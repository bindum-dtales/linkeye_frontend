import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyAccent } from './lib/applyAccent'
import { loadDocsIndex } from './lib/docs'
import './styles/index.css'

applyAccent()

/*
 * Completes the static-host SPA fallback: `public/404.html` stashes the
 * originally requested deep URL and bounces to the app shell; we restore it
 * here before React mounts, so the router sees the real path.
 */
try {
  const redirect = sessionStorage.getItem('spa:redirect')
  if (redirect) {
    sessionStorage.removeItem('spa:redirect')
    if (redirect !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(null, '', redirect)
    }
  }
} catch {
  /* sessionStorage unavailable — direct navigation still works on hosts with rewrites */
}

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root not found')

const root = createRoot(container)
const mount = (node: ReactNode) => root.render(<StrictMode>{node}</StrictMode>)

/** Boot-time status, in the portal's own type scale and colour tokens. */
const notice = (message: string): ReactNode => (
  <div className="flex min-h-dvh items-center justify-center p-6 text-center text-[var(--color-muted)]">
    <p className="max-w-[42ch] text-[0.9375rem] leading-[1.6]">{message}</p>
  </div>
)

/*
 * The documentation index is served by the backend CMS, so it has to be in
 * hand before the router can resolve a `/docs/*` URL. The admin app carries its
 * own data layer and must still mount when that call fails.
 */
mount(notice('Loading documentation…'))

/*
 * Publishing happens in another tab (or another person's browser), so re-read
 * the index whenever this tab comes back to the front. `loadDocsIndex` is a
 * no-op when nothing changed.
 */
function watchForPublishedChanges(): void {
  const refresh = () => {
    if (document.visibilityState !== 'visible') return
    void loadDocsIndex().catch(() => {
      /* offline or backend down — keep showing what we already have */
    })
  }
  document.addEventListener('visibilitychange', refresh)
  window.addEventListener('focus', refresh)
}

loadDocsIndex().then(
  () => {
    mount(<App />)
    watchForPublishedChanges()
  },
  (error: unknown) => {
    console.error('Failed to load the documentation index', error)
    if (window.location.pathname.startsWith('/admin')) return mount(<App />)
    mount(notice('The documentation could not be loaded right now. Please refresh the page to try again.'))
  },
)
