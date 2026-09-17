import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateHeure } from "@/lib/format";
import { libelleStatut, teinteStatut } from "@/lib/statuts";

// La liste depend de la base : jamais prerendue au build.
export const dynamic = "force-dynamic";

export default async function PageClients() {
  const clients = await prisma.client.findMany({
    orderBy: [{ dateAudit: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      nom: true,
      entreprise: true,
      email: true,
      telephone: true,
      dateAudit: true,
      statut: true,
      calendlyEventUri: true,
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light">Clients</h1>
          <p className="mt-1 text-sm text-lumio-white/50">
            {clients.length === 0
              ? "Aucune fiche pour le moment."
              : `${clients.length} fiche${clients.length > 1 ? "s" : ""} dans la base.`}
          </p>
        </div>

        <Link
          href="/admin/nouveau"
          className="rounded-md bg-lumio-blue-light px-4 py-2 text-sm font-medium text-lumio-black transition-colors hover:bg-lumio-blue hover:text-lumio-white"
        >
          Nouveau client
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="mt-10 rounded-lg border border-lumio-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-lumio-white/50">
          Les fiches arrivent ici automatiquement à chaque réservation Calendly,
          ou se créent à la main depuis « Nouveau client ».
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-lumio-white/10 text-xs uppercase tracking-wider text-lumio-white/40">
                <th className="py-3 pr-4 font-medium">Nom</th>
                <th className="py-3 pr-4 font-medium">Contact</th>
                <th className="py-3 pr-4 font-medium">Date</th>
                <th className="py-3 pr-4 font-medium">Statut</th>
                <th className="py-3 font-medium">Origine</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-lumio-white/5 align-top"
                >
                  <td className="py-4 pr-4">
                    <span className="text-lumio-white">{client.nom}</span>
                    {client.entreprise ? (
                      <span className="block text-lumio-white/50">
                        {client.entreprise}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-4 pr-4">
                    <span className="block text-lumio-white/70">
                      {client.email}
                    </span>
                    {client.telephone ? (
                      <span className="block text-lumio-white/50">
                        {client.telephone}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-4 pr-4 text-lumio-white/70">
                    {formatDateHeure(client.dateAudit)}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs ${teinteStatut(client.statut)}`}
                    >
                      {libelleStatut(client.statut)}
                    </span>
                  </td>
                  <td className="py-4 text-lumio-white/50">
                    {client.calendlyEventUri ? "Calendly" : "Saisie manuelle"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
