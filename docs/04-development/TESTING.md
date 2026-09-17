# OpenPulse — Testing & Quality Assurance Strategy

This document outlines the testing pyramid, automated test suites, and load benchmarks enforced across the OpenPulse platform.

---

## 1. Testing Pyramid Overview

```
                      / \
                     / E2E \       Playwright: Full Dashboard User Journeys
                    /───────\
                   /  Integ  \     Testcontainers: Postgres, ClickHouse, Redis
                  /───────────\
                 /    Unit     \   Vitest: SDK Queue, Batching, Zod Schema Parsing
                /───────────────\
               /  Load & Chaos   \ k6: 25,000+ req/s Ingestion & Backpressure
```

---

## 2. Unit Testing Strategy (Vitest)

- **Execution**: Fast, in-memory execution running on every local commit and PR.
- **Coverage Targets**:
  - `@openpulse/sdk-core`: **> 95%** coverage (queue behavior, flush timers, offline storage failover, exponential retry jitter).
  - `@openpulse/shared`: **100%** coverage (Universal Event Schema validation, PII masking rules).
  - `@openpulse/clickhouse`: **> 90%** coverage (SQL parameterization builders, query generation).

### Example: SDK Batch & Flush Test
```typescript
test("SDK flushes when max_batch_size is reached", async () => {
  const transport = vi.fn().mockResolvedValue({ status: 202 });
  const client = new OpenPulseClient({
    apiKey: "op_test_123",
    maxBatchSize: 3,
    flushIntervalMs: 10000,
    transport
  });

  client.track("event_1");
  client.track("event_2");
  expect(transport).not.toHaveBeenCalled();

  client.track("event_3");
  expect(transport).toHaveBeenCalledTimes(1);
  expect(transport.mock.calls[0][0].batch).toHaveLength(3);
});
```

---

## 3. Integration Testing Strategy (Testcontainers)

Integration tests spin up lightweight ephemeral Docker containers for PostgreSQL, ClickHouse, and Redis to test true end-to-end storage contracts.

- **Postgres Migrations**: Verify Prisma migration steps apply cleanly and constraints (`UNIQUE`, foreign keys, cascade deletes) function as expected.
- **Redis Streams**: Verify `apps/ingest` writes events via `XADD` and `apps/worker` reads them reliably with consumer groups without message loss.
- **ClickHouse Analytical Queries**: Verify that `windowFunnel()` and `retention()` queries compute accurate numbers against seeded test events.

---

## 4. Ingestion Load & Benchmark Testing (k6)

To validate the high-throughput guarantee, automated load testing with **k6** is executed against the ingestion endpoint (`POST /api/v1/batch`):

```javascript
import http from "k6/http";
import { check } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 5000 },
    { duration: "1m", target: 25000 }, // Ramp to 25k req/s
    { duration: "30s", target: 0 }
  ]
};

export default function () {
  const payload = JSON.stringify({
    sent_at: new Date().toISOString(),
    batch: Array.from({ length: 10 }, (_, i) => ({
      event_id: `evt_${__VU}_${__ITER}_${i}`,
      event: "$pageview",
      distinct_id: `usr_${__VU}`,
      session_id: `sess_${__VU}`,
      timestamp: new Date().toISOString(),
      properties: { $current_url: "https://test.com/home" }
    }))
  });

  const res = http.post("http://localhost:3001/api/v1/batch", payload, {
    headers: {
      "Content-Type": "application/json",
      "X-OpenPulse-API-Key": "op_test_key_benchmark"
    }
  });

  check(res, {
    "status is 202": (r) => r.status === 202,
    "response time < 25ms": (r) => r.timings.duration < 25
  });
}
```

---

## 5. End-to-End Testing (Playwright)

Playwright validates critical dashboard UI workflows:
1. **User Onboarding Flow**: Sign up $\rightarrow$ create organization $\rightarrow$ create project $\rightarrow$ obtain API key.
2. **Real-time Live Ingestion**: Open `/projects/:id/realtime` $\rightarrow$ dispatch test event $\rightarrow$ assert new table row appears within 1,000ms.
3. **Funnel Builder**: Add 3 funnel steps $\rightarrow$ assert funnel visualization renders with expected percentage drop-offs.
