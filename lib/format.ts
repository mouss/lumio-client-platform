/*
  Extraction d'une liste de chaines depuis un champ Json de Prisma.
  Un champ Json peut contenir n'importe quoi : on ne garde que les chaines non vides.
*/
export function listeDeTextes(valeur: unknown): string[] {
  if (!Array.isArray(valeur)) {
    return [];
  }

  return valeur.filter(
    (element): element is string =>
      typeof element === "string" && element.trim() !== "",
  );
}

/*
  Affichage des dates et heures.
  Fuseau fixe Europe/Paris : l'heure affichee est celle du client, pas celle du serveur.
*/

const FORMATEUR_DATE_HEURE = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

const FORMATEUR_DATE_LONGUE = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

export function formatDateHeure(valeur: Date | null | undefined): string {
  if (!valeur) {
    return "Non renseignée";
  }

  return FORMATEUR_DATE_HEURE.format(valeur);
}

export function formatDateLongue(valeur: Date | null | undefined): string {
  if (!valeur) {
    return "date non renseignée";
  }

  return FORMATEUR_DATE_LONGUE.format(valeur);
}

/*
  Valeur a mettre dans un champ date HTML, au format attendu AAAA-MM-JJ.
  Le format en-CA rend exactement cette forme, et le fuseau de Paris evite qu'une date
  saisie en France soit relue comme la veille par un serveur en UTC.
*/
const FORMATEUR_VALEUR_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
});

export function valeurChampDate(valeur: Date): string {
  return FORMATEUR_VALEUR_DATE.format(valeur);
}

/*
  Nom de fichier sur et lisible, construit depuis le nom de l'entreprise.
  Les accents et les espaces sont retires : un nom de fichier telecharge peut traverser
  des systemes qui ne les gerent pas, et le nom d'origine reste affiche dans l'interface.
*/
export function slugFichier(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
