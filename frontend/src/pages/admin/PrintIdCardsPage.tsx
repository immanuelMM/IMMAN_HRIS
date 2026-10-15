import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { IdCardBackInner, IdCardFrontInner, type IdCardPersonData } from '../../components/IdCardFace'
import { Icon } from '../../components/Icon'
import { CustomCardSide, idCardContext, useDepartmentDesigns } from '../../components/CustomIdCard'
import type { IdCardDesign } from '../../components/idCardDesign'
import { getAllEmployeeQrTokens, listEmployees } from '../../api/employees'
import type { Employee, EmployeeQrToken } from '../../api/types'
import { extractErrorMessage } from '../../api/client'
import { ADMIN_NAV } from './adminNav'

export function PrintIdCardsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [tokens, setTokens] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const designs = useDepartmentDesigns(
    employees
      .filter((e) => e.currentDepartmentIdCardTemplate === 'custom' && e.currentDepartmentId)
      .map((e) => e.currentDepartmentId as number),
  )

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
            <IdPrintPair
              key={emp.id}
              employee={emp}
              token={tokens[emp.id]}
              customDesign={emp.currentDepartmentId ? designs[emp.currentDepartmentId] ?? null : null}
            />
          ))}
          {employees.length === 0 && <p className="no-print">No employees to print.</p>}
        </div>
      )}
    </AdminLayout>
  )
}

function IdPrintPair({
  employee,
  token,
  customDesign,
}: {
  employee: Employee
  token?: string
  customDesign: IdCardDesign | null
}) {
  const currentRole = employee.departmentHistories.find((d) => !d.endDate)?.position
  const employeeNo = `EMP-${String(employee.id).padStart(5, '0')}`
  const template = employee.currentDepartmentIdCardTemplate === 'custom' && !customDesign ? 'wave' : employee.currentDepartmentIdCardTemplate
  const orientation = customDesign?.orientation ?? employee.currentDepartmentCardOrientation
  const orientationClass = orientation === 'vertical' ? 'id-card-vertical' : ''
  const brandStyle = employee.currentDepartmentColor
    ? ({
        '--accent-teal': employee.currentDepartmentColor,
        ...(employee.currentDepartmentColorSecondary
          ? { '--accent-teal-2': employee.currentDepartmentColorSecondary }
          : {}),
      } as CSSProperties)
    : undefined

  const data: IdCardPersonData = {
    fullName: employee.fullName,
    roleOrPosition: currentRole ?? 'Employee',
    departmentName: employee.currentDepartmentName ?? 'IMMAN HRIS',
    employeeNo,
    contactNumber: employee.contactNumber,
    address: employee.address,
    email: employee.email,
    photoUrl: `/employees/${employee.id}/photo`,
    hasPhoto: employee.hasPhoto,
    logoUrl: employee.currentDepartmentId ? `/departments/${employee.currentDepartmentId}/logo` : '',
    hasLogo: employee.currentDepartmentHasLogo,
  }

  if (customDesign) {
    const ctx = idCardContext(data, token ?? null)
    return (
      <div className="id-print-pair">
        {(['front', 'back'] as const).map((side) => (
          <div
            key={side}
            className={`id-print-card ${orientationClass} id-card-template-custom`}
            style={{ borderRadius: customDesign.cornerRadius }}
          >
            <CustomCardSide design={customDesign} side={side} ctx={ctx} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="id-print-pair" style={brandStyle}>
      <div className={`id-print-card ${orientationClass} id-card-template-${template}`}>
        <IdCardFrontInner template={template} data={data} />
      </div>

      <div className={`id-print-card ${orientationClass} id-card-template-${template}`}>
        <IdCardBackInner template={template} data={data} token={token ?? null} error={null} />
      </div>
    </div>
  )
}
