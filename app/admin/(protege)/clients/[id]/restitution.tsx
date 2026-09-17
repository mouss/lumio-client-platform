"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import {
  Alerte,
  BoutonEnvoyer,
  BOUTON_SECONDAIRE,
  CHAMP,
  Erreur,
  erreursDe,
  Succes,
  type Action,
} from "./champs";
import type { EtatFormulaire } from "./actions";

const VIDE: EtatFormulaire = { erreurs: {} };

export type RestitutionAffichee = {
  syntheseDiagnostic: string;
  opportunites: string[];
  roiEstime: string | null;
  recommandation: string | null;
};

/*
  Rendu client de la restitution. C'est la maquette de ce que le prospect lira sur
  /offres/[token] : ne pas y mettre de vocabulaire interne, le texte s'adresse a lui.
*/
function ApercuClient({
  synthese,
  opportunites,
  roi,
  recommandation,
}: {
  synthese: string;
  opportunites: string[];
  roi: string;
  recommandation: string;
}) {
  return (
    <div className="mt-4 rounded-lg border border-lumio-blue-light/30 bg-white/[0.02] p-6">
      <p className="text-xs uppercase tracking-widest text-lumio-white/40">
        Aperçu de ce que verra le client
      </p>

      <h3 className="mt-4 text-xl font-light">Restitution de votre audit</h3>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-lumio-white/80">
        {synthese || "La synthèse apparaîtra ici."}
      </p>

      {opportunites.length > 0 ? (
        <>
          <h4 className="mt-6 text-sm font-medium text-lumio-white">
            Ce que nous avons identifié
          </h4>
          <ul className="mt-3 flex flex-col gap-2">
            {opportunites.map((opportunite, index) => (
              <li
                key={index}
                className="border-l-2 border-lumio-blue-light/40 pl-3 text-sm leading-relaxed text-lumio-white/80"
              >
                {opportunite}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {roi ? (
        <>
          <h4 className="mt-6 text-sm font-medium text-lumio-white">
            Impact estimé
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-lumio-white/80">{roi}</p>
        </>
      ) : null}

      {recommandation ? (
        <p className="mt-6 border-t border-lumio-white/10 pt-4 text-sm leading-relaxed text-lumio-blue-light">
          {recommandation}
        </p>
      ) : null}

      <p className="mt-6 text-xs text-lumio-white/40">
        L&apos;offre proposée s&apos;affiche juste en dessous de cette restitution
        sur la page que recevra le client.
      </p>
    </div>
  );
}

export function SectionRestitution({
  clientId,
  restitution,
  verrouillee,
  action,
}: {
  clientId: string;
  restitution: RestitutionAffichee | null;
  verrouillee: boolean;
  action: Action;
}) {
  const [etat, envoyer] = useFormState(action, VIDE);
  const erreurs = erreursDe(etat);
  const [apercu, setApercu] = useState(false);

  const [synthese, setSynthese] = useState(restitution?.syntheseDiagnostic ?? "");
  const [opportunites, setOpportunites] = useState(
    (restitution?.opportunites ?? []).join("\n"),
  );
  const [roi, setRoi] = useState(restitution?.roiEstime ?? "");
  const [recommandation, setRecommandation] = useState(
    restitution?.recommandation ?? "",
  );

  const lignesOpportunites = opportunites
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter((ligne) => ligne.length > 0);

  if (verrouillee) {
    return (
      <div className="mt-3">
        <p className="rounded-md border border-lumio-white/10 bg-white/[0.02] px-4 py-3 text-sm text-lumio-white/60">
          Une offre a déjà été envoyée à ce prospect : la restitution n&apos;est plus
          modifiable depuis cet écran.
        </p>

        {restitution ? (
          <ApercuClient
            synthese={restitution.syntheseDiagnostic}
            opportunites={restitution.opportunites}
            roi={restitution.roiEstime ?? ""}
            recommandation={restitution.recommandation ?? ""}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-lumio-white/50">
          Reste en brouillon tant qu&apos;aucune offre n&apos;a été envoyée.
        </p>
        <button
          type="button"
          onClick={() => setApercu(!apercu)}
          className={BOUTON_SECONDAIRE}
        >
          {apercu ? "Masquer l'aperçu" : "Aperçu"}
        </button>
      </div>

      <form action={envoyer} className="mt-4 flex flex-col gap-5">
        <input type="hidden" name="clientId" value={clientId} />

        <Alerte message={erreurs.general} />
        <Succes message={etat?.succes} />

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Synthèse du diagnostic *
          <textarea
            name="syntheseDiagnostic"
            rows={4}
            value={synthese}
            onChange={(evenement) => setSynthese(evenement.target.value)}
            placeholder="Quelques phrases qui reformulent la situation du client, sans jargon technique."
            className={CHAMP}
          />
          <Erreur message={erreurs.syntheseDiagnostic} />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Opportunités identifiées (une par ligne, impact estimé entre parenthèses)
          <textarea
            name="opportunites"
            rows={5}
            value={opportunites}
            onChange={(evenement) => setOpportunites(evenement.target.value)}
            placeholder={"Tri automatique des demandes entrantes (environ 12h par mois)\nRelance client tracée dans un seul outil"}
            className={CHAMP}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          ROI ou impact estimé
          <input
            type="text"
            name="roiEstime"
            value={roi}
            onChange={(evenement) => setRoi(evenement.target.value)}
            placeholder="Temps gagné, coût évité, ou tout indicateur pertinent pour ce client."
            className={CHAMP}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Recommandation (une ou deux phrases qui introduisent l&apos;offre)
          <textarea
            name="recommandation"
            rows={3}
            value={recommandation}
            onChange={(evenement) => setRecommandation(evenement.target.value)}
            className={CHAMP}
          />
        </label>

        {apercu ? (
          <ApercuClient
            synthese={synthese}
            opportunites={lignesOpportunites}
            roi={roi}
            recommandation={recommandation}
          />
        ) : null}

        <div>
          <BoutonEnvoyer libelle="Enregistrer la restitution" />
        </div>
      </form>
    </div>
  );
}
