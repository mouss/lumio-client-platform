/*
  Session d'administration : jeton signe, sans etat cote serveur.
  Le jeton contient sa date d'expiration en clair, plus une signature HMAC-SHA256
  calculee avec une cle derivee de ADMIN_PASSWORD.
  Changer ADMIN_PASSWORD invalide donc toutes les sessions en cours.

  Tout passe par Web Crypto : disponible en Node comme dans le runtime edge,
  et la lecture de ADMIN_PASSWORD se fait a l'appel, jamais au chargement du module.
*/

export const COOKIE_SESSION = "lumio_admin_session";
export const DUREE_SESSION_SECONDES = 7 * 24 * 60 * 60;

const ENCODEUR = new TextEncoder();

function versBase64Url(octets: Uint8Array): string {
  let binaire = "";

  // Boucle indexee et non for...of : la cible TypeScript du projet est ES5,
  // qui refuse l'iteration directe sur un Uint8Array.
  for (let index = 0; index < octets.length; index += 1) {
    binaire += String.fromCharCode(octets[index]);
  }

  return btoa(binaire).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function depuisBase64Url(texte: string): Uint8Array {
  const normalise = texte.replace(/-/g, "+").replace(/_/g, "/");
  const reste = normalise.length % 4;
  const complete = reste === 0 ? normalise : normalise.padEnd(normalise.length + (4 - reste), "=");
  const binaire = atob(complete);
  const octets = new Uint8Array(binaire.length);

  for (let index = 0; index < binaire.length; index += 1) {
    octets[index] = binaire.charCodeAt(index);
  }

  return octets;
}

async function importerCle(): Promise<CryptoKey | null> {
  const secret = process.env.ADMIN_PASSWORD;

  if (!secret) {
    return null;
  }

  return crypto.subtle.importKey(
    "raw",
    ENCODEUR.encode(`lumio-admin-session:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export type Session = {
  valeur: string;
  expireLe: Date;
};

export async function creerJeton(): Promise<Session | null> {
  const cle = await importerCle();

  if (!cle) {
    return null;
  }

  const expireLe = new Date(Date.now() + DUREE_SESSION_SECONDES * 1000);
  const charge = String(Math.floor(expireLe.getTime() / 1000));
  const signature = await crypto.subtle.sign("HMAC", cle, ENCODEUR.encode(charge));

  return {
    valeur: `${charge}.${versBase64Url(new Uint8Array(signature))}`,
    expireLe,
  };
}

export async function jetonValide(jeton: string | undefined): Promise<boolean> {
  if (!jeton) {
    return false;
  }

  const cle = await importerCle();

  // Sans ADMIN_PASSWORD, aucune session ne peut etre valide : on refuse plutot que d'ouvrir.
  if (!cle) {
    return false;
  }

  const separateur = jeton.indexOf(".");

  if (separateur === -1) {
    return false;
  }

  const charge = jeton.slice(0, separateur);
  const signatureTexte = jeton.slice(separateur + 1);
  const expiration = Number(charge);

  if (!Number.isFinite(expiration) || expiration * 1000 < Date.now()) {
    return false;
  }

  let signature: Uint8Array;

  try {
    signature = depuisBase64Url(signatureTexte);
  } catch {
    return false;
  }

  // crypto.subtle.verify compare en temps constant.
  // La copie force un Uint8Array adosse a un ArrayBuffer : TypeScript 5.7 type
  // Uint8Array sur son tampon et n'accepte pas ArrayBufferLike comme BufferSource.
  return crypto.subtle.verify(
    "HMAC",
    cle,
    new Uint8Array(signature),
    ENCODEUR.encode(charge),
  );
}
