import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { TestRunSummary } from '@/types/testRun'

export interface TestRunCardProps {
  /** The run to render. */
  run: TestRunSummary
  /** Emitted with the run's id when the card is clicked. Omit it to render read-only. */
  onSelect?: (id: string) => void
}

const statusVariant: Record<TestRunSummary['status'], 'default' | 'destructive' | 'secondary'> = {
  passed: 'default',
  failed: 'destructive',
  timedout: 'destructive',
  interrupted: 'secondary',
}

/**
 * Presentational. Props in, a callback out.
 *
 * It does not know where `run` came from or what happens when it is clicked —
 * that is the container's job, which is exactly why this renders in Storybook
 * with no provider and no network.
 */
export function TestRunCard({ run, onSelect }: TestRunCardProps) {
  return (
    <Card
      className="gap-4 py-4"
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
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>{run.environment}</CardTitle>
          <CardDescription>{run.base_url}</CardDescription>
        </div>
        <Badge variant={statusVariant[run.status]}>{run.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>{run.trigger_type}</span>
          <span>
            {run.passed_count}/{run.total_tests} passed
          </span>
          {run.failed_count > 0 ? (
            <span className="text-destructive font-medium">{run.failed_count} failed</span>
          ) : null}
          {run.skipped_count > 0 ? <span>{run.skipped_count} skipped</span> : null}
        </div>
        <p className="text-muted-foreground text-xs">{new Date(run.started_at).toLocaleString()}</p>
      </CardContent>
    </Card>
  )
}
