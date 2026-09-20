# apps/e2e

Playwright end-to-end suite against a configurable target application, packaged to run as a Kubernetes `Job` (post-deploy) or `CronJob` (recurring). See `/docs/architecture.md` and the plan at the repo root for the full design.

**`tests/ui/smoke.spec.ts` and `tests/api/smoke.spec.ts` are placeholders.** The real target application under test hasn't been chosen yet — these only prove the pipeline (browser/API request → JSON report → submission to `reports-backend`) works end to end. Replace them with real flows (create user, log in, manage a test account, ...) once a target is picked; `fixtures/test-users.ts` and `fixtures/api-client.ts` are ready to build those on.

## Env vars

| Var | Required | Meaning |
| --- | --- | --- |
| `BASE_URL` | yes, for UI tests | Target application's browser-facing origin |
| `API_BASE_URL` | yes, for API tests | Target application's API origin |
| `TARGET_ENV` | no (default `local`) | Environment label stamped onto the submitted run |
| `TRIGGER_TYPE` | no (default `manual`) | `job` \| `cronjob` \| `manual` — stamped onto the submitted run |
| `TEST_GREP` | no | Passed to `playwright test --grep`, e.g. `@smoke` for the CronJob's lighter subset |
| `REPORTS_API_URL` | yes, to submit | Base URL of `reports-backend` |
| `REPORTS_API_KEY` | yes, to submit | Bearer token for `POST /api/v1/test-runs` (`testruns.create` permission) |

## Running locally

```sh
pnpm install
BASE_URL=https://example.com API_BASE_URL=https://example.com npx playwright test
```

Type-check and build (the report/*.ts CLI that the container's entrypoint runs):

```sh
pnpm typecheck
pnpm build   # -> dist/report/submit.js
```

Submit a report by hand:

```sh
REPORTS_API_URL=http://localhost:8080 REPORTS_API_KEY=mtt_key_... \
  node dist/report/submit.js test-results/report.json \
  --trigger-type manual --environment local --base-url https://example.com
```

## Container entrypoint

`entrypoint.sh` runs the suite, then **always** runs `submit.js` regardless of whether the suite passed — a failing run must still be persisted. Its own exit code reflects the test outcome, not just whether submission succeeded, so a Kubernetes `Job`/`CronJob` shows failure correctly.
