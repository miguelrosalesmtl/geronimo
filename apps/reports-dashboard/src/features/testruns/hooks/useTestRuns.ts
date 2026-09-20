import { useQuery } from '@tanstack/react-query'

import { testRunsApi } from '@/api/endpoints/testRuns'
import type { TestRunListParams } from '@/types/testRun'

export function useTestRuns(params: TestRunListParams = {}) {
  return useQuery({
    queryKey: ['test-runs', 'list', params] as const,
    queryFn: () => testRunsApi.list(params),
  })
}
