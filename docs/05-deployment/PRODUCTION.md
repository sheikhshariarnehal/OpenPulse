# OpenPulse — Production Deployment & Clustering Architecture

This document details the production deployment, clustering, high availability (HA), and horizontal scaling patterns for enterprise OpenPulse installations.

---

## 1. Production Topology Overview

```
                          [ Cloudflare / Route 53 ]
                                     │
                                     ▼
                   [ Load Balancer / Ingress Controller ]
                   (TLS Termination, Anycast Routing)
                                     │
        ┌────────────────────────────┴────────────────────────────┐
        ▼                                                         ▼
┌─────────────────────────┐                             ┌─────────────────────────┐
│ apps/ingest (Pod 1..N)  │                             │ apps/web (Pod 1..M)     │
│ (Stateless Autoscaling) │                             │ (Next.js Dashboard)     │
└───────────┬─────────────┘                             └───────────┬─────────────┘
            │                                                       │
            ▼                                                       ▼
┌─────────────────────────┐                             ┌─────────────────────────┐
│ Redis Cluster (HA)      │                             │ PostgreSQL Primary +    │
│ (Streams Ingestion)     │                             │ Read Replicas (PgBouncer)│
└───────────┬─────────────┘                             └─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│ apps/worker (Pool)      │
└───────────┬─────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ ClickHouse Cluster (ClickHouse Keeper)                 │
│ Shards: 2+ | Replicas: 2 | ReplicatedReplacingMergeTree │
└────────────────────────────────────────────────────────┘
```

---

## 2. ClickHouse Production Clustering & Replication

For enterprise telemetry scale ($> 100\text{M}$ events/month), ClickHouse runs in a replicated, sharded topology:

### 2.1 ClickHouse Keeper
Replace Apache ZooKeeper with native **ClickHouse Keeper** (embedded in the ClickHouse binary) for coordinated partition leader election and replication logs.

### 2.2 Table Definition using `ReplicatedReplacingMergeTree`
```sql
CREATE TABLE openpulse.events_local ON CLUSTER openpulse_cluster (
    event_id UUID,
    project_id UUID,
    event_name LowCardinality(String),
    distinct_id String,
    session_id String,
    timestamp DateTime64(3, 'UTC'),
    properties String,
    ip_anonymized IPv4,
    user_agent String,
    os LowCardinality(String),
    browser LowCardinality(String),
    device_type LowCardinality(String),
    country LowCardinality(FixedString(2)),
    city LowCardinality(String),
    created_at DateTime64(3, 'UTC') DEFAULT now64(3)
) ENGINE = ReplicatedReplacingMergeTree('/clickhouse/tables/{shard}/events', '{replica}')
PARTITION BY toYYYYMM(timestamp)
ORDER BY (project_id, event_name, toDate(timestamp), distinct_id, timestamp);

-- Distributed view for routing queries across all shards
CREATE TABLE openpulse.events ON CLUSTER openpulse_cluster AS openpulse.events_local
ENGINE = Distributed(openpulse_cluster, openpulse, events_local, rand());
```

---

## 3. High-Availability PostgreSQL Configuration

- **Connection Pooling**: Deploy **PgBouncer** in front of PostgreSQL to handle thousands of concurrent serverless and Next.js connections without exhausting database socket limits.
- **Backups**: Continuous Write-Ahead Log (WAL) archiving via **WAL-G** or **pgBackRest** to S3/GCS with automated daily snapshots.

---

## 4. Monitoring & Observability

- **Metrics Collection**: All OpenPulse services expose a `/metrics` Prometheus endpoint:
  - Ingestion rate (`openpulse_ingest_events_total`)
  - Queue latency (`openpulse_redis_stream_lag_seconds`)
  - ClickHouse flush duration (`openpulse_clickhouse_insert_duration_ms`)
  - Dashboard query execution time (`openpulse_query_duration_seconds`)
- **Pre-configured Grafana Dashboards**: Included in `docker/grafana` for instant cluster visibility.
