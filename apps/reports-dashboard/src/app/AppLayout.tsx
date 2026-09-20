import { NavLink, Outlet, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { EnvironmentBanner } from '@/components/environment-banner'
import { getConfig } from '@/config/env'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/shared/hooks/useCurrentUser'
import { useLogout } from '@/shared/hooks/useLogout'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn('text-sm font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')

export function AppLayout() {
  // The composition root reads config; everything below it just receives props.
  const { environment } = getConfig()
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()

  function handleLogout() {
    logout.mutate(undefined, { onSuccess: () => void navigate('/login', { replace: true }) })
  }

  return (
    <div className="min-h-screen">
      <EnvironmentBanner environment={environment} />
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 pt-6">
        <NavLink to="/test-runs" className={navLinkClass}>
          Test runs
        </NavLink>
        <div className="ml-auto flex items-center gap-3">
          {user ? <span className="text-muted-foreground text-sm">{user.email}</span> : null}
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={logout.isPending}>
            Log out
          </Button>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Outlet />
      </main>
    </div>
  )
}
