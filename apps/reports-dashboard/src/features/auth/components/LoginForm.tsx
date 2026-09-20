import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface LoginFormProps {
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
  isPending: boolean
  error?: string
}

/** Presentational. Current field values and a submit callback in, nothing else. */
export function LoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isPending,
  error,
}: LoginFormProps) {
  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
