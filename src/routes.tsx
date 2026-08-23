/**
 * Route table.
 *
 * Deliberately small: one catch-all under `/docs` resolves any depth against
 * the build-time index, so nesting a subfolder never requires a route change.
 */
import { Navigate, Route, Routes } from 'react-router-dom'
import { DocsLayout } from '@/layouts/DocsLayout'
import { DocsHome } from '@/pages/DocsHome'
import { DocPageRoute } from '@/pages/DocPageRoute'
import { NotFound } from '@/pages/NotFound'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/docs" replace />} />
      <Route element={<DocsLayout />}>
        <Route path="/docs" element={<DocsHome />} />
        <Route path="/docs/*" element={<DocPageRoute />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
