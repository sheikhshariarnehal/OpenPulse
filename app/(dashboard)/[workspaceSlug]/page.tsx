import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { pingClickHouse } from '@/lib/clickhouse';
import { DashboardSidebar } from '@/components/layout/sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { KpiStatCards } from '@/components/analytics/kpi-stat-cards';
import { TelemetryChart } from '@/components/analytics/telemetry-chart';
import { LiveStreamTable } from '@/components/analytics/live-stream-table';
import { AppWindow, FileCode, CheckCircle2, AlertCircle } from 'lucide-react';

export default async function WorkspaceDashboardPage({
  params
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const user = await getCurrentUser();
  if (!user) return notFound();

  const workspaces = db.getWorkspacesForUser(user.id);
  const currentWs = db.getWorkspaceBySlug(workspaceSlug);
  if (!currentWs) return notFound();

  const apps = db.getAppsForWorkspace(currentWs.id);
  const stats = db.getStats(currentWs.id);
  const events = db.getEvents(currentWs.id, 50);
  const isChAlive = await pingClickHouse();

  const allEvents = db.getEvents(currentWs.id, 1000);
  const totalCount = allEvents.length;

  const colors = ['#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];
  const appDistribution = apps.map((app, idx) => {
    const count = allEvents.filter(e => e.appId === app.id).length;
    const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    return {
      id: app.id,
      name: app.name,
      platform: app.platform,
      count,
      pct,
      color: colors[idx % colors.length]
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <>
      {/* Sidebar */}
      <DashboardSidebar
        user={user}
        workspaces={workspaces}
        currentSlug={workspaceSlug}
      />

      {/* Main Viewport */}
      <div className="main-viewport">
        <TopNav
          workspaceName={currentWs.name}
          workspaceSlug={workspaceSlug}
          currentViewTitle="Overview"
        />

        <main className="dashboard-container">
          {/* Header Bar */}
          <div className="header-bar">
            <div className="header-titles">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 className="page-title">Telemetry & Ingestion Analytics</h1>
                <div style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: isChAlive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: isChAlive ? '#34d399' : '#f87171',
                  border: isChAlive ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isChAlive ? '#10b981' : '#ef4444',
                    boxShadow: isChAlive ? '0 0 6px #10b981' : '0 0 6px #ef4444'
                  }} />
                  <span>{isChAlive ? 'ClickHouse Live' : 'ClickHouse Reconnecting'}</span>
                </div>
              </div>
              <p className="page-subtitle">
                Real-time event streaming, vectorized ClickHouse columnar storage, and dual-sink PostgreSQL mirror.
              </p>
            </div>

            <div className="action-group">
              <Link href={`/${workspaceSlug}/apps`} className="action-btn-subtle">
                <AppWindow style={{ width: '13px', height: '13px' }} />
                <span>{apps.length} App{apps.length === 1 ? '' : 's'} Connected</span>
              </Link>

              <Link href={`/${workspaceSlug}/docs/connect`} className="action-btn-primary">
                <FileCode style={{ width: '13px', height: '13px' }} />
                <span>Connect App Docs</span>
              </Link>
            </div>
          </div>

          {/* 4 KPI Metric Stat Cards */}
          <KpiStatCards
            totalEvents={stats.totalEvents}
            p95Latency={stats.p95Latency}
            activeNodes={stats.activeNodes}
            errorRate={stats.errorRate}
          />

          {/* Middle Section: Telemetry Throughput Chart + Live Stream Table */}
          <div className="telemetry-split">
            <TelemetryChart initialEvents={events} workspaceSlug={workspaceSlug} />
            <LiveStreamTable initialEvents={events} workspaceSlug={workspaceSlug} />
          </div>

          {/* Bottom Section: SDK Distribution & Cluster Shard Health */}
          <div className="bottom-split">
            {/* SDK Volume Progress */}
            <div className="sub-card">
              <div className="sub-card-header">
                <span className="sub-card-title">Ingestion Volume by App</span>
                <span className="sub-card-badge mono">{totalCount} Total Event{totalCount === 1 ? '' : 's'}</span>
              </div>
              <div className="sources-list mono">
                {appDistribution.length === 0 ? (
                  <div style={{ padding: '16px', color: '#71717a', fontSize: '13px', textAlign: 'center' }}>
                    No apps connected yet.
                  </div>
                ) : (
                  appDistribution.map(app => (
                    <div key={app.id} className="source-item">
                      <span className="source-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{app.name}</span>
                        <span style={{ fontSize: '10px', color: '#71717a' }}>({app.platform})</span>
                      </span>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.max(app.pct, app.count > 0 ? 4 : 0)}%`,
                            background: app.color
                          }}
                        />
                      </div>
                      <span className="source-val">{app.count} ({app.pct}%)</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ClickHouse Shard Nodes */}
            <div className="sub-card">
              <div className="sub-card-header">
                <span className="sub-card-title">Storage & Cluster Engine</span>
                <span className="sub-card-badge mono" style={{ color: isChAlive ? '#10b981' : '#f87171' }}>
                  {isChAlive ? 'All Engines Healthy' : 'Cluster Offline'}
                </span>
              </div>
              <div className="shards-grid mono">
                {[
                  { name: 'openpulse-ch', status: isChAlive ? 'Online' : 'Down', desc: 'Port 8123 HTTP · 9000 Native' },
                  { name: 'openpulse-pg', status: 'Online', desc: 'PostgreSQL 16 · Port 5432' },
                  { name: 'engine-stream', status: 'Vectorized', desc: 'ReplacingMergeTree' },
                  { name: 'partitioning', status: 'Active', desc: 'Partitioned toYYYYMM' }
                ].map(node => (
                  <div key={node.name} className="shard-box">
                    <div className="shard-name-row">
                      <span>{node.name}</span>
                      <span
                        className="shard-health-dot"
                        style={{ background: isChAlive ? '#10b981' : '#ef4444' }}
                      />
                    </div>
                    <div className="shard-cpu-val">{node.status}</div>
                    <div className="shard-meta-desc">{node.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
