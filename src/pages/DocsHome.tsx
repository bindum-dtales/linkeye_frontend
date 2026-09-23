/**
 * Documentation home.
 *
 * An editorial landing rather than a card grid: a display masthead, then the
 * sections as list rows separated by hairlines. Each row lifts slightly and
 * grows an accent tick on hover.
 *
 * The masthead text is CMS-managed (see `src/lib/homeDoc.ts`) and arrives with
 * the navigation index, so this stays a synchronous render: no loading state,
 * and no flash of placeholder text before the published wording lands. When
 * there is no home document, or the backend cannot be reached, every field
 * falls back to the string the page was previously hardcoded with.
 *
 * The section list is not CMS text at all — it is derived from the live folder
 * tree on every render, which is what keeps it in step with the documentation
 * structure without a second copy to maintain.
 */
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { countPages, homeDoc, homeUnavailable, topLevelFolders } from '@/lib/docs'
import { isPage } from '@/lib/docs.types'
import { ArticleBody } from '@/components/content/ArticleBody'
import { useRail } from '@/lib/railContext'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Breadcrumbs } from '@/components/docs/Breadcrumbs'

export function DocsHome() {
  const folders = topLevelFolders()
  const home = homeDoc()
  const { setHeadings } = useRail()
  useDocumentTitle('Documentation')

  useEffect(() => {
    setHeadings([])
  }, [setHeadings])

  return (
    <div className="min-w-0">
      <Breadcrumbs items={[{ label: 'Documentation' }]} />

      <header className="mt-8">
        <div className="mb-5 flex items-center gap-2">
          <span aria-hidden="true" className="h-[2px] w-4 bg-[var(--color-accent)]" />
          <span className="eyebrow text-[var(--color-muted)]">{home.eyebrow}</span>
        </div>

        <h1 className="max-w-[16ch] text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.035em] text-[var(--color-ink)] sm:text-[3.25rem] lg:text-[3.75rem]">
          {home.title}
        </h1>

        <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-[1.65] text-[var(--color-secondary)]">
          {home.intro}
        </p>

        {/* Only rendered once an editor writes one, so the default page is
            exactly the masthead it has always been. */}
        {home.bodyHtml && (
          <div className="mt-8">
            <ArticleBody html={home.bodyHtml} />
          </div>
        )}

        {/* The one reader-visible sign that this text is the built-in fallback
            rather than what the CMS holds. Same type scale and tokens as the
            rest of the page — it reports a state, it does not decorate one. */}
        {homeUnavailable() && (
          <p className="mt-6 max-w-[46ch] text-[var(--text-ui)] leading-[1.65] text-[var(--color-muted)]">
            Showing the default introduction — the documentation service could not be reached.
          </p>
        )}
      </header>

      <section aria-labelledby="sections-heading" className="mt-16">
        <div className="flex items-baseline justify-between border-b border-[var(--color-ink)] pb-2.5">
          <h2 id="sections-heading" className="eyebrow text-[var(--color-ink)]">
            {home.sectionsHeading}
          </h2>
          <span className="text-[0.6875rem] tabular-nums text-[var(--color-muted)]">
            {folders.length} sections
          </span>
        </div>

        <ul>
          {folders.map((folder) => {
            const firstPage = folder.children.find(isPage)
            return (
              <li key={folder.path}>
                <SectionRow
                  to={firstPage?.path ?? folder.path}
                  title={folder.title}
                  description={folder.description}
                  count={countPages(folder)}
                />
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

interface SectionRowProps {
  to: string
  title: string
  description?: string
  count: number
}

function SectionRow({ to, title, description, count }: SectionRowProps) {
  return (
    <Link
      to={to}
      className="group relative flex items-start gap-6 border-b border-[var(--color-hairline)] py-6 transition-transform duration-[200ms] ease-[var(--ease-out-soft)] hover:-translate-y-px motion-reduce:transform-none"
    >
      {/* Accent tick grows from the left edge on hover. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-6 h-[2px] w-4 origin-left scale-x-0 bg-[var(--color-accent)] transition-transform duration-[200ms] ease-[var(--ease-out-soft)] group-hover:scale-x-100 motion-reduce:transition-none"
      />

      <div className="min-w-0 flex-1 pt-1">
        <div className="flex items-baseline gap-3">
          <h3 className="text-[1.0625rem] font-semibold tracking-[-0.014em] text-[var(--color-ink)]">
            {title}
          </h3>
          <span className="shrink-0 text-[0.6875rem] tabular-nums text-[var(--color-muted)]">
            {count} pages
          </span>
        </div>
        {description && (
          <p className="mt-1.5 max-w-[62ch] text-[var(--text-ui)] leading-[1.65] text-[var(--color-secondary)]">
            {description}
          </p>
        )}
      </div>

      <span
        aria-hidden="true"
        className="mt-1.5 shrink-0 text-[var(--color-border-strong)] transition-[transform,color] duration-[200ms] ease-[var(--ease-out-soft)] group-hover:translate-x-1 group-hover:text-[var(--color-ink)] motion-reduce:transform-none"
      >
        →
      </span>
    </Link>
  )
}
