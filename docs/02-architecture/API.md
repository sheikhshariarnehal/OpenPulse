# OpenPulse — REST API Specifications

The OpenPulse API is partitioned into three logical planes:
1. **Ingestion API**: High-throughput endpoints consumed by client and server SDKs.
2. **Analytics Query API**: High-performance analytical endpoints consumed by the dashboard and external integrations.
3. **Management API**: Transactional configuration endpoints for projects, keys, and settings.

---

## 1. Authentication & Common Headers

### Ingestion Authentication
Client SDKs authenticate using project API keys via the `X-OpenPulse-API-Key` header:
```http
X-OpenPulse-API-Key: op_live_9a7d8c6b5e4f3a2b1c0d
```

### Dashboard / Management Authentication
The dashboard communicates using secure HTTP-only session cookies or a Bearer token:
```http
Authorization: Bearer <session_or_jwt_token>
```

### Standard Error Response Format
```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is either invalid, revoked, or lacks required scopes.",
    "details": []
  }
}
```

---

## 2. Ingestion Endpoints

### 2.1 Ingest Single Event
- **Endpoint**: `POST /api/v1/e`
- **Rate Limit**: 10,000 req/min per API key (configurable)
- **Request Body**:
```json
{
  "event_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "event": "$pageview",
  "distinct_id": "user_usr_99812",
  "session_id": "sess_88310a2",
  "timestamp": "2026-09-17T13:40:00.123Z",
  "sent_at": "2026-09-17T13:40:00.150Z",
  "properties": {
    "$current_url": "https://myapp.com/dashboard",
    "$referrer": "https://google.com",
    "$title": "Analytics Dashboard",
    "$browser": "Chrome",
    "$os": "macOS",
    "$device_type": "desktop",
    "plan": "enterprise"
  }
}
```
- **Response**: `202 Accepted`
```json
{
  "status": "queued",
  "event_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

---

### 2.2 Ingest Event Batch
- **Endpoint**: `POST /api/v1/batch`
- **Headers**: `Content-Encoding: gzip` (optional, recommended for large batches)
- **Request Body**:
```json
{
  "sent_at": "2026-09-17T13:40:05.000Z",
  "batch": [
    {
      "event_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "event": "$pageview",
      "distinct_id": "user_usr_99812",
      "session_id": "sess_88310a2",
      "timestamp": "2026-09-17T13:40:00.123Z",
      "properties": { "$current_url": "https://myapp.com/dashboard" }
    },
    {
      "event_id": "3b2a1c0d-6e5f-4a3b-2c1d-0e9f8a7b6c5d",
      "event": "button_click",
      "distinct_id": "user_usr_99812",
      "session_id": "sess_88310a2",
      "timestamp": "2026-09-17T13:40:02.450Z",
      "properties": { "button_id": "btn-export-csv" }
    }
  ]
}
```
- **Response**: `202 Accepted`
```json
{
  "status": "queued",
  "processed_count": 2
}
```

---

### 2.3 Feature Flags Evaluation (`/decide`)
- **Endpoint**: `POST /api/v1/decide`
- **Request Body**:
```json
{
  "distinct_id": "user_usr_99812",
  "user_properties": {
    "email": "alex@company.com",
    "country": "US",
    "plan": "pro"
  }
}
```
- **Response**: `200 OK`
```json
{
  "feature_flags": {
    "new_billing_portal": true,
    "checkout_redesign": "variant_b"
  }
}
```

---

## 3. Analytics Query Endpoints

### 3.1 Real-Time Event Stream (Server-Sent Events)
- **Endpoint**: `GET /api/v1/projects/:projectId/realtime/stream`
- **Query Params**: `event_name` (optional filter), `limit` (default 50)
- **Response**: `text/event-stream`
```http
event: message
data: {"event_id":"...","event":"$pageview","distinct_id":"...","timestamp":"2026-09-17T13:41:00.000Z"}
```

---

### 3.2 Dynamic Aggregation Query
- **Endpoint**: `POST /api/v1/projects/:projectId/query`
- **Request Body**:
```json
{
  "event_name": "$pageview",
  "date_from": "2026-09-10T00:00:00Z",
  "date_to": "2026-09-17T23:59:59Z",
  "interval": "day",
  "breakdown_property": "$browser",
  "filters": [
    { "property": "$country", "operator": "equals", "value": "US" }
  ]
}
```
- **Response**: `200 OK`
```json
{
  "results": [
    { "date": "2026-09-10", "breakdown_value": "Chrome", "count": 14200 },
    { "date": "2026-09-10", "breakdown_value": "Safari", "count": 8900 }
  ],
  "query_time_ms": 38.4
}
```

---

### 3.3 Conversion Funnel Calculation
- **Endpoint**: `POST /api/v1/projects/:projectId/funnels`
- **Request Body**:
```json
{
  "steps": [
    { "event_name": "$pageview", "filter": { "$current_url": "/signup" } },
    { "event_name": "signup_completed" },
    { "event_name": "first_project_created" }
  ],
  "conversion_window_seconds": 86400,
  "date_from": "2026-09-01T00:00:00Z",
  "date_to": "2026-09-17T23:59:59Z"
}
```
- **Response**: `200 OK`
```json
{
  "steps": [
    { "step_index": 0, "name": "Visit Signup", "entered": 10500, "converted": 10500, "conversion_rate": 100.0 },
    { "step_index": 1, "name": "Signup Completed", "entered": 10500, "converted": 4200, "conversion_rate": 40.0 },
    { "step_index": 2, "name": "First Project", "entered": 4200, "converted": 2940, "conversion_rate": 70.0 }
  ],
  "overall_conversion_rate": 28.0,
  "query_time_ms": 62.1
}
```

---

### 3.4 Cohort Retention Analysis
- **Endpoint**: `POST /api/v1/projects/:projectId/retention`
- **Request Body**:
```json
{
  "target_event": "$pageview",
  "returning_event": "$pageview",
  "period": "week",
  "num_periods": 8
}
```
- **Response**: `200 OK`
```json
{
  "cohorts": [
    {
      "cohort_date": "2026-W30",
      "initial_users": 1200,
      "retention": [100.0, 48.2, 35.1, 29.8, 26.5]
    }
  ]
}
```

---

## 4. Management Endpoints

| Method | Endpoint | Description | Required Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workspaces` | List all workspaces user belongs to | Member |
| `POST` | `/api/v1/workspaces` | Create a new workspace | User |
| `GET` | `/api/v1/workspaces/:id` | Get workspace details and settings | Member |
| `PATCH`| `/api/v1/workspaces/:id` | Update workspace name or slug | Admin / Owner |
| `GET` | `/api/v1/workspaces/:id/members` | List members and roles in workspace | Viewer |
| `POST` | `/api/v1/workspaces/:id/members` | Invite new member to workspace | Admin |
| `GET` | `/api/v1/workspaces/:id/projects` | List projects in a workspace | Viewer |
| `POST` | `/api/v1/workspaces/:id/projects` | Create a new project in workspace | Admin |
| `GET` | `/api/v1/projects/:id/api-keys` | List API keys for a project | Admin |
| `POST` | `/api/v1/projects/:id/api-keys` | Generate a new project API key | Admin |
| `DELETE`| `/api/v1/projects/:id/api-keys/:keyId`| Revoke an API key | Admin |
| `GET` | `/api/v1/projects/:id/dashboards` | List custom dashboards | Viewer |
| `POST` | `/api/v1/projects/:id/dashboards` | Create a custom dashboard layout | Member |
