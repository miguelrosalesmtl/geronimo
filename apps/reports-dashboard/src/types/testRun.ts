/**
 * Domain types for the reports-backend test-runs API.
 *
 * Field names and shapes match docs/architecture.md ("reports-backend test-runs
 * API") exactly — that file is the wire contract, keep this in sync with it.
 * Pagination is keyset (`before` / `next_before`), not page numbers.
 */
export type TestRunTriggerType = 'job' | 'cronjob' | 'manual'

export type TestRunStatus = 'passed' | 'failed' | 'timedout' | 'interrupted'

export type TestResultStatus = 'passed' | 'failed' | 'timedout' | 'skipped' | 'interrupted'

export interface TestRunSummary {
  id: string
  trigger_type: TestRunTriggerType
  environment: string
  base_url: string
  started_at: string
  finished_at: string | null
  status: TestRunStatus
  total_tests: number
  passed_count: number
  failed_count: number
  skipped_count: number
  created_at: string
}

/** A single run's detail. `raw_report` is present only when fetched with `includeRaw`. */
export interface TestRun extends TestRunSummary {
  raw_report?: unknown
}

export interface TestRunResult {
  id: string
  run_id: string
  title: string
  full_title: string
  project: string
  file: string
  line: number
  status: TestResultStatus
  duration_ms: number
  retries: number
  error_message: string | null
  error_stack: string | null
}

/** A keyset-paginated page. `next_before` is `''` when there is nothing more to fetch. */
export interface KeysetPage<T> {
  items: T[]
  next_before: string
}

export interface TestRunListParams {
  environment?: string
  status?: TestRunStatus
  before?: string
}

export interface TestRunResultsParams {
  status?: TestResultStatus
  before?: string
}
