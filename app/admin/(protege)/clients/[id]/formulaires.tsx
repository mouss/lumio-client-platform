"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import {
  Alerte,
  BoutonEnvoyer,
  BOUTON_PRINCIPAL,
  CHAMP,
  Erreur,
  erreursDe,
  Succes,
  type Action,
} from "./champs";
import type { EtatFormulaire } from "./actions";

const VIDE: EtatFormulaire = { erreurs: {} };

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
