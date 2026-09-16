import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { adminLogin, employeeLogin } from '../api/auth'
import { extractErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

type Mode = 'employee' | 'admin'

export function LoginPage() {
  const { auth, login } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('employee')
  const [username, setUsername] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (auth) {
    return <Navigate to={auth.role === 'Admin' ? '/admin' : '/portal'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response =
        mode === 'admin' ? await adminLogin(username, secret) : await employeeLogin(username, secret)
      login(response)
      navigate(response.role === 'Admin' ? '/admin' : '/portal', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, 'Login failed. Please check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <h1>HRIS Login</h1>
        <div className="tab-switch">
          <button
            type="button"
            className={mode === 'employee' ? 'active' : ''}
            onClick={() => {
              setMode('employee')
              setSecret('')
              setError(null)
            }}
          >
            Employee
          </button>
          <button
            type="button"
            className={mode === 'admin' ? 'active' : ''}
            onClick={() => {
              setMode('admin')
              setSecret('')
              setError(null)
            }}
          >
            Administrator
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            {mode === 'admin' ? 'Password' : '6-digit PIN'}
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              inputMode={mode === 'admin' ? 'text' : 'numeric'}
              maxLength={mode === 'admin' ? undefined : 6}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
