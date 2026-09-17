# Plateforme client Lumio Digital

Application interne qui couvre tout le cycle client de Lumio Digital, de la réservation du RDV d'audit sur Calendly jusqu'au lancement opérationnel après signature : fiche client automatique, restitution d'audit, offre, acceptation, puis onboarding.

Le référentiel du projet (contexte, processus métier, grille tarifaire, stack, conventions) est dans `AGENTS.md`. Il fait foi avant toute autre source.

Nom du paquet npm : `lumio-onboarding-hermes`.

## État réel

Au 2026-09-17 : tout le cycle interne est en place, de la fiche client à la création de l'offre. Les pages publiques ne sont pas encore construites.

Vérifié réellement :

- `npm run build` passe, 17 routes générées, type checking et lint inclus.
- La migration `20260917114402_init` s'applique : 9 tables plus `_prisma_migrations`.
- Le webhook Calendly fonctionne, vérifié sur 11 cas : signature absente, fausse, corps falsifié et horodatage périmé rejetés en `401`, autre type d'événement ignoré, réservation créant la fiche, relivraison sans doublon, annulation passant la fiche en `RDV_ANNULE`, annulation inconnue ignorée, corps illisible en `400`.
- L'espace interne est protégé : `/admin`, `/admin/clients/nouveau`, `/admin/clients/[id]` et la route du fichier d'audit renvoient `307` vers `/admin/login` sans session, cookie forgé rejeté.
- Le formulaire « Nouveau client » fonctionne dans un vrai navigateur, dans ses deux modes, avec un fichier réellement écrit sur le disque.
- Le marquage d'audit et le remplacement du fichier fonctionnent de bout en bout : statut passé à `AUDIT_FAIT`, notes conservées, ancien fichier supprimé du disque, nouveau servi avec son bon type.
- La restitution s'enregistre et son aperçu client reflète en direct la synthèse, les opportunités et la recommandation.
- L'offre Quick Win se crée avec son montant, sa modalité et ses 5 livrables figés. L'Extension Second Cerveau bascule de 500 à 990 € HT avec la case « pack dédié ». Le client passe en `OFFRE_ENVOYEE` et la restitution se verrouille.
- Une offre créée referme le formulaire : aucun doublon possible, vérifié par le compte en base.

N'existe pas encore : pages publiques `/offres/[token]`, `/espace/[token]` et `/onboarding/[token]`, écrans des 6 routes API métier, acceptation de l'offre par le prospect, génération du PDF d'audit, envoi des emails du parcours d'onboarding, suite de tests automatisée.

## Arborescence

```
app/
  admin/
    login/                connexion, hors zone protégée
    (protege)/            tout ce qui exige une session
      page.tsx            dashboard : liste des clients
      clients/nouveau/    formulaire de création, deux modes
      clients/[id]/       fiche client : coordonnées, notes, fichier,
                          restitution, offre, liens publics
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
    admin/clients/[id]/fichier-audit/
                          sert le fichier d'audit, session vérifiée dans la route
components/               composants réutilisables, style Lumio
lib/                      Prisma, session, fichiers d'audit, contenu des offres,
                          emails, roadmap, urls, formatage, libellés
prisma/                   schema.prisma et migrations
generated/prisma/         client Prisma généré, ignoré par git
uploads/audits/           fichiers d'audit déposés, ignoré par git
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
| Audit déjà fait | `AUDIT_FAIT` | notes d'audit, fichier d'audit obligatoire |

Le socle commun est nom, email, entreprise, téléphone et une date. La date est convertie en UTC par le navigateur avant envoi : le fuseau du serveur n'influence donc rien, et l'affichage se fait en heure de Paris.

Les fichiers sont écrits dans `uploads/audits/<clientId>/` (surchargeable par `UPLOADS_DIR`). Le nom d'origine est conservé dans `fichierAuditNom`, le nom assaini sur disque dans `fichierAuditChemin`. Formats acceptés : PDF, DOCX, PNG, JPG, WEBP, dans la limite de 10 Mo. Si l'écriture disque échoue, la fiche créée est retirée pour ne pas laisser un dossier incomplet.

Les fiches créées à la main n'ont pas de `calendlyEventUri` : le dashboard les marque « Saisie manuelle ».

### Fiche client

`/admin/clients/[id]` regroupe les coordonnées, les notes d'audit internes, le fichier brut, la restitution, l'offre et les liens publics. Le bouton « Marquer l'audit comme fait » n'apparaît que sur une fiche au statut `RDV_PLANIFIE`. Il permet de corriger les coordonnées, de noter ce qui est ressorti de l'échange et de joindre le fichier, puis passe le statut à `AUDIT_FAIT`. Le fichier y reste facultatif : marquer un audit comme fait ne doit pas être bloqué par une pièce qui n'est pas sous la main.

Le fichier est servi par `/api/admin/clients/[id]/fichier-audit`, jamais par une URL directe. Cette route ne traverse pas le layout du groupe protégé : elle vérifie la session elle-même et redirige vers la connexion. Un nouvel envoi remplace l'ancien fichier, il n'y a pas d'historique de versions.

### Restitution de l'audit

Quatre champs : synthèse du diagnostic, opportunités identifiées (une par ligne, impact estimé entre parenthèses), ROI ou impact estimé, recommandation. Le tout alimente `RestitutionAudit`, en un pour un avec le client.

Le bouton « Aperçu » affiche le rendu client avec les valeurs en cours de saisie, pas seulement celles déjà enregistrées. C'est la maquette de ce que le prospect lira sur la page publique.

La restitution reste modifiable tant qu'aucune offre n'a de date d'envoi. Dès qu'une offre est partie, elle passe en lecture seule : une restitution ne se réécrit pas en silence après être partie chez un prospect.

### Offre

Trois types, avec leur contenu figé dans `lib/offres-contenu.ts` :

| Type | Montant | Contenu figé |
| --- | --- | --- |
| Pack Quick Win | 490 € HT | 5 livrables, modalité « paiement en une fois à la commande » |
| Extension Second Cerveau | 500 € HT, 990 € HT en pack dédié | 3 livrables |
| AI Operations Sprint | saisi à la main | aucun, tarification à la valeur |

Le titre et la liste des livrables ne viennent jamais du formulaire : ils sont lus dans les constantes. Seuls le montant, la description et la modalité restent modifiables pour ajuster un point précis chez un client. C'est ce qui garantit que le contenu ne se reformule pas au fil des générations.

Le Sprint propose une fourchette indicative calculée à 25 et 30 % d'une valeur annuelle estimée, mais le montant reste saisi à la main.

Créer une offre l'enregistre au statut `ENVOYEE` avec sa date d'envoi et passe le client en `OFFRE_ENVOYEE`. L'abonnement de maintenance est **noté dans l'offre** mais créé à l'acceptation, pas à l'envoi.

Une offre ne peut pas être créée sans restitution : la page publique montre la restitution au-dessus de l'offre, une offre seule arriverait sans contexte.

La section affiche ensuite le lien de la page publique, avec un bouton pour le copier et un bouton pour l'envoyer par email au prospect. L'envoi par email dépend d'un SMTP configuré dans `.env` ; sans configuration, l'erreur affichée indique précisément ce qui manque.

## Modèle de données

9 modèles dans `prisma/schema.prisma` :

| Modèle | Relation au client | Rôle |
| --- | --- | --- |
| `Client` | racine | fiche créée par le webhook Calendly ou à la main, porte le token public |
| `RestitutionAudit` | un pour un | restitution de l'audit, éditable tant qu'aucune offre n'est envoyée |
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

Les champs `entreprise` et `telephone` sont préremplis depuis les questions personnalisées Calendly, par recherche de mots-clés insensible aux accents et à la casse.

## Tests

Aucune suite de tests automatisée. Les vérifications du 2026-09-17 ont été faites à la main : appels HTTP réels pour le webhook et la protection de l'espace interne, parcours complets dans un navigateur pour les formulaires, inspection directe du fichier SQLite et des fichiers déposés.

## Conventions

- Aucun tiret cadratin dans les textes affichés dans l'interface, ni dans les commentaires et la documentation.
- Aucun chiffre, prix ou cas client inventé : chaque donnée affichée a une source écrite dans le vault Lumio Digital.
- Aucun secret dans le code : tout passe par `.env`, et `.env.example` porte les valeurs vides.
