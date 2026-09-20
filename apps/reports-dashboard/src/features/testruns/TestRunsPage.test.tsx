import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { TestRunsPage } from '@/features/testruns/TestRunsPage'
import { server } from '@/mocks/server'
import { renderWithProviders } from '@/test/render'

describe('TestRunsPage', () => {
  // The container test exercises the whole slice: hook -> api -> MSW -> render.
  it('loads and renders test runs from the API', async () => {
    renderWithProviders(
      <MemoryRouter>
        <TestRunsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('staging')).toBeInTheDocument()
    expect(screen.getByText('2 failed')).toBeInTheDocument()
  })

  it('shows an error state when the request fails', async () => {
    server.use(http.get('/api/test-runs', () => new HttpResponse(null, { status: 500 })))

    renderWithProviders(
      <MemoryRouter>
        <TestRunsPage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows the empty state when there are no runs', async () => {
    server.use(
      http.get('/api/test-runs', () => HttpResponse.json({ items: [], next_before: '' })),
    )

    renderWithProviders(
      <MemoryRouter>
        <TestRunsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('No test runs yet.')).toBeInTheDocument()
  })
})
