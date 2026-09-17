# OpenPulse — Universal Event Schema & Property Registry

OpenPulse uses a single canonical event schema across all client SDKs (Web, Mobile, Desktop, Server) to guarantee consistent ingestion and sub-second analytical processing.

---

## 1. Canonical Universal Event JSON Schema

```typescript
export interface UniversalEvent {
  // 1. Mandatory Identity & Event Coordinates
  event_id: string;               // UUIDv4 generated on the client
  event: string;                  // Event identifier (e.g., "$pageview", "order_completed")
  distinct_id: string;            // Stable user ID or anonymous visitor hash
  session_id: string;             // Active session UUID
  timestamp: string;              // ISO-8601 UTC timestamp of event creation (e.g. 2026-09-17T13:45:00.123Z)
  sent_at: string;                // ISO-8601 UTC timestamp of HTTP dispatch (used for clock skew correction)

  // 2. Telemetry Properties (Freeform JSON with reserved keys)
  properties: EventProperties;
}

export interface EventProperties {
  // System Reserved Properties (prefixed with $)
  $current_url?: string;
  $host?: string;
  $pathname?: string;
  $referrer?: string;
  $referring_domain?: string;
  $title?: string;
  $browser?: string;              // e.g. "Chrome", "Firefox", "Safari"
  $browser_version?: string;
  $os?: string;                   // e.g. "macOS", "Windows", "Linux", "iOS", "Android"
  $os_version?: string;
  $device_type?: string;          // "desktop", "mobile", "tablet", "bot"
  $screen_width?: number;
  $screen_height?: number;
  $viewport_width?: number;
  $viewport_height?: number;
  $lib?: string;                  // e.g. "openpulse-js", "openpulse-react"
  $lib_version?: string;          // e.g. "0.1.0"
  $time_diff_ms?: number;         // Calculated by ingestion server

  // Custom User Properties
  [key: string]: unknown;
}
```

---

## 2. Standard Reserved Event Names

| Event Name | Trigger Context | Standard Properties Included |
| :--- | :--- | :--- |
| **`$pageview`** | Web page load or client-side route transition | `$current_url`, `$pathname`, `$title`, `$referrer` |
| **`$screen`** | Native mobile / desktop screen view | `$screen_name`, `$previous_screen` |
| **`$autocapture`** | Automatic DOM interaction (clicks on `<a>`, `<button>`) | `$el_tag`, `$el_text`, `$el_id`, `$el_class` |
| **`$identify`** | Linking anonymous visitor ID to authenticated user ID | `$anon_distinct_id`, `$identified_id` |
| **`$session_start`** | Initiation of a new user session (after 30m idle) | `$entry_page`, `$initial_referrer` |
| **`$session_end`** | Termination or timeout of a session | `$duration_ms`, `$event_count` |
| **`$exception`** | Uncaught frontend exception or error report | `$error_type`, `$error_message`, `$stacktrace` |
| **`$web_vital`** | Core Web Vitals telemetry measurement | `$vital_name` (LCP, FID, CLS, INP, TTFB), `$vital_value`, `$vital_rating` |

---

## 3. Ingestion Validation Rules

1. **Size Limits**:
   - Maximum single event payload size: **64 KB**.
   - Maximum batch payload size: **5 MB** (or 500 events).
   - Maximum property key length: **128 characters**.
   - Maximum string property value length: **4,096 characters** (longer strings are truncated).
2. **Naming Conventions**:
   - Custom event names must match regex: `^[a-zA-Z][a-zA-Z0-9_: -]{0,99}$`.
   - Event names starting with `$` are strictly reserved for OpenPulse system events.
3. **Timestamp Validity**:
   - Events with `timestamp` older than 30 days or more than 15 minutes into the future are rejected or flagged with an anomaly property.
