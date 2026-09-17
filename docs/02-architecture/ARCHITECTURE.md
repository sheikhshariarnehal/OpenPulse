# OpenPulse — System Architecture & Topology

## 1. High-Level Architecture Overview

OpenPulse adopts a **hybrid storage architecture**:
1. **PostgreSQL**: Stores relational, transactional metadata (users, organizations, projects, API keys, dashboard layouts, feature flag definitions).
2. **Redis**: Serves as high-speed ingestion buffer (Redis Streams), real-time ephemeral cache (API key validation, feature flag configs), and pub/sub broker for live dashboards.
3. **ClickHouse**: Columnar analytical data warehouse storing immutable event streams, session durations, error occurrences, and Web Vitals telemetry.

```
                      ┌────────────────────────────────────────┐
                      │    Client SDKs (Web, Mobile, Backend)   │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  │ POST /api/v1/e, /batch                        │ GET /api/v1/decide
                  ▼                                               ▼
      ┌───────────────────────┐                       ┌───────────────────────┐
      │   apps/ingest         │                       │   apps/web (Next.js)  │
      │   (Fastify Service)   │                       │   API & Dashboard UI  │
      └───────────┬───────────┘                       └───────────┬───────────┘
                  │                                               │
                  │ O(1) Key Check via Cache                      │ Auth, Metadata,
                  │                                               │ Layouts
                  ▼                                               ▼
      ┌───────────────────────┐                       ┌───────────────────────┐
      │     Redis 7           │ ◄──────────────────── │     PostgreSQL 16     │
      │ (Streams & Cache)     │                       │ (Relational Metadata) │
      └───────────┬───────────┘                       └───────────────────────┘
                  │
                  │ Consumer Group (Micro-batches of 5,000 / 1s)
                  ▼
      ┌───────────────────────┐
      │   apps/worker         │
      │ (Batch Ingestion)     │
      └───────────┬───────────┘
                  │
                  │ Native Vectorized Bulk Insert
                  ▼
      ┌────────────────────────────────────────────────────────┐
      │                 ClickHouse Server 24.3                 │
      │   events | sessions | error_occurrences | web_vitals   │
      └───────────────────────────┬────────────────────────────┘
                                  │
                                  │ Direct Sub-second Aggregations
                                  ▼
                      ┌───────────────────────┐
                      │  apps/web (Dashboard) │
                      └───────────────────────┘
```

---

## 2. Monorepo Package Topology

OpenPulse is structured as a **Turborepo** monorepo utilizing **pnpm workspaces**:

```text
openpulse/
├── apps/
│   ├── web/                     # Next.js 16.3.5 App Router application (Dashboard UI, Analytics APIs)
│   ├── ingest/                  # Lightweight Fastify API for high-velocity event ingestion
│   └── worker/                  # Background worker consuming Redis Streams and writing to ClickHouse
├── packages/
│   ├── db/                      # Prisma ORM client & migrations for PostgreSQL
│   ├── clickhouse/              # ClickHouse connection pool, schema definitions, query builders
│   ├── shared/                  # Common TypeScript types, Zod schemas, constants, event contracts
│   ├── sdk-core/                # Isomorphic TypeScript client SDK engine (queuing, batching, retry)
│   ├── sdk-js/                  # Browser-specific telemetry library (DOM tracking, Web Vitals)
│   ├── sdk-react/               # React Context, hooks, auto-pageview listener
│   └── sdk-node/                # Server-side telemetry library for Node.js
├── docker/                      # Dockerfiles and container configurations
├── docs/                        # Project technical documentation
└── docker-compose.yml           # Complete local & self-hosted container orchestration
```

---

## 3. Ingestion Pipeline & Backpressure Mechanism

### Why Ingestion is Decoupled from Next.js
Next.js serverless functions or standard Node HTTP routes introduce overhead (routing cascades, middleware execution, JSON parsing pipelines) and cannot maintain persistent low-latency buffers without memory leakage under heavy loads.
ClickHouse requires batching: inserting 1,000 events one-by-one creates 1,000 separate table parts, quickly triggering the `Too many parts in all data parts in table` error and halting the database.

### The Decoupled Ingestion Path
1. **API Key Authentication**: When `apps/ingest` receives an event, it extracts the `X-OpenPulse-API-Key` or `Authorization: Bearer <key>`. It computes the SHA-256 hash and verifies it against an in-memory Redis Set (`openpulse:valid_keys`). This operation completes in < 0.5ms with zero PostgreSQL queries.
2. **Clock Skew Adjustment**: The client includes `sent_at` in the payload. The ingestion server calculates `skew = now() - sent_at` and recalibrates the event timestamp `adjusted_timestamp = client_timestamp + skew`.
3. **Queue Ingestion**: The raw event payload is pushed directly to Redis Streams (`XADD openpulse:events:stream * project_id <id> payload <json>`).
4. **Immediate Client Response**: `apps/ingest` returns `202 Accepted` with `{ status: "queued", count: N }`.
5. **Micro-Batch Consumer**: `apps/worker` reads from the Redis consumer group using `XREADGROUP`. It accumulates up to 5,000 events or waits at most 1,000ms, parses the JSON records, formats them as `JSONEachRow`, and executes an optimized bulk `INSERT INTO openpulse.events`.
6. **Error Handling & Dead Letter Queue**: If ClickHouse insertion fails, the worker retries up to 3 times before routing unprocessable payloads to `openpulse:events:dlq` without blocking the main stream.

---

## 4. Analytical Query Pipeline

1. **Dashboard Query Requests**: The user opens the OpenPulse dashboard (e.g. Funnel view).
2. **Next.js Route Handlers**: Next.js verifies the user's session and project permissions in PostgreSQL.
3. **ClickHouse Analytical Execution**: Next.js sends a direct SQL query to ClickHouse over HTTP/TCP with parameterized filters (`project_id`, date range, property filters).
4. **Vectorized Aggregation**: ClickHouse evaluates the query across columnar partitions using SIMD instructions.
5. **JSON Stream Response**: ClickHouse returns the aggregated bucket results directly to Next.js, which renders the interactive charts in < 300ms.
