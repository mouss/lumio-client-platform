"use client";

import { useFormState } from "react-dom";
import {
  Alerte,
  Avertissement,
  BoutonEnvoyer,
  CHAMP,
  Erreur,
  erreursDe,
  Succes,
  type Action,
} from "./champs";
import type { EtatFormulaire } from "./actions";

/*
  Analyse interne, etape 3 du guide d'onboarding.
  Document de preparation cote agence : rien de ce qui est saisi ici n'est montre au
  client. Les quatre champs sont ceux que le guide impose pour arriver a l'appel de
  lancement deja prepare.

  Deux formulaires distincts : enregistrer, puis marquer faite. Le questionnaire du
  client se ferme au marquage, pas a la premiere sauvegarde : une analyse en cours
  d'ecriture ne doit pas verrouiller les reponses du client par surprise.
*/

const VIDE: EtatFormulaire = { erreurs: {} };

export type AnalyseAffichee = {
  problemePrincipal: string;
  solutionProposee: string;
  quickWinsVisibles: string;
  pointsDeVigilance: string;
};

export function SectionAnalyseInterne({
  clientId,
  analyse,
  analyseFaite,
  actionEnregistrer,
  actionMarquerFaite,
}: {
  clientId: string;
  analyse: AnalyseAffichee | null;
  analyseFaite: boolean;
  actionEnregistrer: Action;
  actionMarquerFaite: Action;
}) {
  const [etat, envoyer] = useFormState(actionEnregistrer, VIDE);
  const erreurs = erreursDe(etat);

  const [etatMarquage, marquer] = useFormState(actionMarquerFaite, VIDE);
  const erreursMarquage = erreursDe(etatMarquage);

  return (
    <div className="mt-4 flex flex-col gap-6">
      <form action={envoyer} className="flex flex-col gap-4">
        <input type="hidden" name="clientId" value={clientId} />

        <Alerte message={erreurs.general} />

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Problème principal du client
          <textarea
            name="problemePrincipal"
            rows={3}
            defaultValue={analyse?.problemePrincipal ?? ""}
            className={CHAMP}
          />
          <span className="text-xs text-lumio-white/40">
            Reformulé avec vos mots, à partir du questionnaire et de l&apos;audit.
          </span>
          <Erreur message={erreurs.problemePrincipal} />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Solution IA proposée
          <textarea
            name="solutionProposee"
            rows={3}
            defaultValue={analyse?.solutionProposee ?? ""}
            className={CHAMP}
          />
          <Erreur message={erreurs.solutionProposee} />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Quick wins visibles
          <textarea
            name="quickWinsVisibles"
            rows={3}
            defaultValue={analyse?.quickWinsVisibles ?? ""}
            className={CHAMP}
          />
          <span className="text-xs text-lumio-white/40">
            Ce que le client peut voir changer vite, pour montrer la valeur tôt.
          </span>
          <Erreur message={erreurs.quickWinsVisibles} />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Points de vigilance
          <textarea
            name="pointsDeVigilance"
            rows={3}
            defaultValue={analyse?.pointsDeVigilance ?? ""}
            className={CHAMP}
          />
          <Erreur message={erreurs.pointsDeVigilance} />
        </label>

        <div>
          <BoutonEnvoyer libelle="Enregistrer l'analyse" />
        </div>

        <Succes message={etat?.succes} />
      </form>

      <div className="border-t border-lumio-white/10 pt-5">
        {analyseFaite ? (
          <Succes message="Analyse faite. Le questionnaire du client est en lecture seule." />
        ) : (
          <form action={marquer} className="flex flex-col gap-3">
            <input type="hidden" name="clientId" value={clientId} />
            <Alerte message={erreursMarquage.general} />
            <Succes message={etatMarquage?.succes} />
            <div>
              <BoutonEnvoyer
                libelle="Marquer l'analyse comme faite"
                variante="secondaire"
              />
            </div>
            <Avertissement message="Marquer l'analyse comme faite ferme le questionnaire du client : ses réponses servent de base à l'appel de lancement et ne doivent plus bouger." />
          </form>
        )}
      </div>
    </div>
  );
}
