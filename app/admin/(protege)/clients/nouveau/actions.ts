"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  controlerFichier,
  enregistrerFichierAudit,
} from "@/lib/fichiers-audit";

export type EtatFormulaire = {
  erreurs: Record<string, string>;
};

function emailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function creerClient(
  _etat: EtatFormulaire,
  donnees: FormData,
): Promise<EtatFormulaire> {
  const mode = String(donnees.get("mode") ?? "");
  const nom = String(donnees.get("nom") ?? "").trim();
  const email = String(donnees.get("email") ?? "").trim();
  const entreprise = String(donnees.get("entreprise") ?? "").trim();
  const telephone = String(donnees.get("telephone") ?? "").trim();
  const dateAuditBrute = String(donnees.get("dateAudit") ?? "");
  const notesAudit = String(donnees.get("notesAudit") ?? "").trim();
  const fichier = donnees.get("fichier");

  const erreurs: Record<string, string> = {};
  const modeAudit = mode === "audit";

  if (mode !== "rdv" && mode !== "audit") {
    erreurs.general = "Choisis « RDV à venir » ou « Audit déjà fait ».";
  }

  if (!nom) {
    erreurs.nom = "Le nom est obligatoire.";
  }

  if (!email) {
    erreurs.email = "L'email est obligatoire.";
  } else if (!emailValide(email)) {
    erreurs.email = "Cet email n'est pas valide.";
  }

  const dateAudit = dateAuditBrute ? new Date(dateAuditBrute) : null;

  if (!dateAudit || Number.isNaN(dateAudit.getTime())) {
    erreurs.dateAudit = modeAudit
      ? "La date de l'audit est obligatoire."
      : "La date et l'heure du rendez-vous sont obligatoires.";
  }

  let fichierRetenu: File | null = null;

  if (modeAudit) {
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

  const client = await prisma.client.create({
    data: {
      nom,
      email,
      entreprise: entreprise || null,
      telephone: telephone || null,
      dateAudit,
      notesAudit: modeAudit && notesAudit ? notesAudit : null,
      // Pas de calendlyEventUri : ces fiches ne viennent pas de Calendly.
      statut: modeAudit ? "AUDIT_FAIT" : "RDV_PLANIFIE",
    },
    select: { id: true },
  });

  if (fichierRetenu) {
    try {
      const enregistre = await enregistrerFichierAudit(client.id, fichierRetenu);

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

      // Une fiche sans son fichier serait une fiche incomplete : on retire celle qu'on vient de creer.
      await prisma.client.delete({ where: { id: client.id } });

      return {
        erreurs: {
          fichier:
            "Le fichier n'a pas pu être enregistré sur le serveur. Aucune fiche n'a été créée.",
        },
      };
    }
  }

  revalidatePath("/admin");
  return redirect(`/admin/clients/${client.id}`);
}
