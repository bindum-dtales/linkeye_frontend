/**
 * Fetches a page's article body.
 *
 * Metadata (title, breadcrumbs, headings) is already present in the navigation
 * index, so the page chrome renders immediately and only the body area waits.
 *
 * The effect is keyed on the docs store version as well as the path. Publishing
 * from the CMS refreshes the index, which clears the body cache; without the
 * version in the dependency list a reader already sitting on that page would go
 * on showing the previous body until they navigated away and back. Re-reading
 * the store here is what closes that gap.
 */
import { useEffect, useState, useSyncExternalStore } from 'react'
import { docsVersion, getCachedContent, loadContent, subscribeDocs } from '@/lib/docs'

export function useArticleContent(path: string): { html: string; loading: boolean } {
  const version = useSyncExternalStore(subscribeDocs, docsVersion)
  const cached = getCachedContent(path)
  const [html, setHtml] = useState(cached ?? '')
  const [loading, setLoading] = useState(cached === undefined)

  useEffect(() => {
    const immediate = getCachedContent(path)
    if (immediate !== undefined) {
      setHtml(immediate)
      setLoading(false)
      return
    }

    let cancelled = false
    // A refetch after a publish keeps the current body on screen rather than
    // blanking the article: only a first, uncached load shows the loading state.
    setLoading(html === '')

    loadContent(path).then((loaded) => {
      if (cancelled) return
      setHtml(loaded)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
    // `html` is deliberately absent: it is written by this effect, and reading
    // it only to choose the loading state must not re-trigger the fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, version])

  return { html, loading }
}
