"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { EtatFormulaire } from "./actions";

const VIDE: EtatFormulaire = { erreurs: {} };

const CHAMP =
  "rounded-md border border-lumio-white/15 bg-white/[0.03] px-3 py-2 text-lumio-white outline-none focus:border-lumio-blue-light";

const BOUTON_PRINCIPAL =
  "rounded-md bg-lumio-blue-light px-4 py-2 text-sm font-medium text-lumio-black transition-colors hover:bg-lumio-blue hover:text-lumio-white disabled:cursor-not-allowed disabled:opacity-50";

type Action = (
  etat: EtatFormulaire,
  donnees: FormData,
) => Promise<EtatFormulaire>;

/*
  useFormState peut rendre undefined pendant une transition. Lire erreurs sur l'etat brut
  casse alors le rendu : on normalise systematiquement a l'entree de chaque formulaire.
*/
function erreursDe(etat: EtatFormulaire | undefined): Record<string, string> {
  return etat?.erreurs ?? {};
}

function Erreur({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <span className="text-xs text-red-300">{message}</span>;
}

function Succes({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="status"
      className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"
    >
      {message}
    </p>
  );
}

export function Alerte({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300"
    >
      {message}
    </p>
  );
}

function BoutonEnvoyer({ libelle }: { libelle: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={BOUTON_PRINCIPAL}>
      {pending ? "Enregistrement..." : libelle}
    </button>
  );
}

type ClientModifiable = {
  id: string;
  nom: string;
  entreprise: string | null;
  email: string;
  telephone: string | null;
};

/*
  Le bouton ouvre le formulaire, il ne l'affiche pas d'emblee : la fiche client est
  longue et cette action est ponctuelle.
*/
export function FormulaireAuditFait({
  client,
  action,
}: {
  client: ClientModifiable;
  action: Action;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, envoyer] = useFormState(action, VIDE);
  const erreurs = erreursDe(etat);

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={BOUTON_PRINCIPAL}
      >
        Marquer l&apos;audit comme fait
      </button>
    );
  }

  return (
    <form
      action={envoyer}
      className="mt-2 flex flex-col gap-5 rounded-lg border border-lumio-blue-light/30 bg-lumio-blue-light/5 p-5"
    >
      <input type="hidden" name="clientId" value={client.id} />

      <p className="text-sm text-lumio-white/70">
        Corrige les coordonnées si Calendly ne les avait pas toutes fournies, note
        ce qui est ressorti de l&apos;échange, et joins le fichier brut si tu en as
        un. Le statut passera à « Audit fait ».
      </p>

      <Alerte message={erreurs.general} />
      <Succes message={etat?.succes} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Nom et prénom *
          <input
            type="text"
            name="nom"
            defaultValue={client.nom}
            required
            className={CHAMP}
          />
          <Erreur message={erreurs.nom} />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Email *
          <input
            type="email"
            name="email"
            defaultValue={client.email}
            required
            className={CHAMP}
          />
          <Erreur message={erreurs.email} />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Entreprise
          <input
            type="text"
            name="entreprise"
            defaultValue={client.entreprise ?? ""}
            className={CHAMP}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Téléphone
          <input
            type="tel"
            name="telephone"
            defaultValue={client.telephone ?? ""}
            className={CHAMP}
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
        Notes d&apos;audit (usage interne, jamais montrées au client)
        <textarea
          name="notesAudit"
          rows={5}
          placeholder="Ce qui est ressorti de l'échange : situation, irritants, priorités, points de vigilance."
          className={CHAMP}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
        Fichier d&apos;audit (facultatif, 10 Mo maximum, PDF, DOCX ou image)
        <input
          type="file"
          name="fichier"
          accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
          className="text-lumio-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-lumio-blue-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-lumio-black"
        />
        <Erreur message={erreurs.fichier} />
      </label>

      <div className="flex items-center gap-3">
        <BoutonEnvoyer libelle="Enregistrer l'audit" />
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="text-sm text-lumio-white/50 hover:text-lumio-white"
        >
          Fermer
        </button>
      </div>
    </form>
  );
}

export function FormulaireRemplacementFichier({
  clientId,
  action,
}: {
  clientId: string;
  action: Action;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, envoyer] = useFormState(action, VIDE);
  const erreurs = erreursDe(etat);

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="text-sm text-lumio-blue-light hover:underline"
      >
        Remplacer le fichier
      </button>
    );
  }

  return (
    <form action={envoyer} className="mt-3 flex flex-col gap-3">
      <input type="hidden" name="clientId" value={clientId} />

      <Alerte message={erreurs.general} />
      <Succes message={etat?.succes} />

      <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
        Nouveau fichier (10 Mo maximum, PDF, DOCX ou image)
        <input
          type="file"
          name="fichier"
          accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
          required
          className="text-lumio-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-lumio-blue-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-lumio-black"
        />
        <Erreur message={erreurs.fichier} />
      </label>

      <p className="text-xs text-lumio-white/40">
        Le nouveau fichier remplace l&apos;ancien, il n&apos;y a pas d&apos;historique.
      </p>

      <div className="flex items-center gap-3">
        <BoutonEnvoyer libelle="Remplacer" />
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="text-sm text-lumio-white/50 hover:text-lumio-white"
        >
          Fermer
        </button>
      </div>
    </form>
  );
}
