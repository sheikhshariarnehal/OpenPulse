import { createClient, ClickHouseClient } from '@clickhouse/client';

const globalForClickHouse = globalThis as unknown as {
  clickhouse: ClickHouseClient | undefined;
};

const host = process.env.CLICKHOUSE_HOST || 'http://localhost:8123';
const database = process.env.CLICKHOUSE_DATABASE || 'openpulse';
const username = process.env.CLICKHOUSE_USER || 'default';
const password = process.env.CLICKHOUSE_PASSWORD || '';

export const clickhouse =
  globalForClickHouse.clickhouse ??
  createClient({
    url: host,
    database: database,
    username: username,
    password: password,
    request_timeout: 10000,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForClickHouse.clickhouse = clickhouse;
}

/**
 * Initializes ClickHouse database and columnar analytics tables matching DATABASE.md
 */
export async function initClickHouseSchema(): Promise<boolean> {
  try {
    // 1. Create database
    await clickhouse.command({
      query: `CREATE DATABASE IF NOT EXISTS ${database};`,
    });

    // 2. Create raw events table with ReplacingMergeTree
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${database}.events (
          id String,
          workspace_id String,
          app_id String,
          event LowCardinality(String),
          distinct_id String,
          properties String,
          timestamp DateTime64(3, 'UTC'),
          latency_ms Float32,
          status UInt16,
          shard LowCardinality(String),
          client_ip String,
          user_agent String,
          created_at DateTime64(3, 'UTC') DEFAULT now64(3)
        ) ENGINE = ReplacingMergeTree()
        PARTITION BY toYYYYMM(timestamp)
        ORDER BY (workspace_id, app_id, event, toDate(timestamp), distinct_id, timestamp);
      `,
    });

    // 3. Create sessions summary table
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${database}.sessions (
          session_id String,
          workspace_id String,
          app_id String,
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
        ORDER BY (workspace_id, app_id, toDate(start_time), distinct_id, session_id);
      `,
    });

    return true;
  } catch (err) {
    console.warn('[ClickHouse] Schema initialization skipped (server offline or starting up):', (err as any).message);
    return false;
  }
}

/**
 * Test connectivity to ClickHouse
 */
export async function pingClickHouse(): Promise<boolean> {
  try {
    const res = await clickhouse.ping();
    return res.success;
  } catch {
    return false;
  }
}
