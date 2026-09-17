# Plateforme client Lumio Digital

Application interne qui couvre tout le cycle client de Lumio Digital, de la réservation du RDV d'audit sur Calendly jusqu'au lancement opérationnel après signature : fiche client automatique, restitution d'audit, offre, acceptation, puis onboarding.

Le référentiel du projet (contexte, processus métier, grille tarifaire, stack, conventions) est dans `AGENTS.md`. Il fait foi avant toute autre source.

Nom du paquet npm : `lumio-onboarding-hermes`.

## État réel

Au 2026-09-17 : squelette de projet vérifié. Les pages et les routes API existent et répondent, mais restent des écrans à construire. Les routes API renvoient `501 not_implemented`. Aucun modèle Prisma n'est écrit, donc aucune table n'existe.

Vérifié réellement :

- `npm run build` passe, 13 routes générées.
- Le serveur répond : `/`, `/admin`, `/offres/[token]`, `/espace/[token]` et `/onboarding/[token]` en 200, les 7 routes API en 501.
- La chaîne base de données fonctionne de bout en bout : Next.js, Prisma 7, adaptateur `better-sqlite3`, fichier SQLite, avec `DATABASE_URL` lu depuis `.env`.

N'existe pas encore : authentification de `/admin`, modèles de données, webhook Calendly, envoi d'emails, génération du PDF d'audit, suite de tests.

## Arborescence

```
app/
  admin/                  dashboard interne, protégé
  offres/[token]/         page publique, avant signature : audit + proposition
  espace/[token]/         espace client public, après signature
  onboarding/[token]/     questionnaire public, 10 à 15 questions
  api/
    clients/              fiches clients
    offres/               offres commerciales
    abonnements/          maintenance et échéances
    emails/               envoi des emails clients
    questionnaire/        réponses au questionnaire
    updates/              mises à jour publiées dans l'espace client
    webhooks/calendly/    réservations et annulations Calendly
components/               composants réutilisables, style Lumio
lib/                      client Prisma, envoi d'emails, génération de roadmap
prisma/                   schema.prisma
generated/prisma/         client Prisma généré, ignoré par git
prisma7.config.ts         configuration de la CLI Prisma 7
```

## Stack

Next.js 14 App Router, React 18, TypeScript 5, Tailwind CSS 3, Prisma 7 avec l'adaptateur `@prisma/adapter-better-sqlite3` et SQLite, Nodemailer. Déploiement prévu sur VPS Hostinger avec PM2 et Nginx.

## Charte

Couleurs déclarées dans `tailwind.config.ts` sous le préfixe `lumio` : `lumio-black` `#050505`, `lumio-white` `#FFFFFF`, `lumio-blue` `#0054A6`, `lumio-blue-light` `#4D9FE8`. Le bleu reste un accent, jamais un fond dominant. Typographie RNS Sanz, substitut Helvetica Neue ou Arial en attendant l'intégration.

## Prérequis

- Node.js 24 ou plus récent.
- Un fichier `.env` dérivé de `.env.example`.

## Lancement

```bash
npm install          # lance aussi prisma generate via le script postinstall
cp .env.example .env
npm run db:push      # crée le fichier SQLite
npm run dev
```

L'application écoute sur `http://localhost:3000`.

## Scripts

| Script | Effet |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run start` | sert le build |
| `npm run lint` | ESLint |
| `npm run db:push` | applique le schéma Prisma à la base SQLite |
| `npm run db:generate` | régénère le client Prisma |

## Prisma

Prisma 7 : l'URL de connexion vit dans `prisma7.config.ts`, plus dans `schema.prisma`. Le client est généré en TypeScript dans `generated/prisma`, dossier ignoré par git et recréé par le script `postinstall`. Il s'importe par `@/generated/prisma/client` et s'instancie toujours avec un driver adapter, dans `lib/prisma.ts`.

Deux pièges vérifiés le 2026-09-17 :

- `better-sqlite3` est un module natif. Il doit rester dans `serverComponentsExternalPackages` (`next.config.mjs`), sinon webpack l'embarque et le paquet `bindings` ne retrouve plus son binaire : `TypeError: Cannot read properties of undefined (reading 'indexOf')`.
- Les entiers SQLite remontent en `BigInt`. `NextResponse.json` lève alors `TypeError: Do not know how to serialize a BigInt`. Convertir avant de renvoyer.

## Tests

Aucune suite de tests n'existe à ce jour.

## Conventions

- Aucun tiret cadratin dans les textes affichés dans l'interface, ni dans les commentaires et la documentation.
- Aucun chiffre, prix ou cas client inventé : chaque donnée affichée a une source écrite dans le vault Lumio Digital.
- Aucun secret dans le code : tout passe par `.env`, et `.env.example` porte les valeurs vides.
