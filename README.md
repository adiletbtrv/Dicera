# 🐉 DICERA

> **Enterprise-grade companion platform and intelligent Dungeon Master copilot for Dungeons & Dragons 5th Edition — engineered with WebGL 3D physics, context-aware RAG vector search, and optimistic offline-first state synchronization.**

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+_%7C_pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-EF4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-OGL_5.1-a78bfa?style=flat-square)](https://dnd.wizards.com/resources/systems-reference-document)

**[Architecture](#-system-architecture)** • **[Engineering Highlights](#-key-architectural--engineering-highlights)** • **[Tech Stack](#-tech-stack)** • **[Project Structure](#-project-structure)** • **[API Reference](#-api-endpoints-reference)** • **[Quick Start](#-getting-started)** • **[Testing & QA](#-testing--quality-assurance)** • **[Figma Design](https://www.figma.com/design/ALbnn6TYHSK10G72izKeuf/Dicera?node-id=0-1&t=hlF8ueszoQZXFoRk-1)**

</div>

---

## ⚡ Key Architectural & Engineering Highlights

### 1. WebGL Platonic Solid Calculus & Real-Time 3D Physics
* **Custom Polyhedral Geometry Engine:** Rather than relying on static 2D animations or generic assets, the dice subsystem (`apps/web/src/components/ui/DiceRoller.tsx`) renders real-time 3D Platonic solids via **Three.js WebGL**.
* **Center-of-Mass & Dihedral Angle Calibration:** Manually plots the 3D vertex coordinates for asymmetric solids like the regular tetrahedron ($d4$), offsetting the geometry center by $-R/9$ to ensure rotation around its true barycenter without orbital wobble. Calibrates dodecahedron ($d12$) target rest angles to its exact half-dihedral pitch ($1.017\text{ rad}$) and pre-aligns icosahedral ($d20$) face normals along the Z-axis.
* **Anti-Gimbal-Lock Angular Interpolation:** Implements a custom modular difference algorithm (`alignRotation`) to compute the shortest geodesic path across $[0, 2\pi]$, completely mitigating visual rotational snapping ("Helicopter Unwind") during `lerp` decay.

### 2. Context-Aware RAG Subsystem with `pgvector` Cosine Search
* **Sub-100ms Rule Resolution:** Implements an enterprise RAG pipeline (`packages/ai/src/rag/rules-rag.ts`) that chunks, hashes (deterministic SHA-1 digests), and indexes the entire SRD 5.1 compendium into PostgreSQL using the **`pgvector`** extension (`IVFFlat` indexing with `vector_cosine_ops`).
* **Multi-Provider LLM Abstraction & Resilience:** Decouples AI orchestration through a unified interface supporting **Google Gemini**, **OpenAI**, and **Hugging Face** with automatic fallback to base parametric models during database degradation.
* **Two-Tier Sliding-Window Rate Limiter:** Protects upstream token quotas with an in-memory sliding-window bucket algorithm tracking per-minute burst thresholds alongside midnight-reset daily token budgets (`packages/ai/src/rate-limiter.ts`).

### 3. Optimistic UI Mutations & Snapshot Rollback Resilience
* **Zero-Latency Interactions:** Live combat and character sheet operations (HP mutations, spell slot tracking, condition toggles) utilize **TanStack Query v5** optimistic updates (`apps/web/src/pages/CharacterSheetPage.tsx`).
* **Atomic State Snapshots:** Captures query cache snapshots in `onMutate` before in-flight network dispatch. If network timeout or validation failure occurs, the UI seamlessly reverts to the exact snapshot in `onError`, backed by background revalidation in `onSettled`.

### 4. Parameter-Bounded Bulk Ingestion & Trigram Fuzzy Indexing
* **PostgreSQL Parameter Overflow Protection:** The ETL seed engine (`apps/api/src/db/seed.ts`) dynamically calculates chunk batch sizes (`Math.floor(60000 / columns.length)`) to prevent parameter exhaustion over PostgreSQL’s 65,535 prepared statement binding limit.
* **Fuzzy Search Acceleration:** Integrates PostgreSQL `pg_trgm` GIN indexes across spells, monsters, and items, allowing instantaneous sub-millisecond typographic-tolerant search across thousands of entities.

---

## 🏛 System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER (React 18 SPA)                          │
│                                                                                        │
│  ┌───────────────────────┐   ┌───────────────────────────┐   ┌──────────────────────┐  │
│  │   UI Components &     │   │   Three.js 3D Viewport    │   │  Tactical Map Canvas │  │
│  │ Framer Motion Layouts │   │  (WebGL Platonic Solids)  │   │ (Affine Coordinates) │  │
│  └───────────┬───────────┘   └─────────────┬─────────────┘   └──────────┬───────────┘  │
│              │                             │                            │              │
│              └──────────────────────┬──────┴────────────────────────────┘              │
│                                     ▼                                                  │
│                    ┌─────────────────────────────────┐                                 │
│                    │   TanStack Query v5 / Zustand   │                                 │
│                    │ (Optimistic UI & Cache Stores)  │                                 │
│                    └────────────────┬────────────────┘                                 │
└─────────────────────────────────────┼──────────────────────────────────────────────────┘
                                      │ HTTP / REST (JSON API)
                                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                BACKEND GATEWAY (Node.js / Express)                     │
│                                                                                        │
│  ┌───────────────────┐    ┌────────────────────┐    ┌───────────────────────────────┐  │
│  │ Helmet / CORS /   │───▶│ Jose JWT Auth &    │───▶│ Zod Runtime Request           │  │
│  │ Global Rate-Limit │    │ Security Guards    │    │ Parsing & Type Validation     │  │
│  └───────────────────┘    └────────────────────┘    └───────────────┬───────────────┘  │
│                                                                     │                  │
│       ┌─────────────────────────────────────────────────────────────┴────────┐         │
│       ▼                                                                      ▼         │
│  ┌─────────────────────────┐                            ┌───────────────────────────┐  │
│  │ Core REST Handlers      │                            │ AI / RAG Orchestrator     │  │
│  │ (Spells, Monsters, Map, │                            │ (Rules Engine & Rate-Lim) │  │
│  │ Encounters, Characters) │                            └─────────────┬─────────────┘  │
│  └────────────┬────────────┘                                          │                │
└───────────────┼───────────────────────────────────────────────────────┼────────────────┘
                │                                                       │
                ▼                                                       ▼
┌──────────────────────────────────────────────┐        ┌────────────────────────────────┐
│             POSTGRESQL 15+ ENGINE            │        │      EXTERNAL AI PROVIDERS     │
│                                              │        │                                │
│  ┌────────────────────────────────────────┐  │        │  ┌──────────────────────────┐  │
│  │ Relational Schemas & JSONB Storage     │  │        │  │ Google Gemini 1.5 Flash  │  │
│  ├────────────────────────────────────────┤  │        │  ├──────────────────────────┤  │
│  │ pg_trgm Fuzzy GIN Search Indexes       │  │        │  │ OpenAI GPT-4o Mini / ... │  │
│  ├────────────────────────────────────────┤  │        │  ├──────────────────────────┤  │
│  │ pgvector 1536-dim IVFFlat Vector Store │◀─┼────────┼──┤ Hugging Face Inference   │  │
│  └────────────────────────────────────────┘  │        │  └──────────────────────────┘  │
└──────────────────────────────────────────────┘        └────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technologies | Description |
|---|---|---|
| **Frontend & UI** | `React 18.3`, `TypeScript 5.5`, `Vite 5.4`, `Tailwind CSS 3.4`, `Framer Motion 12`, `Lucide React` | Component architecture with deep-surface glassmorphism design system |
| **Graphics & Math** | `Three.js 0.183`, `WebGL`, `Custom Linear Algebra / Trigonometry` | Low-latency 3D dice physics with exact Platonic solid geometry calculus |
| **State & Cache** | `TanStack React Query 5.56`, `Zustand 5.0` | Client-side optimistic synchronization, rollback snapshots, and reactive stores |
| **Backend & APIs** | `Node.js 20+ (ESM)`, `Express 4.19`, `Zod 3.23`, `Jose 5.6`, `Pino 10`, `Helmet 8` | Type-safe REST API gateway, structured JSON logging, and secure JWT auth |
| **AI & Vector Search** | `@dnd/ai`, `pgvector`, `Cosine Distance (<=>)`, `OpenAI API`, `Google Gemini API` | RAG rulebook retriever, sliding-window rate limiters, AI campaign co-pilots |
| **Database & ETL** | `PostgreSQL 15+`, `pg 8.12`, `pg_trgm`, `Custom Chunked Batch Ingestion` | Relational + JSONB schema, IVFFlat vector indexing, automated migration runner |
| **Monorepo & DevOps** | `Turborepo 2.9`, `Docker`, `Docker Compose`, `Railway`, `Vercel` | High-efficiency cached workspace pipeline, multi-stage container deployment |
| **Testing & QA** | `Vitest 2.1`, `Fast-Check 4.6`, `Testing Library`, `Supertest 7.2`, `JSDOM 29` | Property-based testing for mathematical parsers, integration & unit suites |

---

## 📁 Project Structure

```
dicera/
├── apps/
│   ├── api/                        # Express backend service (@dnd/api)
│   │   ├── src/
│   │   │   ├── db/                 # Postgres connection pool, migration runner & bulk seeders
│   │   │   │   └── migrations/     # Atomic SQL DDL schemas (pgvector, pg_trgm, JSONB indexes)
│   │   │   ├── middleware/         # Jose JWT auth guards, rate limiters, Pino HTTP loggers
│   │   │   ├── routes/             # REST resource endpoints (characters, spells, AI, maps)
│   │   │   ├── utils/              # Structured logger & mathematical helper functions
│   │   │   ├── app.ts              # Express application assembly & security pipeline
│   │   │   ├── config.ts           # Zod-validated environment configuration
│   │   │   └── server.ts           # Server lifecycle & database health check entry point
│   │   ├── Dockerfile              # Production multi-stage Node.js container build
│   │   └── package.json
│   │
│   └── web/                        # React SPA frontend client (@dnd/web)
│       ├── src/
│       │   ├── components/         # Design system primitives, UI layouts, Command Palette
│       │   │   └── ui/             # WebGL Three.js Dice Roller, stat blocks, custom selects
│       │   ├── lib/                # Type-safe API client wrappers & modifier math utilities
│       │   ├── pages/              # 35+ dynamic routes (Compendium, Builder, Tactical Maps)
│       │   │   └── tools/          # CR budget analyzer, Loot generator, Initiative tracker
│       │   ├── store/              # Zustand global client stores (dice history, combat, toasts)
│       │   ├── App.tsx             # Root layout router with AnimatePresence view transitions
│       │   └── index.css           # Glassmorphism design tokens & CSS custom variables
│       ├── Dockerfile              # Nginx static web container build
│       └── vite.config.ts          # Vite build pipeline with dev proxy configuration
│
├── packages/
│   ├── ai/                         # Extensible AI orchestration package (@dnd/ai)
│   │   └── src/
│   │       ├── bots/               # Specialized DM assistant, Storyteller & NPC agents
│   │       ├── providers/          # LLM integrations (Gemini, OpenAI, Hugging Face)
│   │       ├── rag/                # RAG vector retrieval & chunk aggregation pipeline
│   │       ├── rate-limiter.ts     # Two-tier token bucket & sliding-window rate limiter
│   │       └── vector-store/       # pgvector cosine similarity search driver
│   │
│   └── data/                       # Compendium ETL & Schema package (@dnd/data)
│       ├── scripts/                # SRD 5.1 automated raw JSON dataset downloader
│       └── src/
│           ├── etl/                # Normalization pipelines for spells, monsters, classes
│           └── schemas/            # Zod validation schemas for all 5e game entities
│
├── infra/                          # Deployment manifests (Railway, Vercel SPA routing)
├── docker-compose.yml              # Local PostgreSQL 14/15 + pgvector container definition
├── package.json                    # Monorepo root configuration & Turborepo task scripts
└── turbo.json                      # Monorepo task pipeline dependency graph
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account with hashed credentials |
| `POST` | `/api/auth/login` | Public | Authenticate user and issue signed JWT bearer token |
| `GET` | `/api/auth/me` | Bearer Token | Retrieve authenticated user profile |
| `GET` | `/api/spells` | Optional | Query compendium spells (Filter by `level`, `school`, `class`, `q`) |
| `GET` | `/api/spells/:id` | Optional | Fetch detailed spell entry by slug identifier |
| `GET` | `/api/monsters` | Optional | Query SRD bestiary (Filter by `cr`, `type`, `size`, `environment`, `q`) |
| `GET` | `/api/monsters/:id` | Optional | Fetch detailed monster statblock by slug identifier |
| `GET` | `/api/characters` | Bearer Token | Retrieve all character sheets owned by user |
| `POST` | `/api/characters` | Bearer Token | Create new character sheet with validated ability scores |
| `PATCH` | `/api/characters/:id` | Bearer Token | Optimistically update HP, spell slots, features, or stats |
| `DELETE`| `/api/characters/:id` | Bearer Token | Delete character sheet |
| `GET` | `/api/campaigns` | Bearer Token | List campaigns owned by or joined by the user |
| `POST` | `/api/campaigns/:id/invite` | Bearer Token | Generate unique campaign invitation code |
| `POST` | `/api/dice/roll` | Optional | Server-side algebraic dice parser and roll logger |
| `POST` | `/api/ai/rules` | Bearer Token | Query RAG vector knowledge base for exact 5e rules citations |
| `POST` | `/api/ai/npc` | Bearer Token | Procedural NPC generation and dynamic dialogue stream |
| `POST` | `/api/ai/story` | Bearer Token | Campaign narrative generator and DM co-pilot assistant |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v20.0.0` or higher
* **npm**: `v10.0.0` or higher
* **Docker & Docker Compose** (for local PostgreSQL instance)

---

### Step 1: Clone Repository & Install Dependencies

```bash
git clone https://github.com/adiletbtrv/Dicera.git
cd Dicera
npm install
```

---

### Step 2: Configure Environment Variables

Create `apps/api/.env`:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/dicera"
JWT_SECRET="dev-super-secret-jwt-key-minimum-32-characters-long"
JWT_EXPIRY="7d"
CORS_ORIGIN="http://localhost:3000"

# AI Provider Configuration (Configure at least one)
AI_PROVIDER="gemini"
GEMINI_API_KEY="your_gemini_api_key"
AI_DEFAULT_MODEL="gemini-1.5-flash"
AI_EMBEDDING_MODEL="text-embedding-004"
AI_MAX_REQUESTS_PER_MINUTE=5
AI_MAX_REQUESTS_PER_DAY=50
```

Create `apps/web/.env`:

```env
VITE_API_URL="http://localhost:3001/api"
```

---

### Step 3: Initialize Database & Run Automated ETL Pipeline

1. **Launch PostgreSQL with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Download SRD 5.1 datasets and run the ETL compiler:**
   ```bash
   npm run setup-data --workspace=@dnd/data
   ```

3. **Apply atomic SQL migrations (Creates tables, triggers, and GIN/IVFFlat indexes):**
   ```bash
   npm run db:migrate --workspace=@dnd/api
   ```

4. **Inject normalized compendium datasets into PostgreSQL:**
   ```bash
   npm run db:seed --workspace=@dnd/api
   ```

---

### Step 4: Run Development Environment

Start both client and API services concurrently via **Turborepo**:

```bash
npm run dev
```

* **Frontend Client:** `http://localhost:3000`
* **Backend API:** `http://localhost:3001`
* **API Health Check:** `http://localhost:3001/health`

---

## 🧪 Testing & Quality Assurance

Dicera utilizes **Vitest** for blazing fast unit/integration testing and **Fast-Check** for generative property-based testing.

```bash
# Run all workspace test suites concurrently
npm run test

# Execute property-based tests on the mathematical expression parser
npm run test --workspace=@dnd/api

# Run static type verification across all monorepo packages
npm run typecheck

# Verify code formatting and linting rules
npm run lint
```

### Key Test Coverage Areas:
* **Property-Based Parser Validation (`fast-check`):** Verifies the algebraic dice syntax parser against thousands of generated permutations (`NdN+K`, `NdN-NdN`), guaranteeing that total roll sums strictly remain within analytical mathematical bounds $[\text{count}, \text{count} \times \text{sides}]$.
* **Optimistic Cache Reversion (`JSDOM`):** Verifies that client state mutations correctly capture snapshots and revert in-flight mutations upon simulated 500/503 network faults.
* **Schema Validation Suites:** Asserts 100% boundary compliance across all SRD 5.1 ETL scripts against Zod schemas.

---

## 📜 License & Acknowledgments

* **Platform Codebase:** Proprietary © Dicera Architecture. All rights reserved.
* **Game Content:** D&D 5e content is licensed under the **[Open Game License v1.0a / System Reference Document 5.1 (SRD5)](https://dnd.wizards.com/resources/systems-reference-document)** by Wizards of the Coast LLC.

**Author:** [Adilet Batyrov](https://github.com/adiletbtrv) • Connect on [LinkedIn](https://www.linkedin.com/in/adilet-batyrov/)
