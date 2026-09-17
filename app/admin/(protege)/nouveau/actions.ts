"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type EtatFormulaire = {
  erreurs: Record<string, string>;
};

const TAILLE_MAX_PDF = 10 * 1024 * 1024;

function dossierDepot(): string {
  return process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
}

/*
  Nom du fichier sur le disque. On ne garde que le nom de base de ce qui a ete envoye,
  puis on remplace tout caractere hors liste blanche : un nom d'origine ne doit jamais
  pouvoir sortir du dossier de depot.
  Le nom d'origine reste stocke tel quel dans fichierAuditNom, pour l'affichage.
*/
function nomSurDisque(nomOrigine: string): string {
  const base = path.basename(nomOrigine).replace(/[^a-zA-Z0-9._-]/g, "_");

  return base.slice(-120) || "audit.pdf";
}

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
    if (!(fichier instanceof File) || fichier.size === 0) {
      erreurs.fichier = "Le PDF de l'audit est obligatoire.";
    } else if (fichier.size > TAILLE_MAX_PDF) {
      erreurs.fichier = "Le PDF dépasse 10 Mo.";
    } else if (
      (fichier.type && fichier.type !== "application/pdf") ||
      !fichier.name.toLowerCase().endsWith(".pdf")
    ) {
      // Le type MIME peut etre vide selon le navigateur : l'extension sert de second controle.
      erreurs.fichier = "Le fichier doit être un PDF.";
    } else {
      fichierRetenu = fichier;
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
    const dossier = path.join(dossierDepot(), "audits", client.id);
    const chemin = path.join(dossier, nomSurDisque(fichierRetenu.name));

    try {
      await mkdir(dossier, { recursive: true });
      await writeFile(chemin, Buffer.from(await fichierRetenu.arrayBuffer()));

      await prisma.client.update({
        where: { id: client.id },
        data: {
          fichierAuditNom: fichierRetenu.name.slice(0, 200),
          fichierAuditChemin: chemin,
        },
      });
    } catch (erreur) {
      console.error(
        `Enregistrement du PDF d'audit impossible pour la fiche ${client.id} :`,
        erreur,
      );

      // Une fiche sans son PDF serait une fiche incomplete : on retire celle qu'on vient de creer.
      await prisma.client.delete({ where: { id: client.id } });

      return {
        erreurs: {
          fichier:
            "Le PDF n'a pas pu être enregistré sur le serveur. Aucune fiche n'a été créée.",
        },
      };
    }
  }

  revalidatePath("/admin");
  redirect("/admin");
}
