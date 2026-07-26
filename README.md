# PLANN — Planification Festival

Plateforme web full-stack pour planifier un festival : lieux, bénévoles, artistes, animations, tâches, postes récurrents, tableau de bord admin et export PDF.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** + composants UI (Radix)
- **SQLite** + **Drizzle ORM**
- Auth **code festival + PIN** (bcrypt + JWT httpOnly)
- **@react-pdf/renderer** pour l'export PDF
- Protection des routes via **`src/proxy.ts`** (runtime Node.js)

## Démarrage rapide

```bash
# Installer les dépendances
npm install

# Générer les migrations (si schéma modifié)
npm run db:generate

# Initialiser la base + seed C15-2026
npm run db:init

# Lancer en dev
npm run dev
```

Ouvrir [http://localhost:3000/login](http://localhost:3000/login)

> Les identifiants initiaux sont créés par `npm run db:init`. Changez les PINs admin avant la mise en production.

## Structure

```
src/
├── app/
│   ├── login/              # Connexion
│   ├── (volunteer)/        # Espace bénévole (mobile-first)
│   ├── admin/              # Espace admin
│   └── api/                # REST API
├── components/
│   ├── ui/                 # Composants UI
│   ├── dashboard/          # Carte dynamique admin
│   ├── planning/           # Navigation & listes
│   └── forms/              # Formulaires CRUD
├── lib/
│   ├── db/                 # Schéma, client, seed
│   ├── auth/               # JWT, hash PIN, session
│   └── pdf/                # Templates PDF
└── proxy.ts                # Garde d'authentification
```

## Fonctionnalités

### Bénévole
- **Accueil** : prochains créneaux (animations, tâches, postes)
- **Planning** : vue personnelle par jour
- **Annuaire** : bénévoles et artistes
- Navigation bottom bar (zones tactiles ≥ 44px)

### Admin
- **Carte dynamique** : grille visuelle des lieux + modale détail + fallback mobile
- **Planning global** : timeline multi-ressources
- **CRUD** : lieux, bénévoles, artistes, animations, tâches, postes
- **Générateur de créneaux** pour postes récurrents
- **Export PDF** : 4 templates (lieu/bénévole × jour/global)

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run db:init` | Migrations + seed |
| `npm run db:generate` | Générer migrations Drizzle |

## Variables d'environnement

Créer `.env.local` à partir de `.env.example` :

```
JWT_SECRET=<secret-aléatoire-min-32-caractères>
```

`JWT_SECRET` est **obligatoire en production**.

## PWA

L'application est installable sur mobile/tablette via le manifest (`/manifest.webmanifest`).
