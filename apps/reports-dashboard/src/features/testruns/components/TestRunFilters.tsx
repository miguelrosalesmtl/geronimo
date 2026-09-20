import type { TestRunStatus } from '@/types/testRun'

export interface TestRunFiltersProps {
  environment: string
  status: TestRunStatus | ''
  onEnvironmentChange: (value: string) => void
  onStatusChange: (value: TestRunStatus | '') => void
}

const statuses: TestRunStatus[] = ['passed', 'failed', 'timedout', 'interrupted']

/** Presentational. Current filter values in, changes out — it holds no state of its own. */
export function TestRunFilters({
  environment,
  status,
  onEnvironmentChange,
  onStatusChange,
}: TestRunFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Filter by environment…"
        value={environment}
        onChange={(e) => onEnvironmentChange(e.target.value)}
        aria-label="Filter by environment"
        className="border-input bg-background h-9 rounded-md border px-3 text-sm shadow-xs"
      />
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as TestRunStatus | '')}
        aria-label="Filter by status"
        className="border-input bg-background h-9 rounded-md border px-3 text-sm shadow-xs"
      >
        <option value="">All statuses</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  )
}
