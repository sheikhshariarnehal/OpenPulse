'use client';

import { useEffect, useRef, useState } from 'react';

interface TelemetryChartProps {
  initialEvents?: { timestamp: string }[];
  workspaceSlug?: string;
}

export function TelemetryChart({ initialEvents = [], workspaceSlug }: TelemetryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [range, setRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [events, setEvents] = useState<{ timestamp: string }[]>(initialEvents);

  // Poll for latest events if workspaceSlug is provided
  useEffect(() => {
    if (!workspaceSlug) return;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/analytics/events?workspace=${workspaceSlug}&limit=1000`);
        const data = await res.json();
        if (data.events) {
          setEvents(prev => {
            if (prev.length === data.events.length) return prev;
            return data.events;
          });
        }
      } catch {}
    };
    const timer = setInterval(fetchLatest, 5000);
    return () => clearInterval(timer);
  }, [workspaceSlug]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderChart = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const now = Date.now();
      let windowMs = 24 * 60 * 60 * 1000;
      let bucketCount = 24;

      if (range === '1h') {
        windowMs = 60 * 60 * 1000;
        bucketCount = 12;
      } else if (range === '7d') {
        windowMs = 7 * 24 * 60 * 60 * 1000;
        bucketCount = 7;
      } else if (range === '30d') {
        windowMs = 30 * 24 * 60 * 60 * 1000;
        bucketCount = 30;
      }

      const bucketSizeMs = windowMs / bucketCount;
      const startTime = now - windowMs;
      const counts: number[] = new Array(bucketCount).fill(0);

      events.forEach(e => {
        const t = new Date(e.timestamp).getTime();
        if (t >= startTime && t <= now) {
          const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor((t - startTime) / bucketSizeMs)));
          counts[idx]++;
        }
      });

      const maxVal = Math.max(...counts, 1);
      const midVal = Math.round(maxVal / 2);

      // Subtle grid lines
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      [0.2, 0.5, 0.8].forEach(pct => {
        ctx.beginPath();
        ctx.moveTo(35, h * pct);
        ctx.lineTo(w, h * pct);
        ctx.stroke();
      });

      ctx.setLineDash([]);
      ctx.fillStyle = '#71717a';
      ctx.font = '10px Geist Mono, monospace';
      ctx.fillText(String(maxVal), 8, h * 0.2 + 3);
      ctx.fillText(String(midVal), 8, h * 0.5 + 3);
      ctx.fillText('0', 8, h * 0.8 + 3);

      // Bottom time ticks
      if (range === '1h') {
        ctx.fillText('-60m', 38, h - 6);
        ctx.fillText('-45m', w * 0.28, h - 6);
        ctx.fillText('-30m', w * 0.52, h - 6);
        ctx.fillText('-15m', w * 0.76, h - 6);
        ctx.fillText('Now', w - 30, h - 6);
      } else if (range === '24h') {
        ctx.fillText('-24h', 38, h - 6);
        ctx.fillText('-18h', w * 0.28, h - 6);
        ctx.fillText('-12h', w * 0.52, h - 6);
        ctx.fillText('-6h', w * 0.76, h - 6);
        ctx.fillText('Now', w - 30, h - 6);
      } else {
        ctx.fillText(`-${range}`, 38, h - 6);
        ctx.fillText('Mid', w * 0.52, h - 6);
        ctx.fillText('Now', w - 30, h - 6);
      }

      // Compute point coordinates
      const startX = 35;
      const stepX = (w - startX - 10) / (bucketCount - 1);
      const pts: { x: number; y: number }[] = [];

      for (let i = 0; i < bucketCount; i++) {
        const x = startX + i * stepX;
        const normalized = counts[i] / maxVal;
        // top = 0.2, bottom = 0.8
        const y = h * 0.8 - normalized * (h * 0.6);
        pts.push({ x, y });
      }

      // Gradient fill under curve
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.03)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.beginPath();
      ctx.moveTo(pts[0].x, h * 0.8);
      ctx.lineTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const midX = (prev.x + curr.x) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, (prev.y + curr.y) / 2);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.lineTo(pts[pts.length - 1].x, h * 0.8);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Curve line
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const midX = (prev.x + curr.x) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, (prev.y + curr.y) / 2);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Data points dots
      pts.forEach((p, idx) => {
        if (counts[idx] > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#09090b';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
    };

    renderChart();

    const resizeObserver = new ResizeObserver(() => {
      renderChart();
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [range, events]);

  return (
    <div className="chart-panel">
      <div className="panel-header">
        <div className="panel-title-block">
          <h3 className="panel-title">Ingestion Velocity & Throughput</h3>
          <p className="panel-desc">Real-time vectorized telemetry batches into ClickHouse</p>
        </div>

        <div className="chart-time-selectors">
          {(['1h', '24h', '7d', '30d'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`time-chip ${range === r ? 'active' : ''}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-viewport">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
    </div>
  );
}
