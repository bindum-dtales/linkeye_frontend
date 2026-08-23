/**
 * Fetches a page's article body.
 *
 * Bodies are code-split, so the first visit to a page loads its chunk. Metadata
 * (title, breadcrumbs, headings) is already present in the navigation index, so
 * the page chrome renders immediately and only the body area waits.
 */
import { useEffect, useState } from 'react'
import { getCachedContent, loadContent } from '@/lib/docs'

export function useArticleContent(path: string): { html: string; loading: boolean } {
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
    setLoading(true)

    loadContent(path).then((loaded) => {
      if (cancelled) return
      setHtml(loaded)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [path])

  return { html, loading }
}
