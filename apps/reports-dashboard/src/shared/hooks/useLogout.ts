import { useMutation, useQueryClient } from '@tanstack/react-query'

import { authToken } from '@/api/authToken'
import { authApi } from '@/api/endpoints/auth'

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logout(),
    // Log the client out locally even if the network call itself failed
    // (token already invalid, offline, ...) -- staying "logged in" with a
    // token the server has revoked or that never reaches it helps no one.
    onSettled: () => {
      authToken.clear()
      queryClient.removeQueries({ queryKey: ['auth', 'me'] })
    },
  })
}
