"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  controlerFichier,
  enregistrerFichierAudit,
} from "@/lib/fichiers-audit";

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

/*
  Marquage de l'audit comme fait, depuis la fiche client.
  La fiche est mise a jour, pas recreee : le proprietaire du dossier sur disque reste le
  meme identifiant client, donc un fichier deja depose y reste aussi.

  Cette action ne redirige pas : elle s'execute depuis la page qu'elle modifie. Rediriger
  vers l'URL courante laisse le formulaire monte pendant la transition, et useFormState
  recoit alors un etat undefined qui casse le rendu. La revalidation suffit a rafraichir
  les donnees affichees.
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
  // bloque par une piece qui n'est pas encore sous la main. Elle peut etre ajoutee
  // ensuite depuis la meme page.
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

      revalidatePath("/admin");
      revalidatePath(`/admin/clients/${client.id}`);

      return {
        erreurs: {
          fichier:
            "L'audit est marqué comme fait, mais le fichier n'a pas pu être enregistré. Réessaie depuis « Remplacer le fichier ».",
        },
      };
    }
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${client.id}`);

  return { erreurs: {}, succes: "Audit enregistré." };
}

/*
  Remplacement du fichier d'audit. Un nouvel envoi ecrase l'ancien : pas d'historique
  de versions pour l'instant. Meme raison que ci-dessus pour l'absence de redirection.
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
