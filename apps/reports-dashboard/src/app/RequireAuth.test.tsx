import { screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { authToken } from '@/api/authToken'
import { RequireAuth } from '@/app/RequireAuth'
import { setMockSession } from '@/mocks/handlers'
import { renderWithProviders } from '@/test/render'

// Matches src/mocks/handlers.ts's fixed dev/test session.
const FAKE_TOKEN = 'msw-fake-token'

function renderGuarded() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/test-runs']}>
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route element={<RequireAuth />}>
          <Route path="/test-runs" element={<p>protected content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  it('redirects to /login when there is no session', async () => {
    renderGuarded()

    expect(await screen.findByText('login page')).toBeInTheDocument()
  })

  it('renders the protected route when a session is present', async () => {
    // The MSW handler only accepts this token once its own in-memory session
    // knows about it too — simulate "already signed in on page load" without
    // re-driving the login form here.
    authToken.set(FAKE_TOKEN)
    setMockSession(FAKE_TOKEN)

    renderGuarded()

    expect(await screen.findByText('protected content')).toBeInTheDocument()
  })
})
