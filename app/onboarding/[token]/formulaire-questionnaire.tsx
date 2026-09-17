"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/*
  Questionnaire d'onboarding rempli par le client signe.

  Neuf questions de fond, obligatoires : c'est la regle du guide d'onboarding (10 a 15
  questions maximum, claires, actionnables, obligatoires). Les informations generales
  sont pre-remplies depuis la fiche et corrigibles, parce que le contact reel peut
  differer du prospect qui a reserve l'audit.

  Aucun identifiant n'est demande ici : la question sur les acces sert a savoir quels
  comptes ouvrir, les mots de passe ne transitent jamais par ce formulaire.

  Apres envoi, on rafraichit la page cote serveur : c'est le rendu serveur qui decide
  de l'affichage, jamais l'etat local.
*/

const CHAMP =
  "w-full rounded-md border border-lumio-white/15 bg-lumio-black px-4 py-2.5 text-sm leading-relaxed text-lumio-white outline-none focus:border-lumio-blue-light";

const BOUTON_PRINCIPAL =
  "rounded-md bg-lumio-blue px-6 py-3 text-sm font-medium text-lumio-white transition hover:bg-lumio-blue-light hover:text-lumio-black disabled:cursor-not-allowed disabled:opacity-60";

const ACCES_POSSIBLES = [
  "CRM",
  "Email",
  "API",
  "Outils no-code",
  "Autres",
];

export type ValeursQuestionnaire = {
  nom: string;
  entreprise: string;
  telephone: string;
  objectifPrincipal: string;
  kpi: string;
  deadlineIdeale: string;
  outilsActuels: string;
  processActuel: string;
  problemesPrincipaux: string;
  contraintesLegales: string;
  contraintesInternes: string;
  accesTechniques: string[];
};

type CleTexte =
  | "nom"
  | "entreprise"
  | "telephone"
  | "objectifPrincipal"
  | "kpi"
  | "deadlineIdeale"
  | "outilsActuels"
  | "processActuel"
  | "problemesPrincipaux"
  | "contraintesLegales"
  | "contraintesInternes";

export function FormulaireQuestionnaire({
  token,
  dejaRepondu,
  valeursInitiales,
}: {
  token: string;
  dejaRepondu: boolean;
  valeursInitiales: ValeursQuestionnaire;
}) {
  const router = useRouter();
  const [valeurs, setValeurs] = useState(valeursInitiales);
  const [acces, setAcces] = useState<string[]>(valeursInitiales.accesTechniques);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  function modifier(cle: CleTexte, valeur: string) {
    setValeurs((precedent) => ({ ...precedent, [cle]: valeur }));
  }

  function basculerAcces(nom: string) {
    setAcces((precedent) =>
      precedent.includes(nom)
        ? precedent.filter((element) => element !== nom)
        : [...precedent, nom],
    );
  }

  async function envoyer() {
    setEnCours(true);
    setErreurs({});
    setErreurGenerale(null);

    try {
      const reponse = await fetch("/api/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...valeurs, accesTechniques: acces }),
      });

      const donnees = (await reponse.json().catch(() => null)) as
        | { message?: string; erreurs?: Record<string, string> }
        | null;

      if (!reponse.ok) {
        setErreurs(donnees?.erreurs ?? {});
        setErreurGenerale(
          donnees?.erreurs
            ? "Certaines réponses manquent. Regardez les champs signalés."
            : (donnees?.message ??
              "Vos réponses n'ont pas pu être enregistrées. Réessayez dans un instant."),
        );
        setEnCours(false);
        return;
      }

      setEnvoye(true);
      setEnCours(false);
      router.refresh();
    } catch {
      setErreurGenerale(
        "Connexion impossible. Vérifiez votre réseau et réessayez dans un instant.",
      );
      setEnCours(false);
    }
  }

  if (envoye) {
    return (
      <div
        role="status"
        className="mt-10 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.07] px-6 py-8"
      >
        <h2 className="text-xl font-light text-lumio-white">
          C&apos;est envoyé, merci
        </h2>
        <p className="mt-4 text-base leading-relaxed text-lumio-white/80">
          Vos réponses sont enregistrées. Je les lis avant notre appel de
          lancement, pour ne rien découvrir en direct le jour J.
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-10 flex flex-col gap-10"
      onSubmit={(evenement) => {
        evenement.preventDefault();
        void envoyer();
      }}
    >
      {dejaRepondu ? (
        <p className="rounded-md border border-lumio-blue-light/30 bg-lumio-blue/[0.12] px-4 py-3 text-sm text-lumio-white/80">
          Vous avez déjà envoyé ce questionnaire. Vos réponses sont
          pré-remplies : corrigez ce qui a changé, puis envoyez à nouveau.
        </p>
      ) : null}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-widest text-lumio-white/50">
          Informations générales
        </h2>
        <p className="mt-2 text-xs text-lumio-white/45">
          Ce que nous avons déjà de notre côté. Corrigez si besoin.
        </p>

        <div className="mt-5 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Personne de contact *
            <input
              type="text"
              value={valeurs.nom}
              onChange={(evenement) => modifier("nom", evenement.target.value)}
              className={CHAMP}
            />
            {erreurs.nom ? (
              <span role="alert" className="text-xs text-red-300">
                {erreurs.nom}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Entreprise *
            <input
              type="text"
              value={valeurs.entreprise}
              onChange={(evenement) =>
                modifier("entreprise", evenement.target.value)
              }
              className={CHAMP}
            />
            {erreurs.entreprise ? (
              <span role="alert" className="text-xs text-red-300">
                {erreurs.entreprise}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Téléphone
            <input
              type="text"
              value={valeurs.telephone}
              onChange={(evenement) =>
                modifier("telephone", evenement.target.value)
              }
              className={CHAMP}
            />
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-widest text-lumio-white/50">
          Objectifs business
        </h2>

        <div className="mt-5 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Quel est l&apos;objectif principal du projet ? *
            <textarea
              rows={3}
              value={valeurs.objectifPrincipal}
              onChange={(evenement) =>
                modifier("objectifPrincipal", evenement.target.value)
              }
              className={CHAMP}
            />
            <span className="text-xs text-lumio-white/40">
              Dites-le avec vos mots, comme vous l&apos;expliqueriez à un
              collègue.
            </span>
            {erreurs.objectifPrincipal ? (
              <span role="alert" className="text-xs text-red-300">
                {erreurs.objectifPrincipal}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            À quoi verrez-vous que c&apos;est réussi ? *
            <textarea
              rows={2}
              value={valeurs.kpi}
              onChange={(evenement) => modifier("kpi", evenement.target.value)}
              className={CHAMP}
            />
            <span className="text-xs text-lumio-white/40">
              Un chiffre ou un fait observable : heures gagnées, délai divisé,
              relances qui partent seules.
            </span>
            {erreurs.kpi ? (
              <span role="alert" className="text-xs text-red-300">
                {erreurs.kpi}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Deadline idéale *
            <input
              type="text"
              value={valeurs.deadlineIdeale}
              onChange={(evenement) =>
                modifier("deadlineIdeale", evenement.target.value)
              }
              placeholder="Par exemple : avant la rentrée, fin du trimestre, aucune contrainte"
              className={CHAMP}
            />
            {erreurs.deadlineIdeale ? (
              <span role="alert" className="text-xs text-red-300">
                {erreurs.deadlineIdeale}
              </span>
            ) : null}
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-widest text-lumio-white/50">
          Contexte et existant
        </h2>

        <div className="mt-5 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Quels outils utilisez-vous aujourd&apos;hui ? *
            <textarea
              rows={3}
              value={valeurs.outilsActuels}
              onChange={(evenement) =>
                modifier("outilsActuels", evenement.target.value)
              }
              className={CHAMP}
            />
            <span className="text-xs text-lumio-white/40">
              CRM, boîte email, outil de devis, tableur, logiciel métier.
            </span>
            {erreurs.outilsActuels ? (
              <span role="alert" className="text-xs text-red-300">
                {erreurs.outilsActuels}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Comment ça se passe aujourd&apos;hui, étape par étape ? *
            <textarea
              rows={4}
              value={valeurs.processActuel}
              onChange={(evenement) =>
                modifier("processActuel", evenement.target.value)
              }
              className={CHAMP}
            />
            {erreurs.processActuel ? (
              <span role="alert" className="text-xs text-red-300">
                {erreurs.processActuel}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Qu&apos;est-ce qui vous coûte le plus de temps ? *
            <textarea
              rows={3}
              value={valeurs.problemesPrincipaux}
              onChange={(evenement) =>
                modifier("problemesPrincipaux", evenement.target.value)
              }
              className={CHAMP}
            />
            {erreurs.problemesPrincipaux ? (
              <span role="alert" className="text-xs text-red-300">
                {erreurs.problemesPrincipaux}
              </span>
            ) : null}
          </label>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-widest text-lumio-white/50">
          Accès techniques à ouvrir
        </h2>
        <p className="mt-2 text-xs text-lumio-white/45">
          Cochez ce qui devra être connecté. Ne mettez aucun mot de passe ici :
          nous verrons les accès ensemble.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {ACCES_POSSIBLES.map((nom) => (
            <label
              key={nom}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm transition ${
                acces.includes(nom)
                  ? "border-lumio-blue-light/60 bg-lumio-blue-light/10 text-lumio-white"
                  : "border-lumio-white/15 text-lumio-white/70"
              }`}
            >
              <input
                type="checkbox"
                checked={acces.includes(nom)}
                onChange={() => basculerAcces(nom)}
              />
              {nom}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-widest text-lumio-white/50">
          Contraintes
        </h2>
        <p className="mt-2 text-xs text-lumio-white/45">
          Indiquez « Aucune » si la question ne s&apos;applique pas.
        </p>

        <div className="mt-5 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Contraintes légales ou RGPD *
            <textarea
              rows={2}
              value={valeurs.contraintesLegales}
              onChange={(evenement) =>
                modifier("contraintesLegales", evenement.target.value)
              }
              className={CHAMP}
            />
            {erreurs.contraintesLegales ? (
              <span role="alert" className="text-xs text-red-300">
                {erreurs.contraintesLegales}
              </span>
            ) : null}
          </label>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Contraintes internes *
            <textarea
              rows={2}
              value={valeurs.contraintesInternes}
              onChange={(evenement) =>
                modifier("contraintesInternes", evenement.target.value)
              }
              className={CHAMP}
            />
            <span className="text-xs text-lumio-white/40">
              Valider avec le dirigeant, budget déjà engagé, période chargée,
              personne à former.
            </span>
            {erreurs.contraintesInternes ? (
              <span role="alert" className="text-xs text-red-300">
                {erreurs.contraintesInternes}
              </span>
            ) : null}
          </label>
        </div>
      </section>

      {erreurGenerale ? (
        <p
          role="alert"
          className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300"
        >
          {erreurGenerale}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 border-t border-lumio-white/10 pt-8">
        <button type="submit" className={BOUTON_PRINCIPAL} disabled={enCours}>
          {enCours ? "Envoi en cours..." : "Envoyer mes réponses"}
        </button>
        <p className="text-xs text-lumio-white/45">
          Les champs marqués d&apos;une étoile sont obligatoires.
        </p>
      </div>
    </form>
  );
}
