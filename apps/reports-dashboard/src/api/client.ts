import { authToken } from '@/api/authToken'
import { getConfig } from '@/config/env'

export class ApiError extends Error {
  readonly status: number
  readonly url: string

  constructor(status: number, url: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

/**
 * The single point where this app talks to the network.
 *
 * Nothing above the `hook` layer should ever import this module directly —
 * the ESLint boundary config enforces that.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options
  // Read at call time, not module scope: config is not loaded when this module
  // is first evaluated.
  const url = `${getConfig().apiUrl}${path}`
  const token = authToken.get()

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) {
    // A 401 means this token is no longer any good (missing, expired,
    // revoked) -- drop it so the next render knows we're logged out, instead
    // of retrying the same dead token forever.
    if (response.status === 401) authToken.clear()
    throw new ApiError(response.status, url, `Request failed: ${response.status} ${path}`)
  }

  if (response.status === 204) return undefined as T

  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
