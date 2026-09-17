import { createHash, timingSafeEqual } from "node:crypto";

/*
  Verification du mot de passe d'administration.
  Les deux valeurs sont hashees avant comparaison : timingSafeEqual exige des longueurs
  identiques, et comparer les mots de passe bruts revelerait leur longueur.
*/
export function motDePasseValide(saisie: string): boolean {
  const attendu = process.env.ADMIN_PASSWORD;

  if (!attendu || !saisie) {
    return false;
  }

  const saisieHashee = createHash("sha256").update(saisie, "utf8").digest();
  const attenduHashe = createHash("sha256").update(attendu, "utf8").digest();

  return timingSafeEqual(saisieHashee, attenduHashe);
}
