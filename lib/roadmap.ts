/*
  Generation de la feuille de route projet, creee apres l'appel de lancement.
  Decoupage repris du guide d'onboarding client : 3 phases sur 20 jours.
  Phase 1 setup (J1 a J5), Phase 2 build (J6 a J15), Phase 3 delivery (J16 a J20).
*/

const DAY_MS = 24 * 60 * 60 * 1000;

export type RoadmapStep = {
  phase: string;
  startDay: number;
  endDay: number;
  startDate: Date;
  endDate: Date;
  tasks: string[];
};

export type PhaseDefinition = {
  phase: string;
  startDay: number;
  endDay: number;
  tasks: string[];
};

export const PHASES: PhaseDefinition[] = [
  {
    phase: "Phase 1 : setup",
    startDay: 1,
    endDay: 5,
    tasks: [
      "Recuperation des acces",
      "Audit technique de l'existant",
      "Cadrage du perimetre",
    ],
  },
  {
    phase: "Phase 2 : build",
    startDay: 6,
    endDay: 15,
    tasks: [
      "Developpement de l'agent IA",
      "Automatisations et integrations",
      "Tests intermediaires",
    ],
  },
  {
    phase: "Phase 3 : delivery",
    startDay: 16,
    endDay: 20,
    tasks: ["Tests finaux", "Demonstration client", "Ajustements et recette"],
  },
];

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/*
  Le jour 1 correspond a la date de demarrage transmise : la phase 1 commence donc a cette date.
  Les dates renvoyees sont des instants bruts, l'affichage en heure de Paris reste a la charge de l'appelant.
*/
export function buildRoadmap(start: Date): RoadmapStep[] {
  return PHASES.map((phase) => ({
    phase: phase.phase,
    startDay: phase.startDay,
    endDay: phase.endDay,
    startDate: addDays(start, phase.startDay - 1),
    endDate: addDays(start, phase.endDay - 1),
    tasks: [...phase.tasks],
  }));
}
