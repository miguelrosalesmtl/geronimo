import type { Meta, StoryObj } from '@storybook/react-vite'

import { TestResultList } from '@/features/testruns/components/TestResultList'
import type { TestRunResult } from '@/types/testRun'

const results: TestRunResult[] = [
  {
    id: '1',
    run_id: 'run-1',
    title: 'logs in',
    full_title: 'auth > logs in',
    project: 'ui',
    file: 'tests/ui/login.spec.ts',
    line: 12,
    status: 'passed',
    duration_ms: 842,
    retries: 0,
    error_message: null,
    error_stack: null,
  },
  {
    id: '2',
    run_id: 'run-1',
    title: 'rejects a bad password',
    full_title: 'auth > rejects a bad password',
    project: 'api',
    file: 'tests/api/login.spec.ts',
    line: 20,
    status: 'failed',
    duration_ms: 310,
    retries: 1,
    error_message: 'expected 401, got 500',
    error_stack: 'Error: expected 401, got 500\n    at tests/api/login.spec.ts:24:10',
  },
]

const meta = {
  title: 'TestRuns/TestResultList',
  component: TestResultList,
} satisfies Meta<typeof TestResultList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { results },
}

export const Empty: Story = {
  args: { results: [] },
}
