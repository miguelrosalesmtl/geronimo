import { useQuery } from '@tanstack/react-query'

import { authToken } from '@/api/authToken'
import { authApi } from '@/api/endpoints/auth'

async function fetchCurrentUser() {
  // Fail fast and synchronously-ish rather than letting the query sit in
  // `enabled: false` limbo -- RequireAuth just needs isPending/isError, and
  // "no token" should read as an error exactly like "token rejected" does.
  if (!authToken.get()) {
    throw new Error('Not signed in')
  }
  return authApi.me()
}

/**
 * The current user, sourced from reports-backend's own session -- this IS
 * server state, so it lives in TanStack Query, not a client store. `retry:
 * false` matters here: a 401 should resolve to "logged out" immediately,
 * not sit retrying.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'] as const,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60_000,
  })
}
