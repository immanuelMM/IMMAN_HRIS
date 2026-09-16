import { apiClient } from './client'

export interface ImportSummary {
  message: string
  departments: number
  employees: number
  attendanceRecords: number
}

export async function exportBackup() {
  const response = await apiClient.get('/admin/backup/export', { responseType: 'blob' })

  const contentDisposition = response.headers['content-disposition'] as string | undefined
  const match = contentDisposition?.match(/filename="([^"]+)"|filename=([^;]+)/)
  const filename = (match?.[1] ?? match?.[2])?.trim() ?? `hris-backup-${new Date().toISOString().slice(0, 10)}.json`

  const url = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function importBackup(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient
    .post<ImportSummary>('/admin/backup/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}
