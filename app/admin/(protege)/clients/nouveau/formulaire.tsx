"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { EtatFormulaire } from "./actions";

type Mode = "rdv" | "audit";

const VIDE: EtatFormulaire = { erreurs: {} };

const CHAMP =
  "rounded-md border border-lumio-white/15 bg-white/[0.03] px-3 py-2 text-lumio-white outline-none focus:border-lumio-blue-light";

function Erreur({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <span className="text-xs text-red-300">{message}</span>
  );
}

function BoutonEnvoyer({ libelle }: { libelle: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-lumio-blue-light px-4 py-2 text-sm font-medium text-lumio-black transition-colors hover:bg-lumio-blue hover:text-lumio-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Enregistrement..." : libelle}
    </button>
  );
}

/*
  Le champ date est un datetime-local sans attribut name : il est converti en ISO 8601 UTC
  par le navigateur avant l'envoi, dans un champ cache. Sans cette conversion, le serveur
  interpreterait l'heure dans son propre fuseau et decalerait le rendez-vous.
*/
function versIso(valeurLocale: string): string {
  if (!valeurLocale) {
    return "";
  }

  const date = new Date(valeurLocale);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function FormulaireNouveauClient({
  action,
}: {
  action: (etat: EtatFormulaire, donnees: FormData) => Promise<EtatFormulaire>;
}) {
  const [mode, setMode] = useState<Mode>("rdv");
  const [dateLocale, setDateLocale] = useState("");
  const [etat, envoyer] = useFormState(action, VIDE);

  // useFormState peut rendre undefined pendant une transition : lire erreurs sur l'etat
  // brut casse alors le rendu.
  const erreurs = etat?.erreurs ?? {};

  const modeAudit = mode === "audit";

  return (
    <form action={envoyer} className="mt-8 flex flex-col gap-6">
      <input type="hidden" name="mode" value={mode} />

      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-sm text-lumio-white/70">
          Type de fiche
        </legend>

        <button
          type="button"
          onClick={() => setMode("rdv")}
          aria-pressed={!modeAudit}
          className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
            modeAudit
              ? "border-lumio-white/10 bg-white/[0.02] text-lumio-white/60 hover:border-lumio-white/25"
              : "border-lumio-blue-light bg-lumio-blue-light/10 text-lumio-white"
          }`}
        >
          <span className="block font-medium">RDV à venir</span>
          <span className="mt-1 block text-xs text-lumio-white/60">
            Audit programmé par téléphone ou email, pas encore réalisé. La fiche
            démarre au statut RDV planifié.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode("audit")}
          aria-pressed={modeAudit}
          className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
            modeAudit
              ? "border-lumio-blue-light bg-lumio-blue-light/10 text-lumio-white"
              : "border-lumio-white/10 bg-white/[0.02] text-lumio-white/60 hover:border-lumio-white/25"
          }`}
        >
          <span className="block font-medium">Audit déjà fait</span>
          <span className="mt-1 block text-xs text-lumio-white/60">
            Fiche créée après coup, avec les notes de l&apos;audit et le PDF
            produit. La fiche démarre au statut Audit fait.
          </span>
        </button>
      </fieldset>

      {erreurs.general ? (
        <p
          role="alert"
          className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300"
        >
          {erreurs.general}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Nom et prénom *
          <input type="text" name="nom" required className={CHAMP} />
          <Erreur message={erreurs.nom} />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Email *
          <input type="email" name="email" required className={CHAMP} />
          <Erreur message={erreurs.email} />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Entreprise
          <input type="text" name="entreprise" className={CHAMP} />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Téléphone
          <input type="tel" name="telephone" className={CHAMP} />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70 sm:col-span-2">
          {modeAudit ? "Date de l'audit *" : "Date et heure du rendez-vous *"}
          <input
            type="datetime-local"
            value={dateLocale}
            onChange={(evenement) => setDateLocale(evenement.target.value)}
            className={CHAMP}
          />
          <input type="hidden" name="dateAudit" value={versIso(dateLocale)} />
          <Erreur message={erreurs.dateAudit} />
        </label>
      </div>

      {modeAudit ? (
        <div className="flex flex-col gap-4 rounded-lg border border-lumio-white/10 bg-white/[0.02] p-5">
          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Notes d&apos;audit
            <textarea
              name="notesAudit"
              rows={6}
              placeholder="Ce qui est ressorti de l'audit : problèmes identifiés, priorités, points de vigilance."
              className={CHAMP}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Fichier d&apos;audit * (10 Mo maximum, PDF, DOCX ou image)
            <input
              type="file"
              name="fichier"
              accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
              required
              className="text-lumio-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-lumio-blue-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-lumio-black"
            />
            <Erreur message={erreurs.fichier} />
          </label>
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <BoutonEnvoyer libelle="Créer la fiche" />
        <span className="text-xs text-lumio-white/40">
          Un token public est généré automatiquement.
        </span>
      </div>
    </form>
  );
}
