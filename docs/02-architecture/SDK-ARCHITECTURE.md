# OpenPulse — SDK Architecture & Multi-Platform Strategy

OpenPulse SDKs follow a **layered modular architecture**. A single, framework-agnostic TypeScript core engine (`@openpulse/sdk-core`) encapsulates all state, queueing, identity management, and retry logic, while platform-specific layers provide idiomatic bindings and auto-instrumentation.

---

## 1. SDK Tier Hierarchy

```
                      ┌──────────────────────────────┐
                      │    @openpulse/sdk-core       │
                      │  - Event Queue & Batching    │
                      │  - Identity & Distinct ID    │
                      │  - Session Window Calculator │
                      │  - Storage Adapter Interface │
                      │  - Transport & Exponential   │
                      │    Backoff Retry Engine      │
                      └──────────────┬───────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
 ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
 │ @openpulse/sdk-js │     │@openpulse/sdk-node│     │  Mobile / Desktop │
 │ - DOM Autocapture │     │ - HTTP Middleware │     │ - Flutter / Dart  │
 │ - Web Vitals API  │     │ - Async Context   │     │ - React Native    │
 │ - LocalStorage /  │     │ - In-memory queue │     │ - Tauri (Rust/TS) │
 │   IndexedDB       │     │                   │     │ - iOS / Android   │
 └─────────┬─────────┘     └───────────────────┘     └───────────────────┘
           │
           ▼
 ┌───────────────────┐
 │@openpulse/sdk-react│
 │ - Context Provider│
 │ - useOpenPulse()  │
 │ - Route Listener  │
 └───────────────────┘
```

---

## 2. Core Queue & Transport Lifecycle

### 2.1 Batching & Flushing
1. When `openpulse.track(event, properties)` is called, the core engine serializes the event and adds it to an in-memory queue.
2. The queue automatically flushes when either condition is met:
   - **Batch Threshold**: Queue size reaches `max_batch_size` (default: 30 events).
   - **Time Interval**: Timer reaches `flush_interval_ms` (default: 3,000ms).
3. On web browsers, the SDK listens to `visibilitychange` and `beforeunload` events, triggering an immediate synchronous flush via `navigator.sendBeacon`.

### 2.2 Storage Adapters & Offline Resilience
- When the device is offline or the server returns `503 Service Unavailable` or `429 Too Many Requests`:
  - Web: Events spill over from memory to **IndexedDB** (with a fallback to **LocalStorage** if IndexedDB is blocked).
  - Node/Server: In-memory ring buffer with a configurable cap (default 10,000 events) to prevent memory exhaustion.
- When network connectivity restores, buffered events are dispatched with exponential backoff and randomized jitter:
  $$\text{Delay} = \min(\text{max\_delay}, \text{base\_delay} \times 2^{\text{attempt}}) \pm \text{jitter}$$

---

## 3. Session & Identity Lifecycle

- **Anonymous Distinct ID**: On first initialization, the SDK checks for a stored UUID in persistent storage. If none exists, it generates a cryptographically secure UUIDv4 and stores it.
- **Session ID (`session_id`)**:
  - Automatically created on initialization.
  - Features a **30-minute sliding inactivity window**: every tracked event updates `last_activity_timestamp`.
  - If the gap between events exceeds 30 minutes, a new `session_id` is generated and a `$session_start` event is emitted.
- **Identity Linking (`identify`)**:
  - Calling `openpulse.identify(userId, userProperties)` aliases the anonymous ID with the permanent user identifier and emits an `$identify` system event.
  - Subsequent events carry the confirmed `distinct_id`.
  - Calling `openpulse.reset()` clears all stored identities, tokens, and active sessions (ideal for user logout).

---

## 4. Web Auto-Instrumentation

### 4.1 Page Views
Automatically observes browser History API (`pushState`, `replaceState`) and `popstate` events to emit `$pageview` events on client-side routing transitions (Next.js, React Router, Vue Router).

### 4.2 Web Vitals
Wraps the modern `web-vitals` library to track Core Web Vitals:
- **LCP** (Largest Contentful Paint)
- **FID** / **INP** (First Input Delay / Interaction to Next Paint)
- **CLS** (Cumulative Layout Shift)
- **FCP** (First Contentful Paint)
- **TTFB** (Time to First Byte)

### 4.3 Error Tracking
Hooks into `window.onerror` and `window.onunhandledrejection` to catch uncaught runtime exceptions, serialize stack frames, and emit `$exception` events with source location fingerprints.
