# AGENTS.md : plateforme client Lumio Digital

Ce fichier est le référentiel du projet. Il est chargé automatiquement au début de chaque session de travail. Si une conversation, un souvenir ou un autre fichier le contredit, c'est ce fichier qui fait foi (hors documents de pilotage listés en section 8).

## 1. Contexte

**Le projet.** Une application interne à Lumio Digital (agence IA fondée par Moussa Diallo) qui couvre tout le cycle client, de la réservation du rendez-vous d'audit jusqu'au lancement opérationnel après signature. Elle sert l'ensemble des offres de l'agence : l'Agent Hermès en priorité, plus son extension Second Cerveau et l'AI Operations Sprint.

**Ce que la plateforme prend en charge, dans l'ordre du cycle :**

1. Réservation du RDV d'audit par le prospect sur Calendly.
2. Création automatique de la fiche client dès la réservation, avant même que l'audit ait lieu.
3. Rédaction de la restitution de l'audit.
4. Construction et envoi de l'offre la plus adaptée au client.
5. Acceptation de l'offre par le prospect.
6. Onboarding jusqu'au lancement opérationnel une fois le client signé.

**Déclencheur technique.** Un webhook Calendly crée la fiche client dans la plateforme dès la réservation. C'est le point d'entrée de tout le reste : aucune fiche ne se crée à la main.

**Trois espaces distincts.**

| Espace | Accès | Usage |
| --- | --- | --- |
| `/admin` | Protégé, usage interne Moussa | Pilotage, rédaction, envoi des offres |
| `/offres/[token]` | Public, lien unique | Proposition commerciale, avant signature |
| `/espace/[token]` | Public, lien unique sans mot de passe | Une page par client signé |

**Principe de restitution.** Toute la restitution de documents côté client (résultats de l'audit, offre, suivi de projet) passe par cette plateforme. Le prospect reçoit malgré tout un vrai PDF de son audit, pas seulement une page web : c'est un document qu'il peut garder, imprimer ou montrer en interne. Le PDF est généré automatiquement depuis les mêmes données que la page. Il n'est jamais écrit à la main à part.

## 2. Processus métier

Source : `guide-onboarding-client.md` (vault Obsidian, dossier `Lumio Digital`). Le cycle de vente et l'audit qui précèdent la signature sont dans `guide-audit-ia.md`, même dossier.

### Pourquoi l'onboarding est critique

Les 24 à 72 heures qui suivent la signature correspondent au pic maximal de doute chez le client (remords d'achat). Un onboarding structuré évite ces regrets, définit des attentes claires, collecte les informations techniques en amont, et transforme un client enthousiaste en collaborateur satisfait. Un bon onboarding ne vend pas plus : il sécurise la vente déjà faite.

### Les 7 étapes, dans l'ordre, sans en sauter une

1. Signature du client.
2. Email de bienvenue, dans l'heure qui suit.
3. Questionnaire d'onboarding.
4. Analyse interne, côté agence.
5. Appel de lancement, sous 48h.
6. Feuille de route projet.
7. Lancement opérationnel.

La plateforme doit refléter cette séquence : chaque étape a un état, une date et une check-list de sortie. Une étape non atteinte bloque la suivante.

### Étape 1 : email de bienvenue (dans l'heure)

Objectif : rassurer immédiatement, valoriser la décision du client, donner de la visibilité sur la suite.

Check-list de l'email :

- Félicitations et remerciement.
- Rappel de l'objectif du projet.
- Présentation rapide de l'équipe.
- Étapes à venir, claires et datées.
- Lien vers le questionnaire d'onboarding.
- Lien de prise de rendez-vous pour l'appel de lancement.
- Rappel des règles de communication.

Ton attendu : félicitations pour la décision, ce qu'on va accomplir ensemble, les prochaines étapes avec une timeline claire, ce qu'on attend du client maintenant, signature humaine. Jamais un email automatique impersonnel.

### Étape 2 : questionnaire d'onboarding

Objectif : collecter la totalité des informations nécessaires avant de commencer à produire.

**Règle d'or : 10 à 15 questions maximum**, claires, actionnables, obligatoires. Ne pas noyer le client sous un formulaire interminable. C'est une contrainte de conception du formulaire, pas une préférence.

Sections recommandées :

- Informations générales : nom de l'entreprise, personne de contact, email et téléphone.
- Objectifs business : objectif principal du projet, indicateur de succès (KPI), deadline idéale.
- Contexte et existant : outils actuels utilisés, process actuel s'il existe, problèmes principaux rencontrés.
- Accès techniques : CRM, email, API, outils no-code, autres.
- Contraintes : contraintes légales ou RGPD, contraintes internes.

### Étape 3 : analyse interne (côté agence)

Objectif : arriver à l'appel de lancement déjà préparé, jamais découvrir le dossier en direct avec le client.

Check-list interne : questionnaire relu, objectifs reformulés, risques identifiés, opportunités détectées, hypothèse de roadmap.

Document interne à remplir pour chaque client : problème principal, solution IA proposée, quick wins visibles, points de vigilance.

### Étape 4 : appel de lancement (sous 48h)

Objectif : alignement total sur le périmètre, le résultat attendu et le mode de collaboration.

Structure de l'appel, 45 à 60 minutes : rappel du contexte et des objectifs, reformulation des attentes, validation du périmètre (ce qui est inclus et ce qui ne l'est pas), présentation de la roadmap, communication et délais, questions et objections.

Check-list de fin d'appel : objectifs validés, KPI validés, roadmap validée, canaux de communication validés.

### Étape 5 : feuille de route projet

Objectif : transformer un projet flou en plan clair et rassurant pour le client.

Contenu obligatoire : Phase 1 (diagnostic / setup), Phase 2 (build / implémentation), Phase 3 (stabilisation / livraison).

Exemple simplifié sur 20 jours : Phase 1 Setup (J1 à J5, accès, audit, cadrage), Phase 2 Build (J6 à J15, développement IA et automatisation), Phase 3 Delivery (J16 à J20, tests, démo, ajustements).

### Étape 6 : communication, le système anti-insatisfaction

70 % des insatisfactions client viennent de la communication, pas de la technique. Principe clé : le client doit se sentir informé sans avoir à interrompre l'agence toute la journée.

Protocole recommandé, à définir client par client :

- Un créneau de communication dédié.
- Un délai de réponse garanti de 15 minutes maximum sur ce créneau.
- Une réponse différée en dehors du créneau.

Règles internes : communication groupée plutôt que dispersée, mises à jour proactives toutes les 48h, modèles de messages réutilisables, historique documenté.

### Étape 7 : delivery, la règle des 60/40

**60 % du temps sur le frontend et l'expérience client, 40 % sur le backend.**

Priorités : templates visuels professionnels, dashboards clairs, documentation élégante, démo irréprochable. Un système beau et simple vaut largement plus, en valeur perçue, qu'un système techniquement parfait mais invisible pour le client. Cette règle s'applique aussi au produit lui-même : les écrans vus par un client passent avant la plomberie.

### Rétention : le pitch de la mission suivante

Objectif : créer un enchaînement naturel de missions plutôt qu'un projet qui se termine sans suite.

Méthode à la livraison : féliciter, identifier un problème connexe, montrer l'impact business potentiel, proposer une solution simple, donner une prochaine étape facile à accepter.

**Timing optimal : 24 à 48h après la livraison**, jamais pendant la livraison elle-même.

### Repère indicatif

Le plan d'implémentation source répartit sur 30 jours : J1 à J10 génération de leads, J11 à J15 onboarding, J16 à J20 communication, J21 à J25 delivery, J26 à J30 rétention. Le résultat annoncé dans la formation source (+40 à +70 % de chiffre d'affaires sous 60 jours) vient d'une source externe : c'est un ordre de grandeur indicatif, jamais un engagement ni un argument client.

## 3. Produit Agent Hermès et grille tarifaire

### Pack Quick Win « Agent Hermès » (Employé IA 24/7)

Produit d'entrée, pensé pour déclencher la vente rapidement. **490 € HT en paiement unique**, livraison sous 48h.

Contenu :

- VPS dédié.
- Connexion Telegram ou WhatsApp.
- Agents Defut et Caveman.
- Briefing Matinal automatique.

Dans le vault, ce pack s'appelle « Votre Employé IA 24/7 » et est présenté comme basé sur Hermes Agent. Voir la section 7 pour l'écart de nommage.

### Option « Extension Second Cerveau » (upsell)

- Intégration Obsidian.
- Migration des notes du client.
- Boucle d'apprentissage autonome.
- **+500 € HT en upsell sur un pack déjà vendu, ou 990 € HT en pack dédié si vendue seule.**
- Se propose lors de la démo, ou environ deux semaines après l'installation. Jamais avant que le client ait pu se familiariser avec le pack de base.

Voir la section 7 : ce tarif ne figure pas encore dans le vault.

### Abonnement Maintenance

- Mises à jour des modèles.
- Création de nouveaux skills ou cron jobs pour le client.
- **90 € HT/mois**, revenu récurrent pour l'agence.
- Proposé en option à l'acceptation de l'offre initiale.

### Passerelle vers l'AI Operations Sprint

Le pack Agent Hermès peut servir de porte d'entrée vers un AI Operations Sprint plus large si le client veut aller plus loin. Le modèle de données doit garder cette possibilité ouverte : une offre Sprint doit rester possible sur un client déjà passé par Agent Hermès.

### Politique tarifaire Lumio pour le Sprint (valable en option)

- **Tarification à la valeur : 25 à 30 % de la valeur créée** (économies annuelles ou ROI démontrable).
- **Quand l'Audit IA a été offert gratuitement** : paiement en 3 fois 20/60/20. 20 % à la validation du Blueprint, 60 % à la mise en production, 20 % à la formation et la clôture.
- **Sinon, process standard** : devis, acompte de 30 à 50 % à la signature, solde à la livraison, relance jusqu'à J+30.
- **Audit IA déjà payé** : son montant n'est jamais déduit du premier palier de 20 %. Les deux paiements restent distincts (décision de Moussa du 2026-09-17).

## 4. Stack technique

Versions réellement installées et vérifiées par un build le 2026-09-17 :

- Next.js 14.2.35, App Router, React 18.3.1.
- TypeScript 5.
- Tailwind CSS 3.4.19.
- Prisma 7.10.0 avec l'adaptateur `@prisma/adapter-better-sqlite3` et SQLite.
- Nodemailer 10.
- Déploiement VPS Hostinger avec PM2 et Nginx.

**Piège de version Prisma.** Le dist-tag `latest` du paquet `prisma` pointait sur une release candidate (`8.0.0-rc.15`) le 2026-09-17, alors que `@prisma/client` était en 7.10.0. Un `npm install -D prisma` sans version explicite désaligne la CLI du client et casse la génération. Toujours installer `prisma` avec la version exacte du client.

## 5. Conventions

### Charte graphique Lumio

| Rôle | Valeur |
| --- | --- |
| Noir | `#050505` |
| Blanc | `#FFFFFF` |
| Accent sur fond clair | `#0054A6` |
| Accent sur fond sombre | `#4D9FE8` |

Jamais de bleu en fond dominant.

Typographie : RNS Sanz. Light pour les titres, Regular pour le corps, Medium pour les accents. Substitut Helvetica Neue ou Arial en attendant l'intégration de la police.

### Style d'écriture

**Aucun tiret cadratin dans les textes affichés dans l'interface** : emails, libellés, messages, offres, pages publiques, PDF. Remplacer par une virgule, deux-points, un point, des parenthèses, ou deux phrases séparées. Même règle dans le code livré : commentaires, README et documentation.

### Règle des chiffres

Aucun chiffre, prix ou cas client inventé. Chaque donnée affichée à un client a une source écrite dans le vault Lumio Digital ou une validation explicite de Moussa. Si la donnée manque, on la demande, on ne la déduit pas.

### Validation

Aucune publication ni envoi vers un prospect sans validation explicite de Moussa dans la conversation en cours. Cela vaut pour l'envoi d'une offre, l'envoi d'un email client et la mise en ligne d'une page publique.

### Git

Un commit par changement cohérent, message court à l'impératif préfixé `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`. Jamais de `git add -A` aveugle. Secrets dans `.env` uniquement, jamais committé, et `.env.example` committé avec des valeurs vides.

## 6. Règles d'architecture

- Le webhook Calendly est le seul point de création de fiche client. Il doit être idempotent : une même réservation ne crée jamais deux fiches.
- Le PDF d'audit et la page web lisent la même source de données. Aucune duplication de contenu rédigé.
- Les tokens des espaces publics (`/offres/[token]`, `/espace/[token]`, `/onboarding/[token]`) sont non devinables et sans mot de passe. Aucune donnée d'un client ne doit être accessible depuis le token d'un autre.
- Le modèle de données doit distinguer les offres d'un même client dans le temps (pack, extension, maintenance, Sprint) sans écraser l'historique.
- **Base de données.** Prisma 7 : l'URL de connexion vit dans `prisma7.config.ts`, plus dans `schema.prisma`. Le client est généré dans `generated/prisma` (ignoré par git, recréé par le script `postinstall`) et s'importe par `@/generated/prisma/client`. Il s'instancie toujours avec un driver adapter, jamais sans : voir `lib/prisma.ts`.
- **`better-sqlite3` reste dans `serverComponentsExternalPackages`** (`next.config.mjs`). C'est un module natif : embarqué par webpack, il casse au premier accès à la base avec `TypeError: Cannot read properties of undefined (reading 'indexOf')`. Vérifié le 2026-09-17.
- **Les entiers SQLite remontent en `BigInt`.** `NextResponse.json` lève alors `TypeError: Do not know how to serialize a BigInt`. Convertir avant de renvoyer. Vérifié le 2026-09-17.
- Aucun dossier de route ne peut commencer par un souligné dans `app/` : l'App Router le traite comme un dossier privé et la route renvoie 404. Vérifié le 2026-09-17.

## 7. Écarts et points à trancher

Ces points ont été relevés à la création du projet, le 2026-09-17. Ils ne sont pas bloquants pour écrire du code, mais ils bloquent tout texte affiché à un client.

1. **Tarif de l'Extension Second Cerveau.** Les 500 € HT en upsell et 990 € HT en pack dédié viennent du briefing de Moussa et ne figurent nulle part dans `offres.md` au 2026-09-17. Le vault ne mentionne ni « Second Cerveau » ni « Obsidian » comme offre. À confirmer puis à ajouter au vault avant de l'afficher dans une proposition.
2. **Nom du produit.** Le briefing dit « Agent Hermès (Employé IA 24/7) », le vault dit « Pack Quick Win Votre Employé IA 24/7 » basé sur Hermes Agent. Un seul nom doit être retenu pour les documents client.
3. **Briefing Matinal.** Le briefing le présente comme un livrable nommé du pack. Le vault le présente comme un exemple de cron job (« ex. briefing matinal à 8h00 croisant les e-mails prioritaires, les rendez-vous de la journée et une veille sectorielle »). À aligner si le pack doit être vendu sur ce livrable précis.
4. **Canal d'accès mobile.** Le vault cite « Telegram, WhatsApp ou Slack ». Le briefing ne cite que Telegram et WhatsApp. Moussa n'utilise pas Slack.
5. **Audit payant et déduction du premier palier.** Tranché le 2026-09-17, voir la sous-section « Tranché » ci-dessous.

### Tranché

- **2026-09-17, audit payant et premier palier.** Un Audit IA déjà payé ne se déduit jamais du premier palier de 20 % du Sprint. Les deux paiements restent distincts, ils ne se compensent pas. Décision de Moussa. Le `[À trancher]` correspondant a été retiré de `offres.md` dans le vault le 2026-09-17 et remplacé par la décision.

## 8. Documents liés

| Document | Emplacement | Rôle |
| --- | --- | --- |
| `guide-onboarding-client.md` | vault, dossier `Lumio Digital` | Processus après signature (section 2) |
| `guide-audit-ia.md` | vault, dossier `Lumio Digital` | Méthode P.R.A.A, audit, objections, restitution et vente finale |
| `offres.md` | vault, dossier `Lumio Digital` | Grille tarifaire, conditions de paiement, périmètre du Sprint |
| `company.md`, `services.md` | vault, dossier `Lumio Digital` | Identité et services |
| `AGENTS.md` | `/home/mousszy/workspace` | Règles transverses des projets de Moussa |
| `CGV_Lumio_Digital_v1.docx` | Drive, dossier `CGV` | CGV client, source des mentions légales |

Le vault est en lecture seule pour ce projet. On y lit, on n'y écrit pas, sauf demande explicite de Moussa.
