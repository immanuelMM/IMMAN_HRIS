import { apiClient } from './client'
import type { CardOrientation } from './types'

export interface SavedIdCardTemplate {
  id: number
  name: string
  /** JSON-encoded IdCardDesign. */
  design: string
  cardOrientation: CardOrientation
  /** Team colors of the department it was saved from (used to recolor on apply). */
  sourceColor: string | null
  sourceColorSecondary: string | null
  sourceDepartmentName: string | null
  createdAtUtc: string
}

export function listIdCardTemplates() {
  return apiClient.get<SavedIdCardTemplate[]>('/id-card-templates').then((r) => r.data)
}

export function createIdCardTemplate(name: string, design: string, cardOrientation: CardOrientation, sourceDepartmentId: number | null) {
  return apiClient
    .post<SavedIdCardTemplate>('/id-card-templates', { name, design, cardOrientation, sourceDepartmentId })
    .then((r) => r.data)
}

export function renameIdCardTemplate(id: number, name: string) {
  return apiClient.put(`/id-card-templates/${id}`, { name })
}

export function deleteIdCardTemplate(id: number) {
  return apiClient.delete(`/id-card-templates/${id}`)
}
