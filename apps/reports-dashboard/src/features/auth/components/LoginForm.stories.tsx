import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { LoginForm } from '@/features/auth/components/LoginForm'

const meta = {
  title: 'Auth/LoginForm',
  component: LoginForm,
  args: {
    email: '',
    password: '',
    onEmailChange: fn(),
    onPasswordChange: fn(),
    onSubmit: fn(),
    isPending: false,
  },
} satisfies Meta<typeof LoginForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Submitting: Story = {
  args: { email: 'ci-bot@geronimo.local', password: 'correct-horse-battery-staple', isPending: true },
}

export const WithError: Story = {
  args: {
    email: 'ci-bot@geronimo.local',
    password: 'wrong-password',
    error: 'Incorrect email or password.',
  },
}
