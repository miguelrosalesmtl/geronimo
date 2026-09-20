import { randomUUID } from 'node:crypto'

export interface TestUser {
  email: string
  password: string
  fullName: string
}

/**
 * A collision-free identity for a single test run. Tests execute repeatedly
 * against a live, shared target environment, so a fixed fixture email would
 * collide across runs (and across parallel workers within one run).
 */
export function uniqueUser(label = 'user'): TestUser {
  const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`
  return {
    email: `${label}-${suffix}@geronimo.test`,
    password: 'correct-horse-battery-staple',
    fullName: `Geronimo Test ${suffix}`,
  }
}
