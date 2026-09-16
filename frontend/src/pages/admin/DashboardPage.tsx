import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/AdminLayout'
import { Icon } from '../../components/Icon'
import { getInitials } from '../../utils/initials'
import { todayLocalDateString } from '../../utils/dates'
import { ADMIN_NAV } from './adminNav'
import { listEmployees } from '../../api/employees'
import { listDepartments } from '../../api/departments'
import { getAttendanceMonitoring } from '../../api/adminAttendance'
import type { Department, Employee } from '../../api/types'

export function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [presentToday, setPresentToday] = useState(0)
  const [clockedInNow, setClockedInNow] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = todayLocalDateString()
    Promise.all([
      listEmployees(),
      listDepartments(),
      getAttendanceMonitoring({ startDate: today, endDate: today }),
    ])
      .then(([emps, depts, attendance]) => {
        setEmployees(emps)
        setDepartments(depts)
        setPresentToday(attendance.records.filter((r) => r.timeIn !== null).length)
        setClockedInNow(attendance.records.filter((r) => r.timeIn !== null && r.timeOut === null).length)
      })
      .finally(() => setLoading(false))
  }, [])

  const recentEmployees = [...employees]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5)

  return (
    <AdminLayout navItems={ADMIN_NAV}>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card-icon">
                <Icon name="users" size={22} />
              </div>
              <div>
                <div className="stat-card-value">{employees.length}</div>
                <div className="stat-card-label">Total Employees</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">
                <Icon name="building" size={22} />
              </div>
              <div>
                <div className="stat-card-value">{departments.length}</div>
                <div className="stat-card-label">Departments</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">
                <Icon name="calendar" size={22} />
              </div>
              <div>
                <div className="stat-card-value">{presentToday}</div>
                <div className="stat-card-label">Present Today</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon">
                <Icon name="clock" size={22} />
              </div>
              <div>
                <div className="stat-card-value">{clockedInNow}</div>
                <div className="stat-card-label">Currently Clocked In</div>
              </div>
            </div>
          </div>

          <h2>Recent Employees</h2>
          <div className="table-scroll card">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Hire Date</th>
                </tr>
              </thead>
              <tbody>
                {recentEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <Link to={`/admin/employees/${emp.id}`} className="table-name-cell">
                        <span className="avatar-circle avatar-small">{getInitials(emp.fullName)}</span>
                        {emp.fullName}
                      </Link>
                    </td>
                    <td>{emp.currentDepartmentName ?? '—'}</td>
                    <td>{emp.hireDate}</td>
                  </tr>
                ))}
                {recentEmployees.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-cell">
                      No employees yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
