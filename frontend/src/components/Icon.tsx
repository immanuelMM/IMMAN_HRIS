import type { ReactNode } from 'react'

export type IconName =
  | 'dashboard'
  | 'users'
  | 'building'
  | 'clock'
  | 'logout'
  | 'menu'
  | 'mail'
  | 'phone'
  | 'map-pin'
  | 'briefcase'
  | 'graduation-cap'
  | 'calendar'
  | 'key'
  | 'settings'
  | 'download'
  | 'upload'
  | 'camera'
  | 'qr-code'
  | 'id-card'
  | 'check-circle'
  | 'alert-circle'

const paths: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  users: (
    <>
      <circle cx="8.5" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="8.5" r="2.6" />
      <path d="M15.5 14.3c2.7.4 4.7 2.7 4.7 5.7" />
    </>
  ),
  building: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <line x1="8" y1="7" x2="8" y2="7.01" />
      <line x1="12" y1="7" x2="12" y2="7.01" />
      <line x1="16" y1="7" x2="16" y2="7.01" />
      <line x1="8" y1="11" x2="8" y2="11.01" />
      <line x1="12" y1="11" x2="12" y2="11.01" />
      <line x1="16" y1="11" x2="16" y2="11.01" />
      <line x1="8" y1="15" x2="8" y2="15.01" />
      <line x1="12" y1="15" x2="12" y2="15.01" />
      <line x1="16" y1="15" x2="16" y2="15.01" />
      <path d="M9 21v-3h6v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  menu: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  phone: (
    <path d="M6.6 4.2 9 4a1 1 0 0 1 1 .8l.6 3a1 1 0 0 1-.4 1L8.7 10a12 12 0 0 0 5.3 5.3l1.2-1.5a1 1 0 0 1 1-.4l3 .6a1 1 0 0 1 .8 1l-.2 2.4a1.4 1.4 0 0 1-1.4 1.3A16.6 16.6 0 0 1 3.3 5.6a1.4 1.4 0 0 1 1.3-1.4z" />
  ),
  'map-pin': (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </>
  ),
  'graduation-cap': (
    <>
      <path d="M2 9l10-5 10 5-10 5-10-5z" />
      <path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
      <path d="M22 9v6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M11 12l8-8" />
      <path d="M15 8l3 3" />
      <path d="M18 5l3 3" />
    </>
  ),
  settings: (
    <>
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="9" cy="6" r="2.2" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="16" cy="12" r="2.2" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="10" cy="18" r="2.2" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 20h16" />
    </>
  ),
  upload: (
    <>
      <path d="M12 20V8" />
      <path d="M7 13l5-5 5 5" />
      <path d="M4 20h16" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="14" r="3.5" />
    </>
  ),
  'qr-code': (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <line x1="14" y1="14" x2="14" y2="14.01" />
      <line x1="18" y1="14" x2="18" y2="14.01" />
      <line x1="14" y1="18" x2="14" y2="18.01" />
      <line x1="18" y1="18" x2="18" y2="18.01" />
      <line x1="14" y1="21" x2="21" y2="21" />
      <line x1="21" y1="14" x2="21" y2="21" />
    </>
  ),
  'id-card': (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <circle cx="8" cy="11" r="2.2" />
      <path d="M4.7 16c.5-1.7 1.9-2.6 3.3-2.6s2.8.9 3.3 2.6" />
      <line x1="14.5" y1="9.5" x2="18.5" y2="9.5" />
      <line x1="14.5" y1="12.5" x2="18.5" y2="12.5" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5 5.5-5.5" />
    </>
  ),
  'alert-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <line x1="12" y1="16" x2="12" y2="16.01" />
    </>
  ),
}

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
