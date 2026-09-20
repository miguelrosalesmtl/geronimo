import { test as base, type APIRequestContext } from '@playwright/test'
import type { TestUser } from './test-users.js'

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

/**
 * Logs a user in against a conventional `POST /auth/login -> { token }`
 * endpoint and returns the bearer token. This is a placeholder shape — adapt
 * the path/body/response field once the real target's auth API is known;
 * everything else in this fixture (the request context itself) stays valid.
 */
export async function loginAndGetToken(
  request: APIRequestContext,
  user: Pick<TestUser, 'email' | 'password'>,
): Promise<string> {
  const response = await request.post('/auth/login', {
    data: { email: user.email, password: user.password },
  })
  if (!response.ok()) {
    throw new Error(`Login failed for ${user.email}: ${response.status()} ${await response.text()}`)
  }
  const body = (await response.json()) as { token: string }
  return body.token
}

interface ApiFixtures {
  /** The API-project's request context, scoped to API_BASE_URL. Named for clarity at call sites. */
  apiClient: APIRequestContext
}

export const test = base.extend<ApiFixtures>({
  apiClient: async ({ request }, use) => {
    await use(request)
  },
})

export { expect } from '@playwright/test'
