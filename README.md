# Plateforme client Lumio Digital

Application interne qui couvre tout le cycle client de Lumio Digital, de la réservation du RDV d'audit sur Calendly jusqu'au lancement opérationnel après signature : fiche client automatique, restitution d'audit, offre, acceptation, puis onboarding.

Le référentiel du projet (contexte, processus métier, grille tarifaire, stack, conventions) est dans `AGENTS.md`. Il fait foi avant toute autre source.

Nom du paquet npm : `lumio-onboarding-hermes`.

## État réel

Au 2026-09-17 : modèle de données, réception Calendly, authentification de l'espace interne, dashboard et formulaire de création terminés. Les écrans publics et les routes API métier restent à construire.

Vérifié réellement :

- `npm run build` passe, 15 routes générées, type checking et lint inclus.
- La migration `20260917114402_init` s'applique : 9 tables plus `_prisma_migrations`.
- Les modèles fonctionnent à l'exécution : token UUID v4 auto-généré, statut par défaut, lecture par token.
- Le webhook Calendly fonctionne, vérifié sur 11 cas : signature absente, fausse, corps falsifié et horodatage périmé rejetés en `401`, autre type d'événement ignoré, réservation créant la fiche, relivraison sans doublon, annulation passant la fiche en `RDV_ANNULE`, annulation inconnue ignorée, corps illisible en `400`.
- L'espace interne est protégé : `/admin` et `/admin/nouveau` renvoient `307` vers `/admin/login` sans session, cookie forgé rejeté.
- Le formulaire « Nouveau client » fonctionne dans un vrai navigateur, dans ses deux modes, avec un PDF réellement écrit sur le disque.

N'existe pas encore : écrans des 6 routes API métier, pages publiques `/offres/[token]`, `/espace/[token]` et `/onboarding/[token]`, envoi d'emails, génération du PDF d'audit, accès au PDF depuis la fiche client, suite de tests automatisée.

## Arborescence

```
app/
  admin/
    login/                connexion, hors zone protégée
    (protege)/            tout ce qui exige une session
      page.tsx            dashboard : liste des clients
      nouveau/            formulaire de création, deux modes
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
lib/                      client Prisma, session, emails, roadmap, formatage, libellés
prisma/                   schema.prisma et migrations
generated/prisma/         client Prisma généré, ignoré par git
uploads/audits/           PDF d'audit déposés, ignoré par git
prisma7.config.ts         configuration de la CLI Prisma 7
```

## Stack

Next.js 14 App Router, React 18, TypeScript 5, Tailwind CSS 3, Prisma 7 avec l'adaptateur `@prisma/adapter-better-sqlite3` et SQLite, Nodemailer. Déploiement prévu sur VPS Hostinger avec PM2 et Nginx.

## Charte

Couleurs déclarées dans `tailwind.config.ts` sous le préfixe `lumio` : `lumio-black` `#050505`, `lumio-white` `#FFFFFF`, `lumio-blue` `#0054A6`, `lumio-blue-light` `#4D9FE8`. Le bleu reste un accent, jamais un fond dominant. Typographie RNS Sanz, substitut Helvetica Neue ou Arial en attendant l'intégration.

## Prérequis

- Node.js 24 ou plus récent.
- Un fichier `.env` dérivé de `.env.example`, avec `ADMIN_PASSWORD` renseigné, sinon l'espace interne refuse toute connexion.

## Lancement

```bash
npm install          # lance aussi prisma generate via le script postinstall
cp .env.example .env
npm run db:migrate   # crée le fichier SQLite et applique les migrations
npm run dev
```

L'application écoute sur `http://localhost:3000`, l'espace interne sur `/admin`.

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

## Espace interne

Accès protégé par un mot de passe unique dans `ADMIN_PASSWORD`. Changer ce mot de passe invalide immédiatement toutes les sessions ouvertes.

La protection vit dans `app/admin/(protege)/layout.tsx` et non dans un `middleware.ts` : dans le runtime edge d'un middleware, `process.env` est figé au build alors que la connexion lit `ADMIN_PASSWORD` au runtime, ce qui ferait boucler les redirections après un changement de mot de passe sans reconstruction. Conséquence pratique : tout nouvel écran interne se place dans `app/admin/(protege)/`.

Le cookie de session est un jeton signé HMAC-SHA256, valable 7 jours, `httpOnly`. Le format et la vérification sont dans `lib/session.ts`.

### Formulaire « Nouveau client »

Deux modes, pour les rendez-vous qui ne passent pas par Calendly :

| Mode | Statut initial | Champs supplémentaires |
| --- | --- | --- |
| RDV à venir | `RDV_PLANIFIE`, identique au webhook | aucun |
| Audit déjà fait | `AUDIT_FAIT` | notes d'audit, PDF de l'audit obligatoire |

Le socle commun est nom, email, entreprise, téléphone et une date. La date est convertie en UTC par le navigateur avant envoi : le fuseau du serveur n'influence donc rien, et l'affichage se fait en heure de Paris.

Les PDF sont écrits dans `uploads/audits/<clientId>/` (surchargeable par `UPLOADS_DIR`). Le nom d'origine est conservé dans `fichierAuditNom`, le nom assaini sur disque dans `fichierAuditChemin`. Un PDF de plus de 10 Mo est refusé. Si l'écriture disque échoue, la fiche créée est retirée pour ne pas laisser un dossier incomplet.

Les fiches créées à la main n'ont pas de `calendlyEventUri` : le dashboard les marque « Saisie manuelle ».

## Modèle de données

9 modèles dans `prisma/schema.prisma` :

| Modèle | Relation au client | Rôle |
| --- | --- | --- |
| `Client` | racine | fiche créée par le webhook Calendly ou à la main, porte le token public |
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

## Webhook Calendly

`app/api/webhooks/calendly/route.ts` reçoit les réservations et les annulations.

| Code | Quand |
| --- | --- |
| `201` | fiche client créée |
| `200` | relivraison, type d'événement non concerné, ou annulation d'un rendez-vous inconnu |
| `400` | corps illisible alors que la signature est valide |
| `401` | signature absente, fausse, ou horodatage hors des 180 secondes de tolérance |
| `422` | signature valide mais charge inexploitable : type d'événement, URI d'événement, email ou créneau manquant |
| `500` | `CALENDLY_WEBHOOK_SIGNING_KEY` absent du `.env` |

La signature est vérifiée avant toute lecture du contenu : en-tête `Calendly-Webhook-Signature` au format `t=<horodatage>,v1=<hmac>`, HMAC-SHA256 sur `{t}.{corps brut}`, comparaison en temps constant. Le corps est lu une seule fois, en brut, jamais resérialisé.

`CALENDLY_AUDIT_EVENT_URI` filtre les rendez-vous. Sans lui, tous les types d'événements sont traités. S'il est renseigné et que la charge n'expose aucun type d'événement, la requête est refusée en `422` plutôt que de créer une fiche non identifiable.

Le champ `calendlyEventUri` sert de clé d'idempotence : une même réservation relivrée ne crée jamais deux fiches. Une annulation ne supprime rien, elle passe le statut à `RDV_ANNULE` pour garder la trace de la réservation d'origine.

Les champs `entreprise` et `telephone` sont préremplis depuis les questions personnalisées Calendly, par recherche de mots-clés insensible aux accents et à la casse. Si aucune question ne correspond, ils restent vides et s'éditent dans l'admin.

## Tests

Aucune suite de tests automatisée. Les vérifications du 2026-09-17 ont été faites à la main : appels HTTP réels pour le webhook et la protection de l'espace interne, parcours complet dans un navigateur pour le formulaire, inspection directe du fichier SQLite et des PDF écrits.

## Conventions

- Aucun tiret cadratin dans les textes affichés dans l'interface, ni dans les commentaires et la documentation.
- Aucun chiffre, prix ou cas client inventé : chaque donnée affichée a une source écrite dans le vault Lumio Digital.
- Aucun secret dans le code : tout passe par `.env`, et `.env.example` porte les valeurs vides.
