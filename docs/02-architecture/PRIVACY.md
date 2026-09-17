# OpenPulse — Privacy Architecture & Regulatory Compliance

OpenPulse is built from the ground up as a **privacy-first telemetry engine**. By maintaining full data ownership on self-hosted infrastructure, organizations eliminate cross-border data transfer risks and third-party data broker harvesting.

---

## 1. IP Address Anonymization & Geo-Resolution

- **Client IP Handling Modes**:
  1. **Full Anonymization (Default)**: The last octet of IPv4 addresses is masked (`192.168.1.100` $\rightarrow$ `192.168.1.0`), and the last 80 bits of IPv6 addresses are zeroed before geo-lookup and persistence.
  2. **Zero-Storage Mode**: The IP address is read in memory solely to resolve country and city via a local MaxMind GeoLite2 database; the IP itself is discarded and never written to ClickHouse.
  3. **Strict Compliance Hash**: An irreversible HMAC-SHA256 hash using a project-specific rotating salt is computed for fraud detection, preventing raw IP reconstruction.

---

## 2. PII Scrubbing & Sanitization

OpenPulse enforces PII protection at both the client SDK and ingestion server tiers:

### 2.1 Client-Side Sanitization Rules
The `@openpulse/sdk-core` inspects property keys and text contents prior to network dispatch:
- **Key Blacklist**: Any property key matching sensitive patterns is automatically redacted:
  - `/password/i`, `/token/i`, `/auth/i`, `/secret/i`, `/credit[-_]?card/i`, `/cvv/i`, `/ssn/i`.
- **Value Scrubbers**:
  - Credit card numbers matching Luhn algorithm regexes are replaced with `[REDACTED_CARD]`.
  - Email addresses in freeform string fields can be obfuscated via `mask_emails: true` config.

### 2.2 Server-Side Ingestion Gatekeeper
Even if a misconfigured client transmits sensitive data, `apps/ingest` runs an AST-based JSON property filter that drops prohibited fields before placing records on the Redis stream.

---

## 3. GDPR & CCPA Compliance Architecture

### 3.1 Right to be Forgotten (Data Deletion)
In ClickHouse, raw row deletion (`ALTER TABLE ... DELETE`) triggers heavy background table mutations. OpenPulse handles deletion requests via a managed asynchronous workflow:
1. **Deletion Request Received**: Admin triggers `DELETE /api/v1/projects/:id/users/:distinct_id`.
2. **Postgres Deletion Queue**: The `distinct_id` is entered into `gdpr_deletion_requests` in PostgreSQL.
3. **Off-Peak Batch Mutation**: During designated maintenance windows (e.g. 02:00 UTC), a scheduled worker executes a consolidated ClickHouse mutation:
   ```sql
   ALTER TABLE openpulse.events
   DELETE WHERE project_id = '...' AND distinct_id IN ('user_1', 'user_2');
   ```
4. **Immediate Query Masking**: In the interim, an in-memory Bloom filter or subquery masks deleted IDs from dashboard queries so they disappear immediately from reports.

### 3.2 Right to Access & Data Portability
- Users can request a complete JSON export of all telemetry associated with their `distinct_id`.
- OpenPulse provides a streaming export endpoint (`GET /api/v1/projects/:id/users/:distinct_id/export`) that extracts all events, sessions, and errors in NDJSON format.

### 3.3 Data Retention Policies
- Every project defines a `retention_days` setting in PostgreSQL (e.g., 30 days, 90 days, 365 days).
- ClickHouse partition TTLs automatically drop historical partitions without CPU-intensive delete operations:
  ```sql
  ALTER TABLE openpulse.events MODIFY TTL toDate(timestamp) + INTERVAL 90 DAY;
  ```
