'use client';

import { X, Copy, Check } from 'lucide-react';
import { TelemetryEvent } from '@/lib/db';
import { useState } from 'react';

function Field({ label, value, mono = true, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #141417', gap: '12px' }}>
      <span style={{ fontSize: '11px', color: '#71717a', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '11px', fontFamily: mono ? 'Geist Mono, monospace' : 'inherit', color: color || '#d4d4d8', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }} title={value}>{value}</span>
    </div>
  );
}

export function EventDrawer({
  event,
  onClose
}: {
  event: TelemetryEvent | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const statusColor = event.status >= 400 ? '#fb7185' : event.status === 202 ? '#38bdf8' : '#34d399';

  async function handleCopyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', zIndex: 40 }}
        onClick={onClose}
      />
      {/* Drawer */}
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '420px', background: '#0c0c0e', borderLeft: '1px solid #27272a', boxShadow: '-16px 0 40px rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.15s ease-out' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa' }}>Event Inspector</h3>
            <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>{event.id}</span>
          </div>
          <button onClick={onClose} style={{ color: '#71717a', padding: '4px', cursor: 'pointer', transition: 'color 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fafafa'}
            onMouseLeave={e => e.currentTarget.style.color = '#71717a'}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Status Badge */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #141417', flexShrink: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: `${statusColor}18`, border: `1px solid ${statusColor}40` }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: statusColor, fontFamily: 'monospace' }}>
              {event.status} {event.status === 200 ? 'OK' : event.status === 202 ? 'ACCEPTED' : event.status === 404 ? 'NOT FOUND' : 'ERROR'}
            </span>
            <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace', fontWeight: 700 }}>·</span>
            <span style={{ fontSize: '11px', color: '#10b981', fontFamily: 'monospace', fontWeight: 600 }}>{event.latencyMs}ms</span>
          </div>
        </div>

        {/* Fields */}
        <div style={{ padding: '0 16px', flexShrink: 0 }}>
          <Field label="Event" value={event.event} color="#fafafa" />
          <Field label="Distinct ID" value={event.distinctId} color="#38bdf8" />
          <Field label="Timestamp" value={new Date(event.timestamp).toLocaleString()} />
          <Field label="ClickHouse Shard" value={event.shard} />
          {event.clientIp && <Field label="Client IP" value={event.clientIp} />}
          {event.properties?.country && <Field label="Country" value={event.properties.country} mono={false} />}
          {event.properties?.browser && <Field label="Browser" value={event.properties.browser} mono={false} />}
          {event.properties?.os && <Field label="OS" value={event.properties.os} mono={false} />}
          {event.properties?.path && <Field label="Path / Screen" value={event.properties.path} color="#818cf8" />}
          {event.userAgent && <Field label="User Agent" value={event.userAgent} />}
        </div>

        {/* JSON Payload */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '12px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Properties</span>
            <button onClick={handleCopyJson}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: copied ? 'rgba(16,185,129,0.1)' : '#18181b', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : '#27272a'}`, borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: copied ? '#34d399' : '#a1a1aa', cursor: 'pointer', transition: 'all 0.2s' }}>
              {copied ? <Check style={{ width: '10px', height: '10px' }} /> : <Copy style={{ width: '10px', height: '10px' }} />}
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
          </div>
          <pre style={{ flex: 1, background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#38bdf8', fontFamily: 'Geist Mono, monospace', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6, margin: 0 }}>
            {JSON.stringify(event.properties, null, 2)}
          </pre>
        </div>
      </div>
    </>
  );
}
