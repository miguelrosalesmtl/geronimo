import { useMutation, useQueryClient } from '@tanstack/react-query'

import { authToken } from '@/api/authToken'
import { authApi } from '@/api/endpoints/auth'
import type { LoginCredentials } from '@/types/auth'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: ({ token, user }) => {
      authToken.set(token)
      // We already have the user from the login response -- seed the cache
      // directly instead of firing an immediate, redundant /auth/me.
      queryClient.setQueryData(['auth', 'me'], user)
    },
  })
}
