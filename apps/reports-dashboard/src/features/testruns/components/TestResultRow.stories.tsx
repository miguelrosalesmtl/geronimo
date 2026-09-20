import type { Meta, StoryObj } from '@storybook/react-vite'

import { TestResultRow } from '@/features/testruns/components/TestResultRow'

const meta = {
  title: 'TestRuns/TestResultRow',
  component: TestResultRow,
  args: {
    result: {
      id: '1',
      run_id: 'run-1',
      title: 'logs in with valid credentials',
      full_title: 'auth > logs in with valid credentials',
      project: 'ui',
      file: 'tests/ui/login.spec.ts',
      line: 12,
      status: 'passed',
      duration_ms: 842,
      retries: 0,
      error_message: null,
      error_stack: null,
    },
  },
} satisfies Meta<typeof TestResultRow>

export default meta
type Story = StoryObj<typeof meta>

export const Passed: Story = {}

export const Failed: Story = {
  args: {
    result: {
      ...meta.args.result,
      status: 'failed',
      retries: 1,
      error_message: 'Timed out waiting for locator("#submit") to be visible',
      error_stack:
        'Error: Timed out waiting for locator("#submit") to be visible\n    at tests/ui/login.spec.ts:18:22',
    },
  },
}

export const Skipped: Story = {
  args: { result: { ...meta.args.result, status: 'skipped' } },
}
