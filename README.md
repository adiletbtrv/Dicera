# Dicera 5e

Dicera is a modern, enterprise-grade Dungeons & Dragons 5th Edition digital toolkit. It provides a highly responsive, animated, and reliable platform for character management, compendium reference, encounter building, and campaign tracking.

## Architecture & Tech Stack

This repository is structured as an npm monorepo with dedicated `apps` and `packages` workspaces.

### Frontend (`apps/web`)
- **Framework**: React 18 / Vite / TypeScript
- **Styling**: TailwindCSS with Custom CSS Variables (Amon Fudo Theme)
- **State**: Zustand (App state) & TanStack Query (Server state)
- **Animations**: Framer Motion
- **Features**: Canvas Map Viewer, Native HTML5 Drag and Drop, Fully Mobile Responsive Grid

### Backend (`apps/api`)
- **Server**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL (using `pg` driver)
- **Vectors**: `pgvector` for upcoming AI RAG features
- **Design Pattern**: Router-Controller pattern with raw SQL queries for absolute execution speed and control

### Shared (`packages/data` & `packages/ai`)
- **Data Schemas**: Shared Zod schemas for end-to-end type safety between the frontend and database
- **ETL Pipelines**: Node scripts that process external raw API JSON into fully normalized, database-ready output for rapid seeding

## Quick Setup

### 1. Requirements
- Node.js `v20+` or `v22+`
- PostgreSQL `15+` (with `pgvector` and `pg_trgm` extensions enabled)

### 2. Environment Variables
You must provide `.env` files in both the frontend and backend directories.

**`apps/api/.env`**:
```env
# Standard Postgres Connection String
DATABASE_URL=postgresql://user:password@localhost:5432/dicera

# API Port
PORT=3001
```

**`apps/web/.env`**:
```env
# URL to Local or Remote API
VITE_API_URL=http://localhost:3001
```

### 3. Installation & Preparation
```bash
# Install dependencies for all workspaces
npm install

# Build the shared packages
npm run build:packages

# Pull missing 5e-bits raw API json for the ETL pipeline
npm run data:download

# Parse, transform, and normalize the raw data
npm run data:etl

# Migrate the database schema and seed the entire 5e structural compendium
npm run db:setup
```

### 4. Running the Ecosystem
To run everything concurrently in development mode:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:3001`.

## Core Features
1. **Compendium**: 14 distinct interconnected pages mapping out spells, monsters, races, backgrounds, classes, feats, conditions, weapons, and magic items. Lookups utilize Postgres trigram searching for extreme speed.
2. **Character Builder**: Advanced 4-step wizard saving locally or natively into the DB. Contains an integrated interactive sheet spanning Saves, Skills, Spells, HP adjustments, and features.
3. **DM Tools**: Integrated Encounter builders, dynamic map panning, CR budgeting, Initiative tracking, and scaled loot generators.
4. **Resilient**: Fully typed using Zod boundaries, and automatically recovers from database network interruptions. Includes a beautiful skeleton loading architecture for clean transitions. 
