# OpenPulse — Dual Database Setup Walkthrough

OpenPulse has been configured with the **Production Dual Database architecture**:
- **PostgreSQL 16 (via Prisma ORM)**: Relational metadata, user authentication, multi-workspace isolation, application credentials, and API keys.
- **ClickHouse 24.3 (via `@clickhouse/client`)**: High-velocity columnar time-series telemetry store for raw event streams, session aggregations, and analytical queries.
- **Docker Compose**: Pre-configured multi-container orchestration for PostgreSQL and ClickHouse.
- **Resilient Hybrid Data Layer**: Updated `lib/db.ts` that seamlessly writes and mirrors to PostgreSQL and ClickHouse with zero-downtime offline fallback.

---

## 🗄️ Database Architecture & Components

```
                      ┌────────────────────────────────────────┐
                      │          Next.js App Router            │
                      │       (API Routes & UI Components)     │
                      └──────────────────┬─────────────────────┘
                                         │
                        ┌────────────────┴────────────────┐
                        ▼                                 ▼
         ┌──────────────────────────────┐  ┌──────────────────────────────┐
         │       Prisma ORM (v6)        │  │     ClickHouse Client (v1)   │
         │       [lib/prisma.ts]        │  │      [lib/clickhouse.ts]     │
         └──────────────┬───────────────┘  └──────────────┬───────────────┘
                        │                                 │
                        ▼ (Port 5432)                     ▼ (Port 8123)
         ┌──────────────────────────────┐  ┌──────────────────────────────┐
         │        PostgreSQL 16         │  │       ClickHouse 24.3        │
         │  • users                     │  │  • openpulse.events          │
         │  • workspaces                │  │    (ReplacingMergeTree)      │
         │  • workspace_members         │  │  • openpulse.sessions        │
         │  • app_projects              │  │    (ReplacingMergeTree)      │
         │  • api_keys                  │  │                              │
         │  • telemetry_events (mirror) │  │                              │
         └──────────────────────────────┘  └──────────────────────────────┘
```

---

## 📂 Key Files Created & Configured

### 1. Multi-Container Orchestration (`docker-compose.yml`)
- Configured `postgres:16-alpine` on port `5432` with healthcheck (`pg_isready`) and volume `pgdata`.
- Configured `clickhouse/clickhouse-server:24.3-alpine` on ports `8123` (HTTP) and `9000` (Native) with volume `chdata`.

### 2. Environment Variables (`.env.example` & `.env`)
- `DATABASE_URL`: PostgreSQL connection string.
- `CLICKHOUSE_HOST`: ClickHouse HTTP endpoint (`http://localhost:8123`).
- `CLICKHOUSE_DATABASE`: Analytics database name (`openpulse`).

### 3. Prisma Relational Schema (`prisma/schema.prisma`)
- Models: `User`, `Workspace`, `WorkspaceMember`, `AppProject`, `ApiKey`, and `TelemetryEventMirror`.
- Generated type-safe client with `pnpm prisma generate`.

### 4. ClickHouse Client & Initializer (`lib/clickhouse.ts`)
- Configured `@clickhouse/client` singleton.
- Includes `initClickHouseSchema()` to provision `openpulse.events` and `openpulse.sessions` partitioned tables.

### 5. Unified Data Access Layer (`lib/db.ts`)
- Exposes `db.prisma` and `db.clickhouse`.
- `recordEvent` automatically mirrors telemetry batches to ClickHouse and PostgreSQL when available.
- Retains backwards-compatible synchronous methods with automatic local store fallback so the dev server runs reliably even if Docker is not active.

### 6. Database Init & Seed Script (`scripts/init-db.ts`)
- Script to test connections, provision ClickHouse partitioned tables, push Prisma schema, and seed default admin (`nehal@openpulse.io`), Acme Corp workspace, and default applications.

---

## 🚀 How to Run the Database Services

### Start Local Databases
```bash
pnpm db:up
```
*(Starts Docker containers for PostgreSQL on port 5432 and ClickHouse on port 8123)*

### Push Schema & Seed Initial Data
```bash
# Push Prisma schema to PostgreSQL
pnpm db:push

# Initialize ClickHouse tables & seed default workspace
pnpm db:init
```

### Stop Databases
```bash
pnpm db:down
```

---

## 🧪 Verification Results
- `pnpm tsc --noEmit`: Exited with code **0 errors**.
- `docker compose config`: Validated with **0 syntax errors**.
- `pnpm db:init`: Tested connectivity handling and initialization routines.
- Next.js UI (`http://localhost:3000/acme-corp/analytics`): Fully verified in Chrome DevTools with zero hydration or console warnings.
