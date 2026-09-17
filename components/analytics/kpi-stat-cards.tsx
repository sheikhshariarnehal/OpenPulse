import { Activity, Clock, Server, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function KpiStatCards({
  totalEvents = 0,
  p95Latency = '0.00 ms',
  activeNodes = '1 Node (Docker)',
  errorRate = '0.00%'
}: {
  totalEvents?: number;
  p95Latency?: string;
  activeNodes?: string;
  errorRate?: string;
}) {
  return (
    <div className="kpi-grid">
      {/* 1. Total Ingested Events */}
      <div className="kpi-card">
        <div className="kpi-top">
          <span className="kpi-label">Total Ingested Events</span>
          <Activity className="kpi-icon" />
        </div>
        <div className="kpi-metric mono">
          {totalEvents.toLocaleString()}
        </div>
        <div className="kpi-footer">
          <span className="trend-pos">
            <ArrowUpRight style={{ width: '12px', height: '12px' }} />
            Live
          </span>
          <span>vectorized ClickHouse stream</span>
        </div>
      </div>

      {/* 2. p95 Ingestion Latency */}
      <div className="kpi-card">
        <div className="kpi-top">
          <span className="kpi-label">p95 Pipeline Latency</span>
          <Clock className="kpi-icon" />
        </div>
        <div className="kpi-metric mono" style={{ color: '#38bdf8' }}>
          {p95Latency}
        </div>
        <div className="kpi-footer">
          <span className="trend-pos">
            <ArrowDownRight style={{ width: '12px', height: '12px' }} />
            Sub-10ms
          </span>
          <span>ClickHouse HTTP batch ingestion</span>
        </div>
      </div>

      {/* 3. Active ClickHouse Nodes */}
      <div className="kpi-card">
        <div className="kpi-top">
          <span className="kpi-label">Active ClickHouse Shards</span>
          <Server className="kpi-icon" />
        </div>
        <div className="kpi-metric mono">
          {activeNodes}
        </div>
        <div className="kpi-footer">
          <span className="trend-neutral">Healthy</span>
          <span>Docker Container · Port 8123</span>
        </div>
      </div>

      {/* 4. Uncaught Error Rate */}
      <div className="kpi-card">
        <div className="kpi-top">
          <span className="kpi-label">Uncaught Error Rate</span>
          <AlertTriangle className="kpi-icon" />
        </div>
        <div className="kpi-metric mono" style={{ color: errorRate === '0.00%' ? '#10b981' : '#f59e0b' }}>
          {errorRate}
        </div>
        <div className="kpi-footer">
          <span className="trend-pos">
            0 Fatal
          </span>
          <span>HTTP 4xx/5xx pipeline health</span>
        </div>
      </div>
    </div>
  );
}
