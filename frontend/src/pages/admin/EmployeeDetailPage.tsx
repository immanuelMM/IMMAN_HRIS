import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { Icon } from '../../components/Icon'
import {
  deleteEmployee,
  getEmployee,
  regeneratePin,
  transferDepartment,
} from '../../api/employees'
import { listDepartments } from '../../api/departments'
import type { Department, Employee } from '../../api/types'
import { extractErrorMessage } from '../../api/client'
import { getInitials } from '../../utils/initials'
import { todayLocalDateString } from '../../utils/dates'
import { ADMIN_NAV } from './adminNav'

export function EmployeeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newPin, setNewPin] = useState<string | null>(null)

  const [transferDeptId, setTransferDeptId] = useState<number | ''>('')
  const [transferPosition, setTransferPosition] = useState('')
  const [transferDate, setTransferDate] = useState(todayLocalDateString)

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

  async function handleRegeneratePin() {
    if (!id) return
    if (!window.confirm('Regenerate this employee\'s PIN? Their old PIN will stop working immediately.')) return
    try {
      const result = await regeneratePin(Number(id))
      setNewPin(result.newPin)
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to regenerate PIN.'))
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
        <div className="row-actions">
          <Link to={`/admin/employees/${employee.id}/edit`} className="btn btn-ghost">
            Edit
          </Link>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="resume-paper">
        <div className="resume-header">
          <div className="avatar-circle">{getInitials(employee.fullName)}</div>
          <div className="resume-heading">
            <h1 className="resume-title">{employee.fullName}</h1>
            <p className="resume-subtitle">
              {[currentRole, employee.currentDepartmentName].filter(Boolean).join(' — ') || 'Employee'}
            </p>
          </div>
        </div>

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
              <Icon name="key" size={15} /> Account
            </h2>
            <dl className="detail-list">
              <dt>Username</dt>
              <dd>{employee.username}</dd>
            </dl>
            <button type="button" className="btn btn-ghost btn-small" onClick={handleRegeneratePin}>
              Regenerate PIN
            </button>
            {newPin && (
              <p className="pin-value">
                New PIN: <strong>{newPin}</strong> (share with employee now, it won't be shown again)
              </p>
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
                  </div>
                </div>
              ))}
            </div>

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
                <input value={transferPosition} onChange={(e) => setTransferPosition(e.target.value)} />
              </label>
              <label>
                Effective Date
                <input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
              </label>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleTransfer}>
              Transfer
            </button>
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
    </AdminLayout>
  )
}
