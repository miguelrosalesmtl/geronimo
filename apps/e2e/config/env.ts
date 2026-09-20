// Single source of truth for target-environment configuration. Values are read
// lazily (on property access), never at module-load time, so `tsc --noEmit`
// and `playwright test --list` don't require env vars that only matter once a
// suite actually runs.

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See apps/e2e/README.md for the full list.`,
    )
  }
  return value
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback
}

export const env = {
  /** Base URL for UI (browser-driven) tests against the target application. */
  get baseUrl(): string {
    return required('BASE_URL')
  },
  /** Base URL for API (request-only) tests against the target application. */
  get apiBaseUrl(): string {
    return required('API_BASE_URL')
  },
  /** Human-readable environment name, stamped onto the submitted test run. */
  get targetEnv(): string {
    return optional('TARGET_ENV', 'local')
  },
  /**
   * Credentials for the local target-app (apps/target-app, a throwaway
   * Django admin app) used by tests/ui/target-app-*.spec.ts. Defaults match
   * the seed values in the repo root docker-compose.yml.
   */
  get targetAdminUsername(): string {
    return optional('TARGET_ADMIN_USERNAME', 'e2e-admin')
  },
  get targetAdminPassword(): string {
    return optional('TARGET_ADMIN_PASSWORD', 'correct-horse-battery-staple')
  },
}
