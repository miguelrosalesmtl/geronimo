import { createBrowserRouter } from 'react-router'

import { AppLayout } from '@/app/AppLayout'
import { TestRunDetailPage } from '@/features/testruns/TestRunDetailPage'
import { TestRunsPage } from '@/features/testruns/TestRunsPage'
import { UsersPage } from '@/features/users/UsersPage'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, Component: UsersPage },
      { path: 'users', Component: UsersPage },
      { path: 'test-runs', Component: TestRunsPage },
      { path: 'test-runs/:id', Component: TestRunDetailPage },
    ],
  },
])
