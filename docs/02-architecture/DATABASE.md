# OpenPulse — Database Design & Schema Specifications

OpenPulse utilizes a dual-database design:
- **PostgreSQL 16**: Relational data, access control, user accounts, projects, and configurations.
- **ClickHouse 24.3**: Columnar time-series store for immutable telemetry data.

---

## 1. PostgreSQL Schema (Relational Metadata)

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('superadmin', 'user');
CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE key_scope AS ENUM ('write:events', 'read:analytics', 'admin');

-- 1. Workspaces (Multi-Workspace Architecture)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    system_role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Workspace Memberships & Multi-Workspace Association
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role workspace_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);

-- 4. Projects (Scoped to Workspace)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    retention_days INTEGER NOT NULL DEFAULT 90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, slug)
);
CREATE INDEX idx_projects_workspace ON projects(workspace_id);

-- 5. API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(16) NOT NULL, -- e.g. "op_live_ab12"
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of entire key
    scopes TEXT[] NOT NULL DEFAULT ARRAY['write:events'],
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_project ON api_keys(project_id);

-- 6. Feature Flags
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    rollout_percentage SMALLINT NOT NULL DEFAULT 100,
    variants JSONB NOT NULL DEFAULT '[]'::jsonb,
    targeting_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, key)
);
CREATE INDEX idx_feature_flags_project ON feature_flags(project_id);

-- 7. Experiments
CREATE TABLE experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    metric_event VARCHAR(100) NOT NULL,
    secondary_metrics TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(32) NOT NULL DEFAULT 'draft', -- draft, running, stopped
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Custom Dashboards
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    layout JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Dashboard Cards / Widgets
CREATE TABLE dashboard_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    chart_type VARCHAR(50) NOT NULL, -- line, bar, stat, table, funnel, retention
    query_config JSONB NOT NULL,
    grid_position JSONB NOT NULL, -- { x: 0, y: 0, w: 6, h: 4 }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    event_name VARCHAR(100),
    condition_type VARCHAR(50) NOT NULL, -- threshold_above, threshold_below, anomaly
    threshold DOUBLE PRECISION NOT NULL,
    window_minutes INTEGER NOT NULL DEFAULT 60,
    notification_channels JSONB NOT NULL DEFAULT '[]'::jsonb, -- slack, discord, webhook
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 2. ClickHouse Schema (High-Velocity Telemetry)

### 2.1 Database Initialization
```sql
CREATE DATABASE IF NOT EXISTS openpulse;
```

### 2.2 Table: `events`
Stores every discrete telemetry event.
```sql
CREATE TABLE IF NOT EXISTS openpulse.events (
    event_id UUID,
    project_id UUID,
    event_name LowCardinality(String),
    distinct_id String,
    session_id String,
    timestamp DateTime64(3, 'UTC'),
    properties String, -- JSON string parsed with ClickHouse JSONExtract functions
    ip_anonymized IPv4,
    user_agent String,
    os LowCardinality(String),
    browser LowCardinality(String),
    device_type LowCardinality(String),
    country LowCardinality(FixedString(2)),
    city LowCardinality(String),
    created_at DateTime64(3, 'UTC') DEFAULT now64(3)
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (project_id, event_name, toDate(timestamp), distinct_id, timestamp);
```

### 2.3 Table: `sessions`
Materialized summary of user sessions for rapid query response.
```sql
CREATE TABLE IF NOT EXISTS openpulse.sessions (
    session_id String,
    project_id UUID,
    distinct_id String,
    start_time DateTime64(3, 'UTC'),
    end_time DateTime64(3, 'UTC'),
    duration_ms UInt64,
    event_count UInt32,
    initial_referrer String,
    entry_page String,
    exit_page String
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(start_time)
ORDER BY (project_id, toDate(start_time), distinct_id, session_id);
```

### 2.4 Table: `error_occurrences`
Captures individual application exceptions and stack traces.
```sql
CREATE TABLE IF NOT EXISTS openpulse.error_occurrences (
    occurrence_id UUID,
    project_id UUID,
    fingerprint String, -- SHA-256 hash of (error_type + location)
    error_type String,
    error_message String,
    stacktrace String,
    timestamp DateTime64(3, 'UTC'),
    distinct_id String,
    session_id String,
    release String,
    environment LowCardinality(String),
    context String
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (project_id, fingerprint, toDate(timestamp), occurrence_id);
```

### 2.5 Table: `web_vitals`
Dedicated table for Core Web Vitals telemetry.
```sql
CREATE TABLE IF NOT EXISTS openpulse.web_vitals (
    vital_id UUID,
    project_id UUID,
    timestamp DateTime64(3, 'UTC'),
    distinct_id String,
    session_id String,
    metric_name LowCardinality(String), -- LCP, FID, CLS, FCP, TTFB, INP
    metric_value Float32,
    rating LowCardinality(String),       -- good, needs-improvement, poor
    page_url String
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (project_id, metric_name, toDate(timestamp), distinct_id);
```

---

## 3. High-Performance Analytical ClickHouse Queries

### 3.1 Funnel Analysis via `windowFunnel()`
ClickHouse computes conversion across multi-step funnels in a single pass:
```sql
SELECT
    level,
    count() AS count
FROM (
    SELECT
        distinct_id,
        windowFunnel(86400)(
            timestamp,
            event_name = '$pageview' AND JSONExtractString(properties, '$current_url') LIKE '%/pricing%',
            event_name = 'signup_started',
            event_name = 'organization_created',
            event_name = 'payment_completed'
        ) AS level
    FROM openpulse.events
    WHERE project_id = {project_id:UUID}
      AND timestamp >= now() - INTERVAL 7 DAY
    GROUP BY distinct_id
)
GROUP BY level
ORDER BY level ASC;
```

### 3.2 Cohort Retention via `retention()`
Calculates weekly retention cohorts efficiently:
```sql
SELECT
    retention(
        toStartOfWeek(timestamp) = toStartOfWeek(now() - INTERVAL 4 WEEK),
        toStartOfWeek(timestamp) = toStartOfWeek(now() - INTERVAL 3 WEEK),
        toStartOfWeek(timestamp) = toStartOfWeek(now() - INTERVAL 2 WEEK),
        toStartOfWeek(timestamp) = toStartOfWeek(now() - INTERVAL 1 WEEK),
        toStartOfWeek(timestamp) = toStartOfWeek(now())
    ) AS retention_vector
FROM openpulse.events
WHERE project_id = {project_id:UUID}
GROUP BY distinct_id;
```
