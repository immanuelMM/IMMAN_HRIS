import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { AdminLayout } from '../../components/AdminLayout'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/Icon'
import { getAllEmployeeQrTokens, listEmployees } from '../../api/employees'
import type { Employee, EmployeeQrToken } from '../../api/types'
import { extractErrorMessage } from '../../api/client'
import { ADMIN_NAV } from './adminNav'

export function PrintIdCardsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tokens, setTokens] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listEmployees(), getAllEmployeeQrTokens()])
      .then(([emps, qrTokens]) => {
        setEmployees(emps)
        const map: Record<number, string> = {}
        qrTokens.forEach((t: EmployeeQrToken) => {
          map[t.employeeId] = t.token
        })
        setTokens(map)
      })
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load employee IDs.')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout navItems={ADMIN_NAV}>
      <div className="page-header no-print">
        <h1>Print Employee IDs</h1>
        <div className="row-actions">
          <Link to="/admin/employees" className="btn btn-ghost">
            Back to Employees
          </Link>
          <button type="button" className="btn btn-primary" onClick={() => window.print()} disabled={loading}>
            <Icon name="download" size={16} /> Print All
          </button>
        </div>
      </div>

      {loading && <p className="no-print">Loading employee IDs...</p>}
      {error && <p className="form-error no-print">{error}</p>}

      {!loading && !error && (
        <div className="id-print-sheet">
          {employees.map((emp) => (
            <IdPrintPair key={emp.id} employee={emp} token={tokens[emp.id]} />
          ))}
          {employees.length === 0 && <p className="no-print">No employees to print.</p>}
        </div>
      )}
    </AdminLayout>
  )
}

function IdPrintPair({ employee, token }: { employee: Employee; token?: string }) {
  const currentRole = employee.departmentHistories.find((d) => !d.endDate)?.position
  const employeeNo = `EMP-${String(employee.id).padStart(5, '0')}`

  return (
    <div className="id-print-pair">
      <div className="id-print-card">
        <div className="id-card-band">
          <Icon name="building" size={16} />
          <span>{employee.currentDepartmentName ?? 'IMMAN HRIS'}</span>
        </div>
        <div className="id-card-body">
          <Avatar
            photoUrl={`/employees/${employee.id}/photo`}
            hasPhoto={employee.hasPhoto}
            name={employee.fullName}
            className="id-card-avatar"
          />
          <div className="id-card-identity">
            <div className="id-card-name">{employee.fullName}</div>
            <div className="id-card-role">{currentRole ?? 'Employee'}</div>
            <div className="id-card-contact">
              <span className="id-card-contact-line" title={employee.contactNumber}>
                <Icon name="phone" size={11} /> {employee.contactNumber}
              </span>
              <span className="id-card-contact-line" title={employee.address}>
                <Icon name="map-pin" size={11} /> {employee.address}
              </span>
            </div>
          </div>
        </div>
        <div className="id-card-footer">
          <span>{employeeNo}</span>
          <span>Official Employee ID</span>
        </div>
      </div>

      <div className="id-print-card">
        <div className="id-card-band id-card-band-alt">
          <span>Scan for Attendance</span>
        </div>
        <div className="id-card-back-body">
          {token ? (
            <div className="id-card-qr-wrap">
              <QRCodeCanvas value={token} size={116} level="M" includeMargin={false} />
            </div>
          ) : (
            <p className="id-card-loading">QR unavailable</p>
          )}
          <p className="id-card-instructions">Present this code to the admin scanner to clock in or out.</p>
        </div>
        <div className="id-card-footer">
          <span>{employeeNo}</span>
          <span>Valid while employed</span>
        </div>
      </div>
    </div>
  )
}
