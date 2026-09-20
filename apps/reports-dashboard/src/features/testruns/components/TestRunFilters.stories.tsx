import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { TestRunFilters } from '@/features/testruns/components/TestRunFilters'

const meta = {
  title: 'TestRuns/TestRunFilters',
  component: TestRunFilters,
  args: {
    environment: '',
    status: '',
    onEnvironmentChange: fn(),
    onStatusChange: fn(),
  },
} satisfies Meta<typeof TestRunFilters>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithFiltersApplied: Story = {
  args: { environment: 'staging', status: 'failed' },
}
