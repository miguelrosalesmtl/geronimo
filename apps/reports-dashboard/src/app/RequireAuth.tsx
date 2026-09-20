import { Navigate, Outlet, useLocation } from 'react-router'

import { useCurrentUser } from '@/shared/hooks/useCurrentUser'

/**
 * Route guard. Everything under it in the router tree requires a signed-in
 * session; an unauthenticated visitor is bounced to /login and sent back to
 * where they were headed once they sign in (see LoginPage's redirectTo).
 */
export function RequireAuth() {
  const location = useLocation()
  const { isPending, isError } = useCurrentUser()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  if (isError) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
