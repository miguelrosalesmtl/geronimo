import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { TestRunRow } from '@/features/testruns/components/TestRunRow'

const meta = {
  title: 'TestRuns/TestRunRow',
  component: TestRunRow,
  args: {
    run: {
      id: '1',
      trigger_type: 'job',
      environment: 'staging',
      base_url: 'https://staging.example.com',
      started_at: '2026-09-20T10:00:00Z',
      finished_at: '2026-09-20T10:03:12Z',
      status: 'passed',
      total_tests: 12,
      passed_count: 12,
      failed_count: 0,
      skipped_count: 0,
      created_at: '2026-09-20T10:03:12Z',
    },
    onSelect: fn(),
  },
} satisfies Meta<typeof TestRunRow>

export default meta
type Story = StoryObj<typeof meta>

export const Passed: Story = {}

export const Failed: Story = {
  args: {
    run: {
      ...meta.args.run,
      status: 'failed',
      passed_count: 10,
      failed_count: 2,
    },
  },
}

export const Interrupted: Story = {
  args: { run: { ...meta.args.run, status: 'interrupted' } },
}

export const CronTriggered: Story = {
  args: { run: { ...meta.args.run, trigger_type: 'cronjob' } },
}

/** No `onSelect` handler — the row is not clickable. */
export const ReadOnly: Story = {
  args: { onSelect: undefined },
}
