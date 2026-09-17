import { FormulaireNouveauClient } from "./formulaire";
import { creerClient } from "./actions";

export default function PageNouveauClient() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-light">Nouveau client</h1>
      <p className="mt-2 text-sm leading-relaxed text-lumio-white/50">
        Les réservations Calendly créent leur fiche automatiquement. Ce
        formulaire sert aux rendez-vous pris par téléphone ou par email, et aux
        audits déjà réalisés.
      </p>

      <FormulaireNouveauClient action={creerClient} />
    </main>
  );
}
