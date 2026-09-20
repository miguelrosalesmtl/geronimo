import { TestResultRow } from '@/features/testruns/components/TestResultRow'
import type { TestRunResult } from '@/types/testRun'

export interface TestResultListProps {
  /** Resolved results. Never undefined — the container waits for the data. */
  results: TestRunResult[]
}

const statusOrder: Record<TestRunResult['status'], number> = {
  failed: 0,
  timedout: 1,
  interrupted: 2,
  passed: 3,
  skipped: 4,
}

/** Presentational. Failed/timed-out results sort first, so the interesting ones need no scrolling to reach. */
export function TestResultList({ results }: TestResultListProps) {
  if (results.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
        No results for this run.
      </p>
    )
  }

  const sorted = [...results].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

  return (
    <ul className="space-y-2">
      {sorted.map((result) => (
        <li key={result.id}>
          <TestResultRow result={result} />
        </li>
      ))}
    </ul>
  )
}
