# OpenPulse — Local Development Setup Guide

This guide walks through spinning up the full OpenPulse development environment on your local machine.

---

## 1. Prerequisites

Ensure the following tools are installed:
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **pnpm**: `^9.0.0` (`npm install -g pnpm`)
- **Docker & Docker Compose**: Docker Engine `24.x`+ with Compose V2
- **Git**: Modern git client

---

## 2. Quickstart Steps

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/openpulse-io/openpulse.git
cd openpulse
pnpm install
```

### Step 2: Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```

Default local `.env` values:
```ini
# PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/openpulse_dev"

# ClickHouse
CLICKHOUSE_HOST="http://localhost:8123"
CLICKHOUSE_USER="default"
CLICKHOUSE_PASSWORD=""
CLICKHOUSE_DATABASE="openpulse"

# Redis
REDIS_URL="redis://localhost:6379"

# Ingestion API
PORT_INGEST=3001
PORT_WEB=3000

# Auth & Secrets
NEXTAUTH_SECRET="dev-secret-change-in-production-32chars"
NEXTAUTH_URL="http://localhost:3000"
```

### Step 3: Start Local Infrastructure Containers
Start PostgreSQL, ClickHouse, and Redis in the background:
```bash
docker compose -f docker-compose.dev.yml up -d
```

Verify all containers are running healthy:
```bash
docker compose -f docker-compose.dev.yml ps
```

### Step 4: Run Database Migrations
Initialize the PostgreSQL schema and ClickHouse tables:
```bash
# Apply Prisma migrations to PostgreSQL
pnpm db:migrate

# Create ClickHouse database & analytical tables
pnpm clickhouse:init
```

### Step 5: Start Local Development Servers
Run the Turborepo development pipeline (starts `apps/web`, `apps/ingest`, and `apps/worker` concurrently):
```bash
pnpm dev
```

The services will be accessible at:
- **Dashboard Web UI**: [http://localhost:3000](http://localhost:3000)
- **Ingestion API**: [http://localhost:3001](http://localhost:3001)
- **ClickHouse Web Client / HTTP**: [http://localhost:8123](http://localhost:8123)

---

## 3. Seeding Test Telemetry Data

To populate your local dashboard with mock events, sessions, errors, and funnels:
```bash
pnpm seed:telemetry --events 10000 --users 250
```

Open [http://localhost:3000](http://localhost:3000) to view the seeded dashboard and test real-time ingestion.
