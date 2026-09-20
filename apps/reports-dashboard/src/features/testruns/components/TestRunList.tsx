import { TestRunRow } from '@/features/testruns/components/TestRunRow'
import type { TestRunSummary } from '@/types/testRun'

export interface TestRunListProps {
  /** Resolved runs, newest first. Never undefined — the container waits for the data. */
  runs: TestRunSummary[]
  /** Emitted with a run's id when its row is clicked. */
  onSelect?: (id: string) => void
}

/**
 * Presentational.
 *
 * Note what is NOT in the props: `isLoading` and `error`. The container
 * branches on those and only renders this once data has resolved.
 */
export function TestRunList({ runs, onSelect }: TestRunListProps) {
  if (runs.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
        No test runs yet.
      </p>
    )
  }

  return (
    <div className="rounded-lg border">
      {runs.map((run) => (
        <TestRunRow key={run.id} run={run} onSelect={onSelect} />
      ))}
    </div>
  )
}
