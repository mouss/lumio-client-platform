import { Card } from "@/components/Card";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-lumio-blue-light">
        Espace interne
      </p>
      <h1 className="mt-3 text-3xl font-light sm:text-4xl">Dashboard</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-lumio-white/60">
        Écran à construire. Cette zone est réservée à Moussa et sera protégée
        par la variable ADMIN_PASSWORD. L&apos;authentification n&apos;est pas
        encore en place.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Card title="Fiches clients">
          Créées automatiquement par le webhook Calendly dès la réservation du
          rendez-vous d&apos;audit.
        </Card>
        <Card title="Restitution et offre">
          Rédaction de la restitution de l&apos;audit, puis construction de
          l&apos;offre la plus adaptée au client.
        </Card>
        <Card title="Abonnements">
          Suivi de la maintenance mensuelle et des échéances de paiement.
        </Card>
        <Card title="Emails">
          Envoi de l&apos;email de bienvenue, du questionnaire et des relances.
        </Card>
      </div>
    </main>
  );
}
