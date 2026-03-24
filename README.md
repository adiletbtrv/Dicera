# Dicera — D&D 5e Platform

A full-stack D&D 5th Edition web toolkit built as a TypeScript monorepo. Covers everything from spell browsing and encounter math to AI-powered DM assistance and character import from Long Story Short.

## What It Does

- **Spell Compendium** — Filter spells by level, school, class, ritual, concentration
- **Bestiary** — Full stat blocks with CR, type, size, and environment filters
- **Character Builder** — Create characters manually or import Long Story Short JSON exports
- **Campaign Manager** — Track sessions, NPCs, locations, and timelines
- **Encounter Builder** — CR/XP budgeting and difficulty calculation per DMG rules
- **Dice Roller** — Any expression (`2d6+3`), history, macros, 3D WebGL rolling animation
- **Map Tools** — Upload maps, place tokens, fog of war, annotations
- **Homebrew** — Create and share custom spells, monsters, items, classes
- **AI Assistants** — Rules Q&A (RAG), NPC dialogue, story generation, DM advisor

## Project Structure

```
dnd-platform/
├── apps/
│   ├── web/          React + Vite + Tailwind frontend
│   └── api/          Express REST API
├── packages/
│   ├── data/         Zod schemas + ETL pipeline
│   └── ai/           LLM providers, RAG, AI bots
└── infra/            Deploy configs (Vercel, Railway)
```

## Tech Stack

**Frontend:** React 18, Vite, TypeScript, TailwindCSS, React Query, Zustand, Framer Motion, Three.js  
**Backend:** Express, TypeScript, PostgreSQL (pgvector)  
**Data:** Zod schemas, ETL pipeline for SRD JSON sources  
**AI:** Gemini / OpenAI / HuggingFace with RAG via pgvector  
**Auth:** JWT (jose)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ with pgvector extension (or Supabase free tier)

### Install

```bash
npm install
```

### Configure

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` with your `DATABASE_URL` and optionally an AI provider key (`GEMINI_API_KEY`, `OPENAI_API_KEY`, or `HUGGINGFACE_API_KEY`).

### Database Setup

```bash
npm run db:migrate -w apps/api
```

### Seed Data (optional)

Place SRD JSON files in `packages/data/data/raw/` and run:

```bash
npm run etl:all -w packages/data
```

### Run

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`, API on `http://localhost:3001`.

## API Overview

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/spells` | List/filter spells |
| GET | `/api/spells/:id` | Spell detail |
| GET | `/api/monsters` | List/filter monsters |
| GET | `/api/monsters/:id` | Monster stat block |
| CRUD | `/api/characters` | Character management |
| CRUD | `/api/campaigns` | Campaign management |
| POST | `/api/encounters` | Create encounter |
| POST | `/api/encounters/calculate` | Difficulty calculation |
| POST | `/api/dice/roll` | Roll dice expression |
| CRUD | `/api/homebrew` | Homebrew content |
| CRUD | `/api/maps` | Map management |
| POST | `/api/ai/rules` | Rules Q&A |
| POST | `/api/ai/npc/dialogue` | NPC dialogue |
| POST | `/api/ai/story/hook` | Session hook generator |
| POST | `/api/ai/dm/chat` | DM assistant |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |

## AI Rate Limiting

- 5 requests/minute per user
- 50 requests/day per user
- Configurable via `AI_MAX_REQUESTS_PER_MINUTE` and `AI_MAX_REQUESTS_PER_DAY` env vars

## Data Sources

D&D 5e SRD content is available under [CC BY 4.0](https://www.dndbeyond.com/attachments/39j2li89/SRD5.1-CCBY4.0License.pdf). Recommended free data source: [5e-database](https://github.com/5e-bits/5e-database) (SRD only).

## License

Private repository — all rights reserved.
