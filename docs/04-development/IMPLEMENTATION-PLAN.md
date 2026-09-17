# OpenPulse — Monorepo Implementation Plan & Technical Scaffolding

This guide details the exact package structure, dependency tree, scripts, and build configuration for the OpenPulse monorepo.

---

## 1. Monorepo Setup & Workspace Topology

OpenPulse is configured using **pnpm workspaces** and **Turborepo**:

### `pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Root `package.json` Scripts
```json
{
  "name": "openpulse-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "db:generate": "turbo run db:generate",
    "db:migrate": "turbo run db:migrate",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0",
    "prettier": "^3.2.0",
    "eslint": "^9.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

---

## 2. Core Dependencies by Package

### 2.1 `apps/web` (Next.js Dashboard)
- `next`: `16.3.5`
- `react`, `react-dom`: `^19.0.0`
- `tailwindcss`: `^3.4.0`
- `@tanstack/react-query`: `^5.0.0` (Client-side analytical query caching)
- `lucide-react`: `^0.400.0` (Technical icon set)
- `recharts` / `@tremor/react`: Visualization charts
- `cmdk`: `^1.0.0` (Command palette modal)
- `@openpulse/db`, `@openpulse/clickhouse`, `@openpulse/shared`: Workspace dependencies

### 2.2 `apps/ingest` (Fastify Ingestion API)
- `fastify`: `^4.26.0` (Sub-millisecond HTTP routing)
- `@fastify/cors`: `^9.0.0`
- `@fastify/compress`: `^7.0.0` (Gzip/deflate decompression)
- `ioredis`: `^5.3.0` (Direct Redis Streams `xadd` pipeline)
- `zod`: `^3.22.0` (Payload structure validation)
- `@openpulse/shared`: Workspace dependency

### 2.3 `apps/worker` (Batch Ingestion Worker)
- `ioredis`: `^5.3.0` (Redis Consumer Groups `xreadgroup`)
- `@clickhouse/client`: `^1.0.0` (High-speed bulk HTTP streaming to ClickHouse)
- `pino`: `^8.19.0` (Structured logging)
- `@openpulse/clickhouse`, `@openpulse/shared`: Workspace dependencies

### 2.4 `packages/db` (PostgreSQL Client)
- `@prisma/client` & `prisma`: `^5.12.0` (Schema management & type-safe queries)

### 2.5 `packages/clickhouse` (ClickHouse Analytics Engine)
- `@clickhouse/client`: `^1.0.0`
- Parameterized query builders for `windowFunnel`, `retention`, and time-bucketing.

---

## 3. Turbo Pipeline Configuration (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:generate": {
      "cache": false
    }
  }
}
```
