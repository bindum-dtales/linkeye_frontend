/**
 * Article reading column.
 *
 * Editorial hierarchy: eyebrow, display title, lede, hairline, body. Metadata is
 * demoted to a single quiet line so it never competes with the title.
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type { DocPage } from '@/lib/docs.types'
import { useArticleContent } from '@/hooks/useArticleContent'
import { Breadcrumbs } from './Breadcrumbs'
import { PageMeta } from './PageMeta'
import { PrevNext } from './PrevNext'
import { ArticleBody } from '@/components/content/ArticleBody'
import { OnThisPage } from './OnThisPage'

export function DocsArticle({ page }: { page: DocPage }) {
  const { html, loading } = useArticleContent(page.path)
  const { hash } = useLocation()

  /*
   * Article bodies are code-split, so on a deep link to a heading the target
   * does not exist when the route first mounts. Scroll once the body lands;
   * `scroll-padding-top` keeps the heading clear of the sticky header.
   */
  useEffect(() => {
    if (loading || !hash) return
    const id = decodeURIComponent(hash.slice(1))
    const target = document.getElementById(id)
    if (!target) return
    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({ block: 'start', behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [loading, hash, page.path])

  const folder = page.breadcrumb.at(-2)?.label

  return (
    <article className="min-w-0">
      <Breadcrumbs items={page.breadcrumb} />

      <header className="mt-8">
        {folder && (
          <div className="mb-4 flex items-center gap-2">
            <span aria-hidden="true" className="h-[2px] w-4 bg-[var(--color-accent)]" />
            <span className="eyebrow text-[var(--color-muted)]">{folder}</span>
          </div>
        )}

        <h1 className="max-w-[18ch] text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.033em] text-[var(--color-ink)] sm:text-[2.75rem] lg:text-[var(--text-display)]">
          {page.title}
        </h1>

        {page.description && (
          <p className="mt-5 max-w-[var(--spacing-measure)] text-[var(--text-lede)] leading-[1.65] text-[var(--color-secondary)]">
            {page.description}
          </p>
        )}

        <div className="mt-7 flex items-center justify-between gap-4 border-t border-[var(--color-hairline)] pt-3">
          <PageMeta lastUpdated={page.lastUpdated} version={page.version} />
        </div>
      </header>

      {/* On This Page moves into the reading column below the rail breakpoint. */}
      <div className="mt-6 xl:hidden">
        <OnThisPage headings={page.headings} collapsible />
      </div>

      <div className="mt-9">
        {loading ? <ArticleSkeleton /> : <ArticleBody html={html} />}
      </div>

      <div className="mt-16">
        <PrevNext prev={page.prev} next={page.next} />
      </div>
    </article>
  )
}

/**
 * Placeholder shown while an article body chunk loads. Matches real prose block
 * rhythm so the page does not jump when content arrives.
 */
function ArticleSkeleton() {
  const widths = [96, 88, 92, 64, 90, 84, 70, 94, 86, 58]
  return (
    <div className="max-w-[var(--spacing-measure)] space-y-3.5" aria-hidden="true">
      {widths.map((width, index) => (
        <div
          key={index}
          className="h-3.5 animate-pulse rounded-sm bg-[var(--color-surface-secondary)] motion-reduce:animate-none"
          style={{ width: `${width}%` }}
        />
      ))}
      <span className="sr-only" aria-live="polite">
        Loading article content
      </span>
    </div>
  )
}
