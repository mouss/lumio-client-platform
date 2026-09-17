"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import {
  Alerte,
  BoutonEnvoyer,
  BOUTON_SECONDAIRE,
  CHAMP,
  Erreur,
  erreursDe,
  Succes,
  Avertissement,
  type Action,
} from "./champs";
import type { EtatFormulaire } from "./actions";
import {
  CONTENU_QUICK_WIN,
  CONTENU_SECOND_CERVEAU,
  CONTENU_SPRINT,
  fourchetteSprint,
} from "@/lib/offres-contenu";

const VIDE: EtatFormulaire = { erreurs: {} };

type TypeOffre = "QUICK_WIN" | "EXTENSION_SECOND_CERVEAU" | "SPRINT";

export type OffreAffichee = {
  id: string;
  titre: string;
  montant: number;
  statutLibelle: string;
  statut: string;
  dateEnvoiAffichee: string | null;
  modaliteFacturement: string;
  lienPaiement: string | null;
};

const TYPES: Array<{ valeur: TypeOffre; libelle: string; resume: string }> = [
  {
    valeur: "QUICK_WIN",
    libelle: "Pack Quick Win : Votre Employé IA 24/7",
    resume: "Produit d'entrée, 490 € HT.",
  },
  {
    valeur: "EXTENSION_SECOND_CERVEAU",
    libelle: "Extension Second Cerveau",
    resume: "Upsell du Pack, 500 € HT, ou 990 € HT en pack dédié.",
  },
  {
    valeur: "SPRINT",
    libelle: "AI Operations Sprint",
    resume: "Offre premium, tarifée à la valeur créée.",
  },
];

function euros(valeur: number): string {
  return `${valeur.toLocaleString("fr-FR")} € HT`;
}

function livrablesDe(type: TypeOffre): string[] {
  if (type === "QUICK_WIN") {
    return CONTENU_QUICK_WIN.livrables;
  }

  if (type === "EXTENSION_SECOND_CERVEAU") {
    return CONTENU_SECOND_CERVEAU.livrables;
  }

  return CONTENU_SPRINT.livrables;
}

function BoutonEnvoiEmail({
  offreId,
  action,
}: {
  offreId: string;
  action: Action;
}) {
  const [etat, envoyer] = useFormState(action, VIDE);
  const erreurs = erreursDe(etat);

  return (
    <form action={envoyer} className="flex flex-col gap-2">
      <input type="hidden" name="offreId" value={offreId} />
      <Alerte message={erreurs.general} />
      <Succes message={etat?.succes} />
      <div>
        <BoutonEnvoyer libelle="Envoyer par email" variante="secondaire" />
      </div>
    </form>
  );
}

/*
  Refus enregistre a la main sur la fiche, pour un prospect qui decline a l'oral.
  N'apparait que sur une offre encore ENVOYEE : une offre acceptee ne se renie pas
  depuis ce bouton.
*/
function BoutonMarquerRefusee({
  offreId,
  action,
}: {
  offreId: string;
  action: Action;
}) {
  const [etat, envoyer] = useFormState(action, VIDE);
  const erreurs = erreursDe(etat);

  return (
    <form
      action={envoyer}
      className="mt-3 flex flex-col gap-2 border-t border-lumio-white/10 pt-3"
    >
      <input type="hidden" name="offreId" value={offreId} />
      <Alerte message={erreurs.general} />
      <Succes message={etat?.succes} />
      <div>
        <BoutonEnvoyer libelle="Marquer refusée" variante="secondaire" />
      </div>
    </form>
  );
}

export function SectionOffre({
  clientId,
  restitutionExiste,
  lienProposition,
  offres,
  actionCreer,
  actionEnvoyer,
  actionRefuser,
}: {
  clientId: string;
  restitutionExiste: boolean;
  lienProposition: string;
  offres: OffreAffichee[];
  actionCreer: Action;
  actionEnvoyer: Action;
  actionRefuser: Action;
}) {
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [etat, envoyer] = useFormState(actionCreer, VIDE);
  const erreurs = erreursDe(etat);
  const succesCreation = etat?.succes;

  /*
    Une offre creee est deja marquee envoyee : laisser le formulaire ouvert avec les
    memes valeurs ferait creer un doublon au clic suivant. On le referme des que la
    creation a reussi.
  */
  useEffect(() => {
    if (succesCreation) {
      setFormulaireOuvert(false);
    }
  }, [succesCreation]);

  const [type, setType] = useState<TypeOffre>("QUICK_WIN");
  const [montant, setMontant] = useState(String(CONTENU_QUICK_WIN.montant));
  const [description, setDescription] = useState(CONTENU_QUICK_WIN.description);
  const [modalite, setModalite] = useState(
    CONTENU_QUICK_WIN.modaliteFacturement,
  );
  const [abonnement, setAbonnement] = useState(false);
  const [packDedie, setPackDedie] = useState(false);
  const [valeurAnnuelle, setValeurAnnuelle] = useState("");
  const [lienPaiement, setLienPaiement] = useState("");
  const [copie, setCopie] = useState(false);

  /*
    Le contenu de chaque offre est fige dans lib/offres-contenu.ts. Changer de type
    reinitialise les champs sur ce contenu : rien n'est regenere ni reformule.
  */
  function choisirType(nouveauType: TypeOffre) {
    setType(nouveauType);
    setPackDedie(false);
    setAbonnement(false);

    if (nouveauType === "QUICK_WIN") {
      setMontant(String(CONTENU_QUICK_WIN.montant));
      setDescription(CONTENU_QUICK_WIN.description);
      setModalite(CONTENU_QUICK_WIN.modaliteFacturement);
      return;
    }

    if (nouveauType === "EXTENSION_SECOND_CERVEAU") {
      setMontant(String(CONTENU_SECOND_CERVEAU.montantUpsell));
      setDescription(CONTENU_SECOND_CERVEAU.description);
      setModalite(CONTENU_SECOND_CERVEAU.modaliteFacturement);
      return;
    }

    setMontant("");
    setDescription(CONTENU_SPRINT.description);
    setModalite(CONTENU_SPRINT.modaliteFacturement);
  }

  function basculerPackDedie(actif: boolean) {
    setPackDedie(actif);
    setMontant(
      String(
        actif
          ? CONTENU_SECOND_CERVEAU.montantPackDedie
          : CONTENU_SECOND_CERVEAU.montantUpsell,
      ),
    );
  }

  const fourchette =
    valeurAnnuelle && Number.isFinite(Number(valeurAnnuelle))
      ? fourchetteSprint(Number(valeurAnnuelle))
      : null;

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(lienProposition);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé) : le lien reste lisible à l'écran.
      setCopie(false);
    }
  }

  return (
    <div className="mt-4">
      {!restitutionExiste ? (
        <Avertissement message="La restitution de l'audit doit être enregistrée avant de créer une offre : c'est elle que le prospect lira en premier, au-dessus de l'offre." />
      ) : null}

      {offres.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3">
          {offres.map((offre) => (
            <div
              key={offre.id}
              className="rounded-lg border border-lumio-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm text-lumio-white">{offre.titre}</span>
                <span className="text-sm text-lumio-white/70">
                  {euros(Number(offre.montant))}
                </span>
              </div>
              <p className="mt-1 text-xs text-lumio-white/50">
                {offre.statutLibelle}
                {offre.dateEnvoiAffichee
                  ? ` le ${offre.dateEnvoiAffichee}`
                  : ""}
                {offre.modaliteFacturement
                  ? `, ${offre.modaliteFacturement}`
                  : ""}
              </p>

              {offre.statut === "ENVOYEE" ? (
                <BoutonMarquerRefusee offreId={offre.id} action={actionRefuser} />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {offres.length > 0 && restitutionExiste ? (
        <div className="mt-4 rounded-lg border border-lumio-blue-light/30 bg-lumio-blue-light/5 p-5">
          <h3 className="text-sm font-medium text-lumio-white">
            Page à transmettre au prospect
          </h3>
          <p className="mt-2 text-xs text-lumio-white/50">
            Restitution et offre sur la même page, que le prospect peut valider
            en ligne. Le montant, la modalité et la mention d&apos;accord y sont
            repris tels quels.
          </p>

          <code className="mt-3 block break-all rounded-md border border-lumio-white/10 bg-lumio-black px-3 py-2 font-mono text-xs text-lumio-blue-light">
            {lienProposition}
          </code>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copierLien}
              className={BOUTON_SECONDAIRE}
            >
              {copie ? "Lien copié" : "Copier le lien"}
            </button>

            <BoutonEnvoiEmail offreId={offres[0].id} action={actionEnvoyer} />
          </div>
        </div>
      ) : null}

      {succesCreation ? (
        <div className="mt-4">
          <Succes message={succesCreation} />
        </div>
      ) : null}

      {!formulaireOuvert ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setFormulaireOuvert(true)}
            className="rounded-md bg-lumio-blue-light px-4 py-2 text-sm font-medium text-lumio-black transition-colors hover:bg-lumio-blue hover:text-lumio-white"
          >
            Créer une offre
          </button>
        </div>
      ) : (
        <form
          action={envoyer}
          className="mt-4 flex flex-col gap-6 rounded-lg border border-lumio-blue-light/30 bg-lumio-blue-light/5 p-5"
        >
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="type" value={type} />

          <Alerte message={erreurs.general} />

          <fieldset className="grid gap-3">
            <legend className="mb-1 text-sm text-lumio-white/70">
              Type d&apos;offre
            </legend>

            {TYPES.map((unType) => (
              <button
                key={unType.valeur}
                type="button"
                onClick={() => choisirType(unType.valeur)}
                aria-pressed={type === unType.valeur}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  type === unType.valeur
                    ? "border-lumio-blue-light bg-lumio-blue-light/10 text-lumio-white"
                    : "border-lumio-white/10 bg-white/[0.02] text-lumio-white/60 hover:border-lumio-white/25"
                }`}
              >
                <span className="block font-medium">{unType.libelle}</span>
                <span className="mt-1 block text-xs text-lumio-white/60">
                  {unType.resume}
                </span>
              </button>
            ))}
          </fieldset>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Titre
            <input
              type="text"
              value={TYPES.find((unType) => unType.valeur === type)?.libelle ?? ""}
              readOnly
              className={`${CHAMP} text-lumio-white/60`}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Description (modifiable pour ajuster un point précis)
            <textarea
              name="description"
              rows={3}
              value={description}
              onChange={(evenement) => setDescription(evenement.target.value)}
              className={CHAMP}
            />
          </label>

          {livrablesDe(type).length > 0 ? (
            <div className="rounded-md border border-lumio-white/10 bg-white/[0.02] p-4">
              <p className="text-xs uppercase tracking-wider text-lumio-white/40">
                Livrables inclus, figés pour cette offre
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {livrablesDe(type).map((livrable, index) => (
                  <li
                    key={index}
                    className="border-l-2 border-lumio-blue-light/40 pl-3 text-sm leading-relaxed text-lumio-white/80"
                  >
                    {livrable}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {type === "QUICK_WIN" ? (
            <label className="flex items-start gap-3 text-sm text-lumio-white/70">
              <input
                type="checkbox"
                name="abonnementMaintenanceInclus"
                checked={abonnement}
                onChange={(evenement) => setAbonnement(evenement.target.checked)}
                className="mt-1"
              />
              <span>
                Inclure l&apos;option maintenance (90 € HT/mois)
                <span className="mt-1 block text-xs text-lumio-white/50">
                  Option, décochée par défaut. Couvre les mises à jour des
                  modèles, l&apos;ajout de nouvelles compétences métier et le
                  support prioritaire.
                </span>
              </span>
            </label>
          ) : null}

          {type === "EXTENSION_SECOND_CERVEAU" ? (
            <div className="flex flex-col gap-3 rounded-md border border-lumio-white/10 bg-white/[0.02] p-4">
              <label className="flex items-start gap-3 text-sm text-lumio-white/70">
                <input
                  type="checkbox"
                  name="packDedie"
                  checked={packDedie}
                  onChange={(evenement) =>
                    basculerPackDedie(evenement.target.checked)
                  }
                  className="mt-1"
                />
                <span>
                  Pack dédié (vendu avec le Pack Quick Win dès le départ)
                  <span className="mt-1 block text-xs text-lumio-white/50">
                    Ajuste le montant à 990 € HT au lieu de 500 € HT. À ne
                    proposer qu&apos;à un client qui a déjà le Pack Quick Win ou
                    qui l&apos;achète en même temps.
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          {type === "SPRINT" ? (
            <div className="flex flex-col gap-3 rounded-md border border-lumio-white/10 bg-white/[0.02] p-4">
              <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
                Valeur annuelle estimée (économies ou ROI démontrable)
                <input
                  type="number"
                  value={valeurAnnuelle}
                  onChange={(evenement) =>
                    setValeurAnnuelle(evenement.target.value)
                  }
                  className={CHAMP}
                />
              </label>

              <p className="text-xs text-lumio-white/50">
                Politique Lumio : 25 à 30 % de la valeur annuelle créée.
                {fourchette
                  ? ` Fourchette indicative : ${euros(fourchette.min)} à ${euros(fourchette.max)}.`
                  : " Renseigne la valeur estimée pour obtenir une fourchette indicative."}
              </p>
            </div>
          ) : null}

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Montant en euros HT *
            <input
              type="text"
              inputMode="decimal"
              name="montant"
              value={montant}
              onChange={(evenement) => setMontant(evenement.target.value)}
              className={CHAMP}
            />
            <Erreur message={erreurs.montant} />
          </label>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Modalité de facturation
            <textarea
              name="modaliteFacturement"
              rows={2}
              value={modalite}
              onChange={(evenement) => setModalite(evenement.target.value)}
              className={CHAMP}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
            Lien de paiement (facultatif, Stripe ou équivalent)
            <input
              type="text"
              name="lienPaiement"
              value={lienPaiement}
              onChange={(evenement) => setLienPaiement(evenement.target.value)}
              className={CHAMP}
            />
          </label>

          <div className="flex items-center gap-3">
            <BoutonEnvoyer libelle="Créer et marquer envoyée" />
            <button
              type="button"
              onClick={() => setFormulaireOuvert(false)}
              className="text-sm text-lumio-white/50 hover:text-lumio-white"
            >
              Fermer
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
