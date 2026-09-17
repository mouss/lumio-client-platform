/*
  Affichage des dates et heures.
  Fuseau fixe Europe/Paris : l'heure affichee est celle du client, pas celle du serveur.
*/

const FORMATEUR_DATE_HEURE = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

export function formatDateHeure(valeur: Date | null | undefined): string {
  if (!valeur) {
    return "Non renseignée";
  }

  return FORMATEUR_DATE_HEURE.format(valeur);
}
