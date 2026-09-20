import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { LoginForm } from '@/features/auth/components/LoginForm'
import { useLogin } from '@/shared/hooks/useLogin'

/**
 * Container. Owns the form fields and does the loading/error branching that
 * the presentational LoginForm below it never touches.
 */
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/test-runs'

  function handleSubmit() {
    login.mutate(
      { email, password },
      { onSuccess: () => void navigate(redirectTo, { replace: true }) },
    )
  }

  // The feature layer may not import `api` (ApiError included) to distinguish
  // "wrong password" from "server down" — a single message covers both; the
  // network tab is where that distinction actually matters.
  const error = login.isError ? 'Incorrect email or password.' : undefined

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground text-sm">Geronimo reports</p>
      </div>
      <LoginForm
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
        isPending={login.isPending}
        error={error}
      />
    </div>
  )
}
