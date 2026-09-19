/*
  Libelles francais des statuts de la fiche client.
  Les valeurs viennent de l'enum StatutClient de prisma/schema.prisma : ajouter une valeur
  au schema sans l'ajouter ici afficherait le code brut dans l'interface.
*/

export const LIBELLES_STATUT: Record<string, string> = {
  RDV_PLANIFIE: "RDV planifié",
  RDV_ANNULE: "RDV annulé",
  AUDIT_FAIT: "Audit fait",
  OFFRE_ENVOYEE: "Offre envoyée",
  OFFRE_ACCEPTEE: "Offre acceptée",
  OFFRE_REFUSEE: "Offre refusée",
  QUESTIONNAIRE_ENVOYE: "Questionnaire envoyé",
  QUESTIONNAIRE_COMPLETE: "Questionnaire complété",
  ANALYSE_FAITE: "Analyse faite",
  APPEL_PLANIFIE: "Appel planifié",
  APPEL_FAIT: "Appel fait",
  ROADMAP_ENVOYEE: "Feuille de route envoyée",
  EN_COURS: "En cours",
  LIVRE: "Livré",
  CLOS: "Clos",
};

export function libelleStatut(statut: string): string {
  return LIBELLES_STATUT[statut] ?? statut;
}

/*
  Libelles des phases de la feuille de route.
  Les valeurs viennent de l'enum StatutPhase de prisma/schema.prisma.
*/
export const LIBELLES_STATUT_PHASE: Record<string, string> = {
  A_VENIR: "À venir",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
};

export function libelleStatutPhase(statut: string): string {
  return LIBELLES_STATUT_PHASE[statut] ?? statut;
}

/*
  Une fois l'analyse interne faite, le client a depasse le questionnaire : ses reponses
  servent de base a l'appel de lancement et ne doivent plus bouger.
*/
const STATUTS_APRES_ANALYSE = [
  "ANALYSE_FAITE",
  "APPEL_PLANIFIE",
  "APPEL_FAIT",
  "ROADMAP_ENVOYEE",
  "EN_COURS",
  "LIVRE",
  "CLOS",
];

export function analyseEstFaite(statut: string): boolean {
  return STATUTS_APRES_ANALYSE.includes(statut);
}

const TEINTES_PAR_FAMILLE: Array<{ statuts: string[]; classes: string }> = [
  {
    statuts: ["RDV_ANNULE", "OFFRE_REFUSEE"],
    classes: "border-red-400/30 bg-red-400/10 text-red-300",
  },
  {
    statuts: ["LIVRE", "CLOS", "OFFRE_ACCEPTEE"],
    classes: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  {
    statuts: ["RDV_PLANIFIE", "APPEL_PLANIFIE"],
    classes: "border-lumio-blue-light/40 bg-lumio-blue-light/10 text-lumio-blue-light",
  },
  {
    statuts: ["EN_COURS", "AUDIT_FAIT", "ANALYSE_FAITE", "APPEL_FAIT"],
    classes: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
];

export function teinteStatut(statut: string): string {
  for (const famille of TEINTES_PAR_FAMILLE) {
    if (famille.statuts.includes(statut)) {
      return famille.classes;
    }
  }

  return "border-lumio-white/20 bg-lumio-white/5 text-lumio-white/70";
}
