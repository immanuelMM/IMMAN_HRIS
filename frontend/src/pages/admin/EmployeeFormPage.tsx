import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { createEmployee, getEmployee, updateEmployee } from '../../api/employees'
import { listDepartments } from '../../api/departments'
import { extractErrorMessage } from '../../api/client'
import type {
  CivilStatus,
  Department,
  EducationRecordInput,
  EmploymentHistoryInput,
  Gender,
} from '../../api/types'
import { ADMIN_NAV } from './adminNav'

const emptyEducation: EducationRecordInput = {
  level: 'Tertiary',
  schoolName: '',
  programOrStrand: '',
  yearGraduated: null,
  honors: '',
}

const emptyEmployment: EmploymentHistoryInput = {
  companyName: '',
  position: '',
  startDate: '',
  endDate: null,
  reasonForLeaving: '',
}

export function EmployeeFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; pin: string } | null>(null)

  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [suffix, setSuffix] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState<Gender>('Male')
  const [civilStatus, setCivilStatus] = useState<CivilStatus>('Single')
  const [address, setAddress] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [email, setEmail] = useState('')
  const [hireDate, setHireDate] = useState('')
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [position, setPosition] = useState('')

  const [education, setEducation] = useState<EducationRecordInput[]>([{ ...emptyEducation }])
  const [employment, setEmployment] = useState<EmploymentHistoryInput[]>([])

  useEffect(() => {
    listDepartments().then(setDepartments).catch(() => setDepartments([]))
  }, [])

  useEffect(() => {
    if (!isEdit || !id) return
    getEmployee(Number(id))
      .then((emp) => {
        setFirstName(emp.firstName)
        setMiddleName(emp.middleName ?? '')
        setLastName(emp.lastName)
        setSuffix(emp.suffix ?? '')
        setDateOfBirth(emp.dateOfBirth)
        setGender(emp.gender)
        setCivilStatus(emp.civilStatus)
        setAddress(emp.address)
        setContactNumber(emp.contactNumber)
        setEmail(emp.email)
        setHireDate(emp.hireDate)
        setEducation(
          emp.educationRecords.length
            ? emp.educationRecords.map((r) => ({
                level: r.level,
                schoolName: r.schoolName,
                programOrStrand: r.programOrStrand,
                yearGraduated: r.yearGraduated,
                honors: r.honors,
              }))
            : [{ ...emptyEducation }],
        )
        setEmployment(
          emp.employmentHistories.map((h) => ({
            companyName: h.companyName,
            position: h.position,
            startDate: h.startDate,
            endDate: h.endDate,
            reasonForLeaving: h.reasonForLeaving,
          })),
        )
      })
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load employee.')))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function updateEducationAt(index: number, patch: Partial<EducationRecordInput>) {
    setEducation((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function updateEmploymentAt(index: number, patch: Partial<EmploymentHistoryInput>) {
    setEmployment((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanedEducation = education
      .filter((r) => r.schoolName.trim() !== '')
      .map((r) => ({ ...r, programOrStrand: r.programOrStrand || null, honors: r.honors || null }))
    const cleanedEmployment = employment
      .filter((h) => h.companyName.trim() !== '')
      .map((h) => ({ ...h, reasonForLeaving: h.reasonForLeaving || null, endDate: h.endDate || null }))

    setSaving(true)
    try {
      if (isEdit && id) {
        await updateEmployee(Number(id), {
          firstName,
          middleName: middleName || null,
          lastName,
          suffix: suffix || null,
          dateOfBirth,
          gender,
          civilStatus,
          address,
          contactNumber,
          email,
          hireDate,
          educationRecords: cleanedEducation,
          employmentHistories: cleanedEmployment,
        })
        navigate(`/admin/employees/${id}`)
      } else {
        if (departmentId === '') {
          setError('Please select an initial department.')
          setSaving(false)
          return
        }
        const result = await createEmployee({
          firstName,
          middleName: middleName || null,
          lastName,
          suffix: suffix || null,
          dateOfBirth,
          gender,
          civilStatus,
          address,
          contactNumber,
          email,
          hireDate,
          departmentId: Number(departmentId),
          position,
          educationRecords: cleanedEducation,
          employmentHistories: cleanedEmployment,
        })
        setCreatedCredentials({ username: result.generatedUsername, pin: result.generatedPin })
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save employee.'))
    } finally {
      setSaving(false)
    }
  }

  if (createdCredentials) {
    return (
      <AdminLayout navItems={ADMIN_NAV}>
        <div className="card credential-reveal">
          <h1>Employee Created</h1>
          <p>Share these one-time login credentials with the employee. The PIN cannot be shown again.</p>
          <dl>
            <dt>Username</dt>
            <dd>{createdCredentials.username}</dd>
            <dt>PIN</dt>
            <dd className="pin-value">{createdCredentials.pin}</dd>
          </dl>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/admin/employees')}>
            Back to Employees
          </button>
        </div>
      </AdminLayout>
    )
  }

  if (loading) {
    return (
      <AdminLayout navItems={ADMIN_NAV}>
        <p>Loading...</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout navItems={ADMIN_NAV}>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Employee' : 'New Employee'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="form-stack card">
        <section>
          <h2>Personal Information</h2>
          <div className="form-grid">
            <label>
              First Name
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </label>
            <label>
              Middle Name
              <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </label>
            <label>
              Last Name
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </label>
            <label>
              Suffix
              <input value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder="Jr., III, etc." />
            </label>
            <label>
              Date of Birth
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
            </label>
            <label>
              Gender
              <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              Civil Status
              <select value={civilStatus} onChange={(e) => setCivilStatus(e.target.value as CivilStatus)}>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
            </label>
            <label>
              Contact Number
              <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Hire Date
              <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} required />
            </label>
            <label className="span-2">
              Address
              <input value={address} onChange={(e) => setAddress(e.target.value)} required />
            </label>
          </div>
        </section>

        {!isEdit && (
          <section>
            <h2>Initial Department Assignment</h2>
            <div className="form-grid">
              <label>
                Department
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
                  required
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
                Position
                <input value={position} onChange={(e) => setPosition(e.target.value)} required />
              </label>
            </div>
          </section>
        )}

        <section>
          <div className="section-header">
            <h2>Educational Attainment</h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setEducation((prev) => [...prev, { ...emptyEducation }])}
            >
              + Add Education Entry
            </button>
          </div>
          {education.map((rec, i) => (
            <div key={i} className="repeatable-row">
              <div className="form-grid">
                <label>
                  Level
                  <select
                    value={rec.level}
                    onChange={(e) => updateEducationAt(i, { level: e.target.value as EducationRecordInput['level'] })}
                  >
                    <option value="Secondary">Secondary</option>
                    <option value="Tertiary">Tertiary</option>
                    <option value="Vocational">Vocational</option>
                  </select>
                </label>
                <label>
                  School Name
                  <input value={rec.schoolName} onChange={(e) => updateEducationAt(i, { schoolName: e.target.value })} />
                </label>
                <label>
                  Program / Strand
                  <input
                    value={rec.programOrStrand ?? ''}
                    onChange={(e) => updateEducationAt(i, { programOrStrand: e.target.value })}
                  />
                </label>
                <label>
                  Year Graduated
                  <input
                    type="number"
                    value={rec.yearGraduated ?? ''}
                    onChange={(e) =>
                      updateEducationAt(i, { yearGraduated: e.target.value ? Number(e.target.value) : null })
                    }
                  />
                </label>
                <label>
                  Honors
                  <input value={rec.honors ?? ''} onChange={(e) => updateEducationAt(i, { honors: e.target.value })} />
                </label>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => setEducation((prev) => prev.filter((_, idx) => idx !== i))}
              >
                Remove
              </button>
            </div>
          ))}
        </section>

        <section>
          <div className="section-header">
            <h2>Employment History (prior employers)</h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setEmployment((prev) => [...prev, { ...emptyEmployment }])}
            >
              + Add Employment Entry
            </button>
          </div>
          {employment.map((job, i) => (
            <div key={i} className="repeatable-row">
              <div className="form-grid">
                <label>
                  Company Name
                  <input value={job.companyName} onChange={(e) => updateEmploymentAt(i, { companyName: e.target.value })} />
                </label>
                <label>
                  Position
                  <input value={job.position} onChange={(e) => updateEmploymentAt(i, { position: e.target.value })} />
                </label>
                <label>
                  Start Date
                  <input
                    type="date"
                    value={job.startDate}
                    onChange={(e) => updateEmploymentAt(i, { startDate: e.target.value })}
                  />
                </label>
                <label>
                  End Date
                  <input
                    type="date"
                    value={job.endDate ?? ''}
                    onChange={(e) => updateEmploymentAt(i, { endDate: e.target.value || null })}
                  />
                </label>
                <label className="span-2">
                  Reason for Leaving
                  <input
                    value={job.reasonForLeaving ?? ''}
                    onChange={(e) => updateEmploymentAt(i, { reasonForLeaving: e.target.value })}
                  />
                </label>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => setEmployment((prev) => prev.filter((_, idx) => idx !== i))}
              >
                Remove
              </button>
            </div>
          ))}
        </section>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Employee'}
          </button>
        </div>
      </form>
    </AdminLayout>
  )
}
