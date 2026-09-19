"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import {
  Alerte,
  BOUTON_SECONDAIRE,
  BoutonEnvoyer,
  CHAMP,
  Erreur,
  erreursDe,
  Succes,
  type Action,
} from "./champs";
import type { EtatFormulaire } from "./actions";

/*
  Feuille de route, etape 5 du guide d'onboarding.
  Le guide impose trois phases : diagnostic et setup, build et implementation,
  stabilisation et livraison. L'application cree les trois d'un coup a partir d'une
  date de demarrage, puis chacune s'ajuste une par une.

  Les dates sont converties en ISO 8601 dans le navigateur, dans un champ cache.
  Un champ date renvoie "2026-09-22" sans fuseau : le convertir ici evite que le
  serveur interprete cette date avec son propre fuseau et decale tout d'un jour.
*/

const VIDE: EtatFormulaire = { erreurs: {} };

const STATUTS = [
  { valeur: "A_VENIR", libelle: "À venir" },
  { valeur: "EN_COURS", libelle: "En cours" },
  { valeur: "TERMINE", libelle: "Terminé" },
];

export type PhaseAffichee = {
  id: string;
  nom: string;
  dateDebutValeur: string;
  dateFinValeur: string;
  dateDebutAffichee: string;
  dateFinAffichee: string;
  description: string;
  statut: string;
  statutLibelle: string;
};

function isoDepuisChampDate(valeur: string): string {
  if (!valeur) {
    return "";
  }

  const [annee, mois, jour] = valeur.split("-").map(Number);

  if (!annee || !mois || !jour) {
    return "";
  }

  return new Date(annee, mois - 1, jour).toISOString();
}

function ChampDate({
  nom,
  libelle,
  valeurInitiale,
  erreur,
}: {
  nom: string;
  libelle: string;
  valeurInitiale: string;
  erreur?: string;
}) {
  const [iso, setIso] = useState(isoDepuisChampDate(valeurInitiale));

  return (
    <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
      {libelle}
      <input
        type="date"
        defaultValue={valeurInitiale}
        onChange={(evenement) => setIso(isoDepuisChampDate(evenement.target.value))}
        className={CHAMP}
      />
      <input type="hidden" name={nom} value={iso} />
      <Erreur message={erreur} />
    </label>
  );
}

function LignePhase({ phase, action }: { phase: PhaseAffichee; action: Action }) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, envoyer] = useFormState(action, VIDE);
  const erreurs = erreursDe(etat);

  const teinte =
    phase.statut === "TERMINE"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : phase.statut === "EN_COURS"
        ? "border-lumio-blue-light/40 bg-lumio-blue-light/10 text-lumio-blue-light"
        : "border-lumio-white/20 bg-white/5 text-lumio-white/60";

  return (
    <div className="rounded-lg border border-lumio-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm text-lumio-white">{phase.nom}</span>
        <span className={`rounded-md border px-2 py-0.5 text-xs ${teinte}`}>
          {phase.statutLibelle}
        </span>
      </div>

      <p className="mt-1 text-xs text-lumio-white/50">
        Du {phase.dateDebutAffichee} au {phase.dateFinAffichee}
      </p>

      {phase.description ? (
        <p className="mt-2 text-sm leading-relaxed text-lumio-white/70">
          {phase.description}
        </p>
      ) : null}

      {!ouvert ? (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="mt-3 text-sm text-lumio-blue-light underline-offset-4 hover:underline"
        >
          Modifier cette phase
        </button>
      ) : (
        <form action={envoyer} className="mt-4 flex flex-col gap-4 border-t border-lumio-white/10 pt-4">
          <input type="hidden" name="phaseId" value={phase.id} />

          <Alerte message={erreurs.general} />

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Nom de la phase
            <input
              type="text"
              name="nom"
              defaultValue={phase.nom}
              className={CHAMP}
            />
            <Erreur message={erreurs.nom} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <ChampDate
              nom="dateDebutIso"
              libelle="Début"
              valeurInitiale={phase.dateDebutValeur}
              erreur={erreurs.dateDebut}
            />
            <ChampDate
              nom="dateFinIso"
              libelle="Fin"
              valeurInitiale={phase.dateFinValeur}
              erreur={erreurs.dateFin}
            />
          </div>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Statut
            <select name="statut" defaultValue={phase.statut} className={CHAMP}>
              {STATUTS.map((unStatut) => (
                <option key={unStatut.valeur} value={unStatut.valeur}>
                  {unStatut.libelle}
                </option>
              ))}
            </select>
            <Erreur message={erreurs.statut} />
          </label>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Description
            <textarea
              name="description"
              rows={3}
              defaultValue={phase.description}
              className={CHAMP}
            />
            <Erreur message={erreurs.description} />
          </label>

          <div className="flex items-center gap-3">
            <BoutonEnvoyer libelle="Enregistrer la phase" />
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="text-sm text-lumio-white/50 hover:text-lumio-white"
            >
              Fermer
            </button>
          </div>

          <Succes message={etat?.succes} />
        </form>
      )}
    </div>
  );
}

export function SectionRoadmap({
  clientId,
  phases,
  actionCreer,
  actionModifier,
}: {
  clientId: string;
  phases: PhaseAffichee[];
  actionCreer: Action;
  actionModifier: Action;
}) {
  const [etat, envoyer] = useFormState(actionCreer, VIDE);
  const erreurs = erreursDe(etat);

  if (phases.length === 0) {
    return (
      <div className="mt-4">
        <form action={envoyer} className="flex flex-col gap-4">
          <input type="hidden" name="clientId" value={clientId} />

          <Alerte message={erreurs.general} />

          <p className="text-sm leading-relaxed text-lumio-white/70">
            Le guide d&apos;onboarding prévoit trois phases : setup, build, puis
            livraison. Elles se créent d&apos;un coup à partir de la date de
            démarrage, puis s&apos;ajustent une par une.
          </p>

          <div className="max-w-xs">
            <ChampDate
              nom="dateDebutIso"
              libelle="Date de démarrage"
              valeurInitiale=""
              erreur={erreurs.dateDebut}
            />
          </div>

          <div>
            <BoutonEnvoyer libelle="Créer la feuille de route" />
          </div>

          <Succes message={etat?.succes} />
        </form>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {phases.map((phase) => (
        <LignePhase key={phase.id} phase={phase} action={actionModifier} />
      ))}

      <p className="text-xs text-lumio-white/40">
        Ces phases sont visibles par le client dans son espace une fois la feuille
        de route envoyée.
      </p>
    </div>
  );
}
