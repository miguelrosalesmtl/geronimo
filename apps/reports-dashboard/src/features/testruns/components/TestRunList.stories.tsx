import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

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
    environment: 'staging',
    base_url: 'https://staging.example.com',
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

/** Zero setup: no QueryClient, no MSW, no router. A dumb component is just a function of its props. */
const meta = {
  title: 'TestRuns/TestRunList',
  component: TestRunList,
  args: { onSelect: fn() },
} satisfies Meta<typeof TestRunList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { runs },
}

export const Empty: Story = {
  args: { runs: [] },
}

export const ReadOnly: Story = {
  args: { runs, onSelect: undefined },
}

export const ClickingACardEmitsItsId: Story = {
  args: { runs },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('click the first run', async () => {
      const [firstRun] = canvas.getAllByRole('button')
      await userEvent.click(firstRun!)
    })

    await step('its id is emitted', async () => {
      await expect(args.onSelect).toHaveBeenCalledWith('1')
    })
  },
}
