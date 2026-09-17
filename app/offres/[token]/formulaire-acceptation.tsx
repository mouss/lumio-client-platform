"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/*
  Validation de l'offre par le prospect, sans compte.

  Deux temps : un bouton, puis une confirmation qui demande le nom complet (pre-rempli
  avec le nom de la fiche, modifiable). C'est ce nom qui est enregistre dans
  Offre.signatureNom, il doit donc pouvoir differer du titulaire de la fiche.

  Apres succes, on rafraichit la page cote serveur : c'est le rendu serveur qui decide
  de l'affichage (proposition en attente, acceptee, refusee), jamais l'etat local.
*/

const MENTION_ACCORD =
  "Cette validation en ligne confirme votre accord sur cette proposition. Un contrat détaillé vous sera transmis séparément si nécessaire. Elle vaut accord écrit entre nous, ce n'est pas une signature électronique qualifiée.";

const BOUTON_PRINCIPAL =
  "rounded-md bg-lumio-blue px-6 py-3 text-sm font-medium text-lumio-white transition hover:bg-lumio-blue-light hover:text-lumio-black disabled:cursor-not-allowed disabled:opacity-60";

const BOUTON_SECONDAIRE =
  "rounded-md border border-lumio-white/20 px-6 py-3 text-sm font-medium text-lumio-white/80 transition hover:border-lumio-white/40 hover:text-lumio-white disabled:cursor-not-allowed disabled:opacity-60";

export function FormulaireAcceptation({
  token,
  nomParDefaut,
  emailContact,
  titreOffre,
}: {
  token: string;
  nomParDefaut: string;
  emailContact: string;
  titreOffre: string;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState(nomParDefaut);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const lienQuestion = `mailto:${emailContact}?subject=${encodeURIComponent(
    `Une question avant de valider : ${titreOffre}`,
  )}`;

  async function valider() {
    const nomNettoye = nom.trim();

    if (!nomNettoye) {
      setErreur("Indiquez votre nom complet pour valider.");
      return;
    }

    setEnCours(true);
    setErreur(null);

    try {
      const reponse = await fetch(`/api/offres/${token}/accepter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureNom: nomNettoye }),
      });

      const donnees = (await reponse.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!reponse.ok) {
        setErreur(
          donnees?.message ??
            "La validation n'a pas pu être enregistrée. Réessayez dans un instant.",
        );
        setEnCours(false);
        return;
      }

      setOuvert(false);
      setEnCours(false);
      router.refresh();
    } catch {
      setErreur(
        "Connexion impossible. Vérifiez votre réseau et réessayez dans un instant.",
      );
      setEnCours(false);
    }
  }

  if (!ouvert) {
    return (
      <div>
        <button
          type="button"
          className={BOUTON_PRINCIPAL}
          onClick={() => {
            setErreur(null);
            setOuvert(true);
          }}
        >
          Accepter cette offre
        </button>

        <p className="mt-4 max-w-xl text-xs leading-relaxed text-lumio-white/45">
          {MENTION_ACCORD}
        </p>

        <p className="mt-5 text-sm">
          <a
            href={lienQuestion}
            className="text-lumio-blue-light underline-offset-4 hover:underline"
          >
            J&apos;ai une question avant de valider
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl rounded-lg border border-lumio-blue-light/30 bg-white/[0.03] px-6 py-6">
      <h3 className="text-base font-medium text-lumio-white">
        Confirmer votre accord
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-lumio-white/70">
        Indiquez votre nom complet. Il est enregistré avec votre validation, comme
        preuve de l&apos;accord.
      </p>

      <label
        htmlFor="signatureNom"
        className="mt-5 block text-xs font-medium uppercase tracking-widest text-lumio-white/50"
      >
        Nom complet
      </label>
      <input
        id="signatureNom"
        name="signatureNom"
        type="text"
        value={nom}
        autoComplete="name"
        onChange={(evenement) => setNom(evenement.target.value)}
        className="mt-2 w-full rounded-md border border-lumio-white/15 bg-lumio-black px-4 py-2.5 text-sm text-lumio-white outline-none focus:border-lumio-blue-light"
      />

      {erreur ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300"
        >
          {erreur}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className={BOUTON_PRINCIPAL}
          onClick={valider}
          disabled={enCours}
        >
          {enCours ? "Enregistrement..." : "Valider et accepter"}
        </button>
        <button
          type="button"
          className={BOUTON_SECONDAIRE}
          onClick={() => setOuvert(false)}
          disabled={enCours}
        >
          Annuler
        </button>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-lumio-white/45">
        {MENTION_ACCORD}
      </p>
    </div>
  );
}
