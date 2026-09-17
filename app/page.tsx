import { Card } from "@/components/Card";

const ESPACES = [
  {
    href: "/admin",
    titre: "Espace interne",
    description:
      "Dashboard protégé, usage interne : fiches clients, restitution de l'audit, offres, abonnements.",
  },
  {
    href: "/offres/exemple",
    titre: "Proposition commerciale",
    description:
      "Page publique par token, avant signature : restitution de l'audit et offre commerciale.",
  },
  {
    href: "/espace/exemple",
    titre: "Espace client",
    description:
      "Page publique par token, après signature : feuille de route et suivi du projet.",
  },
  {
    href: "/onboarding/exemple",
    titre: "Questionnaire d'onboarding",
    description:
      "Formulaire public par token, 10 à 15 questions, ouvert après la signature.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-lumio-blue-light">
        Lumio Digital
      </p>
      <h1 className="mt-3 text-3xl font-light sm:text-4xl">
        Plateforme client
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-lumio-white/60">
        Cycle client complet, de la réservation du rendez-vous d'audit sur
        Calendly jusqu'au lancement opérationnel. Cet écran est un index de
        développement, il n'est pas destiné à un client.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {ESPACES.map((espace) => (
          <Card
            key={espace.href}
            title={espace.titre}
            href={espace.href}
            hrefLabel="Ouvrir"
          >
            {espace.description}
          </Card>
        ))}
      </div>
    </main>
  );
}
