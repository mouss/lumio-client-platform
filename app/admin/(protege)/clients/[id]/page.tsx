import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateHeure } from "@/lib/format";
import { libelleStatut, teinteStatut } from "@/lib/statuts";
import { urlPublique } from "@/lib/urls";
import {
  creerOffre,
  enregistrerRestitution,
  envoyerOffreParEmail,
  marquerAuditFait,
  marquerOffreRefusee,
  remplacerFichierAudit,
} from "./actions";
import {
  FormulaireAuditFait,
  FormulaireRemplacementFichier,
} from "./formulaires";
import { SectionRestitution } from "./restitution";
import { SectionOffre } from "./offre";

export const dynamic = "force-dynamic";

function Ligne({
  libelle,
  valeur,
}: {
  libelle: string;
  valeur: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wider text-lumio-white/40">
        {libelle}
      </dt>
      <dd className="text-sm text-lumio-white/80">{valeur}</dd>
    </div>
  );
}

function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-lg border border-lumio-white/10 bg-white/[0.02] p-6">
      <h2 className="text-sm font-medium uppercase tracking-wider text-lumio-white/40">
        {titre}
      </h2>
      {children}
    </section>
  );
}

export default async function PageClient({
  params,
}: {
  params: { id: string };
}) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      token: true,
      nom: true,
      entreprise: true,
      email: true,
      telephone: true,
      dateAudit: true,
      notesAudit: true,
      statut: true,
      calendlyEventUri: true,
      fichierAuditNom: true,
      restitution: {
        select: {
          syntheseDiagnostic: true,
          opportunites: true,
          roiEstime: true,
          recommandation: true,
        },
      },
      offres: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          titre: true,
          montant: true,
          statut: true,
          dateEnvoi: true,
          modaliteFacturement: true,
          lienPaiement: true,
        },
      },
      questionnaire: {
        select: {
          objectifPrincipal: true,
          kpi: true,
          deadlineIdeale: true,
          outilsActuels: true,
          processActuel: true,
          problemesPrincipaux: true,
          accesTechniques: true,
          contraintesLegales: true,
          contraintesInternes: true,
          completedAt: true,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const lienFichier = `/api/admin/clients/${client.id}/fichier-audit`;
  const lienProposition = urlPublique(`/offres/${client.token}`);

  // Une restitution se verrouille des qu'une offre est partie chez le prospect.
  const restitutionVerrouillee = client.offres.some(
    (offre) => offre.dateEnvoi !== null,
  );

  const restitution = client.restitution
    ? {
        syntheseDiagnostic: client.restitution.syntheseDiagnostic,
        // Le champ est du Json : on ne fait confiance qu'a un tableau de chaines.
        opportunites: Array.isArray(client.restitution.opportunites)
          ? client.restitution.opportunites.filter(
              (element): element is string => typeof element === "string",
            )
          : [],
        roiEstime: client.restitution.roiEstime,
        recommandation: client.restitution.recommandation,
      }
    : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/admin"
        className="text-sm text-lumio-white/50 hover:text-lumio-white"
      >
        Retour aux clients
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light">{client.nom}</h1>
          {client.entreprise ? (
            <p className="mt-1 text-sm text-lumio-white/50">
              {client.entreprise}
            </p>
          ) : null}
        </div>

        <span
          className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs ${teinteStatut(client.statut)}`}
        >
          {libelleStatut(client.statut)}
        </span>
      </div>

      <Section titre="Coordonnées">
        <dl className="mt-4 grid gap-5 sm:grid-cols-2">
          <Ligne libelle="Email" valeur={client.email} />
          <Ligne libelle="Téléphone" valeur={client.telephone ?? "Non renseigné"} />
          <Ligne libelle="Date d'audit" valeur={formatDateHeure(client.dateAudit)} />
          <Ligne
            libelle="Origine"
            valeur={client.calendlyEventUri ? "Réservation Calendly" : "Saisie manuelle"}
          />
        </dl>
      </Section>

      <Section titre="Notes d'audit (interne)">
        {client.notesAudit ? (
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-lumio-white/80">
            {client.notesAudit}
          </p>
        ) : (
          <p className="mt-3 text-sm text-lumio-white/50">
            Rien de noté pour l&apos;instant. Ces notes servent à préparer la
            restitution, elles ne sont jamais montrées au client.
          </p>
        )}
      </Section>

      <Section titre="Fichier d'audit brut">
        {client.fichierAuditNom ? (
          <div className="mt-3">
            <a
              href={lienFichier}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-lumio-blue-light hover:underline"
            >
              Voir le fichier d&apos;audit
            </a>
            <span className="ml-3 text-sm text-lumio-white/50">
              {client.fichierAuditNom}
            </span>

            <div className="mt-2">
              <FormulaireRemplacementFichier
                clientId={client.id}
                action={remplacerFichierAudit}
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-lumio-white/50">
            Aucun fichier déposé. Il peut être ajouté en marquant l&apos;audit
            comme fait, ou depuis le bouton ci-dessous une fois l&apos;audit fait.
          </p>
        )}
      </Section>

      {client.statut === "RDV_PLANIFIE" ? (
        <Section titre="Après l'échange">
          <div className="mt-4">
            <FormulaireAuditFait client={client} action={marquerAuditFait} />
          </div>
        </Section>
      ) : null}

      <Section titre="Restitution de l'audit">
        <SectionRestitution
          clientId={client.id}
          restitution={restitution}
          verrouillee={restitutionVerrouillee}
          action={enregistrerRestitution}
        />
      </Section>

      <Section titre="Offre">
        <SectionOffre
          clientId={client.id}
          restitutionExiste={restitution !== null}
          lienProposition={lienProposition}
          offres={client.offres.map((offre) => ({
            id: offre.id,
            titre: offre.titre,
            montant: Number(offre.montant),
            statut: offre.statut,
            statutLibelle: libelleStatut(offre.statut),
            dateEnvoiAffichee: offre.dateEnvoi
              ? formatDateHeure(offre.dateEnvoi)
              : null,
            modaliteFacturement: offre.modaliteFacturement,
            lienPaiement: offre.lienPaiement,
          }))}
          actionCreer={creerOffre}
          actionEnvoyer={envoyerOffreParEmail}
          actionRefuser={marquerOffreRefusee}
        />
      </Section>

      <Section titre="Questionnaire d'onboarding">
        {client.questionnaire ? (
          <dl className="mt-4 grid gap-4">
            <Ligne
              libelle="Reçu le"
              valeur={formatDateHeure(client.questionnaire.completedAt)}
            />
            <Ligne
              libelle="Objectif principal"
              valeur={client.questionnaire.objectifPrincipal}
            />
            <Ligne
              libelle="Indicateur de succès"
              valeur={client.questionnaire.kpi}
            />
            <Ligne
              libelle="Deadline idéale"
              valeur={client.questionnaire.deadlineIdeale}
            />
            <Ligne
              libelle="Outils actuels"
              valeur={client.questionnaire.outilsActuels}
            />
            <Ligne
              libelle="Process actuel"
              valeur={client.questionnaire.processActuel}
            />
            <Ligne
              libelle="Problèmes principaux"
              valeur={client.questionnaire.problemesPrincipaux}
            />
            <Ligne
              libelle="Accès techniques à ouvrir"
              valeur={
                Array.isArray(client.questionnaire.accesTechniques)
                  ? client.questionnaire.accesTechniques
                      .filter(
                        (element): element is string =>
                          typeof element === "string" && element.trim() !== "",
                      )
                      .join(", ") || "Aucun coché"
                  : "Aucun coché"
              }
            />
            <Ligne
              libelle="Contraintes légales ou RGPD"
              valeur={client.questionnaire.contraintesLegales}
            />
            <Ligne
              libelle="Contraintes internes"
              valeur={client.questionnaire.contraintesInternes}
            />
          </dl>
        ) : (
          <p className="mt-4 text-sm text-lumio-white/60">
            Pas encore de réponse. Le questionnaire s&apos;ouvre au client dès que
            son offre est validée.
          </p>
        )}
      </Section>

      <Section titre="Liens à transmettre">
        <dl className="mt-4 grid gap-4">
          <Ligne
            libelle="Proposition commerciale, avant signature"
            valeur={
              <code className="break-all font-mono text-xs text-lumio-blue-light">
                {lienProposition}
              </code>
            }
          />
          <Ligne
            libelle="Espace client, après signature"
            valeur={
              <code className="break-all font-mono text-xs text-lumio-blue-light">
                {urlPublique(`/espace/${client.token}`)}
              </code>
            }
          />
          <Ligne
            libelle="Questionnaire d'onboarding"
            valeur={
              <code className="break-all font-mono text-xs text-lumio-blue-light">
                {urlPublique(`/onboarding/${client.token}`)}
              </code>
            }
          />
        </dl>

        <p className="mt-4 text-xs text-lumio-white/40">
          La page de proposition et le questionnaire sont en ligne. La page de
          l&apos;espace client reste à construire.
        </p>
      </Section>
    </main>
  );
}
