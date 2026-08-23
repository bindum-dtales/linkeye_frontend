import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyAccent } from './lib/applyAccent'
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

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
