import { createBrowserRouter } from 'react-router'

import { AppLayout } from '@/app/AppLayout'
import { RequireAuth } from '@/app/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { TestRunDetailPage } from '@/features/testruns/TestRunDetailPage'
import { TestRunsPage } from '@/features/testruns/TestRunsPage'

// src/features/users/ is frontend-template's own demo vertical slice, left in
// place only as the worked example CLAUDE.md tells you to copy from -- it's
// not routed here. It expects a mock CRUD API shape that doesn't exist on
// reports-backend's real /users (accounts + roles, envelope-paginated), so
// wiring it up against the real API 500s / throws, not 404s.
export const router = createBrowserRouter([
  { path: '/login', Component: LoginPage },
  {
    path: '/',
    Component: RequireAuth,
    children: [
      {
        Component: AppLayout,
        children: [
          { index: true, Component: TestRunsPage },
          { path: 'test-runs', Component: TestRunsPage },
          { path: 'test-runs/:id', Component: TestRunDetailPage },
        ],
      },
    ],
  },
])
