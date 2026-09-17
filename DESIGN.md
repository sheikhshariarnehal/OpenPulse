# OpenPulse Design System (shadcn/ui Modern Analytics)

## 1. Visual Philosophy & Aesthetic
OpenPulse adheres to the **Modern Analytic shadcn/ui** design system — tailored specifically for high-velocity telemetry, sub-second query exploration, and developer ergonomics:
- **Palette Foundation**: Zinc-950 dark theme (`#09090b`) with hairline zinc borders (`#27272a`), muted slate cards (`#0c0c0e`), and high-contrast foreground typography (`#fafafa`).
- **Accent Signals**: Electric cyan/sky (`#38bdf8`) for telemetry traces and active states, emerald (`#10b981`) for healthy HTTP 2xx/SLA indicators, amber (`#f59e0b`) for warnings, and rose (`#f43f5e`) for uncaught error spikes.
- **Utilitarian Density**: Zero fluffy marketing whitespace. 12px/16px padding grids, 48px header rows, 30px compact controls, and tabular monospaced figures (`Geist Mono`, `JetBrains Mono`).

---

## 2. Design Tokens (CSS Variables)

```css
:root {
  --background: #09090b;             /* Zinc 950 */
  --foreground: #fafafa;             /* Zinc 50 */
  --card: #0c0c0e;                   /* Elevated surface */
  --card-border: #27272a;            /* Zinc 800 */
  --card-foreground: #fafafa;
  --popover: #09090b;
  --popover-border: #27272a;
  --primary: #fafafa;                /* High-contrast action */
  --primary-foreground: #09090b;
  --secondary: #18181b;              /* Zinc 900 */
  --secondary-foreground: #fafafa;
  --muted: #18181b;
  --muted-foreground: #a1a1aa;       /* Zinc 400 */
  --accent: #27272a;
  --accent-foreground: #fafafa;
  --destructive: #7f1d1d;
  --destructive-foreground: #fca5a5;
  --border: #27272a;                 /* 1px hairline */
  --border-subtle: #1f1f23;
  --ring: #d4d4d8;
  --radius: 8px;

  /* Telemetry Status Tokens */
  --emerald: #10b981;
  --emerald-subtle: rgba(16, 185, 129, 0.12);
  --cyan: #06b6d4;
  --cyan-subtle: rgba(6, 182, 212, 0.12);
  --amber: #f59e0b;
  --amber-subtle: rgba(245, 158, 11, 0.12);
  --rose: #f43f5e;
  --rose-subtle: rgba(244, 63, 94, 0.12);
  --sky: #38bdf8;
}
```

---

## 3. Core Component Library

### A. Team / Multi-Workspace Switcher (`TeamSwitcher`)
- **Affordance**: Compact trigger in the top left sidebar showing current workspace logo, title (`Acme Corp`), and tier (`Enterprise Dedicated`), with Lucide `ChevronsUpDown` icon.
- **Popover Dropdown**: Radix-style popover listing all user workspaces with checkmark on active, shortcut keys, and a dedicated `+ Create Workspace` action button.
- **Create Workspace Dialog**: Modal dialog with backdrop blur (`backdrop-filter: blur(4px)`), form fields for Workspace Name, Slug (auto-derived), Storage/Shard allocation, and action buttons (`Cancel`, `Create Workspace`).

### B. Global Navigation & Command Menu
- **Breadcrumb Navigation**: `Workspaces / [Workspace Name] / Telemetry Analytics`.
- **Command Search Trigger (`⌘K`)**: Centralized command bar opening the filterable Command Palette modal for instant keyboard navigation across queries, views, and documentation.
- **Date Range Picker**: Segmented popover (`Last 24 Hours`, `Last 7 Days`, `Last 30 Days`, `Custom Range`).

### C. KPI Metric Card System (4-Grid)
1. **Total Ingested Events**: Large bold 22px mono count with positive trend badge (+14.2% vs previous 24h).
2. **p95 Ingestion Latency**: Real-time SLA tracker displaying sub-millisecond p95 (0.42 ms) with SLA margin badge.
3. **Active ClickHouse Shards**: Replicated cluster health (8 Nodes) with 0 replication lag readout.
4. **Uncaught Error Rate**: Percentage readout (0.02%) with delta compared to current active deployment release.

### D. Ingestion Velocity & Telemetry Chart
- **Visual Style**: Smooth cubic Bézier area chart rendered on high-DPI Canvas with electric cyan stroke (`#38bdf8`), subtle vertical gradient fill (`rgba(56, 189, 248, 0.28)` to `transparent`), hairline dotted graticule lines (`#27272a`), and time resolution selectors (`1h`, `24h`, `7d`, `30d`).

### E. Real-Time Live Event Feed & Inspector Sheet
- **Live Feed**: Monospaced tabular rows with HTTP status badges (`200 OK`, `202 ACCEPT`, `500 ERR`), event names (`$pageview`, `checkout_step`, `api.telemetry_batch`), source metadata, and sub-millisecond latencies.
- **Interactivity**: Pause/Resume streaming toggle, live throughput badge (`1,420 evt/s`).
- **Payload Inspector Drawer**: Slide-over panel opening on row click to display formatted JSON event properties, user agents, distinct IDs, and shard routing tags.

---

## 4. Typography Scale

| Token | Family | Weight | Size / Line Height | Usage |
|---|---|---|---|---|
| Display | Geist / Inter | 600 SemiBold | 18px / 24px | Page titles |
| Headings | Geist / Inter | 600 SemiBold | 13.5px / 18px | Card titles, modal headers |
| Body | Geist / Inter | 400 Regular | 12.5px / 16px | Nav links, form labels |
| Data Readout | Geist Mono / JetBrains | 700 Bold | 22px / 26px | KPI figures, aggregate counts |
| Telemetry Mono | Geist Mono / JetBrains | 400/500 | 10.5px / 14px | Status pills, latencies, timestamps |
