'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, ChevronRight, Copy, Check, ShieldCheck, Clock, Monitor, Globe, Filter } from 'lucide-react';

interface TelemetryEvent {
  id: string;
  event: string;
  distinctId: string;
  properties: Record<string, any>;
  timestamp: string;
  latencyMs: number;
  status: number;
  shard: string;
  userAgent?: string;
  clientIp?: string;
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

export function UserDetailView({
  workspaceSlug,
  distinctId
}: {
  workspaceSlug: string;
  distinctId: string;
}) {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TelemetryEvent | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    fetch(`/api/analytics/users/${encodeURIComponent(distinctId)}?workspace=${workspaceSlug}`)
      .then(r => r.json())
      .then(d => {
        if (d.events) {
          setEvents(d.events);
          if (d.events.length > 0) {
            setSelected(d.events[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceSlug, distinctId]);

  const copyDistinctId = () => {
    navigator.clipboard.writeText(distinctId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const firstSeen = events.length > 0 ? events[events.length - 1].timestamp : null;
  const lastSeen = events.length > 0 ? events[0].timestamp : null;
  const country = events[0]?.properties?.country || '—';
  const browser = events[0]?.properties?.browser || events[0]?.properties?.os || '—';
  const os = events[0]?.properties?.os || '—';

  // Event type counts
  const evtCounts: Record<string, number> = {};
  events.forEach(e => { evtCounts[e.event] = (evtCounts[e.event] || 0) + 1; });
  const topEvents = Object.entries(evtCounts).sort(([, a], [, b]) => b - a);

  const filteredEvents = selectedFilter === 'all'
    ? events
    : events.filter(e => e.event === selectedFilter);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Back Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          href={`/${workspaceSlug}/analytics/users`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#71717a', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; }}
        >
          <ArrowLeft style={{ width: '13px', height: '13px' }} />
          <span>Back to All Users</span>
        </Link>
        <div style={{ fontSize: '11px', color: '#52525b', fontFamily: 'monospace' }}>
          workspace: <span style={{ color: '#a1a1aa' }}>{workspaceSlug}</span>
        </div>
      </div>

      {/* User Header Profile */}
      <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
              border: '1px solid #3f3f46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontFamily: 'monospace',
              color: '#38bdf8',
              fontWeight: 700,
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.1)'
            }}>
              {distinctId.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontFamily: 'monospace', fontWeight: 600, color: '#fafafa' }}>{distinctId}</span>
                <button
                  onClick={copyDistinctId}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copied ? '#34d399' : '#71717a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    transition: 'color 0.15s'
                  }}
                  title="Copy User ID"
                >
                  {copied ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                </button>
              </div>
              <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck style={{ width: '12px', height: '12px', color: '#10b981' }} />
                <span>Tracked Entity · Vector Identified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {[
            { label: 'Total Events', value: events.length.toString(), color: '#38bdf8' },
            { label: 'Primary Country', value: country },
            { label: 'Browser / OS', value: `${browser} · ${os}` },
            { label: 'First Activity', value: firstSeen ? timeAgo(firstSeen) : '—' },
            { label: 'Last Activity', value: lastSeen ? timeAgo(lastSeen) : '—' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#0c0c0e', borderRadius: '6px', padding: '10px 14px', border: '1px solid #1f1f23' }}>
              <div style={{ fontSize: '10px', color: '#52525b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: stat.color || '#d4d4d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Left: Event Type Distribution & Filters */}
        <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Event Breakdown</span>
            <span style={{ fontSize: '10px', color: '#52525b', fontFamily: 'monospace' }}>{topEvents.length} types</span>
          </div>

          <button
            onClick={() => setSelectedFilter('all')}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              background: selectedFilter === 'all' ? '#18181b' : 'transparent',
              border: `1px solid ${selectedFilter === 'all' ? '#38bdf840' : 'transparent'}`,
              color: selectedFilter === 'all' ? '#38bdf8' : '#a1a1aa',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
              transition: 'all 0.15s'
            }}
          >
            <span>All Events</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{events.length}</span>
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1 }}>
            {topEvents.map(([evt, cnt]) => {
              const isSelected = selectedFilter === evt;
              return (
                <button
                  key={evt}
                  onClick={() => setSelectedFilter(isSelected ? 'all' : evt)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: isSelected ? '#18181b' : 'transparent',
                    border: `1px solid ${isSelected ? '#38bdf840' : 'transparent'}`,
                    color: isSelected ? '#38bdf8' : '#a1a1aa',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#0f0f12'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{evt}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, marginLeft: '8px' }}>{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Activity Timeline and Event Inspector */}
        <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '10px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f1f23', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity style={{ width: '13px', height: '13px', color: '#38bdf8' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#fafafa' }}>User Activity Timeline</span>
              <span style={{ fontSize: '10px', color: '#52525b', marginLeft: '6px' }}>
                ({filteredEvents.length} {selectedFilter !== 'all' ? `filtered by ${selectedFilter}` : 'total events'})
              </span>
            </div>
            {selectedFilter !== 'all' && (
              <button
                onClick={() => setSelectedFilter('all')}
                style={{ fontSize: '10px', color: '#38bdf8', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Clear filter
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#52525b', fontSize: '12px' }}>Loading telemetry stream…</div>
            ) : filteredEvents.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#52525b', fontSize: '12px' }}>No events found.</div>
            ) : (
              filteredEvents.map((evt) => {
                const isErr = evt.status >= 400;
                const is202 = evt.status === 202;
                const badgeColor = isErr ? '#fb7185' : is202 ? '#38bdf8' : '#34d399';
                const badgeBg = isErr ? 'rgba(244,63,94,0.1)' : is202 ? 'rgba(56,189,248,0.1)' : 'rgba(16,185,129,0.1)';
                const isSelected = selected?.id === evt.id;

                return (
                  <div key={evt.id} style={{ borderBottom: '1px solid #121216' }}>
                    <div
                      onClick={() => setSelected(isSelected ? null : evt)}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                        background: isSelected ? '#121217' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#0c0c0e'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}40`, flexShrink: 0, fontFamily: 'monospace' }}>
                        {evt.status}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#fafafa', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {evt.event}
                        </div>
                        <div style={{ fontSize: '11px', color: '#52525b', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {evt.properties?.path || evt.properties?.screen || evt.properties?.button || 'payload'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace' }}>{evt.latencyMs}ms</div>
                        <div style={{ fontSize: '10px', color: '#52525b' }}>{timeAgo(evt.timestamp)}</div>
                      </div>
                      <ChevronRight style={{ width: '12px', height: '12px', color: '#3f3f46', transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
                    </div>

                    {/* Expanded Payload Inspector */}
                    {isSelected && (
                      <div style={{ padding: '12px 16px 14px 16px', background: '#050507', borderTop: '1px solid #1a1a20' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
                            Payload Metadata (Shard: {evt.shard})
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(JSON.stringify(evt, null, 2));
                            }}
                            style={{ fontSize: '10px', color: '#38bdf8', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Copy style={{ width: '10px', height: '10px' }} /> Copy JSON
                          </button>
                        </div>
                        <pre style={{ fontFamily: 'Geist Mono, monospace', fontSize: '10.5px', color: '#38bdf8', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#08080a', padding: '10px', borderRadius: '6px', border: '1px solid #1f1f23' }}>
                          {JSON.stringify({
                            id: evt.id,
                            event: evt.event,
                            distinctId: evt.distinctId,
                            timestamp: evt.timestamp,
                            status: evt.status,
                            latencyMs: evt.latencyMs,
                            shard: evt.shard,
                            properties: evt.properties
                          }, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
