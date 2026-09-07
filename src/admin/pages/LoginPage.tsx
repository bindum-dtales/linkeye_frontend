/**
 * Admin sign-in.
 *
 * Only failure text is produced here — every credential decision is the
 * backend's, including the deliberate "same message for unknown email and
 * wrong password".
 */
import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { siteConfig } from '@/config/siteConfig'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ApiError } from '../api'
import { useAuth } from '../auth'
import { Banner, Button, Field, Input } from '../ui'

export function LoginPage() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useDocumentTitle('Admin sign in')
  useEffect(() => {
    if (user) navigate('/admin/documentation', { replace: true })
  }, [user, navigate])

  if (loading) return null
  if (user) return <Navigate to="/admin/documentation" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
      navigate('/admin/documentation', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-page)] px-4">
      <div className="w-full max-w-[22rem]">
        <div className="mb-7 flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-[3px] bg-[var(--color-accent)] text-[11px] font-bold text-[var(--color-ink)]">
            {siteConfig.productName.charAt(0)}
          </span>
          <span className="text-subtitle font-semibold tracking-[-0.02em] text-[var(--color-ink)]">
            {siteConfig.productName} CMS
          </span>
        </div>

        <h1 className="text-lede font-semibold text-[var(--color-ink)]">Sign in</h1>
        <p className="mb-6 text-ui text-[var(--color-muted)]">
          Manage the {siteConfig.documentationTitle} documentation.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {error && <Banner onDismiss={() => setError(null)}>{error}</Banner>}

          <Field label="Email" htmlFor="admin-email">
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>

          <Field label="Password" htmlFor="admin-password">
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          <Button type="submit" variant="primary" disabled={busy} className="mt-1 h-9 w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
