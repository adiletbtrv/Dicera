# Dicera Platform

An enterprise-grade, fully functional platform for **Dungeons & Dragons 5th Edition**.

Dicera provides every mathematical, archival, and DM-assistant tool required for a high-end 5e tabletop experience, wrapped in an elegant, responsive "Apple-tier" web interface driven by `Framer Motion` and modern Tailwind CSS glassmorphism.

## Features

- **Compendiums**: Searchable Spells, Bestiary, Items, Backgrounds, Feats, Races, and Classes with offline-first caching via `TanStack Query`.
- **Character Builder**: Mathematically sound rules engine computing hit points, proficiencies, and saving throws.
- **Encounter Runner**: DM tools encompassing CR budgets, Initiative tracking, and loot generation.
- **Custom Hardware Seed**: Bypasses the open-source D&D licensing limitations by aggressively seeding missing popular sub-classes, thematic descriptions, Feats, and Backgrounds directly into its local Postgres data store.
- **AI Integration**: Connects to advanced AI platforms for rules lookup and dynamic campaign dialogue generation.

## Technology Stack

- **Frontend**: React 18 / Vite / TypeScript / Tailwind CSS / Framer Motion
- **Backend Framework**: Node.js monorepo architecture (`@dnd/web`, `@dnd/api`, `@dnd/data`)
- **Database**: PostgreSQL interfaced via Prisma.
- **Design Language**: Custom deep-surface glassmorphism paired with elite typography (`Outfit` & `Inter`).
- **Data Pipeline**: Purpose-built Node ETL scripts parsing raw Open-Gaming License 5e-bits payload data locally.

## Getting Started

### 1. Installation
Install all monorepo dependencies.
```bash
npm install
```

### 2. Environment Setup
Configure the backend environmental variables in `apps/api/.env`.
```
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/dicera"
JWT_SECRET="super-secret-key"
```

Configure the frontend API endpoints in `apps/web/.env`:
```
VITE_API_URL="http://localhost:3000/api"
```

### 3. Database Seeding & Pipeline
Since the system relies on localized DB instances rather than an external 5e API, you must inject the data:

```bash
# Parse all raw 5e JSON datasets and construct valid insert payloads
npm run etl:all --workspace=@dnd/data

# Push Prisma Database schema
npm run db:setup --workspace=@dnd/api

# Inject parsed ETL output into PostgreSQL
npm run db:seed --workspace=@dnd/api
```

### 4. Initiate Servers
Start both the Frontend and the Backend concurrently.
```bash
npm run dev
```

## Deployment (Vercel)

The `/apps/web` client is pre-configured with a perfect SPA routing file (`vercel.json`) ensuring that client-side navigations to specific deeply nested character/spell pages don't return 404 errors on browser refreshes.

You can host `/apps/web` cleanly on **Vercel** or **Netlify** automatically, provided you update the `VITE_API_URL` to point heavily toward your deployed Node/Express Postgres database endpoint.

## License
Open-Gaming License 5.1 (Wizards of the Coast). Proprietary source platform code by the Dicera Architects.
