import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Icon } from './Icon'

const PORTAL_NAV = [
  { to: '/portal/profile', label: 'Profile' },
  { to: '/portal/attendance', label: 'Attendance' },
]

export function PortalLayout({ children }: { children: ReactNode }) {
  const { auth, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="portal-shell">
      <header className="portal-topbar">
        <div className="portal-topbar-row">
          <span className="portal-wordmark">Employee Portal</span>
          <button
            type="button"
            className="menu-toggle"
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name="menu" size={22} />
          </button>
        </div>
        <nav className={`portal-tabs ${menuOpen ? 'open' : ''}`}>
          {PORTAL_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `portal-tab ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="nav-spacer" />
          <span className="nav-user">{auth?.displayName}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </nav>
      </header>
      <main className="portal-content">{children}</main>
    </div>
  )
}
