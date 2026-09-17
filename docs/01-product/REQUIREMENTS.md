# OpenPulse — Technical & Product Requirements Matrix

This document provides the formal functional and non-functional requirements specification for the OpenPulse platform.

---

## 1. Functional Requirements Matrix

| ID | Module | Requirement Description | Priority | Target Phase |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | Ingestion | Ingest single event payloads via `POST /api/v1/e` with sub-15ms server processing latency. | P0 | Phase 4 |
| **FR-02** | Ingestion | Ingest event batches (up to 500 events per request) via `POST /api/v1/batch` with gzip support. | P0 | Phase 4 |
| **FR-03** | Ingestion | Buffer all incoming events in Redis Streams (`openpulse:events:stream`) for backpressure management. | P0 | Phase 4 |
| **FR-04** | Ingestion | Worker service micro-batches events from Redis into ClickHouse in batches of up to 5,000 events or 1s intervals. | P0 | Phase 4 |
| **FR-05** | Security | Scoped API keys with prefix `op_live_` and `op_test_`; SHA-256 hashed in database, cached in Redis. | P0 | Phase 3 |
| **FR-06** | Tenancy | Hierarchical multi-tenancy: Organization -> Projects -> API Keys, Dashboards, and Event data. | P0 | Phase 3 |
| **FR-07** | Auth | User authentication (email/password with bcrypt/argon2, session tokens/JWT, RBAC roles). | P0 | Phase 3 |
| **FR-08** | Analytics | Real-time event inspector showing live stream of events via SSE / polling with filter criteria. | P1 | Phase 6 |
| **FR-09** | Analytics | Arbitrary property breakdown, count aggregations, time-series bucketing by minute/hour/day. | P1 | Phase 6 |
| **FR-10** | Analytics | Multi-step conversion funnel calculation with flexible conversion window using ClickHouse `windowFunnel()`. | P1 | Phase 6 |
| **FR-11** | Analytics | N-day / N-week cohort retention analysis using ClickHouse `retention()`. | P1 | Phase 6 |
| **FR-12** | Observability | Client error capture with automated grouping via fingerprint hashing (file, line, message). | P2 | Phase 7 |
| **FR-13** | Observability | Web Vitals telemetry capture (LCP, FID, CLS, INP, TTFB) with percentile distributions (p50/p75/p90). | P2 | Phase 7 |
| **FR-14** | Experiments | Feature flag evaluation endpoint (`POST /api/v1/decide`) with user targeting and rollout percentages. | P2 | Phase 7 |
| **FR-15** | Dashboard | Custom dashboard builder with reorderable metric cards, chart types (line, bar, table, metric stat). | P1 | Phase 6 |

---

## 2. Non-Functional Requirements (NFRs)

### 2.1 Performance & Scalability
- **Ingestion Throughput**: Must sustain a minimum of 25,000 events/sec on an entry-level multi-core node without dropping payloads.
- **Analytical Query Latency**: Analytical queries over 10M events must return results in under 500ms; aggregations over 100M events must return in under 2,000ms.
- **Micro-Batch Sizing**: Worker flushes to ClickHouse strictly between 2,000 and 10,000 events or every 1,000ms, maintaining ClickHouse parts under 300 per partition.
- **SDK Footprint**: Web JavaScript bundle must not exceed 12KB (minified + gzipped) to avoid degrading host application Core Web Vitals.

### 2.2 Reliability & Fault Tolerance
- **Zero Ingestion Data Loss**: If ClickHouse is temporarily unavailable, the Redis stream buffer persists incoming events until ClickHouse recovers.
- **Client Offline Queuing**: SDKs must store events locally in IndexedDB (Web) or SQLite/file (Mobile/Desktop) when network is offline, retrying with exponential backoff and jitter.
- **Idempotent Inserts**: Events are deduplicated in ClickHouse via `ReplacingMergeTree` on `(project_id, event_name, toDate(timestamp), distinct_id, timestamp)`.

### 2.3 Security & Compliance
- **Zero Third-Party Leaks**: No outbound telemetry is sent to any external service outside the self-hosted cluster.
- **Data Anonymization**: IP addresses are optionally anonymized (last octet masked or hashed) prior to persistence.
- **PII Scrubbing**: SDK provides automated property sanitizers filtering out passwords, credit cards, bearer tokens, and configurable custom regex patterns.
- **Strict Tenant Isolation**: All analytical queries are parameterized and hard-scoped by `project_id`.

### 2.4 Usability & Accessibility
- **High Information Density**: Compact tables, monospace metrics, minimal decorative padding, dense visualization layouts.
- **Keyboard Navigation**: Global command palette (`Cmd+K` / `Ctrl+K`), shortcut keys for navigation (`g h` for home, `g e` for events, etc.).
- **WCAG 2.1 AA Compliance**: High-contrast dark and light modes with explicit focus indicators.
