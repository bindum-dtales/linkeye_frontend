/**
 * Route table.
 *
 * Deliberately small: one catch-all under `/docs` resolves any depth against
 * the build-time index, so nesting a subfolder never requires a route change.
 *
 * `/admin` is a second, self-contained application (`src/admin`) with its own
 * shell and routes. It is lazy so a reader of the public portal never downloads
 * the CMS.
 */
import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { DocsLayout } from '@/layouts/DocsLayout'
import { DocsHome } from '@/pages/DocsHome'
import { DocPageRoute } from '@/pages/DocPageRoute'
import { NotFound } from '@/pages/NotFound'

const AdminApp = lazy(() => import('@/admin/AdminApp'))

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/docs" replace />} />
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="p-6 text-[var(--color-muted)]">Loading the CMS…</div>}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route element={<DocsLayout />}>
        <Route path="/docs" element={<DocsHome />} />
        <Route path="/docs/*" element={<DocPageRoute />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
