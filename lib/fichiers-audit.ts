import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/*
  Depot et lecture des fichiers d'audit bruts.
  Les fichiers vivent hors du dossier public : ils ne sont jamais servis par une URL
  directe, seulement par une route qui verifie la session d'administration.
  Un seul fichier par client : un nouvel envoi remplace l'ancien, sans historique.
*/

export const TAILLE_MAX_FICHIER = 10 * 1024 * 1024;

export const FORMATS_LISIBLES = "PDF, DOCX, PNG, JPG ou WEBP";

const EXTENSIONS_AUTORISEES = [
  ".pdf",
  ".docx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
];

const TYPES_AUTORISES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const TYPES_PAR_EXTENSION: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/*
  Dossier racine des depots. La variable d'environnement est lue avec || et non ?? :
  une variable definie mais vide doit retomber sur le dossier par defaut, pas produire
  un chemin vide.
*/
export function dossierDepot(): string {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
}

export function dossierClient(clientId: string): string {
  return path.join(dossierDepot(), "audits", clientId);
}

function extensionDe(nom: string): string {
  return path.extname(nom).toLowerCase();
}

/*
  Nom du fichier sur le disque. Seul le nom de base est conserve, puis tout caractere
  hors liste blanche est remplace : un nom d'origine ne doit jamais pouvoir sortir du
  dossier de depot. Le nom d'origine reste stocke en base pour l'affichage.
*/
export function nomSurDisque(nomOrigine: string): string {
  const base = path.basename(nomOrigine).replace(/[^a-zA-Z0-9._-]/g, "_");

  return base.slice(-120) || "fichier-audit";
}

export type ControleFichier =
  | { valide: true; fichier: File }
  | { valide: false; erreur: string };

export function controlerFichier(fichier: unknown): ControleFichier {
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { valide: false, erreur: "Le fichier d'audit est obligatoire." };
  }

  if (fichier.size > TAILLE_MAX_FICHIER) {
    return { valide: false, erreur: "Le fichier dépasse 10 Mo." };
  }

  if (!EXTENSIONS_AUTORISEES.includes(extensionDe(fichier.name))) {
    return { valide: false, erreur: `Formats acceptés : ${FORMATS_LISIBLES}.` };
  }

  // Le type MIME arrive vide selon le navigateur : il ne sert que de second controle.
  if (fichier.type && !TYPES_AUTORISES.includes(fichier.type)) {
    return { valide: false, erreur: `Formats acceptés : ${FORMATS_LISIBLES}.` };
  }

  return { valide: true, fichier };
}

/*
  Ecrit le fichier et retire l'ancien si son chemin differe : un nouvel envoi remplace
  le precedent, il ne s'y ajoute pas.
*/
export async function enregistrerFichierAudit(
  clientId: string,
  fichier: File,
  ancienChemin?: string | null,
): Promise<{ nom: string; chemin: string }> {
  const dossier = dossierClient(clientId);
  const chemin = path.join(dossier, nomSurDisque(fichier.name));

  await mkdir(dossier, { recursive: true });
  await writeFile(chemin, Buffer.from(await fichier.arrayBuffer()));

  if (ancienChemin && ancienChemin !== chemin) {
    await supprimerFichier(ancienChemin);
  }

  return { nom: fichier.name.slice(0, 200), chemin };
}

/*
  Le chemin vient de la base : on verifie qu'il reste bien dans le depot avant de
  toucher au disque, pour qu'une valeur alteree ne puisse pas viser un autre fichier
  du serveur.
*/
export function estDansLeDepot(chemin: string): boolean {
  const racine = path.resolve(dossierDepot());
  const cible = path.resolve(chemin);

  return cible === racine || cible.startsWith(racine + path.sep);
}

export async function supprimerFichier(chemin: string): Promise<void> {
  if (!estDansLeDepot(chemin)) {
    console.error(`Suppression refusée, chemin hors du dépôt : ${chemin}`);
    return;
  }

  try {
    await unlink(chemin);
  } catch {
    // Fichier déjà absent : rien à faire.
  }
}

export function typeMime(chemin: string): string {
  return TYPES_PAR_EXTENSION[extensionDe(chemin)] ?? "application/octet-stream";
}

/*
  En-tete Content-Disposition. Le nom ASCII tombe en secours, le nom reel part en
  filename* encode, ce qui conserve les accents. Les retours a la ligne et les
  guillemets sont retires : ils permettraient d'injecter un en-tete.
*/
export function enteteContenu(
  nom: string,
  disposition: "inline" | "attachment",
): string {
  const secours = nom.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");

  return `${disposition}; filename="${secours}"; filename*=UTF-8''${encodeURIComponent(nom)}`;
}
