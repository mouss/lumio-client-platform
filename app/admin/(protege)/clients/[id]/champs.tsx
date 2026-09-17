"use client";

import { useFormStatus } from "react-dom";
import type { EtatFormulaire } from "./actions";

/*
  Primitives partagees par les formulaires de la fiche client.
  L'etat recu de useFormState peut etre undefined pendant une transition : tout passe par
  erreursDe() pour ne jamais lire un champ sur un objet absent.
*/

export const CHAMP =
  "rounded-md border border-lumio-white/15 bg-white/[0.03] px-3 py-2 text-lumio-white outline-none focus:border-lumio-blue-light";

export const BOUTON_PRINCIPAL =
  "rounded-md bg-lumio-blue-light px-4 py-2 text-sm font-medium text-lumio-black transition-colors hover:bg-lumio-blue hover:text-lumio-white disabled:cursor-not-allowed disabled:opacity-50";

export const BOUTON_SECONDAIRE =
  "rounded-md border border-lumio-blue-light/40 px-4 py-2 text-sm font-medium text-lumio-blue-light transition-colors hover:border-lumio-blue-light hover:bg-lumio-blue-light/10";

export type Action = (
  etat: EtatFormulaire,
  donnees: FormData,
) => Promise<EtatFormulaire>;

export function erreursDe(
  etat: EtatFormulaire | undefined,
): Record<string, string> {
  return etat?.erreurs ?? {};
}

export function Erreur({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <span className="text-xs text-red-300">{message}</span>;
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

export function Avertissement({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">
      {message}
    </p>
  );
}

export function Succes({ message }: { message?: string }) {
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

export function BoutonEnvoyer({
  libelle,
  variante = "principal",
}: {
  libelle: string;
  variante?: "principal" | "secondaire";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={variante === "principal" ? BOUTON_PRINCIPAL : BOUTON_SECONDAIRE}
    >
      {pending ? "Enregistrement..." : libelle}
    </button>
  );
}
