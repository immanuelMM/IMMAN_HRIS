import type { IconName } from '../../components/Icon'

export const ADMIN_NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/employees', label: 'Employees', icon: 'users' },
  { to: '/admin/departments', label: 'Departments', icon: 'building' },
  { to: '/admin/attendance', label: 'Attendance', icon: 'clock' },
]
