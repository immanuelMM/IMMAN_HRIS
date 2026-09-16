import { apiClient } from './client'
import type { AttendanceRecord, Profile } from './types'

export function getProfile() {
  return apiClient.get<Profile>('/me/profile').then((r) => r.data)
}

export function getAttendance() {
  return apiClient.get<AttendanceRecord[]>('/me/attendance').then((r) => r.data)
}

export function timeIn() {
  return apiClient.post<AttendanceRecord>('/me/time-in').then((r) => r.data)
}

export function timeOut() {
  return apiClient.post<AttendanceRecord>('/me/time-out').then((r) => r.data)
}
