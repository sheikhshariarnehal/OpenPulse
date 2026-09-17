# OpenPulse — Screen Specifications & Surface Registry

This document defines the layout, primary metrics, components, and interactions across all 17 core dashboard surfaces in OpenPulse.

---

## Screen Directory

```text
├── 01. Dashboard (Overview)
├── 02. Realtime Stream
├── 03. Events Explorer
├── 04. Users / People
├── 05. Sessions Explorer
├── 06. Funnels
├── 07. Retention Matrices
├── 08. Cohorts
├── 09. User Journeys
├── 10. Errors & Exceptions
├── 11. Performance & Web Vitals
├── 12. Releases
├── 13. Feature Flags
├── 14. Experiments (A/B)
├── 15. Custom Dashboards
├── 16. Alerts
└── 17. Settings & Integrations
```

---

## 1. Primary Analytics Surfaces

### 01. Dashboard (Overview)
- **Purpose**: System health snapshot, primary KPIs, and active metrics over 24 hours / 7 days.
- **Components**:
  - Top Metric Bar: Total Events (24h), Active Users (30m), Error Rate (%), p75 Web Vitals.
  - Multi-series Area Chart: Ingestion velocity (events/min) broken down by environment (prod, staging).
  - Quick Conversion Funnel widget.
  - Top 5 active client platforms & countries table.

### 02. Realtime Stream
- **Purpose**: Live, sub-second feed of incoming telemetry events with zero page reload.
- **Components**:
  - Status Ribbon: Live connection beacon, events/sec counter, Pause/Resume toggle, Sound toggle.
  - Stream Table: Timestamp (ms), Event Name pill, Distinct ID, Client OS/Browser, Current URL.
  - Slide-over Drawer: Clicking any row opens the full formatted JSON payload with property copy buttons.

### 03. Events Explorer
- **Purpose**: SQL-like query builder and historical event investigation.
- **Components**:
  - Filter Bar: Date range selector (Last 15m, 1h, 24h, 7d, 30d, custom), Event Name filter, Property condition builder (`WHERE $browser = 'Chrome' AND plan = 'enterprise'`).
  - Breakdown Dropdown: Group by property (e.g., `$country`, `release`).
  - Time-series Bar/Line Chart with hover inspector.
  - Paginated Results Table with expandable JSON detail rows.

### 04. Users / People
- **Purpose**: User identity directory and individual customer profiles.
- **Components**:
  - User Directory Table: Distinct ID, Email, First Seen, Last Active, Total Event Count, Device.
  - User Profile View:
    - User Metadata card (IP, location, custom user properties).
    - Chronological activity timeline with event pills and duration markers.

### 05. Sessions Explorer
- **Purpose**: Aggregate and investigate individual user browsing sessions.
- **Components**:
  - Session Duration Distribution histogram.
  - Sessions Table: Session ID, User Distinct ID, Start Time, Duration, Pages Visited, Entry Page, Exit Page.
  - Session Detail View: Sequence of events within that session with elapsed time deltas.

---

## 2. Advanced Funnel & Behavior Surfaces

### 06. Funnels
- **Purpose**: Track user drop-offs across sequential actions.
- **Components**:
  - Step Builder: Add step `[Event 1]` $\rightarrow$ `[Event 2]` $\rightarrow$ `[Event 3]` with optional property filters per step.
  - Conversion Window: Set maximum allowable time to complete (e.g. 10 minutes, 1 day, 7 days).
  - Horizontal Funnel Chart: Step drop-off bars with conversion percentage and absolute drop count.
  - Breakdown Table: Conversion rate by country, device, or campaign source.

### 07. Retention Matrices
- **Purpose**: Measure cohort retention and user stickiness over days/weeks/months.
- **Components**:
  - Cohort Setup: First event (e.g., `$pageview` or `signup`) and return event.
  - Retention Heatmap Grid: Rows for each cohort week; columns for Day/Week 0, 1, 2, ... with color-coded intensity cells.

### 08. Cohorts
- **Purpose**: Define dynamic or static groups of users based on behavioral conditions.
- **Components**:
  - Cohort Rule Builder: e.g. "Users who performed `checkout` more than 2 times in the last 30 days".
  - Cohort List with active member count and export button (CSV / Webhook).

### 09. User Journeys
- **Purpose**: Sankey diagram visualization of paths users take before or after a target event.
- **Components**:
  - Anchor Event selector (e.g. "Paths leading up to `churn`" or "Paths following `signup`").
  - Interactive Sankey graph showing path branches, widths proportional to user volume.

---

## 3. Observability & Performance Surfaces

### 10. Errors & Exceptions
- **Purpose**: Grouped crash reporting and exception triage for frontend and backend apps.
- **Components**:
  - Error Groups Table: Fingerprint, Exception Type, Error Message, First Seen, Last Seen, Occurrence Count, Impacted Users.
  - Error Detail View:
    - Stack trace viewer with syntax highlighting and collapsible library frames.
    - Breadcrumbs timeline: The last 10 user events leading up to the crash.

### 11. Performance & Web Vitals
- **Purpose**: Continuous Core Web Vitals monitoring and frontend performance tracking.
- **Components**:
  - Metric Scorecards: LCP, FID, CLS, INP, TTFB with Good / Needs Improvement / Poor thresholds.
  - Percentile Distribution charts (p50, p75, p90) over time.
  - Slowest Pages Table ranked by 75th percentile LCP.

### 12. Releases
- **Purpose**: Monitor the adoption and stability of new software deployments.
- **Components**:
  - Releases Table: Version tag (e.g., `v1.4.2`), First Seen, Active Sessions, Crash-Free Session Percentage (e.g., 99.82%).
  - Version Adoption Area Chart showing rollouts over time.

---

## 4. Experimentation & Management Surfaces

### 13. Feature Flags
- **Purpose**: Create, toggle, and target runtime feature flags.
- **Components**:
  - Flags Table: Flag Key (`new_nav_menu`), Name, Status (Active/Inactive), Rollout (%), Environments.
  - Flag Editor: Percentage rollout slider, targeting rules by user property, multivariate variant builder.

### 14. Experiments (A/B)
- **Purpose**: Run statistical experiments comparing variant conversion rates.
- **Components**:
  - Experiment Dashboard: Control vs Variant A/B conversion rates, sample size, statistical significance ($p$-value / confidence interval).

### 15. Custom Dashboards
- **Purpose**: Multi-widget analytical dashboards built with drag-and-drop grid.
- **Components**:
  - Responsive Grid (`react-grid-layout` style) with resizeable cards.
  - Widget Creator: Line, Bar, Metric KPI Stat, Data Table, Funnel preview.

### 16. Alerts
- **Purpose**: Trigger notifications when metrics cross critical thresholds.
- **Components**:
  - Alert Rule Builder: Condition (e.g. `Error rate > 2% over 15m`), Threshold, Notification channels (Slack Webhook, Discord, Email).
  - Incident History log.

### 17. Settings & Integrations
- **Purpose**: Manage project keys, team members, and data retention.
- **Components**:
  - Project Settings: Name, slug, timezone, data retention TTL (days).
  - API Keys Manager: Generate new keys with copy-once token modal, revoke key.
  - Team & RBAC: Invite members, assign roles (Owner, Admin, Member, Viewer).
  - Data Export & GDPR: Batch export and user deletion requests.
