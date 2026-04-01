<div align="center">

<img src="https://img.shields.io/badge/version-1.1.0-6366f1?style=flat-square" alt="version" />
<img src="https://img.shields.io/badge/license-OGL_5.1-a78bfa?style=flat-square" alt="license" />
<img src="https://img.shields.io/badge/stack-React_·_Node.js_·_PostgreSQL-818cf8?style=flat-square" alt="stack" />
<img src="https://img.shields.io/badge/design-glassmorphism-c4b5fd?style=flat-square" alt="design" />

# DICERA

**The enterprise-grade companion platform for Dungeons & Dragons 5th Edition.**

Dicera delivers every mathematical, archival, and DM-assistant tool required for a serious 5e tabletop experience — wrapped in an elegant, responsive interface built with Framer Motion and a custom deep-surface glassmorphism design language.

[Screenshots](#screenshots) · [Features](#features) · [Getting Started](#getting-started) · [Deployment](#deployment) · [License](#license)

</div>

---

## Screenshots

<div align="center">

| Home Page | Profile Page |
|:---:|:---:|
| ![Compendium](https://github.com/user-attachments/assets/fd12aa3e-7ef9-483b-8bc0-e9719948b38d) | ![Character Builder](https://github.com/user-attachments/assets/483897d6-421a-4c73-9b59-0b390b659da3) |

| Compendium | Bestiary |
|:---:|:---:|
| ![Encounter Runner](https://github.com/user-attachments/assets/03015501-2f23-45ba-9806-869da5242ebc) | ![Bestiary](https://github.com/user-attachments/assets/58198fcb-4582-429e-a701-2b138627d250) |

| Conditions | Item Vault |
|:---:|:---:|
| ![Spell Browser](https://github.com/user-attachments/assets/5bd5a9c8-f0af-43ef-a076-aec70548ae0d) | ![Item Vault](https://github.com/user-attachments/assets/5cd90e77-f68e-4a9e-9b5a-e338c75d56fe) |

</div>

---

## Features

### Full Compendium Suite
Searchable, filterable references for **Spells**, **Bestiary**, **Items**, **Backgrounds**, **Feats**, **Races**, and **Classes** — all powered by offline-first caching via TanStack Query. No internet dependency mid-session.

### Mathematically Sound Character Builder
A complete rules engine that correctly computes **hit points**, **proficiency bonuses**, **saving throws**, **skill modifiers**, and **ability score improvements** across all 20 levels. No rules gaps, no broken edge cases.

### Encounter Runner
A full DM toolkit featuring **CR budget analysis**, **initiative tracking**, and procedural **loot generation** — everything needed to run combat without leaving the browser.

### Custom Hardware Seed
Bypasses the open-source D&D licensing gaps by aggressively seeding missing popular subclasses, thematic descriptions, Feats, and Backgrounds directly into the local Postgres store. Your compendium is complete on day one.

### AI Integration
Connects to advanced AI platforms for **rules lookup**, **edge-case arbitration**, and **dynamic campaign dialogue generation** — giving your DM screen an intelligent co-pilot.

### Apple-Tier Design Language
Built with a custom **deep-surface glassmorphism** aesthetic, `Outfit` + `Inter` typography pairing, and fluid Framer Motion transitions throughout.

> **[View Figma Design File →](https://www.figma.com/design/ALbnn6TYHSK10G72izKeuf/Dicera?node-id=0-1&t=hlF8ueszoQZXFoRk-1)**

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18 · Vite · TypeScript · Tailwind CSS · Framer Motion |
| **Backend** | Node.js · Express · Monorepo (`@dnd/web`, `@dnd/api`, `@dnd/data`) |
| **Database** | PostgreSQL · Prisma ORM |
| **Data Pipeline** | Custom ETL scripts — parses raw OGL 5e JSON datasets locally |
| **Design** | Glassmorphism · `Outfit` & `Inter` · CSS custom properties |

---

## Getting Started

### Prerequisites
- Node.js `v18+`
- PostgreSQL instance (local or hosted)
- npm `v9+`

### 1. Clone & Install

```bash
git clone https://github.com/your-org/dicera.git
cd dicera
npm install
```

### 2. Configure Environment

**Backend** — create `apps/api/.env`:

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/dicera"
JWT_SECRET="your-secret-key"
```

**Frontend** — create `apps/web/.env`:

```env
VITE_API_URL="http://localhost:3000/api"
```

### 3. Seed the Database

Dicera uses a local PostgreSQL instance rather than a live 5e API. The three-step pipeline parses raw OGL data, applies the schema, and injects everything:

```bash
# 1. Parse all raw 5e JSON datasets into valid insert payloads
npm run etl:all --workspace=@dnd/data

# 2. Push the Prisma schema to your database
npm run db:setup --workspace=@dnd/api

# 3. Inject ETL output into PostgreSQL
npm run db:seed --workspace=@dnd/api
```

### 4. Start Development Servers

```bash
npm run dev
```

Both the frontend (`localhost:5173`) and backend (`localhost:3000`) start concurrently.

---

## Deployment

The `/apps/web` client is pre-configured for **Vercel** and **Netlify** with a `vercel.json` SPA routing config — browser refreshes on deep routes like `/characters/123` or `/spells/fireball` resolve correctly without 404s.

For production, update `VITE_API_URL` in your hosting provider's environment variables to point to your deployed Node/Express API.

```
VITE_API_URL="https://api.your-dicera-instance.com/api"
```

> **Note:** Your Express + PostgreSQL backend needs a persistent host (Railway, Render, Fly.io, or a VPS). Vercel's serverless functions are stateless and incompatible with Prisma's connection pooling at scale.

---

## Project Structure

```
dicera/
├── apps/
│   ├── web/          # React frontend (@dnd/web)
│   └── api/          # Express backend (@dnd/api)
├── packages/
│   └── data/         # ETL pipeline & seed scripts (@dnd/data)
├── package.json      # Monorepo root
└── README.md
```

---

## License

Source platform code is proprietary — © Dicera Architects.

All D&D 5e game content is covered under the **[Open-Gaming License v1.0a / 5.1](https://www.dndbeyond.com/attachments/39j2li89/SRD5.1-CCBY4.0License.pdf)** by Wizards of the Coast.
