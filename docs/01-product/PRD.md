# OpenPulse — Product Requirements Document (PRD)

## 1. Executive Summary

**OpenPulse** is an open-source, privacy-first, developer-focused analytics and telemetry platform. Designed to offer self-hostable telemetry with sub-second analytical query performance, OpenPulse bridges the gap between high-overhead enterprise observability platforms (e.g., Datadog) and generic SaaS product analytics tools (e.g., Mixpanel, Amplitude, PostHog Cloud).

OpenPulse enables engineering teams, tech leads, and DevOps engineers to capture, store, and analyze high-velocity event streams, application errors, Web Vitals performance telemetry, conversion funnels, and feature flag experimentation from a single, unified, high-density dashboard.

---

## 2. Problem Statement

Modern software teams face significant challenges with contemporary analytics and observability tools:

1. **Astronomical SaaS Cost Scaling**: Traditional analytics platforms price by monthly tracked users (MTU) or event volume with steep markups, forcing teams to throttle or sample their telemetry.
2. **Data Privacy & Regulatory Risk**: Sending user interactions, session metadata, and application errors to third-party multi-tenant clouds exposes organizations to GDPR, HIPAA, and CCPA compliance vulnerabilities.
3. **Fragmented Tooling**: Engineering teams currently juggle separate tools for product analytics (Mixpanel), error tracking (Sentry), session insights, and feature flagging (LaunchDarkly), leading to fragmented context.
4. **Low-Density, Inefficient Dashboards**: Modern SaaS analytics dashboards prioritize consumer-style whitespace over the high information density, rapid keyboard navigation, and fast filtering developers need to debug issues quickly.

---

## 3. Product Vision & Value Proposition

- **100% Data Sovereignty**: First-class self-hosting with a single `docker compose up` command. All event data lives within the user's infrastructure.
- **Extreme Query Speed via ClickHouse**: Columnar storage engine capable of querying billions of events with sub-second latencies using vectorized execution and analytical primitives (`windowFunnel`, `retention`).
- **Universal Multi-Platform Instrumentation**: Standardized event schema supported across Web (JS, React), Desktop (Tauri), Mobile (Flutter, React Native, iOS, Android), and Backend (Node, Python, Go, Rust).
- **Developer-Centric UX**: Utilitarian, information-dense, dark-mode-first dashboard engineered for rapid scanning, monospace readouts, keyboard shortcuts, and deep SQL/query inspectability.

---

## 4. Target Users & Personas

### Primary Personas

1. **Frontend & Fullstack Developers**
   - *Needs*: Dead-simple SDK setup, automatic pageview and Web Vitals capture, real-time event debugging, and immediate error correlation.
   - *Goal*: Verify feature releases and identify client crashes without leaving their developer workflow.

2. **Tech Leads & Engineering Managers**
   - *Needs*: High-level system health, user onboarding funnels, cohort retention curves, release adoption velocity, and feature flag impact.
   - *Goal*: Make data-driven decisions on feature rollouts and product performance.

3. **DevOps & Platform Engineers**
   - *Needs*: Predictable infrastructure footprint, low resource overhead, seamless containerized deployment, clear backup/restore routines, and zero data leakage.
   - *Goal*: Maintain a reliable self-hosted analytics cluster that scales without maintenance headaches.

---

## 5. Core Feature Requirements

### 5.1 Universal Event Ingestion
- Ingest single events (`POST /api/v1/e`) and batches of up to 500 events (`POST /api/v1/batch`).
- High-throughput buffering via Redis Streams to protect ClickHouse from part fragmentation.
- Automatic client clock skew recalibration using `sent_at` vs. server receipt timestamps.
- Non-blocking O(1) API key authentication via cached Redis sets.

### 5.2 Analytics & Exploration
- **Real-Time Stream**: Live event feed with millisecond timestamps, property inspector, and pause/resume capability.
- **Query Explorer**: Dynamic breakdown by any property (browser, OS, country, custom tags), date ranges, and event counts.
- **Conversion Funnels**: Multi-step conversion funnels calculated via ClickHouse `windowFunnel()` within configurable time windows (e.g., 10 minutes, 1 day).
- **Cohort Retention**: N-day/week cohort retention matrices calculated via ClickHouse `retention()`.
- **User Timelines & Journeys**: Chronological audit trail of all actions performed by a specific `distinct_id`.

### 5.3 Application Stability & Performance
- **Error Tracking**: Grouped client and server exceptions categorized by fingerprint, stacktrace, and release version.
- **Web Vitals Telemetry**: Continuous tracking of Core Web Vitals (LCP, FID, CLS, INP, TTFB) with p50, p75, and p90 percentiles.
- **Release Health**: Compare crash rates, error frequencies, and adoption percentages across software versions.

### 5.4 Feature Flags & A/B Experimentation
- Boolean and multivariate feature flags evaluated in sub-millisecond local SDK cache or via `/api/v1/decide`.
- Gradual percentage rollouts and user attribute targeting rules.
- Statistical significance evaluation of experiment variants against conversion metrics.

---

## 6. Success Metrics & KPIs

- **Query Latency**: 95th percentile query response < 500ms across 10 million events.
- **Ingestion Throughput**: Capable of ingesting > 25,000 events/second on standard 4-core, 8GB RAM host.
- **Deployment Velocity**: Initial self-hosted deployment running in under 5 minutes from repository clone.
- **Client SDK Footprint**: Core Web SDK bundle size < 12KB minified and gzipped.
