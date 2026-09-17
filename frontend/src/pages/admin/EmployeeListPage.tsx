import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { Avatar } from '../../components/Avatar'
import { listEmployees } from '../../api/employees'
import type { Employee } from '../../api/types'
import { extractErrorMessage } from '../../api/client'
import { ADMIN_NAV } from './adminNav'

export function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    listEmployees()
      .then(setEmployees)
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load employees.')))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        (e.username ?? '').toLowerCase().includes(q) ||
        (e.currentDepartmentName ?? '').toLowerCase().includes(q),
    )
  }, [employees, search])

  return (
    <AdminLayout navItems={ADMIN_NAV}>
      <div className="page-header">
        <h1>Employees</h1>
        <Link to="/admin/employees/new" className="btn btn-primary">
          + New Employee
        </Link>
      </div>

      <input
        className="search-input"
        placeholder="Search by name, username, or department"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p>Loading employees...</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && (
        <div className="table-scroll card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Department</th>
                <th>Hire Date</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <Link to={`/admin/employees/${emp.id}`} className="table-name-cell">
                      <Avatar photoUrl={`/employees/${emp.id}/photo`} hasPhoto={emp.hasPhoto} name={emp.fullName} small />
                      {emp.fullName}
                    </Link>
                  </td>
                  <td>{emp.username}</td>
                  <td>{emp.currentDepartmentName ?? '—'}</td>
                  <td>{emp.hireDate}</td>
                  <td>{emp.email}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
