/**
 * Application root.
 *
 * The router lives here and nowhere else — swapping `BrowserRouter` for
 * `HashRouter` is a one-line change, paired with `toHref` in `lib/routing.ts`.
 */
import { useSyncExternalStore } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { docsVersion, subscribeDocs } from './lib/docs'

export default function App() {
  // The documentation index is refetched when the tab regains focus; this
  // subscription re-renders the tree when that brings in new published content.
  useSyncExternalStore(subscribeDocs, docsVersion)

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
