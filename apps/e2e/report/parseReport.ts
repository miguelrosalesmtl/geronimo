import { readFileSync } from 'node:fs'
import type { JSONReport, JSONReportSuite, JSONReportTestResult } from '@playwright/test/reporter'

export type RunStatus = 'passed' | 'failed' | 'interrupted'
export type ResultStatus = 'passed' | 'failed' | 'timedout' | 'skipped' | 'interrupted'

export interface NormalizedResult {
  title: string
  full_title: string
  project: string
  file: string
  line: number
  status: ResultStatus
  duration_ms: number
  retries: number
  error_message: string | null
  error_stack: string | null
}

export interface NormalizedRun {
  status: RunStatus
  total_tests: number
  passed_count: number
  failed_count: number
  skipped_count: number
  raw_report: JSONReport
  results: NormalizedResult[]
}

// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_PATTERN = /\x1b\[[0-9;]*m/g

/**
 * Playwright's error messages/stacks are formatted for a terminal (ANSI color
 * codes included) even inside the JSON reporter's output. These get read by
 * reports-dashboard in a browser, not a terminal, so strip them here rather
 * than at every consumer.
 */
function stripAnsi(text: string | null | undefined): string | null {
  if (!text) return null
  return text.replace(ANSI_ESCAPE_PATTERN, '')
}

function toResultStatus(status: JSONReportTestResult['status']): ResultStatus {
  switch (status) {
    case 'timedOut':
      return 'timedout'
    case undefined:
      return 'skipped'
    default:
      return status
  }
}

/** Walks a (possibly nested) suite tree and yields every spec with its title path. */
function* walkSpecs(suite: JSONReportSuite, titlePath: string[]): Generator<{ spec: JSONReportSuite['specs'][number]; titlePath: string[] }> {
  const path = suite.title ? [...titlePath, suite.title] : titlePath
  for (const spec of suite.specs) {
    yield { spec, titlePath: path }
  }
  for (const child of suite.suites ?? []) {
    yield* walkSpecs(child, path)
  }
}

export function parseReport(reportPath: string): NormalizedRun {
  const raw = JSON.parse(readFileSync(reportPath, 'utf-8')) as JSONReport

  const results: NormalizedResult[] = []
  let interrupted = false

  for (const suite of raw.suites) {
    for (const { spec, titlePath } of walkSpecs(suite, [])) {
      for (const test of spec.tests) {
        // One row per test, reflecting its FINAL attempt — `retries` carries
        // how many attempts preceded it. We don't emit a row per retry.
        const attempts = test.results
        const last = attempts[attempts.length - 1]
        const status = last ? toResultStatus(last.status) : 'skipped'
        if (status === 'interrupted') interrupted = true

        const errorMessage = last?.error?.message ?? last?.errors?.[0]?.message ?? null

        results.push({
          title: spec.title,
          full_title: [...titlePath, spec.title].join(' > '),
          project: test.projectName,
          file: spec.file,
          line: spec.line,
          status,
          duration_ms: last?.duration ?? 0,
          retries: Math.max(attempts.length - 1, 0),
          error_message: stripAnsi(errorMessage),
          error_stack: stripAnsi(last?.error?.stack),
        })
      }
    }
  }

  const passed_count = results.filter((r) => r.status === 'passed').length
  const skipped_count = results.filter((r) => r.status === 'skipped').length
  // "failed" at the run level absorbs both failed and timed-out results —
  // JSONReport has no clean global "the whole run timed out" signal to
  // distinguish a run-level timeout from an ordinary failure, so we don't
  // attempt to produce a `timedout` run status; a per-test timeout still
  // shows up faithfully as that test result's own `timedout` status.
  const failed_count = results.length - passed_count - skipped_count

  const status: RunStatus = interrupted ? 'interrupted' : failed_count > 0 ? 'failed' : 'passed'

  return {
    status,
    total_tests: results.length,
    passed_count,
    failed_count,
    skipped_count,
    raw_report: raw,
    results,
  }
}
