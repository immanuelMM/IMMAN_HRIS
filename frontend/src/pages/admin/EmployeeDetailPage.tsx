import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { Icon } from '../../components/Icon'
import { Avatar } from '../../components/Avatar'
import {
  deleteEmployee,
  deleteEmployeePhoto,
  downloadEmployeeProfileWord,
  getEmployee,
  regeneratePin,
  transferDepartment,
  uploadEmployeePhoto,
} from '../../api/employees'
import { listDepartments } from '../../api/departments'
import type { Department, Employee, PinDeliveryChannel, RegeneratePinResponse } from '../../api/types'
import { extractErrorMessage } from '../../api/client'
import { formatDurationSince, todayLocalDateString } from '../../utils/dates'
import { ADMIN_NAV } from './adminNav'

export function EmployeeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pinResult, setPinResult] = useState<RegeneratePinResponse | null>(null)
  const [pinBusy, setPinBusy] = useState(false)
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [downloadingWord, setDownloadingWord] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const [transferDeptId, setTransferDeptId] = useState<number | ''>('')
  const [transferPosition, setTransferPosition] = useState('')
  const [transferDate, setTransferDate] = useState(todayLocalDateString)

  const [photoVersion, setPhotoVersion] = useState(0)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function load() {
    if (!id) return
    setLoading(true)
    getEmployee(Number(id))
      .then(setEmployee)
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load employee.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])
  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]))
  }, [])

  function handleRegeneratePin() {
    if (!id || !employee) return
    if (!window.confirm('Regenerate this employee\'s PIN? Their old PIN will stop working immediately.')) return

    const hasPhone = Boolean(employee.contactNumber.trim())
    const hasEmail = Boolean(employee.email.trim())

    if (hasPhone && hasEmail) {
      setShowChannelModal(true)
      return
    }

    void performRegenerate(hasPhone ? 'phone' : hasEmail ? 'email' : undefined)
  }

  async function performRegenerate(channel?: PinDeliveryChannel) {
    if (!id) return
    setShowChannelModal(false)
    setPinBusy(true)
    setError(null)
    try {
      const result = await regeneratePin(Number(id), channel)
      setPinResult(result)
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to regenerate PIN.'))
    } finally {
      setPinBusy(false)
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm('Delete this employee record permanently? This cannot be undone.')) return
    try {
      await deleteEmployee(Number(id))
      navigate('/admin/employees')
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete employee.'))
    }
  }

  function handleDownloadPdf() {
    if (!employee) return
    const previousTitle = document.title
    document.title = `${employee.fullName} - Profile`
    window.print()
    document.title = previousTitle
  }

  async function handleDownloadWord() {
    if (!id) return
    setDownloadingWord(true)
    setDownloadError(null)
    try {
      await downloadEmployeeProfileWord(Number(id))
    } catch (err) {
      setDownloadError(extractErrorMessage(err, 'Failed to download Word document.'))
    } finally {
      setDownloadingWord(false)
    }
  }

  function handleChoosePhoto() {
    fileInputRef.current?.click()
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !id) return

    setPhotoBusy(true)
    setPhotoError(null)
    try {
      await uploadEmployeePhoto(Number(id), file)
      setEmployee((emp) => (emp ? { ...emp, hasPhoto: true } : emp))
      setPhotoVersion((v) => v + 1)
    } catch (err) {
      setPhotoError(extractErrorMessage(err, 'Failed to upload photo.'))
    } finally {
      setPhotoBusy(false)
    }
  }

  async function handleRemovePhoto() {
    if (!id) return
    if (!window.confirm("Remove this employee's photo?")) return
    setPhotoBusy(true)
    setPhotoError(null)
    try {
      await deleteEmployeePhoto(Number(id))
      setEmployee((emp) => (emp ? { ...emp, hasPhoto: false } : emp))
    } catch (err) {
      setPhotoError(extractErrorMessage(err, 'Failed to remove photo.'))
    } finally {
      setPhotoBusy(false)
    }
  }

  async function handleTransfer() {
    if (!id || transferDeptId === '' || !transferPosition.trim()) return
    try {
      const updated = await transferDepartment(Number(id), Number(transferDeptId), transferPosition, transferDate)
      setEmployee(updated)
      setTransferDeptId('')
      setTransferPosition('')
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to transfer department.'))
    }
  }

  if (loading) {
    return (
      <AdminLayout navItems={ADMIN_NAV}>
        <p>Loading...</p>
      </AdminLayout>
    )
  }

  if (error || !employee) {
    return (
      <AdminLayout navItems={ADMIN_NAV}>
        <p className="form-error">{error ?? 'Employee not found.'}</p>
      </AdminLayout>
    )
  }

  const currentRole = employee.departmentHistories.find((d) => !d.endDate)?.position

  return (
    <AdminLayout navItems={ADMIN_NAV}>
      <div className="page-header">
        <h1>Employee Profile</h1>
        <div className="row-actions no-print">
          <button type="button" className="btn btn-ghost" onClick={handleDownloadPdf}>
            <Icon name="download" size={16} /> PDF
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleDownloadWord} disabled={downloadingWord}>
            <Icon name="download" size={16} /> {downloadingWord ? 'Downloading...' : 'Word'}
          </button>
          <Link to={`/admin/employees/${employee.id}/edit`} className="btn btn-ghost">
            Edit
          </Link>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {downloadError && <p className="form-error">{downloadError}</p>}
      {error && <p className="form-error">{error}</p>}

      <div className="resume-paper">
        <div className="resume-header">
          <div className="avatar-upload-wrap">
            <Avatar
              photoUrl={`/employees/${employee.id}/photo?v=${photoVersion}`}
              hasPhoto={employee.hasPhoto}
              name={employee.fullName}
            />
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
            <h1 className="resume-title">{employee.fullName}</h1>
            <p className="resume-subtitle">
              {[currentRole, employee.currentDepartmentName].filter(Boolean).join(' — ') || 'Employee'}
            </p>
            {employee.hasPhoto && (
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
        {photoError && <p className="form-error photo-error no-print">{photoError}</p>}

        <div className="resume-contact-row">
          <span className="resume-contact-item">
            <Icon name="mail" size={16} /> {employee.email}
          </span>
          <span className="resume-contact-item">
            <Icon name="phone" size={16} /> {employee.contactNumber}
          </span>
          <span className="resume-contact-item">
            <Icon name="map-pin" size={16} /> {employee.address}
          </span>
          <span className="resume-contact-item">
            <Icon name="calendar" size={16} /> Hired {employee.hireDate}
          </span>
        </div>

        <div className="resume-body">
          <section>
            <h2 className="resume-section-title">
              <Icon name="users" size={15} /> Personal Information
            </h2>
            <dl className="detail-list">
              <dt>Date of Birth</dt>
              <dd>{employee.dateOfBirth}</dd>
              <dt>Gender</dt>
              <dd>{employee.gender}</dd>
              <dt>Civil Status</dt>
              <dd>{employee.civilStatus}</dd>
            </dl>
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="building" size={15} /> Church Affiliation
            </h2>
            <dl className="detail-list">
              <dt>Local</dt>
              <dd>{employee.churchLocal || '—'}</dd>
              <dt>District</dt>
              <dd>{employee.churchDistrict || '—'}</dd>
              <dt>Province</dt>
              <dd>{employee.churchProvince || '—'}</dd>
              <dt>Region</dt>
              <dd>{employee.churchRegion || '—'}</dd>
              <dt>Position / Designation</dt>
              <dd>{employee.churchPosition || '—'}</dd>
              <dt>Parent Religion</dt>
              <dd>{employee.parentReligion || '—'}</dd>
              <dt>Sabbath Date</dt>
              <dd>
                {employee.sabbathDate
                  ? `${employee.sabbathDate} (${formatDurationSince(employee.sabbathDate)})`
                  : '—'}
              </dd>
            </dl>
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="briefcase" size={15} /> Skills &amp; Health
            </h2>
            <dl className="detail-list">
              <dt>Skills / Expertise</dt>
              <dd>{employee.skillsExpertise || '—'}</dd>
              <dt>Health Condition</dt>
              <dd>{employee.healthCondition || '—'}</dd>
            </dl>
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="phone" size={15} /> Emergency Contact
            </h2>
            <dl className="detail-list">
              <dt>Name</dt>
              <dd>{employee.emergencyContactName || '—'}</dd>
              <dt>Contact No.</dt>
              <dd>{employee.emergencyContactNumber || '—'}</dd>
              <dt>Address</dt>
              <dd>{employee.emergencyContactAddress || '—'}</dd>
            </dl>
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="id-card" size={15} /> Government IDs
            </h2>
            <dl className="detail-list">
              <dt>SSS No.</dt>
              <dd>{employee.sssNumber || '—'}</dd>
              <dt>PhilHealth No.</dt>
              <dd>{employee.philHealthNumber || '—'}</dd>
              <dt>TIN No.</dt>
              <dd>{employee.tinNumber || '—'}</dd>
            </dl>
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="key" size={15} /> Account
            </h2>
            <dl className="detail-list">
              <dt>Username</dt>
              <dd>{employee.username}</dd>
            </dl>
            <button
              type="button"
              className="btn btn-ghost btn-small no-print"
              onClick={handleRegeneratePin}
              disabled={pinBusy}
            >
              {pinBusy ? 'Regenerating...' : 'Regenerate PIN'}
            </button>
            {pinResult && (
              <div className="pin-result no-print">
                <p className="pin-value">
                  New PIN: <strong>{pinResult.newPin}</strong> (share with employee now, it won't be shown again)
                </p>
                <p className={`pin-delivery-note ${pinResult.delivered ? 'pin-delivery-sent' : ''}`}>
                  {pinResult.delivered ? (
                    <>
                      <Icon name={pinResult.deliveryChannel === 'phone' ? 'phone' : 'mail'} size={14} />{' '}
                      Sent via {pinResult.deliveryChannel} to {pinResult.deliveryDestination}.{' '}
                    </>
                  ) : null}
                  {pinResult.deliveryNote}
                </p>
              </div>
            )}
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="briefcase" size={15} /> Experience
            </h2>
            {employee.employmentHistories.length === 0 ? (
              <p className="resume-empty">No prior employment recorded.</p>
            ) : (
              <div className="timeline">
                {employee.employmentHistories.map((h) => (
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
            <div className="timeline">
              {employee.departmentHistories.map((d) => (
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

            <div className="no-print">
              <h3 className="resume-subsection-title">Transfer Department</h3>
              <div className="form-grid">
                <label>
                  New Department
                  <select
                    value={transferDeptId}
                    onChange={(e) => setTransferDeptId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  New Position
                  <input
                    value={transferPosition}
                    onChange={(e) => setTransferPosition(e.target.value)}
                    list="transfer-position-suggestions"
                  />
                  <datalist id="transfer-position-suggestions">
                    {departments
                      .find((d) => d.id === transferDeptId)
                      ?.positions.map((p) => <option key={p.id} value={p.title} />)}
                  </datalist>
                </label>
                <label>
                  Effective Date
                  <input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
                </label>
              </div>
              <button type="button" className="btn btn-primary" onClick={handleTransfer}>
                Transfer
              </button>
            </div>
          </section>

          <section>
            <h2 className="resume-section-title">
              <Icon name="graduation-cap" size={15} /> Education
            </h2>
            {employee.educationRecords.length === 0 ? (
              <p className="resume-empty">No records.</p>
            ) : (
              <div className="timeline">
                {employee.educationRecords.map((r) => (
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

      {showChannelModal && (
        <div className="modal-overlay" onClick={() => setShowChannelModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send New PIN</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowChannelModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-meta">Choose where to send {employee.fullName}'s new PIN.</p>
              <button type="button" className="btn btn-primary pin-channel-btn" onClick={() => performRegenerate('phone')}>
                <Icon name="phone" size={16} />
                <span>
                  Phone
                  <small>{employee.contactNumber}</small>
                </span>
              </button>
              <button type="button" className="btn btn-primary pin-channel-btn" onClick={() => performRegenerate('email')}>
                <Icon name="mail" size={16} />
                <span>
                  Email
                  <small>{employee.email}</small>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
