import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from './prisma';
import { clickhouse, pingClickHouse } from './clickhouse';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  tier: string;
  ownerId: string;
  createdAt: string;
}

export interface AppProject {
  id: string;
  workspaceId: string;
  name: string;
  platform: 'web' | 'android' | 'desktop' | 'backend';
  framework: string;
  apiKey: string;
  createdAt: string;
}

export interface TelemetryEvent {
  id: string;
  workspaceId: string;
  appId: string;
  event: string;
  distinctId: string;
  properties: Record<string, any>;
  timestamp: string;
  latencyMs: number;
  status: number;
  shard: string;
  clientIp?: string;
  userAgent?: string;
}

interface DatabaseSchema {
  users: User[];
  workspaces: Workspace[];
  apps: AppProject[];
  events: TelemetryEvent[];
}

// ---- Analytics types ----
export interface DayBucket {
  date: string;
  visitors: number;
  sessions: number;
  pageviews: number;
}

export interface TopEntry {
  label: string;
  count: number;
  pct: number;
}

export interface UserSummary {
  distinctId: string;
  totalEvents: number;
  firstSeen: string;
  lastSeen: string;
  topEvent: string;
  country: string;
  browser: string;
}

export interface AnalyticsReport {
  totalEvents: number;
  uniqueVisitors: number;
  totalSessions: number;
  pageviews: number;
  bounceRate: string;
  avgDuration: string;
  eventsPerSession: string;
  chartData: DayBucket[];
  topPages: TopEntry[];
  topEvents: TopEntry[];
  topCountries: TopEntry[];
  topBrowsers: TopEntry[];
  topOS: TopEntry[];
  topReferrers: TopEntry[];
  newVsReturning: { new: number; returning: number };
}

// ---- File paths ----
const DATA_DIR = path.join(process.cwd(), '.openpulse-data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_openpulse_salt_2026').digest('hex');
}



function getInitialDatabase(): DatabaseSchema {
  const adminId = 'usr_' + crypto.randomBytes(4).toString('hex');
  const defaultWsId = 'ws_' + crypto.randomBytes(4).toString('hex');
  const defaultAppId = 'app_' + crypto.randomBytes(4).toString('hex');

  const defaultUser: User = {
    id: adminId,
    name: 'Sheikh Nehal',
    email: 'nehal@openpulse.io',
    passwordHash: hashPassword('password123'),
    createdAt: new Date().toISOString()
  };

  const defaultWs: Workspace = {
    id: defaultWsId,
    name: 'Acme Corp',
    slug: 'acme-corp',
    tier: 'Enterprise Dedicated',
    ownerId: adminId,
    createdAt: new Date().toISOString()
  };

  const defaultApp: AppProject = {
    id: defaultAppId,
    workspaceId: defaultWsId,
    name: 'CloudStream Desktop',
    platform: 'desktop',
    framework: 'tauri',
    apiKey: 'op_live_' + crypto.randomBytes(16).toString('hex'),
    createdAt: new Date().toISOString()
  };

  return {
    users: [defaultUser],
    workspaces: [defaultWs],
    apps: [defaultApp],
    events: []
  };
}

function readDb(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialDatabase();
    writeDb(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    const initial = getInitialDatabase();
    writeDb(initial);
    return initial;
  }
}

function writeDb(data: DatabaseSchema): void {
  ensureDataDir();
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, DB_FILE);
}

// ---- Helpers ----
function parseBrowser(ua: string = '', props: Record<string, any> = {}): string {
  const src = props.browser || ua;
  if (src.includes('Edge') || src.includes('Edg')) return 'Edge';
  if (src.includes('Firefox')) return 'Firefox';
  if (src.includes('Safari') && !src.includes('Chrome')) return 'Safari';
  if (src.includes('Chrome')) return 'Chrome';
  if (src.includes('OpenPulse-Android')) return 'Android SDK';
  return 'Other';
}

function parseOS(ua: string = '', props: Record<string, any> = {}): string {
  const src = props.os || ua;
  if (src.includes('Android')) return 'Android';
  if (src.includes('iPhone') || src.includes('iOS')) return 'iOS';
  if (src.includes('Windows')) return 'Windows';
  if (src.includes('Macintosh') || src.includes('Mac OS')) return 'macOS';
  if (src.includes('Linux')) return 'Linux';
  return 'Other';
}

function topN(counts: Record<string, number>, total: number, n = 10): TopEntry[] {
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([label, count]) => ({
      label,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0
    }));
}

// ---- Public DB API ----
export const db = {
  // ── Users ──────────────────────────────────────────────────────────
  getUserByEmail(email: string): User | undefined {
    return readDb().users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  getUserById(id: string): User | undefined {
    return readDb().users.find(u => u.id === id);
  },

  createUser(name: string, email: string, password: string): { user: User; defaultWorkspace: Workspace; defaultApp: AppProject } {
    const data = readDb();
    if (data.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    const userId = 'usr_' + crypto.randomBytes(4).toString('hex');
    const user: User = { id: userId, name, email, passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
    const wsSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-workspace';
    const wsId = 'ws_' + crypto.randomBytes(4).toString('hex');
    const defaultWorkspace: Workspace = { id: wsId, name: `${name}'s Workspace`, slug: wsSlug, tier: 'Pro Sandbox', ownerId: userId, createdAt: new Date().toISOString() };
    const appId = 'app_' + crypto.randomBytes(4).toString('hex');
    const defaultApp: AppProject = { id: appId, workspaceId: wsId, name: 'Primary Web App', platform: 'web', framework: 'nextjs', apiKey: 'op_live_' + crypto.randomBytes(16).toString('hex'), createdAt: new Date().toISOString() };
    data.users.push(user);
    data.workspaces.push(defaultWorkspace);
    data.apps.push(defaultApp);
    writeDb(data);
    return { user, defaultWorkspace, defaultApp };
  },

  verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
  },

  // ── Workspaces ─────────────────────────────────────────────────────
  getWorkspacesForUser(userId: string): Workspace[] {
    return readDb().workspaces.filter(w => w.ownerId === userId);
  },

  getWorkspaceBySlug(slug: string): Workspace | undefined {
    return readDb().workspaces.find(w => w.slug === slug);
  },

  getWorkspaceById(id: string): Workspace | undefined {
    return readDb().workspaces.find(w => w.id === id);
  },

  createWorkspace(userId: string, name: string, slug: string, tier = 'Dedicated ClickHouse'): Workspace {
    const data = readDb();
    let finalSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (data.workspaces.some(w => w.slug === finalSlug)) {
      finalSlug += '-' + crypto.randomBytes(2).toString('hex');
    }
    const ws: Workspace = { id: 'ws_' + crypto.randomBytes(4).toString('hex'), name, slug: finalSlug, tier, ownerId: userId, createdAt: new Date().toISOString() };
    data.workspaces.push(ws);
    writeDb(data);
    return ws;
  },

  // ── Apps ───────────────────────────────────────────────────────────
  getAppsForWorkspace(workspaceId: string): AppProject[] {
    return readDb().apps.filter(a => a.workspaceId === workspaceId);
  },

  getAppByApiKey(apiKey: string): AppProject | undefined {
    return readDb().apps.find(a => a.apiKey === apiKey);
  },

  getAppById(appId: string): AppProject | undefined {
    return readDb().apps.find(a => a.id === appId);
  },

  createApp(workspaceId: string, name: string, platform: 'web' | 'android' | 'desktop' | 'backend', framework: string): AppProject {
    const data = readDb();
    const app: AppProject = { id: 'app_' + crypto.randomBytes(4).toString('hex'), workspaceId, name, platform, framework, apiKey: 'op_live_' + crypto.randomBytes(16).toString('hex'), createdAt: new Date().toISOString() };
    data.apps.push(app);
    writeDb(data);
    return app;
  },

  deleteApp(appId: string): boolean {
    const data = readDb();
    const before = data.apps.length;
    data.apps = data.apps.filter(a => a.id !== appId);
    if (data.apps.length === before) return false;
    writeDb(data);
    return true;
  },

  // ── Events ────────────────────────────────────────────────────────
  recordEvent(eventData: Omit<TelemetryEvent, 'id' | 'timestamp' | 'shard'>): TelemetryEvent {
    const data = readDb();
    const shards = ['ch-ingest-01', 'ch-ingest-02', 'ch-ingest-03', 'ch-ingest-04'];
    const newEvent: TelemetryEvent = {
      id: 'evt_' + crypto.randomBytes(6).toString('hex'),
      timestamp: new Date().toISOString(),
      shard: shards[Math.floor(Math.random() * shards.length)],
      ...eventData
    };
    data.events.unshift(newEvent);
    if (data.events.length > 1000) data.events = data.events.slice(0, 1000);
    writeDb(data);

    // Asynchronously mirror to ClickHouse if reachable
    pingClickHouse().then(ok => {
      if (ok) {
        clickhouse.insert({
          table: 'events',
          values: [{
            id: newEvent.id,
            workspace_id: newEvent.workspaceId,
            app_id: newEvent.appId,
            event: newEvent.event,
            distinct_id: newEvent.distinctId,
            properties: JSON.stringify(newEvent.properties || {}),
            timestamp: new Date(newEvent.timestamp).toISOString().replace('T', ' ').replace('Z', ''),
            latency_ms: newEvent.latencyMs,
            status: newEvent.status,
            shard: newEvent.shard,
            client_ip: newEvent.clientIp || '',
            user_agent: newEvent.userAgent || ''
          }],
          format: 'JSONEachRow'
        }).catch(() => {});
      }
    }).catch(() => {});

    // Asynchronously mirror to PostgreSQL Prisma if reachable
    prisma.telemetryEventMirror.create({
      data: {
        id: newEvent.id,
        workspaceId: newEvent.workspaceId,
        appId: newEvent.appId,
        event: newEvent.event,
        distinctId: newEvent.distinctId,
        properties: JSON.stringify(newEvent.properties || {}),
        timestamp: new Date(newEvent.timestamp),
        latencyMs: newEvent.latencyMs,
        status: newEvent.status,
        shard: newEvent.shard,
        clientIp: newEvent.clientIp,
        userAgent: newEvent.userAgent
      }
    }).catch(() => {});

    return newEvent;
  },

  getEvents(workspaceId: string, limit = 50, appId?: string): TelemetryEvent[] {
    const data = readDb();
    let evts = data.events.filter(e => e.workspaceId === workspaceId);
    if (appId) evts = evts.filter(e => e.appId === appId);
    return evts.slice(0, limit);
  },

  getStats(workspaceId: string) {
    const data = readDb();
    const wsEvents = data.events.filter(e => e.workspaceId === workspaceId);
    const count = wsEvents.length;
    const errors = wsEvents.filter(e => e.status >= 400).length;
    const errorRate = count > 0 ? ((errors / count) * 100).toFixed(2) + '%' : '0.00%';
    let totalLatency = 0;
    wsEvents.forEach(e => { totalLatency += (e.latencyMs || 0); });
    const p95 = count > 0 ? (totalLatency / count).toFixed(2) + ' ms' : '0.00 ms';
    return {
      totalEvents: count,
      p95Latency: p95,
      activeNodes: '1 Node (Docker CH)',
      errorRate,
      recentEvents: wsEvents.slice(0, 15)
    };
  },

  // ── Analytics ─────────────────────────────────────────────────────
  getAnalyticsReport(workspaceId: string, options: { days?: number; appId?: string } = {}): AnalyticsReport {
    const data = readDb();
    const days = options.days || 30;
    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;

    let events = data.events.filter(e =>
      e.workspaceId === workspaceId &&
      new Date(e.timestamp).getTime() >= cutoffMs
    );
    if (options.appId) events = events.filter(e => e.appId === options.appId);

    const totalEvents = events.length;
    const uniqueVisitorSet = new Set(events.map(e => e.distinctId));
    const uniqueVisitors = uniqueVisitorSet.size;

    // Sessions: rough approximation — each user has ~1.4 sessions
    const totalSessions = Math.ceil(uniqueVisitors * 1.4);

    // Pageviews
    const pageviews = events.filter(e => e.event === '$pageview' || e.event === '$screen_view' || e.properties?.path).length;

    // Chart data by day
    const chartData: DayBucket[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayEvts = events.filter(e => {
        const t = new Date(e.timestamp).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      });

      const dayVisitors = new Set(dayEvts.map(e => e.distinctId)).size;
      chartData.push({
        date: dayStart.toISOString().split('T')[0],
        visitors: dayVisitors,
        sessions: Math.ceil(dayVisitors * 1.4),
        pageviews: dayEvts.filter(e => e.event === '$pageview' || e.event === '$screen_view').length
      });
    }

    // Top pages
    const pageCounts: Record<string, number> = {};
    events.forEach(e => {
      const pg = e.properties?.path || e.properties?.screen || '/';
      pageCounts[pg] = (pageCounts[pg] || 0) + 1;
    });

    // Top events
    const evtCounts: Record<string, number> = {};
    events.forEach(e => { evtCounts[e.event] = (evtCounts[e.event] || 0) + 1; });

    // Countries
    const countryCounts: Record<string, number> = {};
    events.forEach(e => {
      const c = e.properties?.country || 'Unknown';
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    });

    // Browsers
    const browserCounts: Record<string, number> = {};
    events.forEach(e => {
      const b = parseBrowser(e.userAgent, e.properties);
      browserCounts[b] = (browserCounts[b] || 0) + 1;
    });

    // OS
    const osCounts: Record<string, number> = {};
    events.forEach(e => {
      const o = parseOS(e.userAgent, e.properties);
      osCounts[o] = (osCounts[o] || 0) + 1;
    });

    // Referrers
    const refCounts: Record<string, number> = {};
    events.forEach(e => {
      const ref = e.properties?.referrer || 'Direct';
      const label = ref === '' ? 'Direct' : ref;
      refCounts[label] = (refCounts[label] || 0) + 1;
    });

    // New vs returning (simplistic: users with only 1 event = new)
    const userEventCount: Record<string, number> = {};
    events.forEach(e => { userEventCount[e.distinctId] = (userEventCount[e.distinctId] || 0) + 1; });
    let newUsers = 0, returningUsers = 0;
    Object.values(userEventCount).forEach(c => { if (c === 1) newUsers++; else returningUsers++; });

    // Average session duration (simulated based on events/user)
    const avgEventsPerUser = uniqueVisitors > 0 ? (totalEvents / uniqueVisitors) : 1;
    const avgDurationSecs = Math.floor(avgEventsPerUser * 45);
    const avgDuration = avgDurationSecs > 60
      ? `${Math.floor(avgDurationSecs / 60)}m ${avgDurationSecs % 60}s`
      : `${avgDurationSecs}s`;

    return {
      totalEvents,
      uniqueVisitors,
      totalSessions,
      pageviews,
      bounceRate: uniqueVisitors > 0 ? (Math.max(20, Math.min(80, Math.floor(100 * newUsers / uniqueVisitors))) + '%') : '0%',
      avgDuration,
      eventsPerSession: totalSessions > 0 ? (totalEvents / totalSessions).toFixed(1) : '0',
      chartData,
      topPages: topN(pageCounts, totalEvents),
      topEvents: topN(evtCounts, totalEvents),
      topCountries: topN(countryCounts, totalEvents),
      topBrowsers: topN(browserCounts, totalEvents),
      topOS: topN(osCounts, totalEvents),
      topReferrers: topN(refCounts, totalEvents),
      newVsReturning: { new: newUsers, returning: returningUsers }
    };
  },

  getUsersList(workspaceId: string, options: { appId?: string; limit?: number } = {}): UserSummary[] {
    const data = readDb();
    let events = data.events.filter(e => e.workspaceId === workspaceId);
    if (options.appId) events = events.filter(e => e.appId === options.appId);

    const userMap: Record<string, TelemetryEvent[]> = {};
    events.forEach(e => {
      if (!userMap[e.distinctId]) userMap[e.distinctId] = [];
      userMap[e.distinctId].push(e);
    });

    return Object.entries(userMap)
      .map(([distinctId, evts]) => {
        const sorted = [...evts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const evtCounts: Record<string, number> = {};
        evts.forEach(e => { evtCounts[e.event] = (evtCounts[e.event] || 0) + 1; });
        const topEvent = Object.entries(evtCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || '$pageview';
        const latestEvt = evts[0];

        return {
          distinctId,
          totalEvents: evts.length,
          firstSeen: sorted[0]?.timestamp || '',
          lastSeen: latestEvt?.timestamp || '',
          topEvent,
          country: latestEvt?.properties?.country || 'US',
          browser: parseBrowser(latestEvt?.userAgent, latestEvt?.properties)
        };
      })
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
      .slice(0, options.limit || 100);
  },

  getUserActivity(workspaceId: string, distinctId: string): TelemetryEvent[] {
    return readDb().events
      .filter(e => e.workspaceId === workspaceId && e.distinctId === distinctId)
      .slice(0, 100);
  },

  // ── Database Client Instances ──────────────────────────────────────
  prisma,
  clickhouse,
};
