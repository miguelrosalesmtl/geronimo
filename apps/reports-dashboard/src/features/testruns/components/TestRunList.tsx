import { TestRunCard } from '@/features/testruns/components/TestRunCard'
import type { TestRunSummary } from '@/types/testRun'

export interface TestRunListProps {
  /** Resolved runs. Never undefined — the container waits for the data. */
  runs: TestRunSummary[]
  /** Emitted with a run's id when its card is clicked. */
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
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {runs.map((run) => (
        <li key={run.id}>
          <TestRunCard run={run} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  )
}
