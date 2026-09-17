import { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Avatar } from './Avatar'
import { Icon } from './Icon'
import { getMyQrToken } from '../api/attendance'
import { extractErrorMessage } from '../api/client'
import type { Profile } from '../api/types'

export function IdCardModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    getMyQrToken()
      .then((res) => setToken(res.token))
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load ID QR code.')))
  }, [])

  const currentRole = profile.departmentHistories.find((d) => !d.endDate)?.position
  const employeeNo = `EMP-${String(profile.id).padStart(5, '0')}`

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <div className="modal-dialog id-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>My Employee ID</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="modal-body id-card-modal-body">
          <div className="id-card-scene">
            <div className={`id-card-flip ${flipped ? 'flipped' : ''}`}>
              <div className="id-card-face id-card-front">
                <div className="id-card-band">
                  <Icon name="id-card" size={16} />
                  <span>IMMAN HRIS</span>
                </div>
                <div className="id-card-body">
                  <Avatar
                    photoUrl={`/me/photo`}
                    hasPhoto={profile.hasPhoto}
                    name={profile.fullName}
                    className="id-card-avatar"
                  />
                  <div className="id-card-identity">
                    <div className="id-card-name">{profile.fullName}</div>
                    <div className="id-card-role">{currentRole ?? 'Employee'}</div>
                    <div className="id-card-dept">{profile.currentDepartmentName ?? '—'}</div>
                    <div className="id-card-contact">
                      <span className="id-card-contact-line" title={profile.contactNumber}>
                        <Icon name="phone" size={11} /> {profile.contactNumber}
                      </span>
                      <span className="id-card-contact-line" title={profile.address}>
                        <Icon name="map-pin" size={11} /> {profile.address}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="id-card-footer">
                  <span>{employeeNo}</span>
                  <span>Official Employee ID</span>
                </div>
              </div>

              <div className="id-card-face id-card-back">
                <div className="id-card-band id-card-band-alt">
                  <span>Scan for Attendance</span>
                </div>
                <div className="id-card-back-body">
                  {error && <p className="form-error">{error}</p>}
                  {!error && token && (
                    <div className="id-card-qr-wrap">
                      <QRCodeCanvas value={token} size={116} level="M" includeMargin={false} />
                    </div>
                  )}
                  {!error && !token && <p className="id-card-loading">Loading QR...</p>}
                  <p className="id-card-instructions">
                    Present this code to the admin scanner to clock in or out.
                  </p>
                </div>
                <div className="id-card-footer">
                  <span>{employeeNo}</span>
                  <span>Valid while employed</span>
                </div>
              </div>
            </div>
          </div>

          <button type="button" className="btn btn-ghost id-card-flip-btn" onClick={() => setFlipped((f) => !f)}>
            <Icon name="qr-code" size={16} /> {flipped ? 'Show Front' : 'Show Back / QR Code'}
          </button>
        </div>
      </div>
    </div>
  )
}
