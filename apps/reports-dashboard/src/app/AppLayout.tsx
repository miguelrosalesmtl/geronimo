import { NavLink, Outlet } from 'react-router'

import { EnvironmentBanner } from '@/components/environment-banner'
import { getConfig } from '@/config/env'
import { cn } from '@/lib/utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn('text-sm font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')

export function AppLayout() {
  // The composition root reads config; everything below it just receives props.
  const { environment } = getConfig()

  return (
    <div className="min-h-screen">
      <EnvironmentBanner environment={environment} />
      <nav className="mx-auto flex max-w-5xl gap-6 px-6 pt-6">
        <NavLink to="/users" className={navLinkClass}>
          Users
        </NavLink>
        <NavLink to="/test-runs" className={navLinkClass}>
          Test runs
        </NavLink>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Outlet />
      </main>
    </div>
  )
}
