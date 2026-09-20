const STORAGE_KEY = 'geronimo.auth_token'

/**
 * The session token reports-backend issues on login. Lives in localStorage,
 * read directly by client.ts to attach it to every request -- kept in the
 * `api` layer (not `store`) since `api` may not import `store`, and this is
 * exactly the kind of client-only value transport itself needs to see.
 */
export const authToken = {
  get(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, token)
    } catch {
      // Private-mode / storage-disabled browsers throw here. Staying signed
      // in for this tab only, rather than crashing, is the better failure.
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // See set() above.
    }
  },
}
