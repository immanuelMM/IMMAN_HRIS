import { apiClient } from './client'

export interface NotificationSettings {
  smtpHost: string | null
  smtpPort: number | null
  smtpUsername: string | null
  smtpPasswordSet: boolean
  smtpFromEmail: string | null
  smtpFromName: string | null
  smtpUseSsl: boolean
  smsApiKeySet: boolean
  semaphoreSenderName: string | null
  smtpEnvFallbackAvailable: boolean
  smsEnvFallbackAvailable: boolean
  smtpEffectivelyConfigured: boolean
  smsEffectivelyConfigured: boolean
}

export interface UpdateNotificationSettingsPayload {
  smtpHost: string | null
  smtpPort: number | null
  smtpUsername: string | null
  smtpPassword: string | null
  smtpFromEmail: string | null
  smtpFromName: string | null
  smtpUseSsl: boolean
  semaphoreApiKey: string | null
  semaphoreSenderName: string | null
}

export interface TestSendResult {
  success: boolean
  message: string
}

export function getNotificationSettings() {
  return apiClient.get<NotificationSettings>('/admin/notification-settings').then((r) => r.data)
}

export function updateNotificationSettings(payload: UpdateNotificationSettingsPayload) {
  return apiClient.put<NotificationSettings>('/admin/notification-settings', payload).then((r) => r.data)
}

export function sendTestEmail(email: string) {
  return apiClient
    .post<TestSendResult>('/admin/notification-settings/test-email', { email })
    .then((r) => r.data)
}

export function sendTestSms(phone: string) {
  return apiClient
    .post<TestSendResult>('/admin/notification-settings/test-sms', { phone })
    .then((r) => r.data)
}
