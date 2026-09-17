# OpenPulse — Self-Hosting & Docker Guide

OpenPulse is designed for effortless, privacy-first self-hosting on a single VPS or dedicated server with a single Docker Compose invocation.

---

## 1. Hardware Sizing Recommendations

| Tier | Monthly Volume | Recommended Hardware | Storage Requirement |
| :--- | :--- | :--- | :--- |
| **Hobby / Startup** | $< 5\text{M}$ events | 2 vCPU, 4GB RAM | 40GB NVMe SSD |
| **Growth** | $5\text{M} - 50\text{M}$ events | 4 vCPU, 8GB RAM | 150GB NVMe SSD |
| **Enterprise Self-Host** | $50\text{M} - 500\text{M}$ events | 8-16 vCPU, 32GB RAM | 500GB+ NVMe SSD |

---

## 2. One-Command Deployment

### 2.1 Download Deployment Files
```bash
mkdir openpulse && cd openpulse
curl -sSL https://raw.githubusercontent.com/openpulse-io/openpulse/main/docker-compose.yml -o docker-compose.yml
curl -sSL https://raw.githubusercontent.com/openpulse-io/openpulse/main/.env.example -o .env
```

### 2.2 Configure `.env`
Edit `.env` to set secure passwords and domain names:
```ini
DOMAIN="analytics.yourdomain.com"
POSTGRES_PASSWORD="generate_a_secure_password_here"
NEXTAUTH_SECRET="generate_32_character_random_hex_secret"
```

### 2.3 Launch OpenPulse
```bash
docker compose up -d
```

OpenPulse will automatically initialize:
1. PostgreSQL schema and default organization tables.
2. ClickHouse database and partitioned analytical tables.
3. Redis stream queues and consumer groups.
4. Fastify Ingestion API and Next.js Web Dashboard.

Visit `https://analytics.yourdomain.com` (or `http://localhost:3000`) to create the initial admin account.

---

## 3. Production `docker-compose.yml` Reference

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: openpulse
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: openpulse
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - openpulse-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U openpulse"]
      interval: 5s
      timeout: 5s
      retries: 5

  clickhouse:
    image: clickhouse/clickhouse-server:24.3-alpine
    restart: unless-stopped
    volumes:
      - chdata:/var/lib/clickhouse
    networks:
      - openpulse-internal
    ulimits:
      nofile:
        soft: 262144
        hard: 262144
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8123/ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data
    networks:
      - openpulse-internal

  ingest:
    image: openpulse/ingest:latest
    restart: unless-stopped
    depends_on:
      redis:
        condition: service_started
    environment:
      REDIS_URL: redis://redis:6379
      PORT: 3001
    ports:
      - "3001:3001"
    networks:
      - openpulse-internal
      - openpulse-public

  worker:
    image: openpulse/worker:latest
    restart: unless-stopped
    depends_on:
      clickhouse:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      REDIS_URL: redis://redis:6379
      CLICKHOUSE_HOST: http://clickhouse:8123
      CLICKHOUSE_DATABASE: openpulse
    networks:
      - openpulse-internal

  web:
    image: openpulse/web:latest
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      clickhouse:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://openpulse:${POSTGRES_PASSWORD}@postgres:5432/openpulse
      CLICKHOUSE_HOST: http://clickhouse:8123
      REDIS_URL: redis://redis:6379
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: https://${DOMAIN}
    ports:
      - "3000:3000"
    networks:
      - openpulse-internal
      - openpulse-public

networks:
  openpulse-internal:
    internal: true
  openpulse-public:

volumes:
  pgdata:
  chdata:
  redisdata:
```

---

## 4. Backup & Restore Routine

### PostgreSQL Metadata Backup
```bash
docker compose exec -T postgres pg_dump -U openpulse openpulse > backup_postgres_$(date +%F).sql
```

### ClickHouse Freeze Snapshot
```bash
docker compose exec clickhouse clickhouse-client --query "ALTER TABLE openpulse.events FREEZE WITH NAME 'backup_$(date +%F)';"
```
The frozen data is stored in `/var/lib/clickhouse/shadow/` and can be rsynced to off-site object storage (S3/Wasabi/Backblaze B2).
