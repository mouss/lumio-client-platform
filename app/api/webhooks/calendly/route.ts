import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Reception des webhooks Calendly : invitee.created et invitee.canceled.
// Node est obligatoire : le HMAC et Prisma ne tournent pas sur le runtime edge.
export const runtime = "nodejs";

// Tolerance sur l'horodatage de la signature, en secondes. Au dela, la requete est refusee
// comme rejeu : une signature valide reste valide indefiniment sinon.
const TOLERANCE_SIGNATURE_SECONDES = 180;

type QuestionReponse = {
  question?: string;
  answer?: string;
  position?: number;
};

type InviteeCalendly = {
  uri?: string;
  name?: string;
  email?: string;
  // URI de l'evenement planifie, sert de cle d'idempotence.
  event?: string;
  event_type?: string;
  questions_and_answers?: QuestionReponse[];
  scheduled_event?: {
    uri?: string;
    start_time?: string;
    end_time?: string;
    event_type?: string;
  };
};

type CorpsCalendly = {
  event?: string;
  payload?: InviteeCalendly;
};

/*
  Calendly signe avec l'en-tete "Calendly-Webhook-Signature: t=<horodatage>,v1=<hmac>".
  La chaine signee est "{t}.{corps brut}", en HMAC-SHA256, sortie hexadecimale.
  Le corps doit etre lu brut, avant tout JSON.parse : la moindre reserialisation casse le HMAC.
*/
function signatureValide(
  corpsBrut: string,
  entete: string | null,
  cleSignature: string,
): boolean {
  if (!entete) {
    return false;
  }

  const valeurs = new Map<string, string>();

  for (const morceau of entete.split(",")) {
    const separateur = morceau.indexOf("=");
    if (separateur === -1) {
      continue;
    }
    valeurs.set(
      morceau.slice(0, separateur).trim(),
      morceau.slice(separateur + 1).trim(),
    );
  }

  const horodatage = valeurs.get("t");
  const signatureRecue = valeurs.get("v1");

  if (!horodatage || !signatureRecue) {
    return false;
  }

  const horodatageNombre = Number(horodatage);
  if (!Number.isFinite(horodatageNombre)) {
    return false;
  }

  const maintenant = Math.floor(Date.now() / 1000);
  if (Math.abs(maintenant - horodatageNombre) > TOLERANCE_SIGNATURE_SECONDES) {
    return false;
  }

  const signatureAttendue = createHmac("sha256", cleSignature)
    .update(`${horodatage}.${corpsBrut}`)
    .digest("hex");

  const recue = Buffer.from(signatureRecue, "hex");
  const attendue = Buffer.from(signatureAttendue, "hex");

  // timingSafeEqual exige des longueurs identiques : une signature tronquee ou mal encodee
  // ne doit pas lever, elle doit etre refusee.
  if (recue.length !== attendue.length) {
    return false;
  }

  return timingSafeEqual(recue, attendue);
}

function normaliser(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const MOTS_ENTREPRISE = [
  "entreprise",
  "societe",
  "company",
  "organisation",
  "organization",
];

const MOTS_TELEPHONE = ["telephone", "phone", "mobile", "portable"];

/*
  Rapproche une question personnalisee Calendly d'un champ de la fiche client.
  Le libelle exact depend de ce qui a ete saisi dans Calendly, donc on cherche par mot-cle
  plutot que par egalite stricte. Les deux champs restent null si rien ne correspond,
  et seront editables dans l'admin.
*/
function extraireReponse(
  reponses: QuestionReponse[],
  motsCles: string[],
): string | null {
  for (const reponse of reponses) {
    const question = reponse.question;
    const valeur = reponse.answer;

    if (!question || !valeur) {
      continue;
    }

    const questionNormalisee = normaliser(question);
    const correspond = motsCles.some((mot) =>
      questionNormalisee.includes(mot),
    );

    if (correspond && valeur.trim() !== "") {
      return valeur.trim();
    }
  }

  return null;
}

function uriEvenement(payload: InviteeCalendly): string | null {
  return payload.event ?? payload.scheduled_event?.uri ?? null;
}

function uriTypeEvenement(payload: InviteeCalendly): string | null {
  return payload.scheduled_event?.event_type ?? payload.event_type ?? null;
}

export async function POST(request: Request) {
  const cleSignature = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;

  if (!cleSignature) {
    console.error(
      "Webhook Calendly refuse : CALENDLY_WEBHOOK_SIGNING_KEY est absent du .env.",
    );
    return NextResponse.json(
      { erreur: "configuration_manquante" },
      { status: 500 },
    );
  }

  const corpsBrut = await request.text();

  if (
    !signatureValide(
      corpsBrut,
      request.headers.get("calendly-webhook-signature"),
      cleSignature,
    )
  ) {
    console.error("Webhook Calendly refuse : signature invalide ou expiree.");
    return NextResponse.json({ erreur: "signature_invalide" }, { status: 401 });
  }

  let corps: CorpsCalendly;

  try {
    corps = JSON.parse(corpsBrut) as CorpsCalendly;
  } catch {
    console.error("Webhook Calendly signe mais corps illisible.");
    return NextResponse.json({ erreur: "json_invalide" }, { status: 400 });
  }

  const payload = corps.payload;

  if (!payload) {
    return NextResponse.json({ erreur: "payload_absent" }, { status: 422 });
  }

  if (corps.event === "invitee.created") {
    return traiterReservation(payload);
  }

  if (corps.event === "invitee.canceled") {
    return traiterAnnulation(payload);
  }

  // Calendly peut envoyer d'autres types : on acquitte sans rien faire.
  return NextResponse.json(
    { ignore: true, raison: "evenement_non_traite", evenement: corps.event ?? null },
    { status: 200 },
  );
}

async function traiterReservation(payload: InviteeCalendly) {
  const typeEvenement = uriTypeEvenement(payload);
  const evenement = uriEvenement(payload);
  const typeAttendu = process.env.CALENDLY_AUDIT_EVENT_URI?.trim();

  if (typeAttendu) {
    // Sans le type d'evenement, impossible de distinguer un rendez-vous d'audit
    // d'un appel de lancement : on refuse plutot que de creer une fiche au hasard.
    if (!typeEvenement) {
      console.error(
        "Reservation Calendly refusee : le payload ne porte aucun type d'evenement, le filtre CALENDLY_AUDIT_EVENT_URI ne peut pas s'appliquer.",
      );
      return NextResponse.json(
        { erreur: "type_evenement_absent" },
        { status: 422 },
      );
    }

    if (typeEvenement !== typeAttendu) {
      return NextResponse.json(
        { ignore: true, raison: "autre_type_evenement", typeEvenement },
        { status: 200 },
      );
    }
  }

  if (!evenement) {
    console.error(
      "Reservation Calendly refusee : URI de l'evenement planifie absent, l'idempotence ne peut pas etre garantie.",
    );
    return NextResponse.json({ erreur: "evenement_absent" }, { status: 422 });
  }

  const email = payload.email?.trim();
  if (!email) {
    console.error("Reservation Calendly refusee : aucun email d'invite.");
    return NextResponse.json({ erreur: "email_absent" }, { status: 422 });
  }

  const debut = payload.scheduled_event?.start_time;
  const dateAudit = debut ? new Date(debut) : null;

  if (!dateAudit || Number.isNaN(dateAudit.getTime())) {
    console.error(
      `Reservation Calendly refusee : creneau de debut absent ou illisible (recu : ${String(debut)}).`,
    );
    return NextResponse.json({ erreur: "creneau_absent" }, { status: 422 });
  }

  // Idempotence : Calendly peut relivrer un meme evenement, une reservation ne cree jamais deux fiches.
  const existant = await prisma.client.findUnique({
    where: { calendlyEventUri: evenement },
  });

  if (existant) {
    return NextResponse.json(
      { deja_traite: true, clientId: existant.id },
      { status: 200 },
    );
  }

  const reponses = payload.questions_and_answers ?? [];

  const client = await prisma.client.create({
    data: {
      nom: payload.name?.trim() || "Invite sans nom",
      email,
      entreprise: extraireReponse(reponses, MOTS_ENTREPRISE),
      telephone: extraireReponse(reponses, MOTS_TELEPHONE),
      dateAudit,
      calendlyEventUri: evenement,
      calendlyInviteeUri: payload.uri ?? null,
      statut: "RDV_PLANIFIE",
    },
    select: { id: true, token: true, statut: true },
  });

  console.log(
    `Reservation Calendly traitee : fiche ${client.id} creee pour ${email}, audit du ${dateAudit.toISOString()}.`,
  );

  return NextResponse.json(
    { cree: true, clientId: client.id, token: client.token, statut: client.statut },
    { status: 201 },
  );
}

async function traiterAnnulation(payload: InviteeCalendly) {
  const evenement = uriEvenement(payload);

  if (!evenement) {
    return NextResponse.json({ erreur: "evenement_absent" }, { status: 422 });
  }

  const client = await prisma.client.findUnique({
    where: { calendlyEventUri: evenement },
    select: { id: true, statut: true },
  });

  // Cas normal pour un rendez-vous d'un autre type, jamais transforme en fiche client.
  if (!client) {
    return NextResponse.json(
      { ignore: true, raison: "client_introuvable" },
      { status: 200 },
    );
  }

  if (client.statut === "RDV_ANNULE") {
    return NextResponse.json(
      { deja_traite: true, clientId: client.id },
      { status: 200 },
    );
  }

  // La fiche et la reservation d'origine sont conservees : seul le statut change.
  await prisma.client.update({
    where: { id: client.id },
    data: { statut: "RDV_ANNULE" },
  });

  console.log(`Annulation Calendly traitee : fiche ${client.id} passee en RDV_ANNULE.`);

  return NextResponse.json({ annule: true, clientId: client.id }, { status: 200 });
}
