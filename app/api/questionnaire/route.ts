import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/*
  Reception du questionnaire d'onboarding rempli par le client signe.

  Route publique : le client n'a pas de compte, c'est le token de sa fiche qui fait
  office d'autorisation. Le token arrive dans le corps de la requete, pas dans l'URL.

  Les neuf questions de fond sont obligatoires, comme le demande le guide d'onboarding.
  Le telephone et la liste des acces techniques sont facultatifs : un client peut ne
  rien avoir a connecter.

  Un client deja passe a l'analyse interne ne peut plus modifier ses reponses : les
  reponses servent de base a l'appel de lancement, elles ne doivent pas changer apres
  avoir ete lues.
*/

const STATUTS_ACCEPTES = [
  "OFFRE_ACCEPTEE",
  "QUESTIONNAIRE_ENVOYE",
  "QUESTIONNAIRE_COMPLETE",
];

const CHAMPS_OBLIGATOIRES: Array<{ cle: string; libelle: string }> = [
  { cle: "nom", libelle: "La personne de contact est obligatoire." },
  { cle: "entreprise", libelle: "L'entreprise est obligatoire." },
  {
    cle: "objectifPrincipal",
    libelle: "L'objectif principal du projet est obligatoire.",
  },
  {
    cle: "kpi",
    libelle: "L'indicateur de succès est obligatoire.",
  },
  { cle: "deadlineIdeale", libelle: "La deadline idéale est obligatoire." },
  { cle: "outilsActuels", libelle: "Les outils actuels sont obligatoires." },
  {
    cle: "processActuel",
    libelle: "La description du process actuel est obligatoire.",
  },
  {
    cle: "problemesPrincipaux",
    libelle: "Les problèmes principaux sont obligatoires.",
  },
  {
    cle: "contraintesLegales",
    libelle:
      "Les contraintes légales ou RGPD sont obligatoires. Indiquez « Aucune » si la question ne s'applique pas.",
  },
  {
    cle: "contraintesInternes",
    libelle:
      "Les contraintes internes sont obligatoires. Indiquez « Aucune » si la question ne s'applique pas.",
  },
];

function texte(corps: Record<string, unknown>, cle: string): string {
  const valeur = corps[cle];

  return typeof valeur === "string" ? valeur.trim() : "";
}

export async function POST(request: Request) {
  let corps: Record<string, unknown>;

  try {
    corps = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Requête illisible." }, { status: 400 });
  }

  const token = texte(corps, "token");

  if (!token) {
    return NextResponse.json(
      { message: "Lien incomplet : le token du client est manquant." },
      { status: 422 },
    );
  }

  const client = await prisma.client.findUnique({
    where: { token },
    select: { id: true, statut: true, questionnaire: { select: { id: true } } },
  });

  if (!client) {
    return NextResponse.json(
      { message: "Ce lien n'est plus valide." },
      { status: 404 },
    );
  }

  if (!STATUTS_ACCEPTES.includes(client.statut)) {
    return NextResponse.json(
      {
        message:
          "Ce questionnaire n'est pas ouvert. Il s'ouvre dès que votre proposition est validée.",
      },
      { status: 409 },
    );
  }

  const erreurs: Record<string, string> = {};

  for (const champ of CHAMPS_OBLIGATOIRES) {
    if (texte(corps, champ.cle) === "") {
      erreurs[champ.cle] = champ.libelle;
    }
  }

  if (Object.keys(erreurs).length > 0) {
    return NextResponse.json(
      {
        message: "Certaines réponses manquent.",
        erreurs,
      },
      { status: 422 },
    );
  }

  const accesTechniques = Array.isArray(corps.accesTechniques)
    ? corps.accesTechniques.filter(
        (element): element is string =>
          typeof element === "string" && element.trim() !== "",
      )
    : [];

  const reponses = {
    objectifPrincipal: texte(corps, "objectifPrincipal"),
    kpi: texte(corps, "kpi"),
    deadlineIdeale: texte(corps, "deadlineIdeale"),
    outilsActuels: texte(corps, "outilsActuels"),
    processActuel: texte(corps, "processActuel"),
    problemesPrincipaux: texte(corps, "problemesPrincipaux"),
    accesTechniques,
    contraintesLegales: texte(corps, "contraintesLegales"),
    contraintesInternes: texte(corps, "contraintesInternes"),
  };

  const maintenant = new Date();

  try {
    await prisma.$transaction(async (transaction) => {
      if (client.questionnaire) {
        // Re-soumission : on met a jour les reponses, completedAt garde sa valeur
        // d'origine pour ne pas fausser la date de premiere completion.
        await transaction.questionnaire.update({
          where: { clientId: client.id },
          data: reponses,
        });
      } else {
        await transaction.questionnaire.create({
          data: {
            clientId: client.id,
            ...reponses,
            completedAt: maintenant,
          },
        });
      }

      // Les informations generales sont corrigibles ici : le contact reel peut
      // differer du prospect qui a reserve l'audit.
      await transaction.client.update({
        where: { id: client.id },
        data: {
          nom: texte(corps, "nom"),
          entreprise: texte(corps, "entreprise"),
          telephone: texte(corps, "telephone") || null,
          statut: "QUESTIONNAIRE_COMPLETE",
        },
      });
    });
  } catch (erreur) {
    console.error(
      `Enregistrement du questionnaire impossible pour la fiche ${client.id} :`,
      erreur,
    );

    return NextResponse.json(
      { message: "Vos réponses n'ont pas pu être enregistrées. Réessayez." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Vos réponses sont enregistrées, merci.",
  });
}
