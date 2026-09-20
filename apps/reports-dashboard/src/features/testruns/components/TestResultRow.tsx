import { ChevronDownIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { statusBadgeProps } from '@/lib/testStatus'
import type { TestRunResult } from '@/types/testRun'

export interface TestResultRowProps {
  result: TestRunResult
}

/**
 * Presentational. A single test result, with its error detail (if any) tucked
 * behind a disclosure so a run full of passes stays scannable.
 */
export function TestResultRow({ result }: TestResultRowProps) {
  const hasError = Boolean(result.error_message || result.error_stack)
  const { variant, className } = statusBadgeProps(result.status)

  return (
    <Collapsible className="rounded-lg border">
      <CollapsibleTrigger
        disabled={!hasError}
        className="flex w-full items-center justify-between gap-4 p-3 text-left disabled:cursor-default [&[data-state=open]>svg]:rotate-180"
      >
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-medium">{result.full_title}</p>
          <p className="text-muted-foreground text-xs">
            {result.file}
            {result.line ? `:${result.line}` : ''} · {result.duration_ms}ms
            {result.retries > 0 ? ` · ${result.retries} retries` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={variant} className={className}>
            {result.status}
          </Badge>
          {hasError ? <ChevronDownIcon className="size-4 transition-transform" /> : null}
        </div>
      </CollapsibleTrigger>
      {hasError ? (
        <CollapsibleContent className="border-t p-3">
          {result.error_message ? (
            <p className="text-destructive text-sm font-medium">{result.error_message}</p>
          ) : null}
          {result.error_stack ? (
            <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-3 text-xs">
              {result.error_stack}
            </pre>
          ) : null}
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  )
}
