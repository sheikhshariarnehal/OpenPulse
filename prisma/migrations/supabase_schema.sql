-- ============================================================================
-- OpenPulse — Supabase Cloud PostgreSQL Migration Script
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- 1. Enable pgcrypto extension for secure key hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "system_role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 3. Create workspaces table
CREATE TABLE IF NOT EXISTS "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'Enterprise Dedicated',
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- 4. Create workspace_members table
CREATE TABLE IF NOT EXISTS "workspace_members" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- 5. Create app_projects table
CREATE TABLE IF NOT EXISTS "app_projects" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_projects_pkey" PRIMARY KEY ("id")
);

-- 6. Create api_keys table
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT 'write:events',
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- 7. Create telemetry_events table
CREATE TABLE IF NOT EXISTS "telemetry_events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "distinct_id" TEXT NOT NULL,
    "properties" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latency_ms" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 200,
    "shard" TEXT NOT NULL DEFAULT 'ch-ingest-01',
    "client_ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_events_pkey" PRIMARY KEY ("id")
);

-- Indexes & Constraints
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_slug_key" ON "workspaces"("slug");
CREATE INDEX IF NOT EXISTS "workspace_members_user_id_idx" ON "workspace_members"("user_id");
CREATE INDEX IF NOT EXISTS "workspace_members_workspace_id_idx" ON "workspace_members"("workspace_id");
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_members_workspace_id_user_id_key" ON "workspace_members"("workspace_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "app_projects_api_key_key" ON "app_projects"("api_key");
CREATE INDEX IF NOT EXISTS "app_projects_workspace_id_idx" ON "app_projects"("workspace_id");
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_hash_key" ON "api_keys"("key_hash");
CREATE INDEX IF NOT EXISTS "api_keys_app_id_idx" ON "api_keys"("app_id");
CREATE INDEX IF NOT EXISTS "telemetry_events_workspace_id_timestamp_idx" ON "telemetry_events"("workspace_id", "timestamp");
CREATE INDEX IF NOT EXISTS "telemetry_events_app_id_timestamp_idx" ON "telemetry_events"("app_id", "timestamp");
CREATE INDEX IF NOT EXISTS "telemetry_events_distinct_id_idx" ON "telemetry_events"("distinct_id");

-- Foreign Keys
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspaces_owner_id_fkey') THEN
        ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_members_workspace_id_fkey') THEN
        ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_members_user_id_fkey') THEN
        ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_projects_workspace_id_fkey') THEN
        ALTER TABLE "app_projects" ADD CONSTRAINT "app_projects_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'api_keys_app_id_fkey') THEN
        ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "app_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'telemetry_events_workspace_id_fkey') THEN
        ALTER TABLE "telemetry_events" ADD CONSTRAINT "telemetry_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'telemetry_events_app_id_fkey') THEN
        ALTER TABLE "telemetry_events" ADD CONSTRAINT "telemetry_events_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "app_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 8. Seed Initial Default User, Workspace, and CloudStream Desktop App
INSERT INTO "users" ("id", "email", "password_hash", "name", "system_role")
VALUES (
    'usr_5c8976d4',
    'nehal@openpulse.io',
    '023c32644a95689ebdc42f33adc2862ab8b8edefcd2ed158111638100b2754b0',
    'Sheikh Nehal',
    'admin'
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "workspaces" ("id", "name", "slug", "tier", "owner_id")
VALUES (
    'ws_8e4533db',
    'Acme Corp',
    'acme-corp',
    'Enterprise Dedicated',
    'usr_5c8976d4'
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "workspace_members" ("id", "workspace_id", "user_id", "role")
VALUES (
    'mem_8e4533db_usr',
    'ws_8e4533db',
    'usr_5c8976d4',
    'owner'
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "app_projects" ("id", "workspace_id", "name", "platform", "framework", "api_key")
VALUES (
    'app_75d40322',
    'ws_8e4533db',
    'CloudStream Desktop',
    'desktop',
    'tauri',
    'op_live_fdab52be3ff66b43a7207bd0cd4d620f'
) ON CONFLICT ("id") DO NOTHING;
