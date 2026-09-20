import type { TestResultStatus, TestRunStatus } from '@/types/testRun'

/**
 * Badge styling for a run/result status. None of shadcn's vendored Badge
 * variants are green, and "passed" reading as the same neutral tone as
 * "skipped" made a list hard to scan at a glance -- passed gets a
 * deliberate, saturated green instead of the default variant's neutral look.
 */
export function statusBadgeProps(status: TestRunStatus | TestResultStatus): {
  variant: 'default' | 'destructive' | 'secondary'
  className?: string
} {
  switch (status) {
    case 'passed':
      return {
        variant: 'default',
        className: 'bg-emerald-600 text-white dark:bg-emerald-500 [a&]:hover:bg-emerald-600/90',
      }
    case 'failed':
    case 'timedout':
      return { variant: 'destructive' }
    case 'skipped':
    case 'interrupted':
      return { variant: 'secondary' }
  }
}
