/**
 * Admin dashboard shell: session provider, route table and the chrome around
 * every screen.
 *
 * Mounted lazily from the app's route table, so nothing here is downloaded by
 * a reader of the public portal.
 */
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Icon, type IconName } from '@/components/primitives/Icon'
import { siteConfig } from '@/config/siteConfig'
import { AuthProvider, RequireAuth, useAuth } from './auth'
import { Button } from './ui'
import { LoginPage } from './pages/LoginPage'
import { DocumentationPage } from './pages/DocumentationPage'
import { MediaPage } from './pages/MediaPage'
import { ReleaseNotesPage } from './pages/ReleaseNotesPage'
import { SettingsPage } from './pages/SettingsPage'

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/admin/documentation', label: 'Documentation', icon: 'book' },
  { to: '/admin/media', label: 'Media', icon: 'image' },
  { to: '/admin/release-notes', label: 'Release Notes', icon: 'file' },
  { to: '/admin/settings', label: 'Settings', icon: 'command' },
]

function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <nav
      aria-label="Admin sections"
      className="flex w-[15rem] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-page)]"
    >
      <div className="flex h-[3.25rem] items-center gap-2 border-b border-[var(--color-border)] px-4">
        <span className="flex size-5 items-center justify-center rounded-[3px] bg-[var(--color-accent)] text-[10px] font-bold text-[var(--color-ink)]">
          {siteConfig.productName.charAt(0)}
        </span>
        <span className="text-ui font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
          {siteConfig.productName} CMS
        </span>
      </div>

      <ul className="flex-1 space-y-0.5 px-2 py-3">
        {NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-nav-group transition-colors duration-150',
                  isActive
                    ? 'bg-[var(--color-surface)] font-semibold text-[var(--color-ink)] shadow-[inset_2px_0_0_var(--color-accent)]'
                    : 'text-[var(--color-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-ink)]',
                ].join(' ')
              }
            >
              <Icon name={item.icon} size={15} />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="border-t border-[var(--color-border)] px-3 py-3">
        <a
          href="/docs"
          target="_blank"
          rel="noreferrer"
          className="mb-3 flex items-center gap-1.5 text-micro text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          <Icon name="external" size={12} />
          View public portal
        </a>
        <p className="truncate text-micro font-medium text-[var(--color-ink)]" title={user?.email}>
          {user?.name}
        </p>
        <p className="mb-2 truncate text-micro text-[var(--color-muted)]">{user?.email}</p>
        <Button variant="secondary" icon="logout" onClick={() => void logout()} className="w-full">
          Sign out
        </Button>
      </div>
    </nav>
  )
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface)] text-[var(--color-body)]">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  )
}

/** Page header shared by every admin screen: title, description, actions. */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <header className="flex h-[3.25rem] shrink-0 items-center gap-4 border-b border-[var(--color-border)] px-5">
      <div className="min-w-0">
        <h1 className="truncate text-ui font-semibold text-[var(--color-ink)]">{title}</h1>
        {description && <p className="truncate text-micro text-[var(--color-muted)]">{description}</p>}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">{children}</div>
    </header>
  )
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  )
}

export default function AdminApp() {
  const location = useLocation()

  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="documentation" element={<Protected><DocumentationPage /></Protected>} />
        <Route path="media" element={<Protected><MediaPage /></Protected>} />
        <Route path="release-notes" element={<Protected><ReleaseNotesPage /></Protected>} />
        <Route path="settings" element={<Protected><SettingsPage /></Protected>} />
        <Route path="*" element={<Navigate to="/admin/documentation" replace state={{ from: location.pathname }} />} />
      </Routes>
    </AuthProvider>
  )
}
