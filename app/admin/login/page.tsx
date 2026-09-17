import { seConnecter } from "./actions";

const MESSAGES_ERREUR: Record<string, string> = {
  identifiants: "Mot de passe incorrect.",
  configuration:
    "ADMIN_PASSWORD n'est pas renseigné dans le fichier .env : la connexion est impossible.",
};

export default function PageConnexion({
  searchParams,
}: {
  searchParams: { erreur?: string };
}) {
  const message = searchParams.erreur
    ? (MESSAGES_ERREUR[searchParams.erreur] ?? "Connexion refusée.")
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="text-sm font-medium uppercase tracking-widest text-lumio-blue-light">
        Lumio Digital
      </p>
      <h1 className="mt-3 text-2xl font-light">Espace interne</h1>
      <p className="mt-3 text-sm leading-relaxed text-lumio-white/60">
        Accès réservé. Saisis le mot de passe d&apos;administration pour continuer.
      </p>

      {message ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300"
        >
          {message}
        </p>
      ) : null}

      <form action={seConnecter} className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-2 text-sm text-lumio-white/70">
          Mot de passe
          <input
            type="password"
            name="motDePasse"
            autoComplete="current-password"
            required
            className="rounded-md border border-lumio-white/15 bg-white/[0.03] px-3 py-2 text-lumio-white outline-none focus:border-lumio-blue-light"
          />
        </label>

        <button
          type="submit"
          className="mt-2 rounded-md bg-lumio-blue-light px-4 py-2 text-sm font-medium text-lumio-black transition-colors hover:bg-lumio-blue hover:text-lumio-white"
        >
          Se connecter
        </button>
      </form>
    </main>
  );
}
