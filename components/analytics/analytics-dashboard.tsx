'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Eye, MousePointerClick, Clock, TrendingUp, TrendingDown,
  Globe, Monitor, Smartphone, RefreshCw
} from 'lucide-react';

interface AnalyticsReport {
  totalEvents: number;
  uniqueVisitors: number;
  totalSessions: number;
  pageviews: number;
  bounceRate: string;
  avgDuration: string;
  eventsPerSession: string;
  chartData: { date: string; visitors: number; sessions: number; pageviews: number }[];
  topPages: { label: string; count: number; pct: number }[];
  topEvents: { label: string; count: number; pct: number }[];
  topCountries: { label: string; count: number; pct: number }[];
  topBrowsers: { label: string; count: number; pct: number }[];
  topOS: { label: string; count: number; pct: number }[];
  topReferrers: { label: string; count: number; pct: number }[];
  newVsReturning: { new: number; returning: number };
}

interface App { id: string; name: string; platform: string; }

function BarCell({ pct }: { pct: number }) {
  return (
    <div style={{ flex: 1, height: '6px', background: '#18181b', borderRadius: '9999px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #38bdf8, #818cf8)', borderRadius: '9999px', transition: 'width 0.6s ease' }} />
    </div>
  );
}

function TopList({ title, items, valueLabel = 'Views', loading }: { title: string; items: { label: string; count: number; pct: number }[]; valueLabel?: string; loading: boolean; }) {
  return (
    <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px 16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>{title}</div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '20px', background: '#18181b', borderRadius: '4px', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#52525b', textAlign: 'center', padding: '12px 0' }}>No data yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
              <span style={{ width: '14px', color: '#52525b', fontFamily: 'monospace', flexShrink: 0, fontSize: '10px' }}>{i + 1}</span>
              <span style={{ flex: 1, color: '#d4d4d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
                title={item.label}>
                {item.label}
              </span>
              <BarCell pct={item.pct} />
              <span style={{ color: '#71717a', fontFamily: 'monospace', fontSize: '11px', flexShrink: 0, minWidth: '32px', textAlign: 'right' }}>
                {item.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniChart({ data, metric }: { data: { date: string; visitors: number; sessions: number; pageviews: number }[]; metric: 'visitors' | 'sessions' | 'pageviews' }) {
  const max = Math.max(...data.map(d => d[metric]), 1);
  const W = 100, H = 48;

  if (data.length < 2) return null;

  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (d[metric] / max) * (H - 4) - 2
  }));

  const pathD = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaD = `${pathD} L${W},${H} L0,${H} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AnalyticsDashboard({ workspaceSlug, initialApps }: { workspaceSlug: string; initialApps: App[] }) {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [chartMetric, setChartMetric] = useState<'visitors' | 'sessions' | 'pageviews'>('visitors');
  const [activeTab, setActiveTab] = useState<'pages' | 'events' | 'referrers'>('pages');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ workspace: workspaceSlug, days: String(days) });
      if (selectedAppId) params.set('appId', selectedAppId);
      const res = await fetch(`/api/analytics/report?${params}`);
      const data = await res.json();
      if (data.report) setReport(data.report);
    } catch { } finally {
      setLoading(false);
    }
  }, [workspaceSlug, days, selectedAppId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const fmt = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + 'M' : n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);

  const metricCards = [
    { label: 'Unique Visitors', value: fmt(report?.uniqueVisitors ?? 0), icon: Users, color: '#38bdf8', sub: `${report?.newVsReturning?.new ?? 0} new` },
    { label: 'Page Views', value: fmt(report?.pageviews ?? 0), icon: Eye, color: '#818cf8', sub: `${report?.eventsPerSession ?? '—'} per session` },
    { label: 'Total Sessions', value: fmt(report?.totalSessions ?? 0), icon: MousePointerClick, color: '#10b981', sub: `Bounce: ${report?.bounceRate ?? '—'}` },
    { label: 'Avg Duration', value: report?.avgDuration ?? '—', icon: Clock, color: '#f59e0b', sub: `${fmt(report?.totalEvents ?? 0)} total events` },
  ];

  const topListData = activeTab === 'pages' ? report?.topPages : activeTab === 'events' ? report?.topEvents : report?.topReferrers;

  return (
    <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.02em' }}>Analytics</h1>
          <p style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>User behavior, traffic, and engagement across your apps.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* App Filter */}
          <select
            value={selectedAppId}
            onChange={e => setSelectedAppId(e.target.value)}
            style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '6px', padding: '5px 10px', color: '#d4d4d8', fontSize: '12px', cursor: 'pointer' }}
          >
            <option value="">All Apps</option>
            {initialApps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          {/* Day Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#121215', border: '1px solid #27272a', borderRadius: '6px', padding: '2px' }}>
            {[7, 14, 30].map(d => (
              <button key={d} onClick={() => setDays(d)}
                style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s', background: days === d ? '#27272a' : 'transparent', color: days === d ? '#fafafa' : '#71717a', border: 'none' }}>
                {d}d
              </button>
            ))}
          </div>

          <button onClick={fetchReport} style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#71717a' }}
            title="Refresh">
            <RefreshCw style={{ width: '13px', height: '13px' }} />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', flexShrink: 0 }}>
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#71717a' }}>{card.label}</span>
                <Icon style={{ width: '14px', height: '14px', color: card.color }} />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#fafafa', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {loading ? <div style={{ width: '60px', height: '24px', background: '#18181b', borderRadius: '4px' }} /> : card.value}
              </div>
              <div style={{ fontSize: '11px', color: '#52525b', marginTop: '4px' }}>{card.sub}</div>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '100%', opacity: 0.06 }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: card.color, transform: 'translate(20px, -20px)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Visitors Chart */}
      <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa' }}>Traffic Over Time</div>
            <div style={{ fontSize: '11px', color: '#52525b' }}>Last {days} days</div>
          </div>
          <div style={{ display: 'flex', gap: '2px', background: '#121215', border: '1px solid #27272a', borderRadius: '6px', padding: '2px' }}>
            {(['visitors', 'sessions', 'pageviews'] as const).map(m => (
              <button key={m} onClick={() => setChartMetric(m)}
                style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.12s', background: chartMetric === m ? '#27272a' : 'transparent', color: chartMetric === m ? '#fafafa' : '#71717a', textTransform: 'capitalize' }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Chart */}
        <div style={{ height: '120px', position: 'relative' }}>
          {loading || !report ? (
            <div style={{ height: '100%', background: '#0c0c0e', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: '#52525b' }}>Loading chart…</span>
            </div>
          ) : (
            <FullChart data={report.chartData} metric={chartMetric} />
          )}
        </div>
      </div>

      {/* Bottom Grid: 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', flexShrink: 0 }}>

        {/* Left: Top Pages/Events/Referrers */}
        <div style={{ gridColumn: '1 / 3' }}>
          <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #27272a' }}>
              {(['pages', 'events', 'referrers'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ flex: 1, padding: '10px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.12s', background: activeTab === tab ? '#121215' : 'transparent', color: activeTab === tab ? '#fafafa' : '#71717a', borderBottom: activeTab === tab ? '2px solid #38bdf8' : '2px solid transparent', textTransform: 'capitalize' }}>
                  {tab === 'pages' ? 'Top Pages' : tab === 'events' ? 'Top Events' : 'Referrers'}
                </button>
              ))}
            </div>
            <div style={{ padding: '14px 16px' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ height: '18px', background: '#18181b', borderRadius: '3px' }} />)}
                </div>
              ) : (topListData || []).slice(0, 8).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', paddingBottom: '8px', marginBottom: '8px', borderBottom: i < 7 ? '1px solid #141417' : 'none' }}>
                  <span style={{ width: '16px', color: '#52525b', fontFamily: 'monospace', fontSize: '10px', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, color: '#d4d4d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: activeTab === 'events' ? 'monospace' : 'inherit', fontSize: activeTab === 'events' ? '11px' : '12px' }}
                    title={item.label}>{item.label}</span>
                  <div style={{ width: '80px', height: '4px', background: '#18181b', borderRadius: '9999px', flexShrink: 0 }}>
                    <div style={{ height: '100%', width: `${item.pct}%`, background: '#38bdf8', borderRadius: '9999px' }} />
                  </div>
                  <span style={{ color: '#71717a', fontFamily: 'monospace', fontSize: '11px', flexShrink: 0, minWidth: '36px', textAlign: 'right' }}>{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Devices + Countries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <TopList title="Browsers" items={report?.topBrowsers ?? []} loading={loading} />
          <TopList title="Countries" items={report?.topCountries ?? []} loading={loading} />
        </div>
      </div>

      {/* New vs Returning + OS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexShrink: 0 }}>
        {/* New vs Returning */}
        <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px 16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>New vs Returning</div>
          {report && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#d4d4d8' }}>New Visitors</span>
                <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>{report.newVsReturning.new}</span>
              </div>
              <div style={{ height: '8px', background: '#18181b', borderRadius: '9999px', marginBottom: '12px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${report.uniqueVisitors > 0 ? (report.newVsReturning.new / report.uniqueVisitors) * 100 : 0}%`, background: '#38bdf8', borderRadius: '9999px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#d4d4d8' }}>Returning Visitors</span>
                <span style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 600 }}>{report.newVsReturning.returning}</span>
              </div>
              <div style={{ height: '8px', background: '#18181b', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${report.uniqueVisitors > 0 ? (report.newVsReturning.returning / report.uniqueVisitors) * 100 : 0}%`, background: '#10b981', borderRadius: '9999px' }} />
              </div>
            </div>
          )}
        </div>

        {/* OS Breakdown */}
        <TopList title="Operating Systems" items={report?.topOS ?? []} loading={loading} />
      </div>
    </div>
  );
}

// Full-size chart with x-axis labels
function FullChart({ data, metric }: { data: { date: string; visitors: number; sessions: number; pageviews: number }[]; metric: 'visitors' | 'sessions' | 'pageviews' }) {
  const max = Math.max(...data.map(d => d[metric]), 1);
  const W = 1000, H = 100;
  const padL = 0, padR = 0;
  const chartW = W - padL - padR;

  const pts = data.map((d, i) => ({
    x: padL + (i / Math.max(data.length - 1, 1)) * chartW,
    y: H - (d[metric] / max) * (H - 4) - 2,
    date: d.date,
    val: d[metric]
  }));

  const pathD = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaD = `${pathD} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;

  // Show every Nth label to avoid crowding
  const showEvery = data.length > 14 ? Math.ceil(data.length / 7) : 1;

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <svg width="100%" height="80" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = H - (pct / 100) * (H - 4) - 2;
          return <line key={pct} x1={0} y1={y} x2={W} y2={y} stroke="#1f1f23" strokeWidth="0.5" />;
        })}
        <path d={areaD} fill="url(#areaGrad)" />
        <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {pts.filter((_, i) => i % showEvery === 0 || i === pts.length - 1).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#38bdf8" stroke="#09090b" strokeWidth="1.5" />
        ))}
      </svg>
      {/* X labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        {data.filter((_, i) => i % showEvery === 0 || i === data.length - 1).map((d, i) => (
          <span key={i} style={{ fontSize: '9px', color: '#52525b', fontFamily: 'monospace' }}>
            {d.date.slice(5)}
          </span>
        ))}
      </div>
    </div>
  );
}
