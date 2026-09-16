import { apiClient } from './client'
import type {
  CreateEmployeeRequest,
  CreateEmployeeResponse,
  Employee,
  RegeneratePinResponse,
  UpdateEmployeeRequest,
} from './types'

export function listEmployees() {
  return apiClient.get<Employee[]>('/employees').then((r) => r.data)
}

export function getEmployee(id: number) {
  return apiClient.get<Employee>(`/employees/${id}`).then((r) => r.data)
}

export function createEmployee(payload: CreateEmployeeRequest) {
  return apiClient.post<CreateEmployeeResponse>('/employees', payload).then((r) => r.data)
}

export function updateEmployee(id: number, payload: UpdateEmployeeRequest) {
  return apiClient.put<Employee>(`/employees/${id}`, payload).then((r) => r.data)
}

export function deleteEmployee(id: number) {
  return apiClient.delete(`/employees/${id}`)
}

export function regeneratePin(id: number) {
  return apiClient.post<RegeneratePinResponse>(`/employees/${id}/regenerate-pin`).then((r) => r.data)
}

export function transferDepartment(id: number, departmentId: number, position: string, effectiveDate: string) {
  return apiClient
    .post<Employee>(`/employees/${id}/department`, { departmentId, position, effectiveDate })
    .then((r) => r.data)
}
