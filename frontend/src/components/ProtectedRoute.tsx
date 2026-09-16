import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../api/types'

export function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { auth } = useAuth()

  if (!auth) {
    return <Navigate to="/login" replace />
  }

  if (auth.role !== role) {
    return <Navigate to={auth.role === 'Admin' ? '/admin' : '/portal'} replace />
  }

  return <>{children}</>
}
