import { useEffect, useState } from 'react'
import { PortalLayout } from '../../components/PortalLayout'
import { Icon } from '../../components/Icon'
import { Toast } from '../../components/Toast'
import { getAttendance, getProfile, timeIn, timeOut } from '../../api/attendance'
import type { AttendanceRecord, Profile } from '../../api/types'
import { extractErrorMessage } from '../../api/client'
import { getInitials } from '../../utils/initials'
import { todayLocalDateString } from '../../utils/dates'
import { getTimeInFeedback, getTimeOutFeedback, type AttendanceFeedback } from '../../utils/attendanceFeedback'
import {
  playGoodMorningSound,
  playLateSound,
  playNormalOutSound,
  playEarlyOutSound,
  playTooEarlySound,
  primeAudio,
} from '../../utils/sounds'

function formatTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function AttendancePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<AttendanceFeedback | null>(null)
  const [pulse, setPulse] = useState(false)
  const [poppedButton, setPoppedButton] = useState<'in' | 'out' | null>(null)
  const [weatherPopup, setWeatherPopup] = useState<'in' | 'out' | null>(null)

  function load() {
    setLoading(true)
    Promise.all([getAttendance(), getProfile()])
      .then(([attendance, profileData]) => {
        setRecords(attendance)
        setProfile(profileData)
      })
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load attendance records.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const today = todayLocalDateString()
  const todayRecord = records.find((r) => r.date === today)
  const canTimeIn = !todayRecord
  const canTimeOut = Boolean(todayRecord && todayRecord.timeIn && !todayRecord.timeOut)
  const currentRole = profile?.departmentHistories.find((d) => !d.endDate)?.position

  function triggerPulse(button: 'in' | 'out') {
    setPulse(true)
    setPoppedButton(button)
    setTimeout(() => setPulse(false), 650)
    setTimeout(() => setPoppedButton(null), 400)
  }

  function triggerWeatherPopup(kind: 'in' | 'out') {
    setWeatherPopup(kind)
    setTimeout(() => setWeatherPopup(null), 3400)
  }

  async function handleTimeIn() {
    primeAudio() // called synchronously, before the await, so browsers still treat this as user-triggered audio
    setError(null)
    setActionLoading(true)
    try {
      const result = await timeIn()
      load()
      triggerPulse('in')
      triggerWeatherPopup('in')
      if (result.timeIn) {
        const feedback = getTimeInFeedback(result.timeIn)
        setToast(feedback)
        if (feedback.tone === 'success') playGoodMorningSound()
        else if (feedback.tone === 'warning') playLateSound()
        else playTooEarlySound()
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to time in.'))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleTimeOut() {
    primeAudio()
    setError(null)
    setActionLoading(true)
    const timeInBeforeOut = todayRecord?.timeIn ?? null
    try {
      const result = await timeOut()
      load()
      triggerPulse('out')
      triggerWeatherPopup('out')
      if (result.timeOut) {
        const feedback = getTimeOutFeedback(timeInBeforeOut, result.timeOut)
        setToast(feedback)
        if (feedback.tone === 'success') playNormalOutSound()
        else playEarlyOutSound()
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to time out.'))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <PortalLayout>
      {toast && <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} />}
      <div className="resume-paper">
        <div className="resume-header">
          <div className="avatar-circle">{getInitials(profile?.fullName)}</div>
          <div className="resume-heading">
            <h1 className="resume-title">{profile?.fullName ?? 'Employee'}</h1>
            <p className="resume-subtitle">
              {[currentRole, profile?.currentDepartmentName].filter(Boolean).join(' — ') || 'Time & Attendance'}
            </p>
          </div>
        </div>

        <div className="resume-body">
          <section className={`today-panel ${pulse ? 'pulse' : ''}`}>
            <div className="today-panel-heading">
              <Icon name="clock" size={28} />
              <div>
                <div className="today-panel-label">Today</div>
                <div className="today-panel-date">{today}</div>
              </div>
            </div>

            <div className="today-panel-actions">
              <button
                type="button"
                className={`btn btn-primary btn-large ${poppedButton === 'in' ? 'just-clicked' : ''}`}
                onClick={handleTimeIn}
                disabled={!canTimeIn || actionLoading}
              >
                Time In
              </button>
              <button
                type="button"
                className={`btn btn-primary btn-large ${poppedButton === 'out' ? 'just-clicked' : ''}`}
                onClick={handleTimeOut}
                disabled={!canTimeOut || actionLoading}
              >
                Time Out
              </button>
            </div>
            {todayRecord && (
              <p className="today-panel-status">
                Time in: <strong>{formatTime(todayRecord.timeIn)}</strong> · Time out:{' '}
                <strong>{formatTime(todayRecord.timeOut)}</strong>
              </p>
            )}
            {error && <p className="form-error">{error}</p>}

            {weatherPopup === 'in' && (
              <div className="weather-popup-zone">
                <div className="weather-badge sun-badge weather-popup">
                  <span className="wind-line wind-line-1" />
                  <span className="wind-line wind-line-2" />
                  <span className="wind-line wind-line-3" />
                  <span className="weather-emoji">🌞</span>
                </div>
              </div>
            )}
            {weatherPopup === 'out' && (
              <div className="weather-popup-zone">
                <div className="weather-badge moon-badge weather-popup">
                  <span className="star star-1" />
                  <span className="star star-2" />
                  <span className="star star-3" />
                  <span className="star star-4" />
                  <span className="star star-5" />
                  <span className="weather-emoji">🌜</span>
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="calendar" size={15} /> Attendance History
            </h2>

            {loading ? (
              <p>Loading attendance history...</p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td>{formatTime(r.timeIn)}</td>
                        <td>{formatTime(r.timeOut)}</td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan={3} className="empty-cell">
                          No attendance records yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </PortalLayout>
  )
}
