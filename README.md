# Plateforme client Lumio Digital

Application interne qui couvre tout le cycle client de Lumio Digital, de la réservation du RDV d'audit sur Calendly jusqu'au lancement opérationnel après signature : fiche client automatique, restitution d'audit, offre, acceptation, puis onboarding.

Le référentiel du projet (contexte, processus métier, grille tarifaire, stack, conventions) est dans `AGENTS.md`. Il fait foi avant toute autre source.

Nom du paquet npm : `lumio-onboarding-hermes`.

## État réel

Au 2026-09-19 : le cycle couvre tout l'onboarding côté agence, du premier contact à la feuille de route préparée. La page de proposition, le questionnaire, le PDF et les emails sont en ligne, l'espace client reste à construire.

Vérifié réellement :

- `npm run build` passe, 17 routes générées, type checking et lint inclus.
- La migration `20260917114402_init` s'applique : 9 tables plus `_prisma_migrations`.
- Le webhook Calendly est écrit et testé sur 11 cas (signature absente, fausse, corps falsifié, horodatage périmé rejetés en `401`, type d'événement non concerné ignoré, réservation créant la fiche, relivraison sans doublon, annulation, etc.), mais il est **dormant** : le palier gratuit de Calendly n'autorise pas les webhooks. Sa clé de signature est vide, donc la route refuse tout en `500` et n'écrit rien en base.
- L'espace interne est protégé : `/admin`, `/admin/clients/nouveau`, `/admin/clients/[id]` et la route du fichier d'audit renvoient `307` vers `/admin/login` sans session, cookie forgé rejeté.
- Le formulaire « Nouveau client » fonctionne dans un vrai navigateur, dans ses deux modes, avec un fichier réellement écrit sur le disque.
- Le marquage d'audit et le remplacement du fichier fonctionnent de bout en bout : statut passé à `AUDIT_FAIT`, notes conservées, ancien fichier supprimé du disque, nouveau servi avec son bon type.
- La restitution s'enregistre et son aperçu client reflète en direct la synthèse, les opportunités et la recommandation.
- L'offre Quick Win se crée avec son montant, sa modalité et ses 5 livrables figés. L'Extension Second Cerveau bascule de 500 à 990 € HT avec la case « pack dédié ». Le client passe en `OFFRE_ENVOYEE` et la restitution se verrouille.
- Une offre créée referme le formulaire : aucun doublon possible, vérifié par le compte en base.
- La page publique reproduit la restitution puis l'offre, avec l'impact dans un encart bleu, les livrables en liste et la ligne de maintenance séparée du montant. Un token inconnu renvoie `404`.
- L'acceptation en ligne fonctionne de bout en bout : offre passée à `ACCEPTEE` avec le nom saisi, client à `OFFRE_ACCEPTEE` avec sa date de signature, abonnement de maintenance créé à 90 € quand l'offre le prévoyait. Un second appel est refusé en `409` et ne recrée aucun abonnement.
- Un nom vide est refusé en `422`. Le nom modifié dans la confirmation est bien celui enregistré, vérifié en base.
- Le refus depuis l'admin passe l'offre à `REFUSEE` et le client à `OFFRE_REFUSEE`. Le bouton n'apparaît pas sur une offre déjà acceptée.
- Le questionnaire s'ouvre à l'acceptation, refuse un client pas encore signé en `409`, passe le client à `QUESTIONNAIRE_COMPLETE` à l'envoi, et conserve la date de première completion quand le client le renvoie corrigé.
- Les branches de refus du questionnaire sont exercées : token absent en `422`, token inconnu en `404`, client non signé en `409`, client déjà passé à l'analyse en `409`, champs manquants en `422` avec le détail par champ.
- Les réponses remontent sur la fiche client dans l'admin, accès techniques compris.
- Les deux emails partent réellement, vérifiés avec un vrai compte le 2026-09-19 : l'email de bienvenue à l'acceptation (le client passe alors à `QUESTIONNAIRE_ENVOYE`, ce qui prouve la branche de succès) et l'envoi de l'offre depuis la fiche client, avec la restitution en PDF en pièce jointe.
- Le PDF de restitution se télécharge et se rend correctement, vérifié en le convertissant en image : logo en en-tête, filet et puces bleus, encart d'impact, pied de page. Un token inconnu renvoie `404`, une fiche sans restitution aussi.
- L'analyse interne s'enregistre et se marque faite en deux temps. Enregistrer ne touche pas au statut du client ; marquer fait passe le client à `ANALYSE_FAITE` et son questionnaire en lecture seule, l'API refusant alors toute modification en `409`. Le marquage est refusé sans analyse, avec un message explicite.
- La feuille de route type crée les trois phases du guide d'un coup, à 5, 10 et 5 jours de la date de démarrage, puis chaque phase s'ajuste. Une date de fin antérieure au début est refusée.

N'existe pas encore : page publique `/espace/[token]`, écrans des 6 routes API métier, appel de lancement, créneaux de communication, emails de relance et de suivi, suite de tests automatisée.

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
    offres/[token]/accepter/  acceptation de l'offre par le prospect, route publique
    offres/[token]/pdf/   restitution en PDF, route publique
    abonnements/          maintenance et échéances
    emails/               envoi des emails clients
    questionnaire/        réponses au questionnaire
    updates/              mises à jour publiées dans l'espace client
    webhooks/calendly/    réservations et annulations Calendly
    admin/clients/[id]/fichier-audit/
                          sert le fichier d'audit, session vérifiée dans la route
components/               composants réutilisables, style Lumio
lib/                      Prisma, session, fichiers d'audit, contenu des offres,
                          urls, formatage, libellés
lib/pdf/                  restitution en PDF, composant et génération
lib/emails/               templates d'emails clients
public/logo-lumio.png     logo Lumio, lu et embarqué dans le PDF
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
- Pour que les emails partent réellement : `SMTP_HOST`, `SMTP_USER` et `SMTP_PASSWORD`. L'identité d'expéditeur est `onboarding@lumio-digital.online` chez IONOS (`smtp.ionos.fr`, port 587). Sans ces trois variables, l'application fonctionne mais aucun email ne part : l'accord du client est enregistré et le client reste au statut qui décrit la situation réelle.

Attention : les identifiants SMTP vivent dans le `.env` **du projet**. Celui de Hermes (`~/.hermes/.env`) n'est pas lu par Next.js.

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

## Page de proposition `/offres/[token]`

Page publique, accessible par le token du client, sans compte. Le token vaut autorisation : uuid v4, non devinable. La page n'est jamais indexée.

Deux blocs, dans cet ordre :

1. **Ce que l'audit a révélé** : synthèse du diagnostic, opportunités en liste, impact estimé dans un encart bleu. Posture de diagnostiqueur avant d'être vendeur.
2. **Ce que je vous propose** : titre, description, livrables en liste pour les offres à contenu figé (Quick Win et Extension Second Cerveau, pas le Sprint), montant et modalité. L'option maintenance apparaît sur une ligne séparée sous le montant, pour ne pas confondre le paiement unique et l'engagement récurrent. Le lien de paiement devient le bouton « Régler l'acompte » quand il est renseigné.

Le champ `recommandation` de la restitution fait la transition entre les deux blocs.

En bas, « Accepter cette offre » ouvre une confirmation qui demande le nom complet, pré-rempli avec le nom de la fiche et modifiable. « J'ai une question avant de valider » ouvre un email vers `moussa@lumiodigital.fr`. La mention d'accord est affichée sous le bouton : elle vaut accord écrit, ce n'est pas une signature électronique qualifiée.

La validation part en `POST /api/offres/[token]/accepter`. C'est une route publique, le prospect n'a pas de compte : c'est le token qui fait office d'autorisation. Elle passe l'offre à `ACCEPTEE` avec le nom saisi et sa date de réponse, le client à `OFFRE_ACCEPTEE` avec sa date de signature, et crée l'abonnement de maintenance à 90 € si l'offre le prévoyait. Elle est **fermée** : un second appel est refusé en `409` sans recréer d'abonnement, donc un double clic ou un onglet resté ouvert ne fait pas payer deux fois la maintenance.

L'email de bienvenue part après l'enregistrement. S'il échoue (SMTP absent), l'accord reste enregistré et le client reste en `OFFRE_ACCEPTEE` : le questionnaire n'a pas été envoyé, ce statut est donc exact, et l'envoi peut être repris. Une fois l'email parti, le client passe à `QUESTIONNAIRE_ENVOYE`.

Le refus se marque à la main depuis la fiche client, pour un prospect qui décline à l'oral : l'offre passe à `REFUSEE` et le client à `OFFRE_REFUSEE`. Une offre déjà acceptée n'affiche pas ce bouton, et l'action refuse aussi ce cas de son côté.

## Questionnaire d'onboarding `/onboarding/[token]`

Étape 2 du guide d'onboarding du vault. Page publique, ouverte par le token du client. Elle n'est pas indexée.

Règle du guide respectée : 10 à 15 questions maximum, claires, obligatoires. Les informations générales (contact, entreprise, téléphone) sont pré-remplies depuis la fiche et corrigibles, parce que le contact réel peut différer du prospect qui a réservé l'audit : les corrections remontent sur la fiche. Les neuf questions de fond sont obligatoires, avec « Aucune » comme réponse admise sur les deux questions de contraintes, pour ne pas bloquer un client qui n'en a pas.

La question des accès techniques est une liste à cocher (CRM, email, API, outils no-code, autres), pas un champ de saisie : **aucun identifiant ne transite par ce formulaire**. Elle sert à savoir quels comptes ouvrir.

Ouverture : le questionnaire est accessible aux statuts `OFFRE_ACCEPTEE`, `QUESTIONNAIRE_ENVOYE` et `QUESTIONNAIRE_COMPLETE`, c'est-à-dire dès l'acceptation même si l'email d'annonce n'est pas parti. Un client qui n'a pas encore validé voit un message qui le dit, et l'API refuse en `409`. Un client déjà passé à l'analyse interne le voit en lecture seule : les réponses servent de base à l'appel de lancement, elles ne doivent plus changer après avoir été lues.

Un renvoi met à jour les réponses et laisse `completedAt` à sa valeur d'origine, pour ne pas fausser la date de première réception.

## Analyse interne et feuille de route

Étapes 3 et 5 du guide d'onboarding, côté agence. Aucune des deux n'est visible par le client.

**Analyse interne** : quatre champs, ceux que le guide impose pour arriver à l'appel de lancement sans découvrir le dossier en direct (problème principal, solution IA proposée, quick wins visibles, points de vigilance). Rien de ce qui est saisi là n'est montré au client, à la différence de la restitution.

Deux temps volontairement séparés :

| Action | Effet sur le client |
| --- | --- |
| Enregistrer l'analyse | aucun, le statut ne bouge pas |
| Marquer l'analyse comme faite | statut `ANALYSE_FAITE`, questionnaire en lecture seule |

La séparation évite qu'une analyse en cours d'écriture verrouille le questionnaire par surprise. Le marquage est refusé tant que l'analyse n'existe pas, avec un message qui le dit.

**Feuille de route** : le guide impose trois phases, diagnostic et setup, build et implémentation, stabilisation et livraison, sur l'exemple d'un projet de 20 jours. L'application les crée d'un coup à partir d'une date de démarrage, à 5, 10 et 5 jours, puis chaque phase s'ajuste (nom, dates, statut, description). Une seconde feuille de route est refusée sur un client qui en a déjà une, et une date de fin antérieure au début est refusée.

Les dates des champs sont converties en ISO 8601 dans le navigateur, dans un champ caché. Un champ date renvoie une date sans fuseau : la convertir côté client évite qu'un serveur en UTC décale tout d'un jour.

## PDF de restitution `/api/offres/[token]/pdf`

Le prospect télécharge sa restitution d'audit en PDF depuis la page de proposition, et la reçoit aussi en pièce jointe de l'email d'offre. Les deux passent par `genererPdfRestitution(client, restitution)` dans `lib/pdf/restitution-pdf.tsx` : une seule fabrication du document, jamais deux.

Le PDF est produit en mémoire par `@react-pdf/renderer`, jamais écrit sur le disque. Rien à nettoyer, rien à exposer par une URL.

Charte imprimable : fond blanc, texte noir, titres et accents en bleu `#0054A6`. Le bleu clair est réservé au fond sombre, il n'apparaît pas ici. Police Helvetica, fournie par le lecteur PDF, en attendant l'intégration de RNS Sanz. Le logo est lu dans `public/logo-lumio.png` et embarqué en data URI : si le fichier disparaît, l'en-tête retombe sur un logotype texte plutôt que de faire échouer la génération.

Le nom du fichier est construit depuis l'entreprise du client, accents et espaces retirés : `Audit-IA-Lumio-Imprimerie-des-Vosges.pdf`. Un nom de fichier téléchargé traverse des systèmes qui ne gèrent pas les accents.

Le document ne reprend pas le champ `recommandation` de la restitution : ce champ fait la transition vers l'offre sur la page web, et il serait orphelin dans un PDF qui ne contient pas l'offre.

L'email d'offre vit dans `lib/emails/envoi-offre.ts` : il remercie pour le temps accordé pendant l'audit, annonce la restitution et la proposition sur le lien public, et joint le PDF. L'action admin refuse l'envoi si la restitution n'existe pas, pour ne pas promettre une pièce jointe qui n'existe pas.

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

## Webhook Calendly (en place mais dormant)

**Cette route ne reçoit rien aujourd'hui.** Moussa est sur le palier gratuit de Calendly, qui n'autorise pas les webhooks : la documentation développeur de Calendly indique que l'API en lecture fonctionne sur tous les paliers, y compris le gratuit, mais qu'un abonnement webhook exige un palier payant (Standard et au-dessus).

Décision du 2026-09-19 : les fiches se créent à la main, avec le formulaire « Nouveau client » en mode « RDV à venir », qui reproduit exactement le résultat du webhook. La route reste en place et testée, pour le jour où un palier payant ou une synchronisation par interrogation de l'API serait mis en place : la logique de création y est déjà écrite et exercée.

`CALENDLY_WEBHOOK_SIGNING_KEY` est **volontairement vide**, et c'est une mesure de sécurité, pas un oubli. La route refuse alors toute requête en `500` sans rien écrire en base. Avec une clé de test devinable à la place, n'importe qui aurait pu forger une signature valide et créer des fiches client à distance : une route publique qui écrit en base doit échouer fermée. Vérifié : une requête forgée renvoie `500` et ne crée aucune fiche.

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

Aucune suite de tests automatisée. Toutes les vérifications ont été faites à la main, entre le 17 et le 19 septembre 2026 : appels HTTP réels pour le webhook, la protection de l'espace interne et les formulaires publics, parcours complets dans un navigateur, inspection directe du fichier SQLite et des fichiers déposés, et envois d'emails réels.

## Conventions

- Aucun tiret cadratin dans les textes affichés dans l'interface, ni dans les commentaires et la documentation.
- Aucun chiffre, prix ou cas client inventé : chaque donnée affichée a une source écrite dans le vault Lumio Digital.
- Aucun secret dans le code : tout passe par `.env`, et `.env.example` porte les valeurs vides.
