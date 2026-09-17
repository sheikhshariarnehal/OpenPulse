import { PrismaClient } from '@prisma/client';
import { clickhouse, initClickHouseSchema, pingClickHouse } from '../lib/clickhouse';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🚀 Initializing OpenPulse Production Dual DB...\n');

  // 1. Check & Initialize ClickHouse
  console.log('--- [1/2] ClickHouse Columnar Telemetry Store ---');
  const chConnected = await pingClickHouse();
  if (chConnected) {
    console.log('✅ ClickHouse server responded to ping at', process.env.CLICKHOUSE_HOST || 'http://localhost:8123');
    const chOk = await initClickHouseSchema();
    if (chOk) {
      console.log('✅ ClickHouse partitioned tables created (events, sessions).');
    }
  } else {
    console.log('⚠️  ClickHouse server not reachable at', process.env.CLICKHOUSE_HOST || 'http://localhost:8123');
    console.log('   Run `docker compose up -d` to launch local ClickHouse container.');
  }

  // 2. Check & Initialize PostgreSQL (Prisma)
  console.log('\n--- [2/2] PostgreSQL Relational Metadata Store ---');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected at', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

    // Reset tables for a clean initial mirror sync
    await prisma.$executeRawUnsafe('TRUNCATE TABLE workspace_members, telemetry_events, api_keys, app_projects, workspaces, users CASCADE;');

    // Read store.json to sync exact entities
    const storePath = path.join(process.cwd(), '.openpulse-data', 'store.json');
    if (fs.existsSync(storePath)) {
      const store = JSON.parse(fs.readFileSync(storePath, 'utf-8'));

      // Sync Users
      for (const u of store.users || []) {
        await prisma.user.upsert({
          where: { email: u.email },
          create: {
            id: u.id,
            name: u.name,
            email: u.email,
            passwordHash: u.passwordHash,
            createdAt: new Date(u.createdAt),
          },
          update: {
            name: u.name,
            passwordHash: u.passwordHash,
          }
        });
      }
      console.log(`✅ Synced ${(store.users || []).length} users to PostgreSQL.`);

      // Sync Workspaces
      for (const w of store.workspaces || []) {
        await prisma.workspace.upsert({
          where: { slug: w.slug },
          create: {
            id: w.id,
            name: w.name,
            slug: w.slug,
            tier: w.tier,
            ownerId: w.ownerId,
            createdAt: new Date(w.createdAt),
          },
          update: {
            name: w.name,
            tier: w.tier,
          }
        });

        // Add membership
        await prisma.workspaceMember.upsert({
          where: {
            workspaceId_userId: {
              workspaceId: w.id,
              userId: w.ownerId
            }
          },
          create: {
            workspaceId: w.id,
            userId: w.ownerId,
            role: 'owner'
          },
          update: {}
        });
      }
      console.log(`✅ Synced ${(store.workspaces || []).length} workspaces to PostgreSQL.`);

      // Sync Apps
      for (const a of store.apps || []) {
        await prisma.appProject.upsert({
          where: { apiKey: a.apiKey },
          create: {
            id: a.id,
            workspaceId: a.workspaceId,
            name: a.name,
            platform: a.platform,
            framework: a.framework,
            apiKey: a.apiKey,
            createdAt: new Date(a.createdAt),
          },
          update: {
            name: a.name,
            platform: a.platform,
            framework: a.framework,
          }
        });
      }
      console.log(`✅ Synced ${(store.apps || []).length} apps to PostgreSQL (including CloudStream Desktop).`);
    }

    console.log('\n🎉 PostgreSQL Database sync complete!');
  } catch (err: any) {
    console.log('⚠️  PostgreSQL connection failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n======================================================');
  console.log('✨ OpenPulse Dual DB setup routine finished.');
  console.log('======================================================\n');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
