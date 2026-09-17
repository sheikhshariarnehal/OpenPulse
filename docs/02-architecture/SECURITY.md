# OpenPulse — Security Architecture & Threat Model

OpenPulse is designed with a defense-in-depth security posture, ensuring tenant data remains segregated, tamper-proof, and resilient against injection and exhaustion attacks.

---

## 1. Authentication & API Key Management

### 1.1 API Key Cryptography
- OpenPulse issues scoped API keys with a high-entropy prefix:
  - Production Keys: `op_live_<32_hex_chars>` (e.g. `op_live_8f7b2c9d1e4a506b7c8d9e0f1a2b3c4d`)
  - Test / Development Keys: `op_test_<32_hex_chars>`
- **Storage**: Plaintext keys are **never stored** in the database. OpenPulse computes a **SHA-256** hash of the key upon creation and stores only the `key_hash` and a 12-character display prefix (`key_prefix` like `op_live_8f7b...`).
- **Validation Fast-Path**:
  - Upon server boot and key creation, active key hashes are mirrored into an in-memory Redis Set (`openpulse:valid_keys`).
  - Ingestion requests validate the presented key via `SISMEMBER openpulse:valid_keys <hash>` in < 0.2ms.

### 1.2 User Authentication & Session Management
- **Password Hashing**: Passwords stored in PostgreSQL are hashed using **Argon2id** (memory cost: 64MB, iterations: 3, parallelism: 1).
- **Session Tokens**: Stateful sessions stored in Redis / PostgreSQL with secure, HTTP-only, SameSite=Lax, TLS-only cookies.
- **Role-Based Access Control (RBAC)**:
  - **Owner**: Full access, billing, organization deletion, member management.
  - **Admin**: Create/delete projects, manage API keys, modify feature flags.
  - **Member**: Create dashboards, run queries, configure alerts, invite viewers.
  - **Viewer**: Read-only access to dashboards, query explorer, and error logs.

---

## 2. Ingestion Defense & Rate Limiting

1. **Sliding Window Rate Limiting**:
   - Implemented at `apps/ingest` via Redis sliding window counters (`INCRBY` + `EXPIRE`).
   - Standard limit: 10,000 events/minute per project API key (customizable).
   - Excess traffic returns `429 Too Many Requests` with a `Retry-After` header.
2. **Payload Size Hard Limits**:
   - Single event payloads capped at **64 KB**.
   - Batch ingestion payloads capped at **5 MB**.
   - Content-length headers verified prior to body parsing to prevent denial-of-service memory spikes.
3. **Strict Parameterization (SQL Injection Defense)**:
   - All analytical queries sent from `apps/web` to ClickHouse use native parameter placeholders (`{project_id:UUID}`, `{date_from:DateTime}`).
   - Raw string interpolation into SQL queries is strictly prohibited and enforced via custom ESLint AST rules.

---

## 3. Network Isolation & Container Hardening

- In a standard Docker Compose self-hosted setup:
  - `postgres`, `clickhouse`, `redis`, and `apps/worker` run on an internal bridge network (`openpulse-internal`) with **no exposed public ports**.
  - Only `apps/web` (port 3000) and `apps/ingest` (port 3001) expose ports to the reverse proxy (Nginx / Caddy / Traefik).
- Containers run as non-root users (`UID 1001:GID 1001`) with read-only root filesystems where applicable.
