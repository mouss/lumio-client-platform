import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { urlPublique } from "@/lib/urls";
import { MONTANT_MAINTENANCE_MENSUEL } from "@/lib/offres-contenu";

/*
  Acceptation de l'offre par le prospect, depuis la page publique /offres/[token].

  Route publique : le prospect n'a pas de compte. Le token du client fait office
  d'autorisation, il est en uuid v4 donc non devinable. Cette route ne verifie donc pas
  de session, contrairement aux routes sous /api/admin.

  Fermee volontairement : une fois l'offre acceptee, un second appel ne recree pas
  d'abonnement et ne renvoie pas d'email. Un prospect qui double-clique, ou qui recharge
  la page dans un onglet reste ouvert, ne doit pas payer deux fois la maintenance.
*/

type Corps = {
  signatureNom?: unknown;
};

export async function POST(
  request: Request,
  { params }: { params: { token: string } },
) {
  let corps: Corps;

  try {
    corps = (await request.json()) as Corps;
  } catch {
    return NextResponse.json(
      { message: "Requête illisible." },
      { status: 400 },
    );
  }

  const signatureNom =
    typeof corps.signatureNom === "string" ? corps.signatureNom.trim() : "";

  if (!signatureNom) {
    return NextResponse.json(
      { message: "Indiquez votre nom complet pour valider." },
      { status: 422 },
    );
  }

  const client = await prisma.client.findUnique({
    where: { token: params.token },
    include: {
      restitution: true,
      offres: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) {
    return NextResponse.json(
      { message: "Ce lien n'est plus valide." },
      { status: 404 },
    );
  }

  const offre = client.offres.find((element) => element.statut === "ENVOYEE") ?? null;

  if (!offre) {
    const dejaAcceptee = client.offres.find(
      (element) => element.statut === "ACCEPTEE",
    );

    if (dejaAcceptee) {
      return NextResponse.json(
        {
          message:
            "Cette offre a déjà été validée. Aucune nouvelle validation n'est nécessaire.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Aucune offre à valider sur ce lien." },
      { status: 409 },
    );
  }

  const maintenant = new Date();
  const lienQuestionnaire = urlPublique(`/onboarding/${client.token}`);

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.offre.update({
        where: { id: offre.id },
        data: {
          statut: "ACCEPTEE",
          dateReponse: maintenant,
          signatureNom,
        },
      });

      await transaction.client.update({
        where: { id: client.id },
        data: {
          statut: "OFFRE_ACCEPTEE",
          dateSignature: maintenant,
        },
      });

      // L'abonnement de maintenance est note dans l'offre et cree ici, a l'acceptation.
      if (offre.abonnementMaintenanceInclus) {
        await transaction.abonnement.create({
          data: {
            clientId: client.id,
            montantMensuel: MONTANT_MAINTENANCE_MENSUEL,
            statut: "ACTIF",
            dateDebut: maintenant,
          },
        });
      }
    });
  } catch (erreur) {
    console.error(
      `Acceptation de l'offre ${offre.id} impossible pour la fiche ${client.id} :`,
      erreur,
    );

    return NextResponse.json(
      { message: "La validation n'a pas pu être enregistrée. Réessayez." },
      { status: 500 },
    );
  }

  /*
    L'email de bienvenue part apres l'enregistrement : si le SMTP n'est pas configure,
    l'accord est deja enregistre et le client reste au statut OFFRE_ACCEPTEE. Le
    questionnaire n'a pas encore ete envoye, ce statut est donc exact, et l'envoi peut
    etre repris depuis l'admin.
  */
  let emailEnvoye = false;

  const corpsEmail = [
    `Bonjour ${client.nom},`,
    "",
    `Merci pour votre confiance : votre accord sur « ${offre.titre} » est enregistré.`,
    "",
    "Ce qui se passe maintenant :",
    "",
    `1. Vous remplissez le questionnaire d'onboarding, il me permet de partir de votre réalité plutôt que d'une page blanche : ${lienQuestionnaire}`,
    "2. Je prépare la mise en place à partir de vos réponses.",
    "3. Je reviens vers vous pour caler le démarrage.",
    "",
    "Une question d'ici là ? Répondez simplement à cet email.",
    "",
    "Moussa Diallo",
    "Lumio Digital",
  ].join("\n");

  try {
    await sendMail({
      to: client.email,
      subject: `Bienvenue chez Lumio Digital, ${offre.titre} est validée`,
      text: corpsEmail,
    });
    emailEnvoye = true;
  } catch (erreur) {
    console.error(
      `Email de bienvenue non envoye pour la fiche ${client.id} (statut laisse en OFFRE_ACCEPTEE) :`,
      erreur,
    );
  }

  if (emailEnvoye) {
    await prisma.client.update({
      where: { id: client.id },
      data: { statut: "QUESTIONNAIRE_ENVOYE" },
    });
  }

  return NextResponse.json({
    ok: true,
    emailEnvoye,
    lienQuestionnaire,
    message: emailEnvoye
      ? "Votre accord est enregistré, le questionnaire arrive par email."
      : "Votre accord est enregistré. Le questionnaire vous sera envoyé par email sous peu.",
  });
}
