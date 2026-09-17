export default function OffrePage({
  params,
}: {
  params: { token: string };
}) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-widest text-lumio-blue-light">
        Lumio Digital
      </p>
      <h1 className="mt-3 text-3xl font-light sm:text-4xl">
        Restitution de l&apos;audit et proposition
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-lumio-white/60">
        Page publique, accessible avant signature par un lien unique. Écran à
        construire : restitution des résultats de l&apos;audit, offre
        commerciale, et PDF téléchargeable.
      </p>
      <p className="mt-6 rounded-md border border-lumio-blue-light/20 bg-white/[0.02] px-4 py-3 text-sm text-lumio-white/70">
        Token reçu :{" "}
        <code className="font-mono text-lumio-blue-light">{params.token}</code>
      </p>
    </main>
  );
}
