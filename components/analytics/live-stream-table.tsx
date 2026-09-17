'use client';

import { useState, useEffect, useRef } from 'react';
import { TelemetryEvent } from '@/lib/db';
import { EventDrawer } from './event-drawer';

export function LiveStreamTable({
  initialEvents = [],
  workspaceSlug = '',
}: {
  initialEvents?: TelemetryEvent[];
  workspaceSlug?: string;
}) {
  const [events, setEvents] = useState<TelemetryEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!workspaceSlug) return;

    const poll = async () => {
      if (isPaused) return;
      try {
        const res = await fetch(`/api/analytics/events?workspace=${workspaceSlug}&limit=50`);
        const data = await res.json();
        if (data.events) {
          setEvents(prev => {
            const prevIds = new Set(prev.map(e => e.id));
            const incoming = data.events as TelemetryEvent[];
            const fresh = incoming.filter(e => !prevIds.has(e.id));
            if (fresh.length === 0) return prev;
            setNewIds(new Set(fresh.map(e => e.id)));
            setTimeout(() => setNewIds(new Set()), 1500);
            return incoming;
          });
        }
      } catch { }
    };

    intervalRef.current = setInterval(poll, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [workspaceSlug, isPaused]);

  const [evtRate, setEvtRate] = useState('Live');

  useEffect(() => {
    if (events.length === 0) {
      setEvtRate('Awaiting Events');
    } else {
      setEvtRate(`${events.length} Real Events`);
    }
  }, [events.length]);

  return (
    <div className="stream-panel">
      <div className="stream-header">
        <div className="stream-title-row">
          <span className="stream-title">Live Ingestion Stream</span>
          <span className="stream-pulse-badge mono">{evtRate}</span>
        </div>
        <div className="stream-controls">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="stream-pause-btn mono"
            style={{ color: isPaused ? '#38bdf8' : '#a1a1aa' }}
          >
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>

      <div className="stream-list mono">
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#71717a', fontSize: '12px' }}>
            No events recorded yet. Connect an app to start streaming!
          </div>
        ) : (
          events.map(ev => {
            const isErr = ev.status >= 400;
            const is202 = ev.status === 202;
            const badgeCls = isErr ? 'badge-status-500' : is202 ? 'badge-status-202' : 'badge-status-200';
            const isNew = newIds.has(ev.id);

            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="stream-row"
                style={isNew ? { background: 'rgba(56,189,248,0.05)', animation: 'fadeIn 0.3s ease-out' } : undefined}
              >
                <div className="stream-left">
                  <span className={`event-type-badge ${badgeCls}`}>
                    {ev.status === 200 ? '200 OK' : ev.status === 202 ? '202 ACCEPT' : `${ev.status} ERR`}
                  </span>
                  <div className="event-info-col">
                    <span className="event-name-text">{ev.event}</span>
                    <span className="event-source-text">
                      {ev.distinctId} · {ev.properties?.path || ev.properties?.screen || 'payload'}
                    </span>
                  </div>
                </div>

                <div className="stream-right">
                  <span className="event-latency-text">{ev.latencyMs} ms</span>
                  <span className="event-time-text" suppressHydrationWarning>
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
