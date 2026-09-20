import { Badge } from '@/components/ui/badge'
import { statusBadgeProps } from '@/lib/testStatus'
import type { TestRunSummary } from '@/types/testRun'

export interface TestRunRowProps {
  /** The run to render. */
  run: TestRunSummary
  /** Emitted with the run's id when the row is clicked. Omit it to render read-only. */
  onSelect?: (id: string) => void
}

/**
 * Presentational. One run, one line: everything a scan of the list needs
 * (status, environment, target, trigger, pass/fail counts, when) sits in a
 * single row rather than stacked in a card, newest run first.
 *
 * It does not know where `run` came from or what happens when it is clicked —
 * that is the container's job, which is exactly why this renders in Storybook
 * with no provider and no network.
 */
export function TestRunRow({ run, onSelect }: TestRunRowProps) {
  const { variant, className } = statusBadgeProps(run.status)

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? () => onSelect(run.id) : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(run.id)
            }
          : undefined
      }
      className="hover:bg-accent/50 flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-3 py-3 text-sm last:border-b-0"
    >
      <Badge variant={variant} className={className}>
        {run.status}
      </Badge>
      <span className="w-24 shrink-0 font-medium">{run.environment}</span>
      <span className="text-muted-foreground min-w-0 flex-1 truncate">{run.base_url}</span>
      <span className="text-muted-foreground w-20 shrink-0">{run.trigger_type}</span>
      <span className="w-28 shrink-0 text-right">
        {run.passed_count}/{run.total_tests} passed
        {run.failed_count > 0 ? (
          <>
            {' · '}
            <span className="text-destructive font-medium">{run.failed_count} failed</span>
          </>
        ) : null}
      </span>
      <span className="text-muted-foreground w-40 shrink-0 text-right">
        {new Date(run.started_at).toLocaleString()}
      </span>
    </div>
  )
}
