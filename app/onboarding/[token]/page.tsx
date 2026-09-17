export default function OnboardingPage({
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
        Questionnaire d&apos;onboarding
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-lumio-white/60">
        Formulaire public, accessible par un lien unique après la signature.
        Écran à construire : 10 à 15 questions maximum, réparties en informations
        générales, objectifs business, contexte et existant, accès techniques et
        contraintes. Toutes les questions sont obligatoires.
      </p>
      <p className="mt-6 rounded-md border border-lumio-blue-light/20 bg-white/[0.02] px-4 py-3 text-sm text-lumio-white/70">
        Token reçu :{" "}
        <code className="font-mono text-lumio-blue-light">{params.token}</code>
      </p>
    </main>
  );
}
