/*
  Construction des URL publiques : liens envoyes aux prospects et aux clients.
  APP_URL est lue au runtime, avec repli sur l'adresse locale de developpement.
*/
export function urlPublique(chemin: string): string {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");

  return `${base}${chemin}`;
}
