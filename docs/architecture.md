# Geronimo architecture

See `/home/miguelros/.claude/plans/shimmying-gliding-whistle.md` for the full plan and rationale. This file is the authoritative contract for the `reports-backend` API, so `apps/e2e` (producer) and `apps/reports-dashboard` (consumer) can be built independently against it.

## `reports-backend` test-runs API

All routes are under `/api/v1`, auth via `Authorization: Bearer <session token or API key>`, same as the rest of the forked template.

### `POST /test-runs` — permission `testruns.create`

Request body:

```jsonc
{
  "trigger_type": "job" | "cronjob" | "manual",
  "environment": "string",       // e.g. "staging"
  "base_url": "string",
  "started_at": "2026-09-20T10:00:00Z",   // RFC3339
  "finished_at": "2026-09-20T10:03:12Z",  // RFC3339
  "status": "passed" | "failed" | "timedout" | "interrupted",
  "total_tests": 12,
  "passed_count": 10,
  "failed_count": 2,
  "skipped_count": 0,
  "raw_report": { /* full Playwright JSONReport, stored as-is in jsonb */ },
  "results": [
    {
      "title": "string",
      "full_title": "string",     // suite > title
      "project": "ui" | "api",
      "file": "tests/ui/login.spec.ts",
      "line": 12,
      "status": "passed" | "failed" | "timedout" | "skipped" | "interrupted",
      "duration_ms": 842,
      "retries": 0,
      "error_message": "string | null",
      "error_stack": "string | null"
    }
  ]
}
```

Server validates `passed_count + failed_count + skipped_count <= total_tests` and that `len(results) == total_tests`, rather than trusting the caller's summary counts blindly. Response `201`: the created run object (see GET shape below, `results` omitted, `raw_report` omitted).

### `GET /test-runs?environment=&status=&before=<uuid>`

Pagination is **keyset**, matching this codebase's existing `audit_log` listing convention (ids are uuidv7 and therefore time-ordered, so `id < before` means "older than" — a page costs the same at any depth, and a row arriving mid-scroll can't shift pages under the reader; do not add OFFSET pagination). Page size is a server-side constant (20). Response `200`:

```jsonc
{
  "items": [
    {
      "id": "uuid",
      "trigger_type": "job",
      "environment": "staging",
      "base_url": "https://staging.example.com",
      "started_at": "...", "finished_at": "...",
      "status": "failed",
      "total_tests": 12, "passed_count": 10, "failed_count": 2, "skipped_count": 0,
      "created_at": "..."
    }
  ],
  "next_before": "uuid-of-oldest-item-on-this-page-or-empty-string"
}
```
`next_before` is empty when the page wasn't full (nothing more to fetch) — same convention as `next_before` on `GET /audit`.

### `GET /test-runs/{id}?include_raw=true`

Response `200`: same run object as above, plus `raw_report` only when `include_raw=true`.

### `GET /test-runs/{id}/results?status=failed&before=<uuid>`

Same keyset pagination as the list endpoint above. Response `200`:

```jsonc
{
  "items": [
    {
      "id": "uuid", "run_id": "uuid",
      "title": "...", "full_title": "...", "project": "ui",
      "file": "...", "line": 12,
      "status": "failed", "duration_ms": 842, "retries": 1,
      "error_message": "...", "error_stack": "..."
    }
  ],
  "next_before": "uuid-or-empty"
}
```

Errors follow the template's existing envelope (`internal/server/response.go`) — do not invent a new error shape.

## Env vars

`apps/e2e` container: `TRIGGER_TYPE`, `TARGET_ENV`, `BASE_URL`, `API_BASE_URL`, `REPORTS_API_URL` (points at `reports-backend`), `REPORTS_API_KEY`.

`reports-dashboard`: existing `APP_API_URL`/`APP_ENVIRONMENT`/`APP_ENABLE_MOCKING` from the template, `APP_API_URL` pointed at `reports-backend`'s Service.
