# Plateforme client Lumio Digital

Application interne qui couvre tout le cycle client de Lumio Digital, de la réservation du RDV d'audit sur Calendly jusqu'au lancement opérationnel après signature : fiche client automatique, restitution d'audit, offre, acceptation, puis onboarding.

Le référentiel du projet (contexte, processus métier, grille tarifaire, stack, conventions) est dans `AGENTS.md`. Il fait foi avant toute autre source.

## État réel

Au 2026-09-17 : aucun code. Le dépôt contient le référentiel `AGENTS.md`, le `.gitignore`, le `.env.example` et ce README. Rien ne se lance encore.

## Espaces prévus

| Espace | Accès |
| --- | --- |
| `/admin` | Protégé, usage interne |
| `/offres/[token]` | Public, proposition commerciale avant signature |
| `/espace/[token]` | Public, une page par client signé |

## Stack

Next.js 14 App Router, TypeScript, Tailwind, Prisma + SQLite, Nodemailer, déploiement VPS Hostinger avec PM2 et Nginx.

## Prérequis

- Node.js 24 ou plus récent.
- Un fichier `.env` dérivé de `.env.example`.

## Lancement (une fois le code en place)

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Tests (une fois le code en place)

```bash
npm test
```

Aucune suite de tests n'existe à ce jour.

## Conventions

- Aucun tiret cadratin dans les textes affichés dans l'interface, ni dans les commentaires et la documentation.
- Aucun chiffre, prix ou cas client inventé : chaque donnée affichée a une source écrite dans le vault Lumio Digital.
- Aucun secret dans le code : tout passe par `.env`, et `.env.example` porte les valeurs vides.
