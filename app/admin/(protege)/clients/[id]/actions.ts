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
