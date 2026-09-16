import { apiClient } from './client'
import type { Department } from './types'

export function listDepartments() {
  return apiClient.get<Department[]>('/departments').then((r) => r.data)
}

export function createDepartment(name: string, description: string | null) {
  return apiClient.post<Department>('/departments', { name, description }).then((r) => r.data)
}

export function updateDepartment(id: number, name: string, description: string | null) {
  return apiClient.put(`/departments/${id}`, { name, description })
}

export function deleteDepartment(id: number) {
  return apiClient.delete(`/departments/${id}`)
}
