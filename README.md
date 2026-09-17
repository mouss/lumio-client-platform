# Plateforme client Lumio Digital

Application interne qui couvre tout le cycle client de Lumio Digital, de la réservation du RDV d'audit sur Calendly jusqu'au lancement opérationnel après signature : fiche client automatique, restitution d'audit, offre, acceptation, puis onboarding.

Le référentiel du projet (contexte, processus métier, grille tarifaire, stack, conventions) est dans `AGENTS.md`. Il fait foi avant toute autre source.

Nom du paquet npm : `lumio-onboarding-hermes`.

## État réel

Au 2026-09-17 : squelette de projet et modèle de données terminés. Les pages et les routes API existent et répondent, mais restent des écrans à construire et renvoient `501 not_implemented`. Le schéma Prisma est écrit, migré, et les 9 tables existent.

Vérifié réellement :

- `npm run build` passe, 13 routes générées, type checking et lint inclus.
- Le serveur répond : `/`, `/admin`, `/offres/[token]`, `/espace/[token]` et `/onboarding/[token]` en 200, les 7 routes API en 501.
- La migration `20260917114402_init` s'applique : 9 tables plus `_prisma_migrations`.
- Les modèles fonctionnent à l'exécution : création d'un client, token UUID v4 auto-généré sur 36 caractères, statut par défaut `RDV_PLANIFIE`, lecture par token, suppression.

N'existe pas encore : authentification de `/admin`, webhook Calendly, envoi d'emails, génération du PDF d'audit, suite de tests.

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
prisma/                   schema.prisma et migrations
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
npm run db:migrate   # crée le fichier SQLite et applique les migrations
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
| `npm run db:migrate` | `prisma migrate dev`, crée la base et applique les migrations |
| `npm run db:push` | applique le schéma sans créer de migration |
| `npm run db:generate` | régénère le client Prisma |

## Modèle de données

9 modèles dans `prisma/schema.prisma` :

| Modèle | Relation au client | Rôle |
| --- | --- | --- |
| `Client` | racine | fiche créée par le webhook Calendly, porte le token public |
| `RestitutionAudit` | un pour un | restitution de l'audit, éditable tant qu'elle n'est pas envoyée |
| `Offre` | plusieurs | Quick Win, Extension Second Cerveau ou Sprint, historisés |
| `Abonnement` | plusieurs | maintenance mensuelle, créée à l'acceptation |
| `Questionnaire` | un pour un | réponses du client après signature |
| `AnalyseInterne` | un pour un | préparation interne avant l'appel de lancement |
| `RoadmapPhase` | plusieurs | les 3 phases de la feuille de route |
| `CommunicationUpdate` | plusieurs | échanges horodatés, auteur ADMIN ou CLIENT |
| `CreneauCommunication` | plusieurs | créneau de communication dédié au client |

Les `enum` sont supportés par Prisma 7 sur SQLite et stockés en `TEXT`. Les listes (`opportunites`, `livrables`, `accesTechniques`) sont en `Json`, également stocké en `TEXT`.

## Prisma

Prisma 7 : l'URL de connexion vit dans `prisma7.config.ts`, plus dans `schema.prisma`. Le client est généré en TypeScript dans `generated/prisma`, dossier ignoré par git et recréé par le script `postinstall`. Il s'importe par `@/generated/prisma/client` et s'instancie toujours avec un driver adapter, dans `lib/prisma.ts`.

Trois pièges vérifiés le 2026-09-17 :

- `better-sqlite3` est un module natif. Il doit rester dans `serverComponentsExternalPackages` (`next.config.mjs`), sinon webpack l'embarque et le paquet `bindings` ne retrouve plus son binaire : `TypeError: Cannot read properties of undefined (reading 'indexOf')`.
- Les entiers remontent en `BigInt`. `NextResponse.json` lève alors `TypeError: Do not know how to serialize a BigInt`. Convertir avant de renvoyer.
- Le dist-tag `latest` du paquet `prisma` pointait sur une release candidate (`8.0.0-rc.15`) le 2026-09-17. Toujours installer `prisma` avec la version exacte de `@prisma/client`.

## Tests

Aucune suite de tests n'existe à ce jour.

## Conventions

- Aucun tiret cadratin dans les textes affichés dans l'interface, ni dans les commentaires et la documentation.
- Aucun chiffre, prix ou cas client inventé : chaque donnée affichée a une source écrite dans le vault Lumio Digital.
- Aucun secret dans le code : tout passe par `.env`, et `.env.example` porte les valeurs vides.
