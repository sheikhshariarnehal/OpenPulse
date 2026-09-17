'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Eye,
  MousePointerClick,
  Clock,
  RefreshCw,
  ExternalLink,
  MoreHorizontal,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Compass,
  Search,
  X,
  ChevronDown,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

// ---- Types ----
export interface TopEntry {
  label: string;
  count: number;
  pct: number;
}

export interface DayBucket {
  date: string;
  visitors: number;
  sessions: number;
  pageviews: number;
}

export interface RealtimeData {
  activeUsers: number;
  activePages: TopEntry[];
  activeCountries: TopEntry[];
  activeDevices: TopEntry[];
  recentEventsCount: number;
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
  topRoutes: TopEntry[];
  topHostnames: TopEntry[];
  topEvents: TopEntry[];
  topCountries: TopEntry[];
  topDevices: TopEntry[];
  topBrowsers: TopEntry[];
  topOS: TopEntry[];
  topReferrers: TopEntry[];
  topUtm: TopEntry[];
  newVsReturning: { new: number; returning: number };
  realtime?: RealtimeData;
}

interface App {
  id: string;
  name: string;
  platform: string;
}

interface AnalyticsDashboardProps {
  workspaceSlug: string;
  initialApps: App[];
}

// ---- Formatting Helpers ----
function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toLocaleString();
}

function renderCountryFlag(country: string) {
  const c = country.toLowerCase();
  if (c.includes('bangladesh') || c === 'bd') {
    return (
      <span style={{ display: 'inline-flex', width: '17px', height: '12px', borderRadius: '2px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }}>
        <svg viewBox="0 0 20 12" width="100%" height="100%">
          <rect width="20" height="12" fill="#006a4e" />
          <circle cx="9" cy="6" r="4" fill="#f42a41" />
        </svg>
      </span>
    );
  }
  if (c.includes('united states') || c === 'us' || c === 'usa') {
    return (
      <span style={{ display: 'inline-flex', width: '17px', height: '12px', borderRadius: '2px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }}>
        <svg viewBox="0 0 19 10" width="100%" height="100%">
          <rect width="19" height="10" fill="#b22234" />
          <path d="M0,1.5 H19 M0,3.8 H19 M0,6.1 H19 M0,8.5 H19" stroke="#fff" strokeWidth="1" />
          <rect width="7.6" height="5.4" fill="#3c3b6e" />
        </svg>
      </span>
    );
  }
  if (c.includes('india') || c === 'in') {
    return (
      <span style={{ display: 'inline-flex', width: '17px', height: '12px', borderRadius: '2px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }}>
        <svg viewBox="0 0 18 12" width="100%" height="100%">
          <rect width="18" height="4" fill="#FF9933" />
          <rect y="4" width="18" height="4" fill="#FFFFFF" />
          <rect y="8" width="18" height="4" fill="#138808" />
          <circle cx="9" cy="6" r="1.5" fill="#000080" />
        </svg>
      </span>
    );
  }
  if (c.includes('brazil') || c === 'br') {
    return (
      <span style={{ display: 'inline-flex', width: '17px', height: '12px', borderRadius: '2px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }}>
        <svg viewBox="0 0 20 14" width="100%" height="100%">
          <rect width="20" height="14" fill="#009c3b" />
          <polygon points="10,2 18,7 10,12 2,7" fill="#ffdf00" />
          <circle cx="10" cy="7" r="3" fill="#002776" />
        </svg>
      </span>
    );
  }
  if (c.includes('united kingdom') || c.includes('uk') || c === 'gb') {
    return (
      <span style={{ display: 'inline-flex', width: '17px', height: '12px', borderRadius: '2px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }}>
        <svg viewBox="0 0 60 30" width="100%" height="100%">
          <rect width="60" height="30" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#c8102e" strokeWidth="4" />
          <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
          <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
        </svg>
      </span>
    );
  }
  if (c.includes('japan') || c === 'jp') {
    return (
      <span style={{ display: 'inline-flex', width: '17px', height: '12px', borderRadius: '2px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }}>
        <svg viewBox="0 0 18 12" width="100%" height="100%">
          <rect width="18" height="12" fill="#ffffff" />
          <circle cx="9" cy="6" r="3.6" fill="#bc002d" />
        </svg>
      </span>
    );
  }
  return <Globe size={14} color="#888888" />;
}


function getReferrerIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('google')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          fill="#EA4335"
        />
      </svg>
    );
  }
  if (l.includes('github')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    );
  }
  if (l.includes('v0')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M4 8l8-5 8 5v8l-8 5-8-5V8z" stroke="#fff" strokeWidth="2" fill="none" />
      </svg>
    );
  }
  if (l.includes('bing')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#008373">
        <path d="M4.5 2v17.5l4.5 2.5 9-5.2-3.8-2-5.2 2.2V6.2L16 9.8V4.5L4.5 2z" />
      </svg>
    );
  }
  if (l.includes('chatgpt') || l.includes('openai')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#10a37f">
        <path d="M22.28 9.87a5.98 5.98 0 0 0-.52-4.9 6.06 6.06 0 0 0-6.52-2.73 6.03 6.03 0 0 0-4.66-2.24 6.06 6.06 0 0 0-5.78 4.2 6.04 6.04 0 0 0-4.22 3.06 6.06 6.06 0 0 0 .74 7.07 5.98 5.98 0 0 0 .52 4.9 6.06 6.06 0 0 0 6.52 2.73 6.03 6.03 0 0 0 4.66 2.24 6.06 6.06 0 0 0 5.78-4.2 6.04 6.04 0 0 0 4.22-3.06 6.06 6.06 0 0 0-.74-7.07z" />
      </svg>
    );
  }
  if (l.includes('nextjs')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.87 17.56l-6.24-8.08v8.08H9.8V6.44h1.83l6.24 8.08V6.44h1.8v11.12h-1.8z" />
      </svg>
    );
  }
  return <Globe size={14} color="#888888" />;
}

function getBrowserIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('cloudstream')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#a855f7">
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
      </svg>
    );
  }
  if (l.includes('chrome')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#4285F4" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="#FBBC05" />
      </svg>
    );
  }
  if (l.includes('edge')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#0078D7">
        <path d="M0 12C0 5.37 5.37 0 12 0s12 5.37 12 12-5.37 12-12 12S0 18.63 0 12z" />
      </svg>
    );
  }
  if (l.includes('safari')) {
    return <Compass size={14} color="#006CFF" />;
  }
  if (l.includes('firefox')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#FF7139">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }
  return <Globe size={14} color="#888888" />;
}

function getOSIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('windows')) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#00ADEF">
        <path d="M0 3.45L9.9 2.1v9.3H0V3.45zm0 17.1l9.9 1.35V12.6H0v7.95zm11.1 1.5l12.9 1.8V12.6H11.1v9.45zm0-18.6v9.45H24V1.65L11.1 3.45z" />
      </svg>
    );
  }
  if (l.includes('mac') || l.includes('ios') || l.includes('apple')) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.13.64-2.81 1.45-.6.69-1.12 1.83-.98 2.93 1.07.08 2.14-.46 2.8-1.28z" />
      </svg>
    );
  }
  if (l.includes('android')) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#3DDC84">
        <path d="M6 18h12V6H6v12zm10.5-8.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-9 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" />
      </svg>
    );
  }
  if (l.includes('linux') || l.includes('gnu')) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#facc15">
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }
  return <Monitor size={14} color="#888888" />;
}

function getDeviceIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('mobile')) return <Smartphone size={14} color="#888888" />;
  if (l.includes('tablet')) return <Tablet size={14} color="#888888" />;
  return <Monitor size={14} color="#888888" />;
}

// ---- Vercel Analytics Card Component ----
interface VercelCardProps {
  tabs?: { id: string; label: string }[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  title?: string;
  metricHeader?: string;
  items: TopEntry[];
  loading?: boolean;
  valueFormat?: 'count' | 'percent';
  renderIcon?: (label: string) => React.ReactNode;
  onViewAll?: () => void;
  maxItems?: number;
}

const VercelCard: React.FC<VercelCardProps> = ({
  tabs,
  activeTab,
  onTabChange,
  title,
  metricHeader = 'VISITORS',
  items,
  loading = false,
  valueFormat = 'count',
  renderIcon,
  onViewAll,
  maxItems = 7,
}) => {
  const displayItems = items.slice(0, maxItems);
  const maxVal = Math.max(...items.map((it) => it.count), 1);

  return (
    <div className="vercel-analytics-card">
      {/* Top Header Row with Tabs or Title */}
      <div className="vercel-card-header">
        <div className="vercel-card-tabs">
          {tabs && tabs.length > 0 ? (
            tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`vercel-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onTabChange?.(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })
          ) : (
            <span className="vercel-card-title">{title}</span>
          )}
        </div>

        <span className="vercel-metric-header">{metricHeader}</span>
      </div>

      {/* Rows List */}
      <div className="vercel-card-body">
        {loading ? (
          <div className="vercel-skeleton-container">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="vercel-skeleton-row" />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="vercel-empty-state">No data available</div>
        ) : (
          displayItems.map((item, idx) => {
            const barWidthPercent = (item.count / maxVal) * 100;
            const displayValue =
              valueFormat === 'percent'
                ? `${item.pct}%`
                : formatNumber(item.count);

            return (
              <div key={idx} className="vercel-row" title={`${item.label} (${item.count.toLocaleString()})`}>
                {/* Background Progress Bar Fill */}
                <div
                  className="vercel-row-bar"
                  style={{ width: `${Math.max(barWidthPercent, 2)}%` }}
                />

                {/* Content Overlay */}
                <div className="vercel-row-content">
                  <div className="vercel-row-left">
                    {renderIcon && <span className="vercel-row-icon">{renderIcon(item.label)}</span>}
                    <span className="vercel-row-label">{item.label}</span>
                  </div>
                  <span className="vercel-row-value">{displayValue}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Pill: View All & Options */}
      <div className="vercel-card-footer">
        <button
          type="button"
          className="vercel-footer-pill-btn"
          onClick={onViewAll}
        >
          <span>View All</span>
          <ArrowUpRight size={13} />
        </button>
        <button
          type="button"
          className="vercel-footer-icon-btn"
          title="More options"
          onClick={onViewAll}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
};

// ---- Interactive Vercel Traffic Chart Component ----
interface VercelChartProps {
  data: DayBucket[];
  metric: 'visitors' | 'pageviews';
  days: number;
}

const VercelChart: React.FC<VercelChartProps> = ({ data, metric, days }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const values = data.map((d) => (metric === 'visitors' ? d.visitors : d.pageviews));
  const maxVal = Math.max(...values, 1);
  const W = 1000;
  const H = 140;

  const pts = data.map((d, i) => {
    const val = metric === 'visitors' ? d.visitors : d.pageviews;
    const x = (i / Math.max(data.length - 1, 1)) * W;
    const y = H - (val / maxVal) * (H - 24) - 12;
    return { x, y, date: d.date, val, item: d };
  });

  const pathD = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaD = `${pathD} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;

  const activePoint = hoverIndex !== null && pts[hoverIndex] ? pts[hoverIndex] : null;

  return (
    <div
      className="vercel-chart-wrap"
      onMouseLeave={() => setHoverIndex(null)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
        const idx = Math.round(ratio * (data.length - 1));
        setHoverIndex(idx);
      }}
    >
      <svg
        width="100%"
        height="120"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="vercelChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0070f3" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0070f3" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Subtle Horizontal Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = H - pct * (H - 24) - 12;
          return (
            <line
              key={i}
              x1={0}
              y1={y}
              x2={W}
              y2={y}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}

        {/* Gradient Area */}
        <path d={areaD} fill="url(#vercelChartGrad)" />

        {/* Crisp Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#0070f3"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover Crosshair & Dot */}
        {activePoint && (
          <g>
            <line
              x1={activePoint.x}
              y1={0}
              x2={activePoint.x}
              y2={H}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="4.5"
              fill="#0070f3"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      {/* Floating Hover Tooltip */}
      {activePoint && (
        <div
          className="vercel-chart-tooltip"
          style={{
            left: `${(activePoint.x / W) * 100}%`,
            transform: `translate(-50%, -100%)`,
          }}
        >
          <div className="tooltip-date">{activePoint.date}</div>
          <div className="tooltip-value">
            <span className="tooltip-dot" />
            <span>
              {metric === 'visitors' ? 'Visitors' : 'Page Views'}:{' '}
              <strong>{activePoint.val.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      )}

      {/* X Axis Dates */}
      <div className="vercel-chart-x-axis">
        {data.filter((_, idx) => idx === 0 || idx === Math.floor(data.length / 2) || idx === data.length - 1).map((d, i) => (
          <span key={i} className="vercel-axis-label">
            {d.date}
          </span>
        ))}
      </div>
    </div>
  );
};

// ---- Main Analytics Dashboard Component ----
export function AnalyticsDashboard({ workspaceSlug, initialApps }: AnalyticsDashboardProps) {
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number>(30);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [chartMetric, setChartMetric] = useState<'visitors' | 'pageviews'>('visitors');

  // Active sub-tabs inside cards
  const [pagesTab, setPagesTab] = useState<'pages' | 'routes' | 'hostnames' | 'events'>('pages');
  const [referrersTab, setReferrersTab] = useState<'referrers' | 'utm'>('referrers');
  const [devicesTab, setDevicesTab] = useState<'devices' | 'browsers'>('devices');

  // Modal / Drawer state for "View All"
  const [inspectModal, setInspectModal] = useState<{
    title: string;
    items: TopEntry[];
    valueFormat?: 'count' | 'percent';
  } | null>(null);
  const [modalSearch, setModalSearch] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workspace: workspaceSlug,
        days: String(days),
      });
      if (selectedAppId) params.set('appId', selectedAppId);
      const res = await fetch(`/api/analytics/report?${params}`);
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
        if (data.report.realtime) {
          setRealtime(data.report.realtime);
        }
      }
    } catch {
      // silent fallback
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, days, selectedAppId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Fast background polling for live real-time pulse (every 4 seconds)
  useEffect(() => {
    let isMounted = true;
    const pollRealtime = async () => {
      try {
        const params = new URLSearchParams({ workspace: workspaceSlug });
        if (selectedAppId) params.set('appId', selectedAppId);
        const res = await fetch(`/api/analytics/realtime?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.realtime) {
          setRealtime(data.realtime);
        }
      } catch {
        // silent
      }
    };

    pollRealtime();
    const interval = setInterval(pollRealtime, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [workspaceSlug, selectedAppId]);

  // Derived Datasets for each card
  const pagesCardItems = useMemo(() => {
    if (pagesTab === 'routes') return report?.topRoutes || [];
    if (pagesTab === 'hostnames') return report?.topHostnames || [];
    if (pagesTab === 'events') return report?.topEvents || [];
    return report?.topPages || [];
  }, [report, pagesTab]);

  const referrersCardItems = useMemo(() => {
    if (referrersTab === 'utm') return report?.topUtm || [];
    return report?.topReferrers || [];
  }, [report, referrersTab]);

  const devicesCardItems = useMemo(() => {
    if (devicesTab === 'browsers') return report?.topBrowsers || [];
    return report?.topDevices || [];
  }, [report, devicesTab]);

  // Filtered Modal items
  const filteredModalItems = useMemo(() => {
    if (!inspectModal) return [];
    if (!modalSearch.trim()) return inspectModal.items;
    const q = modalSearch.toLowerCase();
    return inspectModal.items.filter((it) => it.label.toLowerCase().includes(q));
  }, [inspectModal, modalSearch]);

  const activeUsersCount = realtime?.activeUsers ?? report?.realtime?.activeUsers ?? 0;

  return (
    <div className="vercel-analytics-page">
      {/* ── Top Header Controls Bar ────────────────────────────────────────── */}
      <div className="vercel-header-bar">
        <div className="vercel-header-title-block">
          <div className="vercel-title-row">
            <h1 className="vercel-page-title">Analytics</h1>
            <div
              className={`vercel-realtime-badge ${activeUsersCount > 0 ? 'active' : 'idle'}`}
              title="Live active visitors right now"
            >
              <span className="vercel-beacon-wrap">
                {activeUsersCount > 0 && <span className="vercel-beacon-ping" />}
                <span className={activeUsersCount > 0 ? 'vercel-beacon-dot' : 'vercel-beacon-dot-idle'} />
              </span>
              <span>
                <strong>{activeUsersCount}</strong> {activeUsersCount === 1 ? 'user' : 'users'} active now
              </span>
            </div>
          </div>
          <p className="vercel-page-sub">
            Real-time developer telemetry, web vitals, and traffic insights.
          </p>
        </div>

        <div className="vercel-header-controls">
          {/* App Selector Dropdown */}
          <div className="vercel-select-wrap">
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="vercel-select"
            >
              <option value="">All Apps</option>
              {initialApps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="vercel-select-arrow" />
          </div>

          {/* Time Range Pills */}
          <div className="vercel-time-pills">
            {[
              { d: 1, label: '24h' },
              { d: 7, label: '7d' },
              { d: 30, label: '30d' },
            ].map(({ d, label }) => (
              <button
                key={d}
                type="button"
                className={`vercel-time-btn ${days === d ? 'active' : ''}`}
                onClick={() => setDays(d)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="vercel-icon-btn"
            title="Refresh Data"
            onClick={fetchReport}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── KPI Stat Summary Cards Row ─────────────────────────────────────── */}
      <div className="vercel-kpi-grid">
        <div className="vercel-kpi-card">
          <div className="vercel-kpi-label">
            <span>Unique Visitors</span>
            <Users size={14} color="#888888" />
          </div>
          <div className="vercel-kpi-val">
            {loading ? <div className="vercel-kpi-skeleton" /> : formatNumber(report?.uniqueVisitors ?? 0)}
          </div>
          <div className="vercel-kpi-sub">
            <span style={{ color: activeUsersCount > 0 ? '#10b981' : '#71717a' }}>
              {activeUsersCount} active now
            </span>
            <span style={{ opacity: 0.5 }}> · </span>
            <span>{report?.newVsReturning?.new ?? 0} new</span>
          </div>
        </div>

        <div className="vercel-kpi-card">
          <div className="vercel-kpi-label">
            <span>Page Views</span>
            <Eye size={14} color="#888888" />
          </div>
          <div className="vercel-kpi-val">
            {loading ? <div className="vercel-kpi-skeleton" /> : formatNumber(report?.pageviews ?? 0)}
          </div>
          <div className="vercel-kpi-sub">
            <span>{report?.eventsPerSession ?? '—'} per session</span>
          </div>
        </div>

        <div className="vercel-kpi-card">
          <div className="vercel-kpi-label">
            <span>Total Sessions</span>
            <MousePointerClick size={14} color="#888888" />
          </div>
          <div className="vercel-kpi-val">
            {loading ? <div className="vercel-kpi-skeleton" /> : formatNumber(report?.totalSessions ?? 0)}
          </div>
          <div className="vercel-kpi-sub">
            <span>Bounce Rate: {report?.bounceRate ?? '0%'}</span>
          </div>
        </div>

        <div className="vercel-kpi-card">
          <div className="vercel-kpi-label">
            <span>Avg Visit Duration</span>
            <Clock size={14} color="#888888" />
          </div>
          <div className="vercel-kpi-val">
            {loading ? <div className="vercel-kpi-skeleton" /> : report?.avgDuration ?? '—'}
          </div>
          <div className="vercel-kpi-sub">
            <span>{formatNumber(report?.totalEvents ?? 0)} total events</span>
          </div>
        </div>
      </div>

      {/* ── Main Interactive Traffic Chart Container ───────────────────────── */}
      <div className="vercel-chart-container">
        <div className="vercel-chart-header">
          <div>
            <div className="vercel-chart-title">Traffic Over Time</div>
            <div className="vercel-chart-sub">
              Displaying real-time activity for the last {days} days
            </div>
          </div>

          <div className="vercel-chart-metric-toggles">
            <button
              type="button"
              className={`vercel-toggle-btn ${chartMetric === 'visitors' ? 'active' : ''}`}
              onClick={() => setChartMetric('visitors')}
            >
              Visitors
            </button>
            <button
              type="button"
              className={`vercel-toggle-btn ${chartMetric === 'pageviews' ? 'active' : ''}`}
              onClick={() => setChartMetric('pageviews')}
            >
              Pageviews
            </button>
          </div>
        </div>

        <div className="vercel-chart-canvas-wrap">
          {loading || !report ? (
            <div className="vercel-chart-loading">Loading telemetry chart…</div>
          ) : (
            <VercelChart data={report.chartData} metric={chartMetric} days={days} />
          )}
        </div>
      </div>

      {/* ── Cards Section 1: Top 2-Column Grid (Pages & Referrers) ──────────── */}
      <div className="vercel-cards-grid-top">
        {/* Card 1: Pages / Routes / Hostnames / Events */}
        <VercelCard
          tabs={[
            { id: 'pages', label: 'Pages' },
            { id: 'routes', label: 'Routes' },
            { id: 'hostnames', label: 'Hostnames' },
            { id: 'events', label: 'Events' },
          ]}
          activeTab={pagesTab}
          onTabChange={(t) => setPagesTab(t as any)}
          metricHeader={pagesTab === 'events' ? 'EVENTS' : 'VISITORS'}
          items={pagesCardItems}
          loading={loading}
          valueFormat="count"
          onViewAll={() =>
            setInspectModal({
              title:
                pagesTab === 'pages'
                  ? 'All Top Pages'
                  : pagesTab === 'routes'
                  ? 'All Routes'
                  : pagesTab === 'hostnames'
                  ? 'All Hostnames'
                  : 'All Custom Events',
              items: pagesCardItems,
              valueFormat: 'count',
            })
          }
        />

        {/* Card 2: Referrers / UTM Parameters */}
        <VercelCard
          tabs={[
            { id: 'referrers', label: 'Referrers' },
            { id: 'utm', label: 'UTM Parameters' },
          ]}
          activeTab={referrersTab}
          onTabChange={(t) => setReferrersTab(t as any)}
          metricHeader="VISITORS"
          items={referrersCardItems}
          loading={loading}
          valueFormat="count"
          renderIcon={referrersTab === 'referrers' ? getReferrerIcon : undefined}
          onViewAll={() =>
            setInspectModal({
              title: referrersTab === 'referrers' ? 'All Referrers' : 'All UTM Parameters',
              items: referrersCardItems,
              valueFormat: 'count',
            })
          }
        />
      </div>

      {/* ── Cards Section 2: Bottom 3-Column Grid (Countries, Devices, OS) ──── */}
      <div className="vercel-cards-grid-bottom">
        {/* Card 3: Countries */}
        <VercelCard
          title="Countries"
          metricHeader="VISITORS"
          items={report?.topCountries || []}
          loading={loading}
          valueFormat="percent"
          renderIcon={renderCountryFlag}
          onViewAll={() =>
            setInspectModal({
              title: 'All Countries & Regions',
              items: report?.topCountries || [],
              valueFormat: 'percent',
            })
          }
        />

        {/* Card 4: Devices / Browsers */}
        <VercelCard
          tabs={[
            { id: 'devices', label: 'Devices' },
            { id: 'browsers', label: 'Browsers' },
          ]}
          activeTab={devicesTab}
          onTabChange={(t) => setDevicesTab(t as any)}
          metricHeader="VISITORS"
          items={devicesCardItems}
          loading={loading}
          valueFormat="percent"
          renderIcon={devicesTab === 'devices' ? getDeviceIcon : getBrowserIcon}
          onViewAll={() =>
            setInspectModal({
              title: devicesTab === 'devices' ? 'Device Types' : 'Browsers Breakdown',
              items: devicesCardItems,
              valueFormat: 'percent',
            })
          }
        />

        {/* Card 5: Operating Systems */}
        <VercelCard
          title="Operating Systems"
          metricHeader="VISITORS"
          items={report?.topOS || []}
          loading={loading}
          valueFormat="percent"
          renderIcon={getOSIcon}
          onViewAll={() =>
            setInspectModal({
              title: 'Operating Systems',
              items: report?.topOS || [],
              valueFormat: 'percent',
            })
          }
        />
      </div>

      {/* ── Modal for "View All" Detailed Inspect View ──────────────────────── */}
      {inspectModal && (
        <div className="vercel-modal-backdrop" onClick={() => setInspectModal(null)}>
          <div className="vercel-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="vercel-modal-header">
              <h3 className="vercel-modal-title">{inspectModal.title}</h3>
              <button
                type="button"
                className="vercel-modal-close-btn"
                onClick={() => setInspectModal(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Search Filter */}
            <div className="vercel-modal-search-box">
              <Search size={14} color="#71717a" />
              <input
                type="text"
                placeholder="Filter entries..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="vercel-modal-search-input"
                autoFocus
              />
              {modalSearch && (
                <button
                  type="button"
                  onClick={() => setModalSearch('')}
                  style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Modal Items List */}
            <div className="vercel-modal-list">
              {filteredModalItems.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                  No matching entries found
                </div>
              ) : (
                filteredModalItems.map((item, i) => (
                  <div key={i} className="vercel-modal-row">
                    <span className="vercel-modal-row-idx">{i + 1}</span>
                    <span className="vercel-modal-row-label">{item.label}</span>
                    <span className="vercel-modal-row-count">
                      {inspectModal.valueFormat === 'percent'
                        ? `${item.pct}% (${item.count.toLocaleString()})`
                        : item.count.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
