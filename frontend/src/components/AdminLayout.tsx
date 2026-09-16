import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Icon, type IconName } from './Icon'
import { getInitials } from '../utils/initials'

interface NavItem {
  to: string
  label: string
  icon: IconName
}

export function AdminLayout({ navItems, children }: { navItems: NavItem[]; children: ReactNode }) {
  const { auth, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const nav = (
    <nav className="admin-sidebar-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/admin'}
          className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
          onClick={() => setDrawerOpen(false)}
        >
          <Icon name={item.icon} size={18} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${drawerOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-logo">
          <span className="admin-sidebar-logo-mark">HR</span>
          <span>HRIS Admin</span>
        </div>
        {nav}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="avatar-circle avatar-small">{getInitials(auth?.displayName)}</div>
            <span>{auth?.displayName}</span>
          </div>
          <button type="button" className="admin-logout-btn" onClick={logout}>
            <Icon name="logout" size={16} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {drawerOpen && <div className="admin-sidebar-backdrop" onClick={() => setDrawerOpen(false)} />}

      <div className="admin-body">
        <header className="admin-topbar">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Toggle navigation"
            onClick={() => setDrawerOpen((o) => !o)}
          >
            <Icon name="menu" size={22} />
          </button>
          <span className="admin-topbar-title">HRIS Admin</span>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}
