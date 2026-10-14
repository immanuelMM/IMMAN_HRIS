import { apiClient } from './client'
import type { CardOrientation, Department, DepartmentPosition, IdCardTemplate } from './types'

export interface DepartmentFields {
  name: string
  description: string | null
  teamColor: string | null
  teamColorSecondary: string | null
  idCardTemplate: IdCardTemplate
  cardOrientation: CardOrientation
}

export function listDepartments() {
  return apiClient.get<Department[]>('/departments').then((r) => r.data)
}

export function createDepartment(fields: DepartmentFields) {
  return apiClient.post<Department>('/departments', fields).then((r) => r.data)
}

export function updateDepartment(id: number, fields: DepartmentFields) {
  return apiClient.put(`/departments/${id}`, fields)
}

export function deleteDepartment(id: number) {
  return apiClient.delete(`/departments/${id}`)
}

export function uploadDepartmentLogo(id: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient.post(`/departments/${id}/logo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function deleteDepartmentLogo(id: number) {
  return apiClient.delete(`/departments/${id}/logo`)
}

export function addDepartmentPosition(id: number, title: string) {
  return apiClient.post<DepartmentPosition>(`/departments/${id}/positions`, { title }).then((r) => r.data)
}

export function deleteDepartmentPosition(id: number, positionId: number) {
  return apiClient.delete(`/departments/${id}/positions/${positionId}`)
}
