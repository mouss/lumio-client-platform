import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FormulaireQuestionnaire } from "./formulaire-questionnaire";

/*
  Questionnaire d'onboarding, etape 2 du guide d'onboarding client du vault.
  Page publique, accessible par le token du client, sans compte.

  Regle du guide : 10 a 15 questions maximum, claires, actionnables, obligatoires.
  Les informations generales sont pre-remplies depuis la fiche et corrigibles, les
  neuf questions de fond sont obligatoires. Aucun acces technique n'est demande ici
  en plus : la liste sert a savoir lesquels ouvrir, pas a saisir des identifiants.
*/

export const metadata: Metadata = {
  title: "Votre questionnaire d'onboarding, Lumio Digital",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Le questionnaire est ouvert a partir de l'acceptation de l'offre, et tant que
// l'analyse interne n'est pas faite. Ensuite il passe en lecture seule.
const STATUTS_OUVERTS = [
  "OFFRE_ACCEPTEE",
  "QUESTIONNAIRE_ENVOYE",
  "QUESTIONNAIRE_COMPLETE",
];

const STATUTS_LECTURE_SEULE = [
  "ANALYSE_FAITE",
  "APPEL_PLANIFIE",
  "APPEL_FAIT",
  "ROADMAP_ENVOYEE",
  "EN_COURS",
  "LIVRE",
  "CLOS",
];

function listeDeTextes(valeur: unknown): string[] {
  if (!Array.isArray(valeur)) {
    return [];
  }

  return valeur.filter(
    (element): element is string =>
      typeof element === "string" && element.trim() !== "",
  );
}

export default async function QuestionnairePage({
  params,
}: {
  params: { token: string };
}) {
  const client = await prisma.client.findUnique({
    where: { token: params.token },
    include: { questionnaire: true },
  });

  if (!client) {
    notFound();
  }

  const reponses = client.questionnaire;
  const ouvert = STATUTS_OUVERTS.includes(client.statut);
  const lectureSeule = STATUTS_LECTURE_SEULE.includes(client.statut);
  const accesTechniques = listeDeTextes(reponses?.accesTechniques);

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <header className="border-b border-lumio-white/10 pb-8">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-lumio-blue-light">
          Lumio Digital
        </p>
        <h1 className="mt-4 text-3xl font-light leading-tight sm:text-4xl">
          Votre questionnaire d&apos;onboarding
        </h1>
        <p className="mt-3 text-sm text-lumio-white/60">
          Préparé pour {client.nom}
          {client.entreprise ? `, ${client.entreprise}` : ""}
        </p>
      </header>

      {!ouvert && !lectureSeule ? (
        <section className="mt-12 rounded-lg border border-lumio-white/10 bg-white/[0.02] px-6 py-8">
          <h2 className="text-xl font-light text-lumio-white">
            Le questionnaire n&apos;est pas encore ouvert
          </h2>
          <p className="mt-4 text-base leading-relaxed text-lumio-white/75">
            Il s&apos;ouvre dès que votre proposition est validée. Si vous pensez
            qu&apos;il devrait déjà être accessible, répondez à l&apos;email de
            bienvenue ou écrivez à moussa@lumiodigital.fr.
          </p>
        </section>
      ) : null}

      {lectureSeule ? (
        <section className="mt-12 rounded-lg border border-lumio-white/10 bg-white/[0.02] px-6 py-8">
          <h2 className="text-xl font-light text-lumio-white">
            Questionnaire transmis, merci
          </h2>
          <p className="mt-4 text-base leading-relaxed text-lumio-white/75">
            Vos réponses sont arrivées et le travail a démarré. Le questionnaire
            n&apos;est plus modifiable : si un point a changé, dites-le pendant
            l&apos;appel de lancement ou par email.
          </p>
        </section>
      ) : null}

      {ouvert ? (
        <FormulaireQuestionnaire
          token={client.token}
          dejaRepondu={reponses !== null}
          valeursInitiales={{
            nom: client.nom,
            entreprise: client.entreprise ?? "",
            telephone: client.telephone ?? "",
            objectifPrincipal: reponses?.objectifPrincipal ?? "",
            kpi: reponses?.kpi ?? "",
            deadlineIdeale: reponses?.deadlineIdeale ?? "",
            outilsActuels: reponses?.outilsActuels ?? "",
            processActuel: reponses?.processActuel ?? "",
            problemesPrincipaux: reponses?.problemesPrincipaux ?? "",
            contraintesLegales: reponses?.contraintesLegales ?? "",
            contraintesInternes: reponses?.contraintesInternes ?? "",
            accesTechniques,
          }}
        />
      ) : null}

      {lectureSeule && reponses ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-widest text-lumio-white/50">
            Ce que vous nous avez transmis
          </h2>

          <dl className="mt-5 flex flex-col gap-5">
            {[
              ["Objectif principal", reponses.objectifPrincipal],
              ["Indicateur de succès", reponses.kpi],
              ["Deadline idéale", reponses.deadlineIdeale],
              ["Outils actuels", reponses.outilsActuels],
              ["Process actuel", reponses.processActuel],
              ["Problèmes principaux", reponses.problemesPrincipaux],
              [
                "Accès techniques à ouvrir",
                accesTechniques.length > 0 ? accesTechniques.join(", ") : null,
              ],
              ["Contraintes légales ou RGPD", reponses.contraintesLegales],
              ["Contraintes internes", reponses.contraintesInternes],
            ]
              .filter(([, valeur]) => valeur)
              .map(([libelle, valeur]) => (
                <div key={String(libelle)}>
                  <dt className="text-xs font-medium uppercase tracking-widest text-lumio-white/50">
                    {libelle}
                  </dt>
                  <dd className="mt-1 whitespace-pre-line text-base leading-relaxed text-lumio-white/80">
                    {valeur}
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      ) : null}

      <footer className="mt-16 border-t border-lumio-white/10 pt-6">
        <p className="text-xs leading-relaxed text-lumio-white/40">
          Une question sur le questionnaire ? Écrivez à{" "}
          <a
            href="mailto:moussa@lumiodigital.fr"
            className="text-lumio-white/60 underline-offset-4 hover:underline"
          >
            moussa@lumiodigital.fr
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
