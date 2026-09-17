import { useEffect, useRef, useState } from 'react'
import { PortalLayout } from '../../components/PortalLayout'
import { Icon } from '../../components/Icon'
import { Avatar } from '../../components/Avatar'
import { deleteMyPhoto, getProfile, uploadMyPhoto } from '../../api/attendance'
import type { Profile } from '../../api/types'
import { extractErrorMessage } from '../../api/client'

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [photoVersion, setPhotoVersion] = useState(0)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load profile.')))
      .finally(() => setLoading(false))
  }, [])

  function handleChoosePhoto() {
    fileInputRef.current?.click()
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setPhotoBusy(true)
    setPhotoError(null)
    try {
      await uploadMyPhoto(file)
      setProfile((p) => (p ? { ...p, hasPhoto: true } : p))
      setPhotoVersion((v) => v + 1)
    } catch (err) {
      setPhotoError(extractErrorMessage(err, 'Failed to upload photo.'))
    } finally {
      setPhotoBusy(false)
    }
  }

  async function handleRemovePhoto() {
    if (!window.confirm('Remove your profile photo?')) return
    setPhotoBusy(true)
    setPhotoError(null)
    try {
      await deleteMyPhoto()
      setProfile((p) => (p ? { ...p, hasPhoto: false } : p))
    } catch (err) {
      setPhotoError(extractErrorMessage(err, 'Failed to remove photo.'))
    } finally {
      setPhotoBusy(false)
    }
  }

  if (loading) {
    return (
      <PortalLayout>
        <p>Loading...</p>
      </PortalLayout>
    )
  }

  if (error || !profile) {
    return (
      <PortalLayout>
        <p className="form-error">{error ?? 'Profile not found.'}</p>
      </PortalLayout>
    )
  }

  const currentRole = profile.departmentHistories.find((d) => !d.endDate)?.position

  return (
    <PortalLayout>
      <div className="resume-paper">
        <div className="resume-header">
          <div className="avatar-upload-wrap">
            <Avatar photoUrl={`/me/photo?v=${photoVersion}`} hasPhoto={profile.hasPhoto} name={profile.fullName} />
            <button
              type="button"
              className="avatar-upload-btn"
              onClick={handleChoosePhoto}
              disabled={photoBusy}
              title="Change photo"
              aria-label="Change photo"
            >
              <Icon name="camera" size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden-file-input"
              onChange={handlePhotoSelected}
            />
          </div>
          <div className="resume-heading">
            <h1 className="resume-title">{profile.fullName}</h1>
            <p className="resume-subtitle">
              {[currentRole, profile.currentDepartmentName].filter(Boolean).join(' — ') || 'Employee'}
            </p>
            {profile.hasPhoto && (
              <button type="button" className="avatar-remove-link" onClick={handleRemovePhoto} disabled={photoBusy}>
                Remove photo
              </button>
            )}
          </div>
        </div>
        {photoError && <p className="form-error photo-error">{photoError}</p>}

        <div className="resume-contact-row">
          <span className="resume-contact-item">
            <Icon name="mail" size={16} /> {profile.email}
          </span>
          <span className="resume-contact-item">
            <Icon name="phone" size={16} /> {profile.contactNumber}
          </span>
          <span className="resume-contact-item">
            <Icon name="map-pin" size={16} /> {profile.address}
          </span>
          <span className="resume-contact-item">
            <Icon name="calendar" size={16} /> Hired {profile.hireDate}
          </span>
        </div>

        <div className="resume-body">
          <section>
            <h2 className="resume-section-title">
              <Icon name="briefcase" size={15} /> Experience
            </h2>
            {profile.employmentHistories.length === 0 ? (
              <p className="resume-empty">No prior employment recorded.</p>
            ) : (
              <div className="timeline">
                {profile.employmentHistories.map((h) => (
                  <div className="timeline-item" key={h.id}>
                    <span className="timeline-dot" />
                    <div className="timeline-role">{h.position}</div>
                    <div className="timeline-org">{h.companyName}</div>
                    <div className="timeline-date">
                      {h.startDate} – {h.endDate ?? 'Present'}
                    </div>
                    {h.reasonForLeaving && <div className="timeline-note">{h.reasonForLeaving}</div>}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="building" size={15} /> Career at the Company
            </h2>
            {profile.departmentHistories.length === 0 ? (
              <p className="resume-empty">No department history recorded.</p>
            ) : (
              <div className="timeline">
                {profile.departmentHistories.map((d) => (
                  <div className="timeline-item" key={d.id}>
                    <span className="timeline-dot" />
                    <div className="timeline-role">{d.position}</div>
                    <div className="timeline-org">{d.departmentName}</div>
                    <div className="timeline-date">
                      {d.startDate} – {d.endDate ?? 'Present'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="graduation-cap" size={15} /> Education
            </h2>
            {profile.educationRecords.length === 0 ? (
              <p className="resume-empty">No education records.</p>
            ) : (
              <div className="timeline">
                {profile.educationRecords.map((r) => (
                  <div className="timeline-item" key={r.id}>
                    <span className="timeline-dot" />
                    <div className="timeline-role">{r.schoolName}</div>
                    <div className="timeline-org">
                      {r.level}
                      {r.programOrStrand ? ` — ${r.programOrStrand}` : ''}
                    </div>
                    {r.yearGraduated && <div className="timeline-date">Graduated {r.yearGraduated}</div>}
                    {r.honors && <div className="timeline-note">{r.honors}</div>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PortalLayout>
  )
}
