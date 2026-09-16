import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AdminLayout } from '../../components/AdminLayout'
import { Modal } from '../../components/Modal'
import { ADMIN_NAV } from './adminNav'
import {
  adjustAttendanceTime,
  createAttendanceRecord,
  deleteAttendanceRecord,
  downloadAttendanceReport,
  getAttendanceMonitoring,
} from '../../api/adminAttendance'
import { listEmployees } from '../../api/employees'
import type { AdminAttendanceRecord, Employee, WeeklySummary } from '../../api/types'
import { extractErrorMessage } from '../../api/client'
import { toLocalDateString, todayLocalDateString } from '../../utils/dates'

function currentWeekRange() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysSinceMonday = (dayOfWeek + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysSinceMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: toLocalDateString(monday), end: toLocalDateString(sunday) }
}

function formatTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function AttendanceMonitoringPage() {
  const defaultRange = useMemo(currentWeekRange, [])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeId, setEmployeeId] = useState<number | ''>('')
  const [startDate, setStartDate] = useState(defaultRange.start)
  const [endDate, setEndDate] = useState(defaultRange.end)

  const [records, setRecords] = useState<AdminAttendanceRecord[]>([])
  const [weeklySummaries, setWeeklySummaries] = useState<WeeklySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  const [busyRecordId, setBusyRecordId] = useState<number | null>(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmployeeId, setNewEmployeeId] = useState<number | ''>('')
  const [newDate, setNewDate] = useState(todayLocalDateString)
  const [newTimeIn, setNewTimeIn] = useState('08:00')
  const [newTimeOut, setNewTimeOut] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const [addNotice, setAddNotice] = useState<string | null>(null)

  const [customTarget, setCustomTarget] = useState<{ record: AdminAttendanceRecord; field: 'timeIn' | 'timeOut' } | null>(
    null,
  )
  const [customAmount, setCustomAmount] = useState('1')
  const [customUnit, setCustomUnit] = useState<'hours' | 'minutes'>('hours')

  useEffect(() => {
    listEmployees().then(setEmployees).catch(() => setEmployees([]))
  }, [])

  function load() {
    setLoading(true)
    setError(null)
    getAttendanceMonitoring({
      employeeId: employeeId === '' ? undefined : employeeId,
      startDate,
      endDate,
    })
      .then((data) => {
        setRecords(data.records)
        setWeeklySummaries(data.weeklySummaries)
      })
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load attendance records.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [employeeId, startDate, endDate])

  async function handleExport(format: 'pdf' | 'excel') {
    setExporting(format)
    setError(null)
    try {
      await downloadAttendanceReport(format, {
        employeeId: employeeId === '' ? undefined : employeeId,
        startDate,
        endDate,
      })
    } catch (err) {
      setError(extractErrorMessage(err, `Failed to generate ${format.toUpperCase()} report.`))
    } finally {
      setExporting(null)
    }
  }

  async function handleAdjust(recordId: number, field: 'timeIn' | 'timeOut', minutes: number) {
    setBusyRecordId(recordId)
    setError(null)
    try {
      await adjustAttendanceTime(recordId, field, minutes)
      load()
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to adjust time.'))
    } finally {
      setBusyRecordId(null)
    }
  }

  function openCustomAdjust(record: AdminAttendanceRecord, field: 'timeIn' | 'timeOut') {
    setCustomTarget({ record, field })
    setCustomAmount('1')
    setCustomUnit('hours')
  }

  async function submitCustomAdjust(direction: 'add' | 'subtract') {
    if (!customTarget) return
    const amount = Number(customAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a positive number of hours or minutes.')
      return
    }

    const minutes = (customUnit === 'hours' ? amount * 60 : amount) * (direction === 'subtract' ? -1 : 1)
    await handleAdjust(customTarget.record.id, customTarget.field, minutes)
    setCustomTarget(null)
  }

  async function handleDelete(recordId: number) {
    if (!window.confirm('Delete this attendance record? This cannot be undone.')) return
    setBusyRecordId(recordId)
    setError(null)
    try {
      await deleteAttendanceRecord(recordId)
      load()
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete record.'))
    } finally {
      setBusyRecordId(null)
    }
  }

  async function handleAddRecord(e: FormEvent) {
    e.preventDefault()
    if (newEmployeeId === '' || !newDate || !newTimeIn) return

    setAddSaving(true)
    setError(null)
    setAddNotice(null)
    try {
      await createAttendanceRecord(
        Number(newEmployeeId),
        newDate,
        `${newDate}T${newTimeIn}:00`,
        newTimeOut ? `${newDate}T${newTimeOut}:00` : null,
      )
      setAddNotice('Record added. Adjust the date filters above if it does not appear in the table below.')
      setNewTimeIn('08:00')
      setNewTimeOut('')
      load()
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to add attendance record.'))
    } finally {
      setAddSaving(false)
    }
  }

  return (
    <AdminLayout navItems={ADMIN_NAV}>
      <div className="page-header">
        <h1>Attendance Monitoring</h1>
      </div>

      <div className="card">
        <div className="form-grid">
          <label>
            Employee
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Start Date
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            End Date
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </div>

        <div className="row-actions filter-actions">
          <button type="button" className="btn btn-primary" onClick={() => handleExport('pdf')} disabled={exporting !== null}>
            {exporting === 'pdf' ? 'Generating...' : 'Export PDF'}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => handleExport('excel')} disabled={exporting !== null}>
            {exporting === 'excel' ? 'Generating...' : 'Export Excel'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setShowAddForm((s) => !s)}>
            {showAddForm ? 'Cancel' : '+ Add Record'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddRecord} className="add-record-form">
            <div className="form-grid">
              <label>
                Employee
                <select
                  value={newEmployeeId}
                  onChange={(e) => setNewEmployeeId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
              </label>
              <label>
                Time In
                <input type="time" value={newTimeIn} onChange={(e) => setNewTimeIn(e.target.value)} required />
              </label>
              <label>
                Time Out (optional)
                <input type="time" value={newTimeOut} onChange={(e) => setNewTimeOut(e.target.value)} />
              </label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={addSaving}>
              {addSaving ? 'Adding...' : 'Add Record'}
            </button>
            {addNotice && <p className="form-notice">{addNotice}</p>}
          </form>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <p>Loading attendance records...</p>}

      {!loading && (
        <>
          <h2>Daily Records</h2>
          <div className="table-scroll card">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Daily Hours</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.employeeName}</td>
                    <td>{r.date}</td>
                    <td>
                      <div className="time-adjust-cell">
                        <span>{formatTime(r.timeIn)}</span>
                        <span className="time-adjust-buttons">
                          <button
                            type="button"
                            className="btn-adjust"
                            title="Subtract 15 minutes"
                            disabled={busyRecordId === r.id}
                            onClick={() => handleAdjust(r.id, 'timeIn', -15)}
                          >
                            −15
                          </button>
                          <button
                            type="button"
                            className="btn-adjust"
                            title="Add 15 minutes"
                            disabled={busyRecordId === r.id}
                            onClick={() => handleAdjust(r.id, 'timeIn', 15)}
                          >
                            +15
                          </button>
                        </span>
                        <button
                          type="button"
                          className="btn-adjust-custom"
                          disabled={busyRecordId === r.id}
                          onClick={() => openCustomAdjust(r, 'timeIn')}
                        >
                          Custom…
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="time-adjust-cell">
                        <span>{formatTime(r.timeOut)}</span>
                        <span className="time-adjust-buttons">
                          <button
                            type="button"
                            className="btn-adjust"
                            title="Subtract 15 minutes"
                            disabled={busyRecordId === r.id}
                            onClick={() => handleAdjust(r.id, 'timeOut', -15)}
                          >
                            −15
                          </button>
                          <button
                            type="button"
                            className="btn-adjust"
                            title="Add 15 minutes"
                            disabled={busyRecordId === r.id}
                            onClick={() => handleAdjust(r.id, 'timeOut', 15)}
                          >
                            +15
                          </button>
                        </span>
                        <button
                          type="button"
                          className="btn-adjust-custom"
                          disabled={busyRecordId === r.id}
                          onClick={() => openCustomAdjust(r, 'timeOut')}
                        >
                          Custom…
                        </button>
                      </div>
                    </td>
                    <td>{r.dailyHours !== null ? `${r.dailyHours.toFixed(2)} hrs` : 'In progress'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        disabled={busyRecordId === r.id}
                        onClick={() => handleDelete(r.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      No attendance records for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2>Weekly Summary</h2>
          <div className="table-scroll card">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Week</th>
                  <th>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {weeklySummaries.map((s, i) => (
                  <tr key={i}>
                    <td>{s.employeeName}</td>
                    <td>
                      {s.weekStart} to {s.weekEnd}
                    </td>
                    <td>{s.totalHours.toFixed(2)} hrs</td>
                  </tr>
                ))}
                {weeklySummaries.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-cell">
                      No weekly totals for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {customTarget && (
        <Modal
          title={`Adjust ${customTarget.field === 'timeIn' ? 'Time In' : 'Time Out'}`}
          onClose={() => setCustomTarget(null)}
        >
          <p className="modal-meta">
            {customTarget.record.employeeName} — {customTarget.record.date}
            <br />
            Current value:{' '}
            {formatTime(customTarget.field === 'timeIn' ? customTarget.record.timeIn : customTarget.record.timeOut)}
          </p>

          <label>
            Amount
            <div className="modal-amount-row">
              <input
                type="number"
                min="0"
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              <select value={customUnit} onChange={(e) => setCustomUnit(e.target.value as 'hours' | 'minutes')}>
                <option value="hours">Hours</option>
                <option value="minutes">Minutes</option>
              </select>
            </div>
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busyRecordId === customTarget.record.id}
              onClick={() => submitCustomAdjust('subtract')}
            >
              − Subtract
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busyRecordId === customTarget.record.id}
              onClick={() => submitCustomAdjust('add')}
            >
              + Add
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
