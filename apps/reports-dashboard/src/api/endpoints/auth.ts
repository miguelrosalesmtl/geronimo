import { api } from '@/api/client'
import type { AuthUser, LoginCredentials, LoginResponse } from '@/types/auth'

export const authApi = {
  login: (credentials: LoginCredentials) => api.post<LoginResponse>('/auth/login', credentials),
  logout: () => api.post<void>('/auth/logout'),
  me: () => api.get<AuthUser>('/auth/me'),
}
