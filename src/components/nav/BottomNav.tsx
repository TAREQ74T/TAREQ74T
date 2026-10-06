import type { ReactNode } from 'react'

export type NavRoute = 'quran' | 'prayer' | 'adhkar' | 'settings'

interface BottomNavProps {
  active: NavRoute
}

interface NavTab {
  id: NavRoute
  label: string
  href: string
  icon: ReactNode
}

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
  'aria-hidden': true,
  focusable: false,
} as const

const QuranIcon = (
  <svg {...ICON_PROPS}>
    <path
      d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v15.5h5.5A2.5 2.5 0 0 1 20 21V5.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
)

const PrayerIcon = (
  <svg {...ICON_PROPS}>
    <path
      d="M12 3.2c1.6 1.5 2.6 2.6 2.6 4a2.6 2.6 0 1 1-5.2 0c0-1.4 1-2.5 2.6-4Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path
      d="M4 21v-4.2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4V21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="M4 21h16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

const AdhkarIcon = (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="5" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="5.6" cy="9.5" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="18.4" cy="9.5" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="7.4" cy="16.5" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="16.6" cy="16.5" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="M12 7.1V14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
)

const SettingsIcon = (
  <svg {...ICON_PROPS}>
    <circle
      cx="12"
      cy="12"
      r="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
)

const TABS: NavTab[] = [
  { id: 'quran', label: 'القرآن', href: '#/', icon: QuranIcon },
  { id: 'prayer', label: 'الصلاة', href: '#/prayer', icon: PrayerIcon },
  { id: 'adhkar', label: 'الأذكار', href: '#/adhkar', icon: AdhkarIcon },
  { id: 'settings', label: 'الإعدادات', href: '#/settings', icon: SettingsIcon },
]

export function BottomNav({ active }: BottomNavProps) {
  return (
    <nav
      className="bottom-nav"
      data-testid="bottom-nav"
      data-active-section={active}
      aria-label="التنقل الرئيسي"
    >
      {TABS.map((tab) => (
        <a
          key={tab.id}
          className={`bottom-nav__tab${active === tab.id ? ' is-active' : ''}`}
          href={tab.href}
          data-testid={`nav-${tab.id}`}
          aria-label={tab.label}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <span className="bottom-nav__icon">{tab.icon}</span>
          <span className="bottom-nav__label">{tab.label}</span>
        </a>
      ))}
    </nav>
  )
}
