import { api } from '@/api/client'
import type {
  KeysetPage,
  TestRun,
  TestRunListParams,
  TestRunResult,
  TestRunResultsParams,
  TestRunSummary,
} from '@/types/testRun'

function toQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

// NOTE: reports-backend serves these under /api/v1 (see docs/architecture.md).
// As with usersApi's `/users`, that prefix is expected to live in the
// configured `apiUrl` itself (e.g. APP_API_URL=https://reports-backend/api/v1),
// not repeated here.
export const testRunsApi = {
  list: (params: TestRunListParams = {}) =>
    api.get<KeysetPage<TestRunSummary>>(
      `/test-runs${toQuery(params as Record<string, string | undefined>)}`,
    ),
  byId: (id: string, includeRaw = false) =>
    api.get<TestRun>(`/test-runs/${id}${includeRaw ? '?include_raw=true' : ''}`),
  results: (id: string, params: TestRunResultsParams = {}) =>
    api.get<KeysetPage<TestRunResult>>(
      `/test-runs/${id}/results${toQuery(params as Record<string, string | undefined>)}`,
    ),
}
