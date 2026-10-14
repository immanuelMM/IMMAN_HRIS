import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PortalLayout } from '../../components/PortalLayout'
import { Icon } from '../../components/Icon'
import { Avatar } from '../../components/Avatar'
import { IdCardModal } from '../../components/IdCardModal'
import { deleteMyPhoto, downloadMyProfileWord, getAttendance, getProfile, uploadMyPhoto } from '../../api/attendance'
import type { AttendanceRecord, Profile } from '../../api/types'
import { extractErrorMessage } from '../../api/client'
import { formatDurationSince, todayLocalDateString } from '../../utils/dates'

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [photoVersion, setPhotoVersion] = useState(0)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showIdCard, setShowIdCard] = useState(false)
  const [downloadingWord, setDownloadingWord] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getProfile(), getAttendance()])
      .then(([profileData, attendanceData]) => {
        setProfile(profileData)
        setAttendance(attendanceData)
      })
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

  function handleDownloadPdf() {
    const previousTitle = document.title
    document.title = profile ? `${profile.fullName} - Resume` : 'Resume'
    window.print()
    document.title = previousTitle
  }

  async function handleDownloadWord() {
    setDownloadingWord(true)
    setDownloadError(null)
    try {
      await downloadMyProfileWord()
    } catch (err) {
      setDownloadError(extractErrorMessage(err, 'Failed to download Word document.'))
    } finally {
      setDownloadingWord(false)
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

  const today = todayLocalDateString()
  const todayRecord = attendance.find((r) => r.date === today)
  const canClockIn = !todayRecord
  const canClockOut = Boolean(todayRecord && todayRecord.timeIn && !todayRecord.timeOut)
  const clockLabel = canClockIn ? 'Clock In' : canClockOut ? 'Clock Out' : 'Attendance'
  const needsAttention = canClockIn || canClockOut

  return (
    <PortalLayout>
      <div className="no-print resume-toolbar">
        <button type="button" className="btn btn-primary" onClick={handleDownloadPdf}>
          <Icon name="download" size={16} /> Download PDF
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleDownloadWord} disabled={downloadingWord}>
          <Icon name="download" size={16} /> {downloadingWord ? 'Downloading...' : 'Download Word'}
        </button>
      </div>
      {downloadError && <p className="form-error no-print">{downloadError}</p>}
      <div className="resume-paper">
        <div className="resume-header">
          <div className="resume-header-main">
            <div className="avatar-upload-wrap">
              <Avatar photoUrl={`/me/photo?v=${photoVersion}`} hasPhoto={profile.hasPhoto} name={profile.fullName} />
              <button
                type="button"
                className="avatar-upload-btn no-print"
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
                <button
                  type="button"
                  className="avatar-remove-link no-print"
                  onClick={handleRemovePhoto}
                  disabled={photoBusy}
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
          <Link
            to="/portal/attendance"
            className={`clock-shortcut-btn no-print ${needsAttention ? 'attention' : ''}`}
          >
            <Icon name="clock" size={20} />
            <span>{clockLabel}</span>
          </Link>
        </div>
        {photoError && <p className="form-error photo-error no-print">{photoError}</p>}

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
              <Icon name="users" size={15} /> Personal Information
            </h2>
            <dl className="detail-list">
              <dt>Date of Birth</dt>
              <dd>{profile.dateOfBirth}</dd>
              <dt>Gender</dt>
              <dd>{profile.gender}</dd>
              <dt>Civil Status</dt>
              <dd>{profile.civilStatus}</dd>
            </dl>
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="building" size={15} /> Church Affiliation
            </h2>
            <dl className="detail-list">
              <dt>Local</dt>
              <dd>{profile.churchLocal || '—'}</dd>
              <dt>District</dt>
              <dd>{profile.churchDistrict || '—'}</dd>
              <dt>Province</dt>
              <dd>{profile.churchProvince || '—'}</dd>
              <dt>Region</dt>
              <dd>{profile.churchRegion || '—'}</dd>
              <dt>Position / Designation</dt>
              <dd>{profile.churchPosition || '—'}</dd>
              <dt>Parent Religion</dt>
              <dd>{profile.parentReligion || '—'}</dd>
              <dt>Sabbath Date</dt>
              <dd>
                {profile.sabbathDate ? `${profile.sabbathDate} (${formatDurationSince(profile.sabbathDate)})` : '—'}
              </dd>
            </dl>
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="briefcase" size={15} /> Skills &amp; Health
            </h2>
            <dl className="detail-list">
              <dt>Skills / Expertise</dt>
              <dd>{profile.skillsExpertise || '—'}</dd>
              <dt>Health Condition</dt>
              <dd>{profile.healthCondition || '—'}</dd>
            </dl>
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="phone" size={15} /> Emergency Contact
            </h2>
            <dl className="detail-list">
              <dt>Name</dt>
              <dd>{profile.emergencyContactName || '—'}</dd>
              <dt>Contact No.</dt>
              <dd>{profile.emergencyContactNumber || '—'}</dd>
              <dt>Address</dt>
              <dd>{profile.emergencyContactAddress || '—'}</dd>
            </dl>
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="id-card" size={15} /> Government IDs
            </h2>
            <dl className="detail-list">
              <dt>SSS No.</dt>
              <dd>{profile.sssNumber || '—'}</dd>
              <dt>PhilHealth No.</dt>
              <dd>{profile.philHealthNumber || '—'}</dd>
              <dt>TIN No.</dt>
              <dd>{profile.tinNumber || '—'}</dd>
            </dl>
          </section>

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
                      <span className="timeline-duration">{formatDurationSince(d.startDate, d.endDate)}</span>
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

          <section className="no-print">
            <h2 className="resume-section-title">
              <Icon name="id-card" size={15} /> Employee ID
            </h2>
            <p className="resume-empty">
              Show your official ID card, with QR code, for admin attendance scanning.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setShowIdCard(true)}>
              <Icon name="id-card" size={16} /> View My ID
            </button>
          </section>
        </div>
      </div>

      {showIdCard && <IdCardModal profile={profile} onClose={() => setShowIdCard(false)} />}
    </PortalLayout>
  )
}
