import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { setConfig } from '@/config/env'
import { resetAuth, resetUsers } from '@/mocks/handlers'
import { server } from '@/mocks/server'

// Tests do not boot through main.tsx, so there is no /config.json fetch.
// Inject the config the app would otherwise have loaded.
setConfig({
  apiUrl: '/api',
  environment: 'development',
  enableMocking: true,
})

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetUsers()
  resetAuth()
  localStorage.clear()
})

afterAll(() => server.close())
