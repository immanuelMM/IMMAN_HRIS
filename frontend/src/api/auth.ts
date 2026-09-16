import { apiClient } from './client'
import type { LoginResponse } from './types'

export function adminLogin(username: string, password: string) {
  return apiClient.post<LoginResponse>('/auth/admin/login', { username, password }).then((r) => r.data)
}

export function employeeLogin(username: string, pin: string) {
  return apiClient.post<LoginResponse>('/auth/employee/login', { username, pin }).then((r) => r.data)
}
