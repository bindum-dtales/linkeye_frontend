/**
 * Resolves a `/docs/*` URL against the build-time index.
 *
 * A single catch-all handles arbitrary nesting depth, so adding a subfolder
 * never means adding a route. If the path names a folder rather than a page we
 * render a folder overview; if it names neither, a 404.
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getFolder, getPage } from '@/lib/docs'
import { useRail } from '@/lib/railContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { normalizePath } from '@/lib/routing'
import { DocsArticle } from '@/components/docs/DocsArticle'
import { FolderOverview } from './FolderOverview'
import { NotFound } from './NotFound'

export function DocPageRoute() {
  const { pathname } = useLocation()
  const path = normalizePath(pathname)

  const page = getPage(path)
  const folder = page ? undefined : getFolder(path)

  const { setHeadings } = useRail()
  useDocumentTitle(page?.title ?? folder?.title)

  // Publish the article's headings to the layout's right rail.
  useEffect(() => {
    setHeadings(page?.headings ?? folder?.headings ?? [])
    return () => setHeadings([])
  }, [page, folder, setHeadings])

  if (page) return <DocsArticle page={page} />
  if (folder) return <FolderOverview folder={folder} />
  return <NotFound />
}
