import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TestRunList } from '@/features/testruns/components/TestRunList'
import type { TestRunSummary } from '@/types/testRun'

const runs: TestRunSummary[] = [
  {
    id: '1',
    trigger_type: 'job',
    environment: 'staging',
    base_url: 'https://staging.example.com',
    started_at: '2026-09-20T10:00:00Z',
    finished_at: '2026-09-20T10:03:12Z',
    status: 'failed',
    total_tests: 12,
    passed_count: 10,
    failed_count: 2,
    skipped_count: 0,
    created_at: '2026-09-20T10:03:12Z',
  },
  {
    id: '2',
    trigger_type: 'cronjob',
    environment: 'production',
    base_url: 'https://example.com',
    started_at: '2026-09-20T09:00:00Z',
    finished_at: '2026-09-20T09:02:40Z',
    status: 'passed',
    total_tests: 4,
    passed_count: 4,
    failed_count: 0,
    skipped_count: 0,
    created_at: '2026-09-20T09:02:40Z',
  },
]

describe('TestRunList', () => {
  it('renders a card per run', () => {
    render(<TestRunList runs={runs} />)

    expect(screen.getByText('staging')).toBeInTheDocument()
    expect(screen.getByText('production')).toBeInTheDocument()
  })

  it('renders an empty state when there are no runs', () => {
    render(<TestRunList runs={[]} />)

    expect(screen.getByText('No test runs yet.')).toBeInTheDocument()
  })

  it('emits onSelect with the run id', async () => {
    const onSelect = vi.fn()
    render(<TestRunList runs={runs} onSelect={onSelect} />)

    const [firstRun] = screen.getAllByRole('button')
    await userEvent.click(firstRun!)

    expect(onSelect).toHaveBeenCalledExactlyOnceWith('1')
  })

  it('is not clickable when onSelect is omitted', () => {
    render(<TestRunList runs={runs} />)

    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
