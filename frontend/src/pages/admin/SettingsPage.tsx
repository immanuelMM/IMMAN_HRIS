import { useRef, useState } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { Icon } from '../../components/Icon'
import { ADMIN_NAV } from './adminNav'
import { exportBackup, importBackup, type ImportSummary } from '../../api/adminBackup'
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
