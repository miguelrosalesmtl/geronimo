import { HttpResponse, http } from 'msw'

import type { AuthUser, LoginCredentials } from '@/types/auth'
import type { CreateUserInput, User } from '@/types/user'
import type { KeysetPage, TestRun, TestRunResult, TestRunSummary } from '@/types/testRun'

const DEV_USER: AuthUser = {
  id: 'dev-user',
  email: 'dev@example.com',
  full_name: 'Dev User',
  is_superuser: true,
  is_active: true,
}
const DEV_PASSWORD = 'password'
const FAKE_TOKEN = 'msw-fake-token'

// Starts signed OUT, same as a fresh browser: /login and RequireAuth's
// redirect get exercised in dev/test too, not just the happy path.
let mockSessionToken: string | null = null

export function resetAuth() {
  mockSessionToken = null
}

/** Test helper: simulate "already signed in" without driving the login form. */
export function setMockSession(token: string | null) {
  mockSessionToken = token
}

const seed: User[] = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'admin' },
  { id: '2', name: 'Alan Turing', email: 'alan@example.com', role: 'member' },
  { id: '3', name: 'Grace Hopper', email: 'grace@example.com', role: 'admin' },
]

let users: User[] = [...seed]

export function resetUsers() {
  users = [...seed]
}

const testRuns: TestRunSummary[] = [
  {
    id: 'run-1',
    trigger_type: 'job',
    environment: 'staging',
    base_url: 'https://staging.example.com',
    started_at: '2026-09-20T10:00:00Z',
    finished_at: '2026-09-20T10:03:12Z',
    status: 'failed',
    total_tests: 12,
    passed_count: 10,
    failed_count: 2,
    skipped_count: 0,
    created_at: '2026-09-20T10:03:12Z',
  },
  {
    id: 'run-2',
    trigger_type: 'cronjob',
    environment: 'production',
    base_url: 'https://example.com',
    started_at: '2026-09-20T09:00:00Z',
    finished_at: '2026-09-20T09:02:40Z',
    status: 'passed',
    total_tests: 4,
    passed_count: 4,
    failed_count: 0,
    skipped_count: 0,
    created_at: '2026-09-20T09:02:40Z',
  },
]

const testResults: TestRunResult[] = [
  {
    id: 'result-1',
    run_id: 'run-1',
    title: 'logs in with valid credentials',
    full_title: 'auth > logs in with valid credentials',
    project: 'ui',
    file: 'tests/ui/login.spec.ts',
    line: 12,
    status: 'passed',
    duration_ms: 842,
    retries: 0,
    error_message: null,
    error_stack: null,
  },
  {
    id: 'result-2',
    run_id: 'run-1',
    title: 'rejects a bad password',
    full_title: 'auth > rejects a bad password',
    project: 'api',
    file: 'tests/api/login.spec.ts',
    line: 20,
    status: 'failed',
    duration_ms: 310,
    retries: 1,
    error_message: 'expected 401, got 500',
    error_stack: 'Error: expected 401, got 500\n    at tests/api/login.spec.ts:24:10',
  },
]

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = (await request.json()) as LoginCredentials
    if (email !== DEV_USER.email || password !== DEV_PASSWORD) {
      return HttpResponse.json({ error: 'invalid credentials' }, { status: 401 })
    }
    mockSessionToken = FAKE_TOKEN
    return HttpResponse.json({ token: FAKE_TOKEN, user: DEV_USER }, { status: 200 })
  }),

  http.post('/api/auth/logout', () => {
    mockSessionToken = null
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/auth/me', ({ request }) => {
    const header = request.headers.get('authorization')
    if (!mockSessionToken || header !== `Bearer ${mockSessionToken}`) {
      return HttpResponse.json({ error: 'authentication required' }, { status: 401 })
    }
    return HttpResponse.json(DEV_USER)
  }),

  http.get('/api/users', () => HttpResponse.json(users)),

  http.get('/api/users/:id', ({ params }) => {
    const user = users.find((u) => u.id === params.id)
    if (!user) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(user)
  }),

  http.post('/api/users', async ({ request }) => {
    const input = (await request.json()) as CreateUserInput
    const user: User = { ...input, id: crypto.randomUUID() }
    users.push(user)
    return HttpResponse.json(user, { status: 201 })
  }),

  http.delete('/api/users/:id', ({ params }) => {
    users = users.filter((u) => u.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/test-runs', ({ request }) => {
    const url = new URL(request.url)
    const environment = url.searchParams.get('environment')
    const status = url.searchParams.get('status')

    let items = testRuns
    if (environment) items = items.filter((r) => r.environment === environment)
    if (status) items = items.filter((r) => r.status === status)

    return HttpResponse.json({ items, next_before: '' } satisfies KeysetPage<TestRunSummary>)
  }),

  http.get('/api/test-runs/:id', ({ params, request }) => {
    const run = testRuns.find((r) => r.id === params.id)
    if (!run) return new HttpResponse(null, { status: 404 })

    const includeRaw = new URL(request.url).searchParams.get('include_raw') === 'true'
    const body: TestRun = includeRaw ? { ...run, raw_report: { fixture: true } } : run
    return HttpResponse.json(body)
  }),

  http.get('/api/test-runs/:id/results', ({ params, request }) => {
    const status = new URL(request.url).searchParams.get('status')
    let items = testResults.filter((r) => r.run_id === params.id)
    if (status) items = items.filter((r) => r.status === status)

    return HttpResponse.json({ items, next_before: '' } satisfies KeysetPage<TestRunResult>)
  }),
]
