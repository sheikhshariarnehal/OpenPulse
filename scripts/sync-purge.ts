import { clickhouse } from '../lib/clickhouse';
import { prisma } from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
  const file = path.join(process.cwd(), '.openpulse-data', 'store.json');
  const d = JSON.parse(fs.readFileSync(file, 'utf-8'));

  console.log(`Synchronizing ${d.events.length} real events into ClickHouse & PostgreSQL...`);

  // 1. Purge non-CloudStream rows from ClickHouse
  try {
    await clickhouse.command({
      query: `ALTER TABLE openpulse.events DELETE WHERE app_id != 'app_75d40322';`,
    });
  } catch (err) {
    console.warn('ClickHouse purge note:', err);
  }

  // 2. Purge non-CloudStream rows from PostgreSQL
  try {
    await prisma.telemetryEventMirror.deleteMany({
      where: { appId: { not: 'app_75d40322' } },
    });
  } catch (err) {
    console.warn('Postgres purge note:', err);
  }

  // 3. Upsert real events
  for (const e of d.events) {
    try {
      await clickhouse.insert({
        table: 'events',
        values: [
          {
            id: e.id,
            workspace_id: e.workspaceId,
            app_id: e.appId,
            event: e.event,
            distinct_id: e.distinctId,
            properties: JSON.stringify(e.properties || {}),
            timestamp: new Date(e.timestamp).toISOString().replace('T', ' ').replace('Z', ''),
            latency_ms: e.latencyMs,
            status: e.status,
            shard: e.shard,
            client_ip: e.clientIp || '',
            user_agent: e.userAgent || '',
          },
        ],
        format: 'JSONEachRow',
      });
    } catch (err) {
      console.warn('ClickHouse insert error:', err);
    }

    try {
      await prisma.telemetryEventMirror.upsert({
        where: { id: e.id },
        update: {},
        create: {
          id: e.id,
          workspaceId: e.workspaceId,
          appId: e.appId,
          event: e.event,
          distinctId: e.distinctId,
          properties: JSON.stringify(e.properties || {}),
          timestamp: new Date(e.timestamp),
          latencyMs: e.latencyMs,
          status: e.status,
          shard: e.shard,
          clientIp: e.clientIp || '',
          userAgent: e.userAgent || '',
        },
      });
    } catch (err) {
      console.warn('Postgres insert error:', err);
    }
  }

  const chRes = await clickhouse.query({
    query: `SELECT count() as c FROM openpulse.events WHERE app_id = 'app_75d40322'`,
    format: 'JSONEachRow',
  });
  const chCount = (await chRes.json()) as any[];
  const pgCount = await prisma.telemetryEventMirror.count();

  console.log('Sync complete!');
  console.log(`ClickHouse Real CloudStream Events:`, chCount[0]?.c);
  console.log(`PostgreSQL Mirror Events:`, pgCount);
}

main().catch(console.error).finally(() => process.exit(0));
