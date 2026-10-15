import { useEffect, useState, type CSSProperties } from 'react'
import { IdCardBackInner, IdCardFrontInner, type IdCardPersonData } from './IdCardFace'
import { CustomCardSide, idCardContext, useDepartmentDesigns } from './CustomIdCard'
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
  const designs = useDepartmentDesigns(
    profile.currentDepartmentIdCardTemplate === 'custom' && profile.currentDepartmentId ? [profile.currentDepartmentId] : [],
  )
  const customDesign = profile.currentDepartmentId ? designs[profile.currentDepartmentId] ?? null : null
  // A department switched to "custom" before anything was saved falls back to the default style.
  const template = profile.currentDepartmentIdCardTemplate === 'custom' && !customDesign ? 'wave' : profile.currentDepartmentIdCardTemplate
  const orientation = customDesign?.orientation ?? profile.currentDepartmentCardOrientation
  const orientationClass = orientation === 'vertical' ? 'id-card-vertical' : ''
  const brandStyle = profile.currentDepartmentColor
    ? ({
        '--accent-teal': profile.currentDepartmentColor,
        ...(profile.currentDepartmentColorSecondary
          ? { '--accent-teal-2': profile.currentDepartmentColorSecondary }
          : {}),
      } as CSSProperties)
    : undefined

  const data: IdCardPersonData = {
    fullName: profile.fullName,
    roleOrPosition: currentRole ?? 'Employee',
    departmentName: profile.currentDepartmentName ?? 'IMMAN HRIS',
    employeeNo,
    contactNumber: profile.contactNumber,
    address: profile.address,
    email: profile.email,
    photoUrl: '/me/photo',
    hasPhoto: profile.hasPhoto,
    logoUrl: profile.currentDepartmentId ? `/departments/${profile.currentDepartmentId}/logo` : '',
    hasLogo: profile.currentDepartmentHasLogo,
  }

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
          <div className={`id-card-scene ${orientationClass}`} style={brandStyle}>
            <div className={`id-card-flip ${flipped ? 'flipped' : ''}`}>
              {customDesign ? (
                <>
                  <div className="id-card-face id-card-front id-card-template-custom" style={{ borderRadius: customDesign.cornerRadius }}>
                    <CustomCardSide design={customDesign} side="front" ctx={idCardContext(data, token, error)} />
                  </div>
                  <div className="id-card-face id-card-back id-card-template-custom" style={{ borderRadius: customDesign.cornerRadius }}>
                    <CustomCardSide design={customDesign} side="back" ctx={idCardContext(data, token, error)} />
                  </div>
                </>
              ) : (
                <>
                  <div className={`id-card-face id-card-front id-card-template-${template}`}>
                    <IdCardFrontInner template={template} data={data} />
                  </div>

                  <div className={`id-card-face id-card-back id-card-template-${template}`}>
                    <IdCardBackInner template={template} data={data} token={token} error={error} />
                  </div>
                </>
              )}
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
