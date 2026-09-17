import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LIBELLE_MAINTENANCE } from "@/lib/offres-contenu";
import { FormulaireAcceptation } from "./formulaire-acceptation";

/*
  Page publique du prospect, accessible par le token unique du client, sans compte.
  Elle montre d'abord ce que l'audit a revele (posture de diagnostiqueur), puis la
  proposition qui en decoule. Le prospect accepte ou pose une question.

  Le token vaut autorisation : il est en uuid v4, donc non devinable. La page n'est
  jamais indexee, un lien de proposition n'a rien a faire dans un moteur de recherche.
*/

export const metadata: Metadata = {
  title: "Votre audit et notre proposition, Lumio Digital",
  robots: { index: false, follow: false },
};

// Le contenu depend de l'etat de l'offre (envoyee, acceptee, refusee) : aucune mise en cache.
export const dynamic = "force-dynamic";

const EMAIL_CONTACT = "moussa@lumiodigital.fr";

function listeDeTextes(valeur: unknown): string[] {
  if (!Array.isArray(valeur)) {
    return [];
  }

  return valeur.filter(
    (element): element is string =>
      typeof element === "string" && element.trim() !== "",
  );
}

export default async function OffrePage({
  params,
}: {
  params: { token: string };
}) {
  const client = await prisma.client.findUnique({
    where: { token: params.token },
    include: {
      restitution: true,
      offres: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) {
    notFound();
  }

  const restitution = client.restitution;
  const offreEnAttente =
    client.offres.find((offre) => offre.statut === "ENVOYEE") ?? null;
  const derniereOffre = client.offres[0] ?? null;
  const offreAcceptee =
    !offreEnAttente && derniereOffre?.statut === "ACCEPTEE" ? derniereOffre : null;
  const offreRefusee =
    !offreEnAttente && derniereOffre?.statut === "REFUSEE" ? derniereOffre : null;

  const opportunites = listeDeTextes(restitution?.opportunites);

  const titreLienPaiement = offreEnAttente?.lienPaiement?.trim() ?? "";
  const montantAffiche = offreEnAttente
    ? Number(offreEnAttente.montant).toLocaleString("fr-FR")
    : "";

  // Livrables en liste pour les offres dont le contenu est fige ; le Sprint se saisit
  // librement et n'en a pas.
  const livrables =
    offreEnAttente &&
    (offreEnAttente.type === "QUICK_WIN" ||
      offreEnAttente.type === "EXTENSION_SECOND_CERVEAU")
      ? listeDeTextes(offreEnAttente.livrables)
      : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <header className="border-b border-lumio-white/10 pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-lumio-blue-light">
          Lumio Digital
        </p>
        <h1 className="mt-4 text-3xl font-light leading-tight sm:text-4xl">
          Votre audit et notre proposition
        </h1>
        <p className="mt-3 text-sm text-lumio-white/60">
          Préparé pour {client.nom}
          {client.entreprise ? `, ${client.entreprise}` : ""}
        </p>
      </header>

      {restitution ? (
        <section className="mt-12">
          <h2 className="text-xl font-light sm:text-2xl">
            Ce que l&apos;audit a révélé
          </h2>

          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-lumio-white/80">
            {restitution.syntheseDiagnostic}
          </p>

          {opportunites.length > 0 ? (
            <div className="mt-10">
              <h3 className="text-sm font-medium uppercase tracking-widest text-lumio-white/50">
                Ce que nous avons identifié
              </h3>
              <ul className="mt-4 space-y-3">
                {opportunites.map((opportunite, index) => (
                  <li
                    key={index}
                    className="border-l-2 border-lumio-blue-light/40 pl-4 text-base leading-relaxed text-lumio-white/80"
                  >
                    {opportunite}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {restitution.roiEstime ? (
            <div className="mt-10 rounded-lg border border-lumio-blue-light/30 bg-lumio-blue/[0.12] px-6 py-5">
              <p className="text-xs font-medium uppercase tracking-widest text-lumio-blue-light">
                Impact estimé
              </p>
              <p className="mt-2 text-lg leading-snug text-lumio-white">
                {restitution.roiEstime}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {restitution?.recommandation ? (
        <p className="mt-12 border-l-2 border-lumio-blue-light pl-5 text-lg font-light leading-relaxed text-lumio-white">
          {restitution.recommandation}
        </p>
      ) : null}

      {offreEnAttente ? (
        <section className="mt-12">
          <h2 className="text-xl font-light sm:text-2xl">Ce que je vous propose</h2>

          <div className="mt-6 rounded-lg border border-lumio-white/10 bg-white/[0.02] px-6 py-7">
            <h3 className="text-lg font-medium text-lumio-white">
              {offreEnAttente.titre}
            </h3>

            {offreEnAttente.description ? (
              <p className="mt-3 text-base leading-relaxed text-lumio-white/75">
                {offreEnAttente.description}
              </p>
            ) : null}

            {livrables.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {livrables.map((livrable, index) => (
                  <li
                    key={index}
                    className="flex gap-3 text-base leading-relaxed text-lumio-white/80"
                  >
                    <span aria-hidden="true" className="text-lumio-blue-light">
                      •
                    </span>
                    <span>{livrable}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-8 border-t border-lumio-white/10 pt-6">
              <p className="text-2xl font-light text-lumio-white">
                {montantAffiche} € <span className="text-base text-lumio-white/60">HT</span>
              </p>

              {offreEnAttente.abonnementMaintenanceInclus ? (
                <p className="mt-2 text-sm text-lumio-white/70">
                  + {LIBELLE_MAINTENANCE} d&apos;option maintenance incluse
                </p>
              ) : null}

              <p className="mt-4 text-sm leading-relaxed text-lumio-white/60">
                {offreEnAttente.modaliteFacturement}
              </p>

              {titreLienPaiement ? (
                <a
                  href={titreLienPaiement}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-block rounded-md bg-lumio-blue px-5 py-2.5 text-sm font-medium text-lumio-white transition hover:bg-lumio-blue-light hover:text-lumio-black"
                >
                  Régler l&apos;acompte
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {offreEnAttente ? (
        <section className="mt-12 border-t border-lumio-white/10 pt-10">
          <FormulaireAcceptation
            token={client.token}
            nomParDefaut={client.nom}
            emailContact={EMAIL_CONTACT}
            titreOffre={offreEnAttente.titre}
          />
        </section>
      ) : null}

      {offreAcceptee ? (
        <section className="mt-12 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.07] px-6 py-8">
          <h2 className="text-xl font-light text-lumio-white">
            C&apos;est noté, merci pour votre confiance
          </h2>
          <p className="mt-4 text-base leading-relaxed text-lumio-white/80">
            Votre accord sur {offreAcceptee.titre} est enregistré
            {offreAcceptee.signatureNom
              ? ` au nom de ${offreAcceptee.signatureNom}`
              : ""}
            . Je vous envoie le questionnaire d&apos;onboarding par email, il nous
            permet de partir de votre réalité et pas d&apos;une page blanche.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-lumio-white/60">
            Une question d&apos;ici là ? Écrivez à{" "}
            <a
              href={`mailto:${EMAIL_CONTACT}`}
              className="text-lumio-blue-light underline-offset-4 hover:underline"
            >
              {EMAIL_CONTACT}
            </a>
            .
          </p>
        </section>
      ) : null}

      {offreRefusee ? (
        <section className="mt-12 rounded-lg border border-lumio-white/10 bg-white/[0.02] px-6 py-8">
          <h2 className="text-xl font-light text-lumio-white">
            Proposition classée sans suite
          </h2>
          <p className="mt-4 text-base leading-relaxed text-lumio-white/75">
            Cette proposition a été marquée comme refusée. Si la situation évolue,
            écrivez à{" "}
            <a
              href={`mailto:${EMAIL_CONTACT}`}
              className="text-lumio-blue-light underline-offset-4 hover:underline"
            >
              {EMAIL_CONTACT}
            </a>
            , on la reprend où elle en est.
          </p>
        </section>
      ) : null}

      {!offreEnAttente && !offreAcceptee && !offreRefusee ? (
        <section className="mt-12 rounded-lg border border-lumio-white/10 bg-white/[0.02] px-6 py-8">
          <h2 className="text-xl font-light text-lumio-white">
            Votre proposition arrive
          </h2>
          <p className="mt-4 text-base leading-relaxed text-lumio-white/75">
            L&apos;audit est bien enregistré, la proposition chiffrée est en
            préparation. Vous recevrez un email dès qu&apos;elle est prête.
          </p>
        </section>
      ) : null}

      <footer className="mt-16 border-t border-lumio-white/10 pt-6">
        <p className="text-xs leading-relaxed text-lumio-white/40">
          Lumio Digital, agent IA et automatisation pour PME. Écrivez à{" "}
          <a
            href={`mailto:${EMAIL_CONTACT}`}
            className="text-lumio-white/60 underline-offset-4 hover:underline"
          >
            {EMAIL_CONTACT}
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
