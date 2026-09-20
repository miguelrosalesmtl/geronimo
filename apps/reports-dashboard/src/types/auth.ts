/**
 * Domain types for reports-backend's own account system (accounts, sessions,
 * RBAC) -- distinct from src/types/user.ts, which describes the unrelated
 * Users feature's demo domain.
 */
export interface AuthUser {
  id: string
  email: string
  full_name: string
  is_superuser: boolean
  is_active: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}
