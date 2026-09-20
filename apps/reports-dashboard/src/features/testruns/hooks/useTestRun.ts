import { useQuery } from '@tanstack/react-query'

import { testRunsApi } from '@/api/endpoints/testRuns'
import type { TestRunResultsParams } from '@/types/testRun'

export function useTestRun(id: string, includeRaw = false) {
  return useQuery({
    queryKey: ['test-runs', 'detail', id, { includeRaw }] as const,
    queryFn: () => testRunsApi.byId(id, includeRaw),
    enabled: Boolean(id),
  })
}

export function useTestRunResults(id: string, params: TestRunResultsParams = {}) {
  return useQuery({
    queryKey: ['test-runs', 'detail', id, 'results', params] as const,
    queryFn: () => testRunsApi.results(id, params),
    enabled: Boolean(id),
  })
}
