import { parseReport } from './parseReport.js'

interface Args {
  reportPath: string
  triggerType: string
  environment: string
  baseUrl: string
}

function parseArgs(argv: string[]): Args {
  const [reportPath, ...rest] = argv
  if (!reportPath) {
    throw new Error('usage: submit.js <report.json> --trigger-type <t> --environment <e> --base-url <u>')
  }

  const flags = new Map<string, string>()
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i]?.replace(/^--/, '')
    const value = rest[i + 1]
    if (!key || value === undefined) {
      throw new Error(`malformed argument near "${rest[i]}"`)
    }
    flags.set(key, value)
  }

  const triggerType = flags.get('trigger-type')
  const environment = flags.get('environment')
  const baseUrl = flags.get('base-url')
  if (!triggerType || !environment || !baseUrl) {
    throw new Error('--trigger-type, --environment, and --base-url are all required')
  }

  return { reportPath, triggerType, environment, baseUrl }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const reportsApiUrl = process.env.REPORTS_API_URL
  const reportsApiKey = process.env.REPORTS_API_KEY
  if (!reportsApiUrl) throw new Error('REPORTS_API_URL is required')
  if (!reportsApiKey) throw new Error('REPORTS_API_KEY is required')

  const normalized = parseReport(args.reportPath)
  const startedAt = normalized.raw_report.stats.startTime
  const finishedAt = new Date(
    new Date(startedAt).getTime() + normalized.raw_report.stats.duration,
  ).toISOString()

  const payload = {
    trigger_type: args.triggerType,
    environment: args.environment,
    base_url: args.baseUrl,
    started_at: startedAt,
    finished_at: finishedAt,
    status: normalized.status,
    total_tests: normalized.total_tests,
    passed_count: normalized.passed_count,
    failed_count: normalized.failed_count,
    skipped_count: normalized.skipped_count,
    raw_report: normalized.raw_report,
    results: normalized.results,
  }

  const url = new URL('/api/v1/test-runs', reportsApiUrl)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${reportsApiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`POST ${url} failed: ${response.status} ${body}`)
  }

  console.log(
    `Submitted test run (${normalized.status}, ${normalized.total_tests} tests, ${normalized.failed_count} failed) to ${url}`,
  )
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
