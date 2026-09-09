/**
 * Settings: the account in use and where the dashboard is pointed.
 *
 * Read-only on purpose — the backend exposes no user-management or config
 * endpoints, and inventing UI for calls that do not exist would be worse than
 * saying plainly where each value comes from.
 */
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { siteConfig } from '@/config/siteConfig'
import { API_BASE_URL } from '@/lib/apiBase'
import { PageHeader } from '../AdminApp'
import { useAuth } from '../auth'
import { Button } from '../ui'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--color-hairline)] py-2.5 last:border-0">
      <span className="text-ui text-[var(--color-muted)]">{label}</span>
      <span className="font-[var(--font-mono)] text-micro text-[var(--color-ink)]">{value}</span>
    </div>
  )
}

export function SettingsPage() {
  const { user, logout } = useAuth()
  useDocumentTitle('Settings')

  return (
    <>
      <PageHeader title="Settings" description="Account and connection" />

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="flex max-w-[38rem] flex-col gap-8">
          <section>
            <h2 className="eyebrow mb-2 text-[var(--color-muted)]">Signed in as</h2>
            <Row label="Name" value={user?.name ?? '—'} />
            <Row label="Email" value={user?.email ?? '—'} />
            <Row label="Role" value={user?.role ?? '—'} />
            <div className="mt-3">
              <Button icon="logout" onClick={() => void logout()}>
                Sign out
              </Button>
            </div>
          </section>

          <section>
            <h2 className="eyebrow mb-2 text-[var(--color-muted)]">Connection</h2>
            <Row label="API endpoint" value={API_BASE_URL} />
            <Row label="Public portal" value={`${window.location.origin}/docs`} />
            <p className="mt-2 text-micro text-[var(--color-muted)]">
              Set <code className="font-[var(--font-mono)]">VITE_API_URL</code> to point this dashboard at a
              different backend, then rebuild — Vite inlines it at build time.
            </p>
          </section>

          <section>
            <h2 className="eyebrow mb-2 text-[var(--color-muted)]">Product</h2>
            <Row label="Product" value={siteConfig.productName} />
            <Row label="Documentation" value={siteConfig.documentationTitle} />
            <p className="mt-2 text-micro text-[var(--color-muted)]">
              Branding, navigation labels and footer links live in{' '}
              <code className="font-[var(--font-mono)]">src/config/siteConfig.ts</code>.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
