import { apiClient } from './client'
import type { AdminAttendanceRecord, AttendanceMonitoringResponse, ScanAttendanceResult } from './types'

export interface AttendanceFilters {
  employeeId?: number
  startDate: string
  endDate: string
}

export function getAttendanceMonitoring(filters: AttendanceFilters) {
  return apiClient
    .get<AttendanceMonitoringResponse>('/admin/attendance', { params: filters })
    .then((r) => r.data)
}

export function createAttendanceRecord(employeeId: number, date: string, timeIn: string, timeOut: string | null) {
  return apiClient
    .post<AdminAttendanceRecord>('/admin/attendance', { employeeId, date, timeIn, timeOut })
    .then((r) => r.data)
}

export function deleteAttendanceRecord(id: number) {
  return apiClient.delete(`/admin/attendance/${id}`)
}

export function adjustAttendanceTime(id: number, field: 'timeIn' | 'timeOut', minutes: number) {
  return apiClient
    .post<AdminAttendanceRecord>(`/admin/attendance/${id}/adjust`, { field, minutes })
    .then((r) => r.data)
}

export function scanAttendanceQr(token: string) {
  return apiClient.post<ScanAttendanceResult>('/admin/attendance/scan', { token }).then((r) => r.data)
}

export async function downloadAttendanceReport(format: 'pdf' | 'excel', filters: AttendanceFilters) {
  const response = await apiClient.get('/admin/attendance/export', {
    params: { ...filters, format },
    responseType: 'blob',
  })

  const contentDisposition = response.headers['content-disposition'] as string | undefined
  const match = contentDisposition?.match(/filename="([^"]+)"|filename=([^;]+)/)
  const filename = (match?.[1] ?? match?.[2])?.trim() ?? `attendance-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`

  const url = URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
