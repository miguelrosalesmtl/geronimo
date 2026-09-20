import { useState } from 'react'
import { useNavigate } from 'react-router'

import { ErrorState } from '@/components/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { TestRunFilters } from '@/features/testruns/components/TestRunFilters'
import { TestRunList } from '@/features/testruns/components/TestRunList'
import { useTestRuns } from '@/features/testruns/hooks/useTestRuns'
import type { TestRunStatus } from '@/types/testRun'

/**
 * Container.
 *
 * The only file in the feature allowed to touch hooks. It owns the filter
 * state and does the loading/error branching, so everything below it receives
 * nothing but resolved domain data.
 */
export function TestRunsPage() {
  const [environment, setEnvironment] = useState('')
  const [status, setStatus] = useState<TestRunStatus | ''>('')
  const navigate = useNavigate()

  const {
    data: page,
    isPending,
    isError,
    error,
    refetch,
  } = useTestRuns({ environment: environment || undefined, status: status || undefined })

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Test runs</h1>
        <p className="text-muted-foreground text-sm">
          Playwright e2e results, submitted by the geronimo e2e Job/CronJob.
        </p>
      </header>

      <TestRunFilters
        environment={environment}
        status={status}
        onEnvironmentChange={setEnvironment}
        onStatusChange={setStatus}
      />

      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : (
        <TestRunList runs={page.items} onSelect={(id) => void navigate(`/test-runs/${id}`)} />
      )}
    </section>
  )
}
