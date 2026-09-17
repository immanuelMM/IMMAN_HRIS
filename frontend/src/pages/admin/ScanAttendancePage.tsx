import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { AdminLayout } from '../../components/AdminLayout'
import { Icon } from '../../components/Icon'
import { scanAttendanceQr } from '../../api/adminAttendance'
import { extractErrorMessage } from '../../api/client'
import type { ScanAttendanceResult } from '../../api/types'
import { playScanErrorSound, playScanSuccessSound, primeAudio } from '../../utils/sounds'
import { ADMIN_NAV } from './adminNav'

const SCANNER_ELEMENT_ID = 'hris-qr-reader'
const RESULT_DISPLAY_MS = 3000

export function ScanAttendancePage() {
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [result, setResult] = useState<ScanAttendanceResult | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [manualToken, setManualToken] = useState('')
  const [manualBusy, setManualBusy] = useState(false)

  const processingRef = useRef(false)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const qrCode = new Html5Qrcode(SCANNER_ELEMENT_ID)
    let cancelled = false
    let started = false

    function stopAndClear() {
      // stop() throws synchronously (not a rejected promise) if the scanner
      // never successfully started, so this must only be called once we know
      // start() actually resolved.
      qrCode
        .stop()
        .then(() => qrCode.clear())
        .catch(() => {
          // Camera may already be gone (e.g. tab backgrounded) — nothing to clean up.
        })
    }

    qrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => handleDecoded(decodedText),
        () => {
          // Per-frame decode misses are expected while aiming the camera — ignore.
        },
      )
      .then(() => {
        started = true
        if (cancelled) {
          // Component unmounted while the camera permission prompt was pending.
          stopAndClear()
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCameraError(
            'Could not access the camera. Check camera permissions, or use manual entry below.',
          )
          console.error(err)
        }
      })

    return () => {
      cancelled = true
      if (started) {
        stopAndClear()
      }
    }
  }, [])

  async function handleDecoded(token: string) {
    if (processingRef.current) return
    processingRef.current = true
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current)

    await submitToken(token)

    clearTimerRef.current = setTimeout(() => {
      setResult(null)
      setScanError(null)
      processingRef.current = false
    }, RESULT_DISPLAY_MS)
  }

  async function submitToken(token: string) {
    setResult(null)
    setScanError(null)
    try {
      const res = await scanAttendanceQr(token)
      setResult(res)
      playScanSuccessSound()
    } catch (err) {
      setScanError(extractErrorMessage(err, 'Scan failed. Try again.'))
      playScanErrorSound()
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualToken.trim() || manualBusy) return
    primeAudio()
    setManualBusy(true)
    const token = manualToken.trim()
    setManualToken('')
    await submitToken(token)
    setManualBusy(false)
  }

  return (
    <AdminLayout navItems={ADMIN_NAV}>
      <div className="page-header">
        <h1>Scan Attendance</h1>
      </div>
      <p className="resume-empty">
        Point the camera at an employee's ID QR code to record their time in or time out.
      </p>

      <div className="scan-page-layout">
        <div className="scan-viewport">
          <div id={SCANNER_ELEMENT_ID} />
        </div>

        {cameraError && <p className="form-error">{cameraError}</p>}

        {result && (
          <div className="scan-status-card scan-status-success">
            <Icon name="clock" size={28} />
            <div className="scan-status-text">
              <h3>{result.employeeName}</h3>
              <p>
                {result.departmentName ?? 'No department'} — {result.message}
              </p>
            </div>
          </div>
        )}

        {scanError && (
          <div className="scan-status-card scan-status-error">
            <Icon name="qr-code" size={28} />
            <div className="scan-status-text">
              <h3>Scan Rejected</h3>
              <p>{scanError}</p>
            </div>
          </div>
        )}

        {!result && !scanError && <p className="scan-idle-hint">Waiting for a QR code…</p>}

        <form className="form-grid" onSubmit={handleManualSubmit} style={{ width: '100%' }}>
          <label>
            Manual code entry (if camera is unavailable)
            <input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Paste or type the ID QR value"
            />
          </label>
          <button type="submit" className="btn btn-ghost" disabled={manualBusy || !manualToken.trim()}>
            Submit Code
          </button>
        </form>
      </div>
    </AdminLayout>
  )
}
