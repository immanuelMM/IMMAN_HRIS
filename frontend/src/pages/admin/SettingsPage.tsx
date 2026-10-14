import { useEffect, useRef, useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { Icon } from '../../components/Icon'
import { ADMIN_NAV } from './adminNav'
import { exportBackup, importBackup, type ImportSummary } from '../../api/adminBackup'
import {
  getNotificationSettings,
  sendTestEmail,
  sendTestSms,
  updateNotificationSettings,
  type NotificationSettings,
} from '../../api/notificationSettings'
import { extractErrorMessage } from '../../api/client'

export function SettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportSummary | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setExporting(true)
    setExportError(null)
    try {
      await exportBackup()
    } catch (err) {
      setExportError(extractErrorMessage(err, 'Failed to export backup.'))
    } finally {
      setExporting(false)
    }
  }

  function handleChooseFile() {
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const confirmed = window.confirm(
      'Importing a backup will REPLACE all current employees, departments, and attendance records with the contents of this file. This cannot be undone. Continue?',
    )
    if (!confirmed) return

    setImporting(true)
    setImportError(null)
    setImportResult(null)
    try {
      const result = await importBackup(file)
      setImportResult(result)
    } catch (err) {
      setImportError(extractErrorMessage(err, 'Failed to import backup.'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <AdminLayout navItems={ADMIN_NAV}>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <NotificationSettingsCard />

      <div className="card">
        <h2>Export Data</h2>
        <p>
          Download a full backup of the system as a JSON file — employees, education, employment and department
          history, departments, and attendance records. Useful for keeping an off-site copy or migrating to a new
          environment.
        </p>
        <button type="button" className="btn btn-primary" onClick={handleExport} disabled={exporting}>
          <Icon name="download" size={16} /> {exporting ? 'Exporting...' : 'Export Backup'}
        </button>
        {exportError && <p className="form-error">{exportError}</p>}
      </div>

      <div className="card">
        <h2>Import Data</h2>
        <p className="form-error">
          Importing a backup file <strong>replaces all current data</strong> — every employee, department, and
          attendance record currently in the system will be deleted and replaced with what's in the file. This
          cannot be undone. Your admin login is not affected.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
          className="hidden-file-input"
        />
        <button type="button" className="btn btn-danger" onClick={handleChooseFile} disabled={importing}>
          <Icon name="upload" size={16} /> {importing ? 'Importing...' : 'Import Backup'}
        </button>
        {importError && <p className="form-error">{importError}</p>}
        {importResult && (
          <p className="form-notice">
            {importResult.message} ({importResult.departments} departments, {importResult.employees} employees,{' '}
            {importResult.attendanceRecords} attendance records)
          </p>
        )}
      </div>
    </AdminLayout>
  )
}

function statusBadge(effectivelyConfigured: boolean, envFallback: boolean) {
  if (effectivelyConfigured) {
    return <span className="settings-status-badge settings-status-on">Configured — real delivery active</span>
  }
  if (envFallback) {
    return <span className="settings-status-badge settings-status-fallback">Using environment variable fallback</span>
  }
  return <span className="settings-status-badge settings-status-off">Not configured — sends are simulated</span>
}

function NotificationSettingsCard() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('')
  const [smtpUsername, setSmtpUsername] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [smtpFromEmail, setSmtpFromEmail] = useState('')
  const [smtpFromName, setSmtpFromName] = useState('')
  const [smtpUseSsl, setSmtpUseSsl] = useState(true)
  const [semaphoreApiKey, setSemaphoreApiKey] = useState('')
  const [semaphoreSenderName, setSemaphoreSenderName] = useState('')

  const [testEmail, setTestEmail] = useState('')
  const [testEmailBusy, setTestEmailBusy] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null)

  const [testPhone, setTestPhone] = useState('')
  const [testPhoneBusy, setTestPhoneBusy] = useState(false)
  const [testPhoneResult, setTestPhoneResult] = useState<string | null>(null)

  function applySettings(s: NotificationSettings) {
    setSettings(s)
    setSmtpHost(s.smtpHost ?? '')
    setSmtpPort(s.smtpPort ? String(s.smtpPort) : '')
    setSmtpUsername(s.smtpUsername ?? '')
    setSmtpFromEmail(s.smtpFromEmail ?? '')
    setSmtpFromName(s.smtpFromName ?? '')
    setSmtpUseSsl(s.smtpUseSsl)
    setSemaphoreSenderName(s.semaphoreSenderName ?? '')
    setSmtpPassword('')
    setSemaphoreApiKey('')
  }

  useEffect(() => {
    getNotificationSettings()
      .then(applySettings)
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load notification settings.')))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const updated = await updateNotificationSettings({
        smtpHost: smtpHost.trim() || null,
        smtpPort: smtpPort.trim() ? Number(smtpPort) : null,
        smtpUsername: smtpUsername.trim() || null,
        smtpPassword: smtpPassword.trim() || null,
        smtpFromEmail: smtpFromEmail.trim() || null,
        smtpFromName: smtpFromName.trim() || null,
        smtpUseSsl,
        semaphoreApiKey: semaphoreApiKey.trim() || null,
        semaphoreSenderName: semaphoreSenderName.trim() || null,
      })
      applySettings(updated)
      setSaved(true)
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save notification settings.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleTestEmail() {
    if (!testEmail.trim()) return
    setTestEmailBusy(true)
    setTestEmailResult(null)
    try {
      const result = await sendTestEmail(testEmail.trim())
      setTestEmailResult(result.message)
    } catch (err) {
      setTestEmailResult(extractErrorMessage(err, 'Failed to send test email.'))
    } finally {
      setTestEmailBusy(false)
    }
  }

  async function handleTestSms() {
    if (!testPhone.trim()) return
    setTestPhoneBusy(true)
    setTestPhoneResult(null)
    try {
      const result = await sendTestSms(testPhone.trim())
      setTestPhoneResult(result.message)
    } catch (err) {
      setTestPhoneResult(extractErrorMessage(err, 'Failed to send test SMS.'))
    } finally {
      setTestPhoneBusy(false)
    }
  }

  return (
    <div className="card">
      <h2>PIN Delivery — Email &amp; SMS</h2>
      <p>
        Configure how the new PIN is sent when an admin regenerates an employee's PIN (Employees → employee profile
        → Regenerate PIN). Leave a section blank to keep sends simulated (logged only, no real message sent).
      </p>

      {loading && <p>Loading...</p>}
      {error && <p className="form-error">{error}</p>}

      {settings && (
        <>
          <form className="form-grid" onSubmit={handleSave}>
            <div className="span-2 settings-subsection">
              <h3 className="settings-section-title">Email (SMTP)</h3>
              {statusBadge(settings.smtpEffectivelyConfigured, settings.smtpEnvFallbackAvailable)}
            </div>
            <label>
              SMTP Host
              <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
            </label>
            <label>
              SMTP Port
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
              />
            </label>
            <label>
              SMTP Username
              <input value={smtpUsername} onChange={(e) => setSmtpUsername(e.target.value)} placeholder="you@example.com" />
            </label>
            <label>
              SMTP Password
              <input
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder={settings.smtpPasswordSet ? 'Unchanged — leave blank to keep' : 'Enter password'}
              />
            </label>
            <label>
              From Email
              <input
                value={smtpFromEmail}
                onChange={(e) => setSmtpFromEmail(e.target.value)}
                placeholder="Defaults to SMTP username"
              />
            </label>
            <label>
              From Name
              <input value={smtpFromName} onChange={(e) => setSmtpFromName(e.target.value)} placeholder="IMMAN HRIS" />
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={smtpUseSsl} onChange={(e) => setSmtpUseSsl(e.target.checked)} />
              Use SSL/TLS
            </label>

            <div className="span-2 settings-subsection">
              <h3 className="settings-section-title">SMS (Semaphore)</h3>
              {statusBadge(settings.smsEffectivelyConfigured, settings.smsEnvFallbackAvailable)}
            </div>
            <label>
              Semaphore API Key
              <input
                type="password"
                value={semaphoreApiKey}
                onChange={(e) => setSemaphoreApiKey(e.target.value)}
                placeholder={settings.smsApiKeySet ? 'Unchanged — leave blank to keep' : 'Enter API key'}
              />
            </label>
            <label>
              Sender Name (optional)
              <input
                value={semaphoreSenderName}
                onChange={(e) => setSemaphoreSenderName(e.target.value)}
                placeholder="Only if your account has an approved sender name"
              />
            </label>

            <div className="span-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              {saved && <span className="form-notice settings-save-notice">Saved.</span>}
            </div>
          </form>

          <div className="settings-test-row">
            <div className="settings-test-group">
              <label>
                Send test email
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <button type="button" className="btn btn-ghost" onClick={handleTestEmail} disabled={testEmailBusy || !testEmail.trim()}>
                <Icon name="mail" size={16} /> {testEmailBusy ? 'Sending...' : 'Send Test'}
              </button>
              {testEmailResult && <p className="form-notice">{testEmailResult}</p>}
            </div>

            <div className="settings-test-group">
              <label>
                Send test SMS
                <input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="09171234567" />
              </label>
              <button type="button" className="btn btn-ghost" onClick={handleTestSms} disabled={testPhoneBusy || !testPhone.trim()}>
                <Icon name="phone" size={16} /> {testPhoneBusy ? 'Sending...' : 'Send Test'}
              </button>
              {testPhoneResult && <p className="form-notice">{testPhoneResult}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
