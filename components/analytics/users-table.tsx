'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Globe, Monitor, Search, ChevronRight, Activity } from 'lucide-react';

interface UserSummary {
  distinctId: string;
  totalEvents: number;
  firstSeen: string;
  lastSeen: string;
  topEvent: string;
  country: string;
  browser: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

const COUNTRY_NAMES: Record<string, string> = {
  US: '🇺🇸 US', GB: '🇬🇧 UK', DE: '🇩🇪 DE', FR: '🇫🇷 FR',
  IN: '🇮🇳 IN', CA: '🇨🇦 CA', AU: '🇦🇺 AU', JP: '🇯🇵 JP',
  BR: '🇧🇷 BR', Unknown: '🌐 ?'
};

export function UsersTable({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'lastSeen' | 'totalEvents' | 'firstSeen'>('lastSeen');

  useEffect(() => {
    fetch(`/api/analytics/users?workspace=${workspaceSlug}&limit=200`)
      .then(r => r.json())
      .then(d => { if (d.users) setUsers(d.users); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceSlug]);

  const filtered = users
    .filter(u => !search || u.distinctId.toLowerCase().includes(search.toLowerCase()) || u.topEvent.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'totalEvents') return b.totalEvents - a.totalEvents;
      if (sortBy === 'firstSeen') return new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime();
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });

  return (
    <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.02em' }}>Users</h1>
          <p style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>
            {loading ? 'Loading…' : `${users.length.toLocaleString()} unique visitors tracked`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#121215', border: '1px solid #27272a', borderRadius: '6px', padding: '5px 10px', width: '220px' }}>
            <Search style={{ width: '12px', height: '12px', color: '#71717a', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by user ID or event…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', color: '#d4d4d8' }}
            />
          </div>
          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '6px', padding: '5px 10px', color: '#d4d4d8', fontSize: '12px', cursor: 'pointer' }}
          >
            <option value="lastSeen">Sort: Last Seen</option>
            <option value="totalEvents">Sort: Most Events</option>
            <option value="firstSeen">Sort: First Seen</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 32px', padding: '8px 16px', borderBottom: '1px solid #1f1f23', background: '#0c0c0e' }}>
          {['User ID', 'Events', 'Country', 'Browser', 'First Seen', 'Last Seen', ''].map((h, i) => (
            <span key={i} style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#52525b', fontSize: '12px' }}>
            Loading users…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#52525b', fontSize: '12px' }}>
            {search ? 'No users match your search.' : 'No users tracked yet. Connect an app to start tracking visitors.'}
          </div>
        ) : (
          filtered.slice(0, 100).map((user, i) => (
            <div
              key={user.distinctId}
              onClick={() => router.push(`/${workspaceSlug}/analytics/users/${encodeURIComponent(user.distinctId)}`)}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 32px',
                padding: '10px 16px', borderBottom: i < filtered.length - 1 ? '1px solid #141417' : 'none',
                cursor: 'pointer', transition: 'background 0.1s', alignItems: 'center'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0c0c0e')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#18181b', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontFamily: 'monospace', color: '#71717a', flexShrink: 0 }}>
                  {user.distinctId.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#d4d4d8', fontWeight: 500 }}>{user.distinctId}</div>
                  <div style={{ fontSize: '10px', color: '#52525b', fontFamily: 'monospace' }}>{user.topEvent}</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#a1a1aa' }}>{user.totalEvents.toLocaleString()}</span>
              <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{COUNTRY_NAMES[user.country] || user.country}</span>
              <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{user.browser}</span>
              <span style={{ fontSize: '11px', color: '#52525b' }}>{timeAgo(user.firstSeen)}</span>
              <span style={{ fontSize: '11px', color: '#52525b' }}>{timeAgo(user.lastSeen)}</span>
              <ChevronRight style={{ width: '14px', height: '14px', color: '#3f3f46' }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
