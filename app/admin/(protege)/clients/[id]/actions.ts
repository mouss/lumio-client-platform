"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  controlerFichier,
  enregistrerFichierAudit,
} from "@/lib/fichiers-audit";
import { envoyerEmailOffre } from "@/lib/emails/envoi-offre";
import {
  CONTENU_QUICK_WIN,
  CONTENU_SECOND_CERVEAU,
  CONTENU_SPRINT,
  LIBELLES_TYPE_OFFRE,
  type TypeOffre,
} from "@/lib/offres-contenu";

export type EtatFormulaire = {
  erreurs: Record<string, string>;
  succes?: string;
};

function emailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function texte(donnees: FormData, champ: string): string {
  return String(donnees.get(champ) ?? "").trim();
}

function rafraichir(clientId: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${clientId}`);
}

/* ------------------------------------------------------------------ Audit */

/*
  Marquage de l'audit comme fait, depuis la fiche client.
  La fiche est mise a jour, pas recreee : le proprietaire du dossier sur disque reste le
  meme identifiant client, donc un fichier deja depose y reste aussi.

  Cette action ne redirige pas : elle s'execute depuis la page qu'elle modifie. Rediriger
  vers l'URL courante laisse le formulaire monte pendant la transition, et useFormState
  recoit alors un etat undefined qui casse le rendu.
*/
export async function marquerAuditFait(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const clientId = texte(donnees, "clientId");
  const nom = texte(donnees, "nom");
  const email = texte(donnees, "email");
  const entreprise = texte(donnees, "entreprise");
  const telephone = texte(donnees, "telephone");
  const notesAudit = texte(donnees, "notesAudit");
  const fichier = donnees.get("fichier");

  const erreurs: Record<string, string> = {};

  if (!clientId) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  if (!nom) {
    erreurs.nom = "Le nom est obligatoire.";
  }

  if (!email) {
    erreurs.email = "L'email est obligatoire.";
  } else if (!emailValide(email)) {
    erreurs.email = "Cet email n'est pas valide.";
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, fichierAuditChemin: true },
  });

  if (!client) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  // Le fichier reste facultatif ici : marquer un audit comme fait ne doit pas etre
  // bloque par une piece qui n'est pas encore sous la main.
  let fichierRetenu: File | null = null;

  if (fichier instanceof File && fichier.size > 0) {
    const controle = controlerFichier(fichier);

    if (controle.valide) {
      fichierRetenu = controle.fichier;
    } else {
      erreurs.fichier = controle.erreur;
    }
  }

  if (Object.keys(erreurs).length > 0) {
    return { erreurs };
  }

  await prisma.client.update({
    where: { id: client.id },
    data: {
      nom,
      email,
      entreprise: entreprise || null,
      telephone: telephone || null,
      notesAudit: notesAudit || null,
      statut: "AUDIT_FAIT",
    },
  });

  if (fichierRetenu) {
    try {
      const enregistre = await enregistrerFichierAudit(
        client.id,
        fichierRetenu,
        client.fichierAuditChemin,
      );

      await prisma.client.update({
        where: { id: client.id },
        data: {
          fichierAuditNom: enregistre.nom,
          fichierAuditChemin: enregistre.chemin,
        },
      });
    } catch (erreur) {
      console.error(
        `Enregistrement du fichier d'audit impossible pour la fiche ${client.id} :`,
        erreur,
      );

      rafraichir(client.id);

      return {
        erreurs: {
          fichier:
            "L'audit est marqué comme fait, mais le fichier n'a pas pu être enregistré. Réessaie depuis « Remplacer le fichier ».",
        },
      };
    }
  }

  rafraichir(client.id);

  return { erreurs: {}, succes: "Audit enregistré." };
}

/*
  Remplacement du fichier d'audit. Un nouvel envoi ecrase l'ancien : pas d'historique
  de versions pour l'instant.
*/
export async function remplacerFichierAudit(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const clientId = texte(donnees, "clientId");
  const controle = controlerFichier(donnees.get("fichier"));

  if (!clientId) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  if (!controle.valide) {
    return { erreurs: { fichier: controle.erreur } };
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, fichierAuditChemin: true },
  });

  if (!client) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  try {
    const enregistre = await enregistrerFichierAudit(
      client.id,
      controle.fichier,
      client.fichierAuditChemin,
    );

    await prisma.client.update({
      where: { id: client.id },
      data: {
        fichierAuditNom: enregistre.nom,
        fichierAuditChemin: enregistre.chemin,
      },
    });
  } catch (erreur) {
    console.error(
      `Remplacement du fichier d'audit impossible pour la fiche ${client.id} :`,
      erreur,
    );

    return {
      erreurs: {
        fichier: "Le fichier n'a pas pu être enregistré sur le serveur.",
      },
    };
  }

  revalidatePath(`/admin/clients/${client.id}`);

  return { erreurs: {}, succes: "Fichier remplacé." };
}

/* ------------------------------------------------------------ Restitution */

/*
  Restitution montree au prospect. Editable tant qu'aucune offre n'a ete envoyee :
  une fois partie chez le prospect, la restitution ne se reecrit plus en silence.
*/
export async function enregistrerRestitution(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const clientId = texte(donnees, "clientId");
  const syntheseDiagnostic = texte(donnees, "syntheseDiagnostic");
  const opportunitesBrutes = texte(donnees, "opportunites");
  const roiEstime = texte(donnees, "roiEstime");
  const recommandation = texte(donnees, "recommandation");

  if (!clientId) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  const erreurs: Record<string, string> = {};

  if (!syntheseDiagnostic) {
    erreurs.syntheseDiagnostic =
      "La synthèse est obligatoire : c'est le cœur de ce que lira le prospect.";
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, offres: { select: { dateEnvoi: true } } },
  });

  if (!client) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  const dejaEnvoyee = client.offres.some((offre) => offre.dateEnvoi !== null);

  if (dejaEnvoyee) {
    return {
      erreurs: {
        general:
          "Une offre a déjà été envoyée à ce prospect : la restitution n'est plus modifiable depuis cet écran.",
      },
    };
  }

  if (Object.keys(erreurs).length > 0) {
    return { erreurs };
  }

  // Une opportunite par ligne non vide. L'impact est laisse dans le texte de la ligne.
  const opportunites = opportunitesBrutes
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter((ligne) => ligne.length > 0);

  const donneesRestitution = {
    syntheseDiagnostic,
    opportunites,
    roiEstime: roiEstime || null,
    recommandation: recommandation || null,
  };

  await prisma.restitutionAudit.upsert({
    where: { clientId: client.id },
    create: { clientId: client.id, ...donneesRestitution },
    update: donneesRestitution,
  });

  rafraichir(client.id);

  return { erreurs: {}, succes: "Restitution enregistrée." };
}

/* ------------------------------------------------------------------ Offre */

function estTypeOffre(valeur: string): valeur is TypeOffre {
  return (
    valeur === "QUICK_WIN" ||
    valeur === "EXTENSION_SECOND_CERVEAU" ||
    valeur === "SPRINT"
  );
}

/*
  Creation d'une offre.

  Le titre et la liste des livrables ne viennent jamais du formulaire : ils sont lus dans
  lib/offres-contenu.ts. Seuls le montant, la description et la modalite restent
  modifiables pour ajuster un point precis chez un client donne. C'est ce qui garantit que
  le contenu des offres ne se reformule pas au fil des generations.
*/
export async function creerOffre(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const clientId = texte(donnees, "clientId");
  const type = texte(donnees, "type");
  const description = texte(donnees, "description");
  const modaliteFacturement = texte(donnees, "modaliteFacturement");
  const lienPaiement = texte(donnees, "lienPaiement");
  const montantBrut = texte(donnees, "montant").replace(",", ".");
  const abonnementMaintenanceInclus =
    donnees.get("abonnementMaintenanceInclus") === "on";
  const packDedie = donnees.get("packDedie") === "on";

  if (!clientId) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  if (!estTypeOffre(type)) {
    return { erreurs: { general: "Choisis un type d'offre." } };
  }

  const erreurs: Record<string, string> = {};
  const montant = Number(montantBrut);

  if (!montantBrut || !Number.isFinite(montant) || montant <= 0) {
    erreurs.montant =
      type === "SPRINT"
        ? "Renseigne le montant issu de la fourchette de valeur créée."
        : "Le montant est obligatoire.";
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      restitution: { select: { id: true } },
    },
  });

  if (!client) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  /*
    La restitution doit exister avant que le lien parte : la page publique montre la
    restitution puis l'offre, une offre seule arriverait sans contexte.
  */
  if (!client.restitution) {
    return {
      erreurs: {
        general:
          "La restitution de l'audit doit être remplie avant de créer l'offre : c'est elle que le prospect lira en premier.",
      },
    };
  }

  if (Object.keys(erreurs).length > 0) {
    return { erreurs };
  }

  const livrables =
    type === "QUICK_WIN"
      ? CONTENU_QUICK_WIN.livrables
      : type === "EXTENSION_SECOND_CERVEAU"
        ? CONTENU_SECOND_CERVEAU.livrables
        : CONTENU_SPRINT.livrables;

  const descriptionRetenue =
    description ||
    (type === "QUICK_WIN"
      ? CONTENU_QUICK_WIN.description
      : type === "EXTENSION_SECOND_CERVEAU"
        ? CONTENU_SECOND_CERVEAU.description
        : description);

  await prisma.offre.create({
    data: {
      clientId: client.id,
      type,
      titre: LIBELLES_TYPE_OFFRE[type],
      description: descriptionRetenue,
      livrables,
      montant,
      modaliteFacturement,
      abonnementMaintenanceInclus,
      packDedie,
      lienPaiement: lienPaiement || null,
      statut: "ENVOYEE",
      dateEnvoi: new Date(),
    },
  });

  // L'abonnement de maintenance se cree a l'acceptation de l'offre, pas ici : on note
  // seulement l'intention dans l'offre. Voir AGENTS.md.

  await prisma.client.update({
    where: { id: client.id },
    data: { statut: "OFFRE_ENVOYEE" },
  });

  rafraichir(client.id);

  return {
    erreurs: {},
    succes:
      "Offre créée et marquée envoyée. Le lien à transmettre au prospect est ci-dessous.",
  };
}

/*
  Envoi de l'offre par email au prospect, depuis la fiche client.
  Le contenu du message et la piece jointe vivent dans lib/emails/envoi-offre.ts : cette
  action ne fait que retrouver l'offre, verifier que la restitution existe, et appeler le
  template. Passe par lib/email.ts, donc exige un SMTP configure dans le .env. Sans
  configuration, l'action renvoie une erreur explicite plutot que d'echouer en silence.

  La restitution part en piece jointe : sans elle, l'email promettrait un document qui
  n'existe pas, donc l'envoi est refuse.
*/
export async function envoyerOffreParEmail(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const offreId = texte(donnees, "offreId");

  if (!offreId) {
    return { erreurs: { general: "Offre introuvable." } };
  }

  const offre = await prisma.offre.findUnique({
    where: { id: offreId },
    select: {
      titre: true,
      client: {
        select: {
          id: true,
          nom: true,
          entreprise: true,
          email: true,
          token: true,
          dateAudit: true,
          restitution: {
            select: {
              syntheseDiagnostic: true,
              opportunites: true,
              roiEstime: true,
            },
          },
        },
      },
    },
  });

  if (!offre) {
    return { erreurs: { general: "Offre introuvable." } };
  }

  if (!offre.client.restitution) {
    return {
      erreurs: {
        general:
          "La restitution de l'audit doit être enregistrée avant d'envoyer l'offre : c'est elle qui part en pièce jointe.",
      },
    };
  }

  try {
    await envoyerEmailOffre({
      client: offre.client,
      offreTitre: offre.titre,
      restitution: offre.client.restitution,
    });
  } catch (erreur) {
    console.error(
      `Envoi de l'offre ${offreId} impossible pour la fiche ${offre.client.id} :`,
      erreur,
    );

    return {
      erreurs: {
        general: `L'email n'a pas pu être envoyé. Vérifie la configuration SMTP du fichier .env. Message : ${erreur instanceof Error ? erreur.message : "inconnu"}`,
      },
    };
  }

  rafraichir(offre.client.id);

  return {
    erreurs: {},
    succes: `Offre envoyée à ${offre.client.email}, avec la restitution en PDF.`,
  };
}

/*
  Refus enregistre a la main, pour un prospect qui decline a l'oral ou par telephone
  plutot que sur la page publique. Une offre deja acceptee ne peut pas repasser en
  refusee : l'accord a ete enregistre avec un nom, il ne s'efface pas par erreur.
*/
export async function marquerOffreRefusee(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const offreId = texte(donnees, "offreId");

  if (!offreId) {
    return { erreurs: { general: "Offre introuvable." } };
  }

  const offre = await prisma.offre.findUnique({
    where: { id: offreId },
    select: { id: true, statut: true, clientId: true },
  });

  if (!offre) {
    return { erreurs: { general: "Offre introuvable." } };
  }

  if (offre.statut === "ACCEPTEE") {
    return {
      erreurs: {
        general:
          "Cette offre est déjà acceptée. Marque-la refusée depuis la base uniquement si le client est revenu sur son accord, pour ne pas effacer une validation enregistrée.",
      },
    };
  }

  await prisma.offre.update({
    where: { id: offre.id },
    data: { statut: "REFUSEE", dateReponse: new Date() },
  });

  await prisma.client.update({
    where: { id: offre.clientId },
    data: { statut: "OFFRE_REFUSEE" },
  });

  rafraichir(offre.clientId);

  return { erreurs: {}, succes: "Offre marquée refusée." };
}

/* -------------------------------------------- Analyse interne (etape 3 du guide) */

/*
  Analyse interne, cote agence, entre le questionnaire et l'appel de lancement.
  Le guide d'onboarding demande d'arriver a l'appel deja prepare : ces quatre champs
  sont le document interne a remplir pour chaque client.

  Rien de tout ceci n'est montre au client : c'est la preparation de Moussa.
*/
export async function enregistrerAnalyseInterne(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const clientId = texte(donnees, "clientId");
  const problemePrincipal = texte(donnees, "problemePrincipal");
  const solutionProposee = texte(donnees, "solutionProposee");
  const quickWinsVisibles = texte(donnees, "quickWinsVisibles");
  const pointsDeVigilance = texte(donnees, "pointsDeVigilance");

  if (!clientId) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });

  if (!client) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  const contenu = {
    problemePrincipal: problemePrincipal || null,
    solutionProposee: solutionProposee || null,
    quickWinsVisibles: quickWinsVisibles || null,
    pointsDeVigilance: pointsDeVigilance || null,
  };

  await prisma.analyseInterne.upsert({
    where: { clientId: client.id },
    create: { clientId: client.id, ...contenu },
    update: contenu,
  });

  rafraichir(client.id);

  return { erreurs: {}, succes: "Analyse interne enregistrée." };
}

/*
  L'analyse est marquee faite quand Moussa a fini de la relire, pas a la premiere
  sauvegarde : le questionnaire se ferme a ce moment la, et les reponses du client
  servent de base a l'appel de lancement. Un enregistrement partiel ne doit pas
  verrouiller le questionnaire par surprise.
*/
export async function marquerAnalyseFaite(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const clientId = texte(donnees, "clientId");

  if (!clientId) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, analyseInterne: { select: { id: true } } },
  });

  if (!client) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  if (!client.analyseInterne) {
    return {
      erreurs: {
        general:
          "Enregistrez d'abord l'analyse interne : elle doit exister avant d'être marquée faite.",
      },
    };
  }

  await prisma.client.update({
    where: { id: client.id },
    data: { statut: "ANALYSE_FAITE" },
  });

  rafraichir(client.id);

  return {
    erreurs: {},
    succes:
      "Analyse marquée faite. Le questionnaire du client passe en lecture seule.",
  };
}

/* ------------------------------------------- Feuille de route (etape 5 du guide) */

/*
  Le guide impose trois phases : diagnostic et setup, build et implementation,
  stabilisation et livraison. Son exemple tient sur 20 jours : J1 a J5, J6 a J15,
  J16 a J20. Les trois phases sont creees d'un coup a partir d'une date de debut,
  puis ajustees une par une.
*/
const PHASES_TYPE = [
  {
    nom: "Phase 1 : Setup",
    debutJours: 0,
    finJours: 4,
    description:
      "Accès, cadrage et validation du périmètre avec vos équipes.",
  },
  {
    nom: "Phase 2 : Build",
    debutJours: 5,
    finJours: 14,
    description:
      "Développement de l'agent et des automatisations, avec des points d'étape.",
  },
  {
    nom: "Phase 3 : Delivery",
    debutJours: 15,
    finJours: 19,
    description:
      "Tests, démonstration, ajustements et remise de la documentation.",
  },
];

function jourDecale(depart: Date, jours: number): Date {
  const valeur = new Date(depart);
  valeur.setDate(valeur.getDate() + jours);

  return valeur;
}

export async function creerRoadmapType(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const clientId = texte(donnees, "clientId");
  const dateDebut = texte(donnees, "dateDebutIso");

  if (!clientId) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  if (!dateDebut) {
    return { erreurs: { dateDebut: "Indiquez la date de démarrage." } };
  }

  const depart = new Date(dateDebut);

  if (Number.isNaN(depart.getTime())) {
    return { erreurs: { dateDebut: "Cette date n'est pas valide." } };
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, roadmapPhases: { select: { id: true } } },
  });

  if (!client) {
    return { erreurs: { general: "Fiche client introuvable." } };
  }

  if (client.roadmapPhases.length > 0) {
    return {
      erreurs: {
        general:
          "Une feuille de route existe déjà pour ce client. Modifiez ses phases plutôt que d'en créer une seconde.",
      },
    };
  }

  await prisma.roadmapPhase.createMany({
    data: PHASES_TYPE.map((phase) => ({
      clientId: client.id,
      nom: phase.nom,
      dateDebut: jourDecale(depart, phase.debutJours),
      dateFin: jourDecale(depart, phase.finJours),
      description: phase.description,
      statut: "A_VENIR" as const,
    })),
  });

  rafraichir(client.id);

  return {
    erreurs: {},
    succes: "Feuille de route créée, trois phases à ajuster si besoin.",
  };
}

export async function mettreAJourPhase(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const phaseId = texte(donnees, "phaseId");
  const nom = texte(donnees, "nom");
  const dateDebut = texte(donnees, "dateDebutIso");
  const dateFin = texte(donnees, "dateFinIso");
  const description = texte(donnees, "description");
  const statut = texte(donnees, "statut");

  if (!phaseId) {
    return { erreurs: { general: "Phase introuvable." } };
  }

  const erreurs: Record<string, string> = {};

  if (!nom) {
    erreurs.nom = "Le nom de la phase est obligatoire.";
  }

  if (!dateDebut) {
    erreurs.dateDebut = "La date de début est obligatoire.";
  }

  if (!dateFin) {
    erreurs.dateFin = "La date de fin est obligatoire.";
  }

  if (dateDebut && dateFin && new Date(dateFin) < new Date(dateDebut)) {
    erreurs.dateFin = "La fin ne peut pas précéder le début.";
  }

  const statutsValides = ["A_VENIR", "EN_COURS", "TERMINE"];

  if (!statutsValides.includes(statut)) {
    erreurs.statut = "Statut inconnu.";
  }

  if (Object.keys(erreurs).length > 0) {
    return { erreurs };
  }

  const phase = await prisma.roadmapPhase.findUnique({
    where: { id: phaseId },
    select: { id: true, clientId: true },
  });

  if (!phase) {
    return { erreurs: { general: "Phase introuvable." } };
  }

  await prisma.roadmapPhase.update({
    where: { id: phase.id },
    data: {
      nom,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      description: description || null,
      statut: statut as "A_VENIR" | "EN_COURS" | "TERMINE",
    },
  });

  rafraichir(phase.clientId);

  return { erreurs: {}, succes: "Phase mise à jour." };
}
