# OpenPulse — UI/UX Design System Specifications

OpenPulse follows an **information-dense, technical aesthetic** engineered specifically for developers and engineering teams. The design prioritizes scanability, high data density, monospaced numeric readouts, crisp micro-borders, and keyboard navigation.

---

## 1. Design Tokens & Visual Hierarchy

### 1.1 Color Palette (Dark-Mode First & Light-Mode Complement)

```css
:root {
  /* Surface & Background (Dark Theme Default) */
  --bg-canvas: #090a0f;           /* Deepest obsidian black */
  --bg-surface: #11131a;          /* Elevated card/table container */
  --bg-subtle: #191c26;           /* Hover states, active items */
  --bg-muted: #242938;            /* Secondary containers, code blocks */

  /* Borders & Dividers */
  --border-subtle: #1e2230;       /* Hairline dividers, card outlines */
  --border-muted: #2e344a;        /* Input borders, active focus outlines */
  --border-strong: #475070;       /* Emphasized boundaries */

  /* Text & Typography */
  --text-primary: #f1f5f9;        /* High-contrast headings and active labels */
  --text-secondary: #94a3b8;      /* Body copy, metric descriptions */
  --text-muted: #64748b;          /* Timestamps, empty state captions */
  --text-disabled: #475569;

  /* Brand & Telemetry Accents */
  --accent-cyan: #06b6d4;         /* Primary brand pulse, active navigation */
  --accent-cyan-glow: rgba(6, 182, 212, 0.15);
  --accent-blue: #3b82f6;         /* Secondary links, interactive selections */
  --accent-violet: #8b5cf6;       /* Advanced query functions, experiments */

  /* Telemetry Status Codes */
  --status-emerald: #10b981;      /* 2xx Success, healthy releases, positive conversion */
  --status-amber: #f59e0b;        /* 4xx Warning, slow query, degraded vital */
  --status-rose: #f43f5e;         /* 5xx Error, fatal exception, conversion drop */
  --status-indigo: #6366f1;       /* Informational, feature flag variants */
}
```

---

## 2. Typography

OpenPulse employs a dual-font pairing:
1. **Primary Interface Font**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
   - High legibility at small point sizes (11px, 12px, 13px) for dense data tables.
2. **Telemetry & Code Font**: `JetBrains Mono`, `Fira Code`, `monospace`
   - Used universally for timestamps, UUIDs, event names, query metrics, latency values, and code snippets.

### Scale & Weight
| Token | Font Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-xs` | 11px (0.6875rem) | 14px | 400 / 500 | Table cell metadata, badges, timestamps |
| `text-sm` | 13px (0.8125rem) | 18px | 400 / 500 | Standard table cells, button labels, navigation |
| `text-base` | 14px (0.875rem) | 20px | 500 / 600 | Card titles, form inputs, primary table headers |
| `text-lg` | 16px (1.0rem) | 24px | 600 | Section headers, modal titles |
| `text-xl` | 20px (1.25rem) | 28px | 600 | Page titles, major section anchors |
| `stat-lg` | 28px (1.75rem) | 32px | 700 (Mono) | Real-time event counter, active user KPI stats |

---

## 3. Spacing & Radius Rhythm

- **Grid Base Unit**: `4px` (Spacing scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px).
- **Component Border Radius**:
  - Small elements (Badges, tags, table pills): `4px` (`rounded-sm`).
  - Inputs, buttons, dropdowns: `6px` (`rounded-md`).
  - Cards, modals, dashboard widgets: `8px` (`rounded-lg`).
  - No rounded pills (`rounded-full`) on cards to maintain an architectural, technical look.

---

## 4. Core Component Specs

### 4.1 Buttons & Action Triggers
- **Primary**: Solid cyan/blue accent with high contrast white text. Subtle hover glow.
- **Secondary**: Dark surface (`--bg-surface`) with 1px hairline border (`--border-subtle`).
- **Ghost**: Transparent background; visible border on hover.
- **Destructive**: Subdued rose background (`rgba(244, 63, 94, 0.1)`) with rose text (`--status-rose`).

### 4.2 High-Density Data Tables
- Header: Sticky top, height 36px, uppercase 11px text with sorting indicators.
- Row: Height 40px, zebra striping with subtle hover highlight (`--bg-subtle`).
- Monospace cells: Timestamp, Event Name, Distinct ID, Duration, Status Code.

### 4.3 Telemetry Badges & Chips
- Compact height (20px), monospace font, 11px.
- Status variants:
  - Success: `bg-emerald-950/40 text-emerald-400 border border-emerald-800/50`
  - Warning: `bg-amber-950/40 text-amber-400 border border-amber-800/50`
  - Error: `bg-rose-950/40 text-rose-400 border border-rose-800/50`
  - Neutral: `bg-slate-900 text-slate-300 border border-slate-700/60`

### 4.4 Real-Time Sparklines & Charts
- Thin 1.5px stroke paths with smooth cubic bezier interpolation or clean stepped lines.
- Subtle vertical hover crosshairs displaying precise coordinate tooltips.
- Zero chart clutter: hidden axes gridlines except subtle dashed horizontal ticks.
