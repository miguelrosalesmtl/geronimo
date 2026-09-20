import { test, expect } from '@playwright/test'

/**
 * PLACEHOLDER — replace once a real target application is chosen.
 *
 * This only proves the pipeline works end to end against API_BASE_URL.
 * Real API flows (register, login, invite, RBAC checks, ...) belong in
 * sibling files in this directory — see fixtures/api-client.ts for the
 * auth-token helper to build them on.
 */
test('the target API is reachable', async ({ request }) => {
  const response = await request.get('/')
  expect(response.status(), 'expected API_BASE_URL to respond, even if with a 404').toBeLessThan(500)
})
