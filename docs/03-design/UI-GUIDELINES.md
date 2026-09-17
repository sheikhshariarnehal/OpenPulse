# OpenPulse — UI Guidelines & Information-Dense Design Patterns

These guidelines establish design and implementation rules for creating a cohesive, high-performance developer analytics interface across OpenPulse.

---

## 1. Information-Density Rules

Developers use OpenPulse to triage issues, observe live telemetry, and analyze funnel metrics. The interface must minimize wasteful whitespace while avoiding cognitive clutter.

1. **Compact Vertical Rhythm**: Table rows must not exceed 40px in standard density mode. A toggle for "Dense Mode" (32px row height) should be available in high-volume views (Live Events, Error Log).
2. **Monospace for Data Precision**:
   - Timestamps (`13:45:02.812`), UUIDs (`7c9e-6679`), IPs (`192.168.1.0`), Status Codes (`200 OK`, `500 ERR`), and Latencies (`42.8ms`) must strictly render in `JetBrains Mono` or monospace.
3. **Numeric Formatting Standards**:
   - Event Counts: Format compactly with one decimal when $> 1,000$ (e.g. `14.2K`, `1.8M`). Exact counts are displayed on tooltip hover (`1,842,912 events`).
   - Latencies: Display in milliseconds (`ms`) under 1,000ms; seconds (`s`) above 1,000ms.
   - Percentages: Strictly one decimal place (e.g., `42.8%`, `99.9%`).
4. **Data Table Alignments**:
   - Text & Event Names: **Left-aligned**.
   - Timestamps & Dates: **Left-aligned** with fixed monospace width.
   - Numeric Metrics, Counts, Latencies, & Percentages: **Right-aligned**.
   - Status Badges & Action Menus: **Centered**.

---

## 2. Keyboard Navigation & Command Palette

OpenPulse is fully operable without a mouse.

### 2.1 Command Palette (`Cmd+K` / `Ctrl+K`)
Pressing `Cmd+K` anywhere opens the fuzzy search command palette with instant shortcuts:
- Jump to Screen: `> Realtime`, `> Events`, `> Funnels`, `> Errors`, `> Settings`
- Switch Projects: Search across all projects in the current organization.
- Run Action: `New Dashboard`, `Create API Key`, `New Feature Flag`.

### 2.2 Global Two-Key Chords
- `g` `h` $\rightarrow$ Go to Home / Primary Dashboard
- `g` `r` $\rightarrow$ Go to Real-Time Feed
- `g` `e` $\rightarrow$ Go to Events Explorer
- `g` `f` $\rightarrow$ Go to Funnels
- `g` `x` $\rightarrow$ Go to Errors
- `/` $\rightarrow$ Focus primary search or filter bar on the current screen
- `Esc` $\rightarrow$ Close modal, drawer, or unfocus filter

---

## 3. Micro-Interactions & State Indicators

### 3.1 Live Telemetry "Pulse" Indicator
- The real-time view features an active pulsating beacon:
  - Green pulsing dot (`#10b981`) with radar wave animation indicating live incoming SSE stream.
  - Pausing the stream turns the indicator to static amber (`#f59e0b`).
  - Disconnect or network error transitions the indicator to red (`#f43f5e`) with auto-reconnect countdown.

### 3.2 Loading States
- **Never use full-page spinner overlays**.
- Use **shimmer skeleton rows** matching the exact height and columns of data tables.
- Chart loading states show the chart bounding box with a pulsing gradient background.

### 3.3 Empty States
- When a project has no events yet:
  - Provide a clean snippet selector (e.g. `JavaScript`, `React`, `Node.js`, `cURL`) showing the 3-line quickstart code with the project's actual API key pre-filled.
  - Render a live listener waiting for the first ping: `"Waiting for your first event..."` that automatically transitions to the dashboard upon receipt.
