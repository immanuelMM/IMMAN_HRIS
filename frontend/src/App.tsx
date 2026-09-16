import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { EmployeeListPage } from './pages/admin/EmployeeListPage'
import { EmployeeFormPage } from './pages/admin/EmployeeFormPage'
import { EmployeeDetailPage } from './pages/admin/EmployeeDetailPage'
import { DepartmentsPage } from './pages/admin/DepartmentsPage'
import { AttendanceMonitoringPage } from './pages/admin/AttendanceMonitoringPage'
import { SettingsPage } from './pages/admin/SettingsPage'
import { ProfilePage } from './pages/portal/ProfilePage'
import { AttendancePage } from './pages/portal/AttendancePage'

function RootRedirect() {
  const { auth } = useAuth()
  if (!auth) return <Navigate to="/login" replace />
  return <Navigate to={auth.role === 'Admin' ? '/admin' : '/portal'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="Admin">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute role="Admin">
              <EmployeeListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees/new"
          element={
            <ProtectedRoute role="Admin">
              <EmployeeFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees/:id"
          element={
            <ProtectedRoute role="Admin">
              <EmployeeDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees/:id/edit"
          element={
            <ProtectedRoute role="Admin">
              <EmployeeFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute role="Admin">
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute role="Admin">
              <AttendanceMonitoringPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute role="Admin">
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal"
          element={
            <ProtectedRoute role="Employee">
              <Navigate to="/portal/profile" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/profile"
          element={
            <ProtectedRoute role="Employee">
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/attendance"
          element={
            <ProtectedRoute role="Employee">
              <AttendancePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
