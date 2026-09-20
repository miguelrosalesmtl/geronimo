import { Link, useParams } from 'react-router'

import { ErrorState } from '@/components/error-state'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TestResultList } from '@/features/testruns/components/TestResultList'
import { useTestRun, useTestRunResults } from '@/features/testruns/hooks/useTestRun'
import { statusBadgeProps } from '@/lib/testStatus'

/**
 * Container.
 *
 * Fetches one run plus its first page of results. Note: only the first page
 * of results is shown — `next_before`-driven "load more" is not built yet,
 * see the feature's README/plan note for that gap.
 */
export function TestRunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const run = useTestRun(id ?? '')
  const results = useTestRunResults(id ?? '')

  if (!id) {
    return <ErrorState title="No run selected" />
  }

  return (
    <section className="space-y-6">
      <Link to="/test-runs" className="text-muted-foreground text-sm hover:underline">
        ← Back to test runs
      </Link>

      {run.isPending ? (
        <Skeleton className="h-24" />
      ) : run.isError ? (
        <ErrorState message={run.error.message} onRetry={() => void run.refetch()} />
      ) : (
        <header className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{run.data.environment}</h1>
            <Badge {...statusBadgeProps(run.data.status)}>{run.data.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {run.data.trigger_type} · {run.data.base_url} ·{' '}
            {new Date(run.data.started_at).toLocaleString()}
          </p>
          <p className="text-muted-foreground text-sm">
            {run.data.passed_count}/{run.data.total_tests} passed
            {run.data.failed_count > 0 ? ` · ${run.data.failed_count} failed` : ''}
            {run.data.skipped_count > 0 ? ` · ${run.data.skipped_count} skipped` : ''}
          </p>
        </header>
      )}

      {results.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : results.isError ? (
        <ErrorState message={results.error.message} onRetry={() => void results.refetch()} />
      ) : (
        <TestResultList results={results.data.items} />
      )}
    </section>
  )
}
