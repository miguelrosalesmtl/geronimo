import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { authToken } from '@/api/authToken'
import { LoginPage } from '@/features/auth/LoginPage'
import { renderWithProviders } from '@/test/render'

// Matches the fixed dev/test account seeded in src/mocks/handlers.ts.
const VALID_EMAIL = 'dev@example.com'
const VALID_PASSWORD = 'password'

describe('LoginPage', () => {
  it('signs in with valid credentials and stores the session token', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText('Email'), VALID_EMAIL)
    await userEvent.type(screen.getByLabelText('Password'), VALID_PASSWORD)
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(authToken.get()).not.toBeNull())
  })

  it('shows an error on invalid credentials and stores no token', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText('Email'), VALID_EMAIL)
    await userEvent.type(screen.getByLabelText('Password'), 'the-wrong-password')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.')
    expect(authToken.get()).toBeNull()
  })
})
