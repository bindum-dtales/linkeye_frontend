/**
 * Folder landing page.
 *
 * Reached when a URL names a folder rather than a page. Renders the section's
 * own `README.md` prose where it has any, then lists the folder's contents as
 * editorial rows so a folder is a real destination, not a dead URL.
 */
import { Link } from 'react-router-dom'
import type { DocFolder, DocNode } from '@/lib/docs.types'
import { isFolder } from '@/lib/docs.types'
import { countPages } from '@/lib/docs'
import { useArticleContent } from '@/hooks/useArticleContent'
import { ArticleBody } from '@/components/content/ArticleBody'
import { Breadcrumbs } from '@/components/docs/Breadcrumbs'

export function FolderOverview({ folder }: { folder: DocFolder }) {
  return (
    <div className="min-w-0">
      <Breadcrumbs items={folder.breadcrumb} />

      <header className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <span aria-hidden="true" className="h-[2px] w-4 bg-[var(--color-accent)]" />
          <span className="eyebrow text-[var(--color-muted)]">Section</span>
        </div>

        <h1 className="text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.033em] text-[var(--color-ink)] sm:text-[2.75rem]">
          {folder.title}
        </h1>

        {folder.description && (
          <p className="mt-5 max-w-[var(--spacing-measure)] text-[var(--text-lede)] leading-[1.65] text-[var(--color-secondary)]">
            {folder.description}
          </p>
        )}
      </header>

      {folder.hasIndex && <FolderIndexBody path={folder.path} />}

      <section className="mt-14">
        <div className="flex items-baseline justify-between border-b border-[var(--color-ink)] pb-2.5">
          <h2 className="eyebrow text-[var(--color-ink)]">In this section</h2>
          <span className="text-[0.6875rem] tabular-nums text-[var(--color-muted)]">
            {countPages(folder)} pages
          </span>
        </div>

        <ul>
          {folder.children.map((child) => (
            <li key={child.path}>
              <ChildRow node={child} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/**
 * The section README's body. Code-split like any article body, so a section
 * without prose costs nothing.
 */
function FolderIndexBody({ path }: { path: string }) {
  const { html, loading } = useArticleContent(path)
  if (loading || !html) return null
  return (
    <div className="mt-10">
      <ArticleBody html={html} />
    </div>
  )
}

function ChildRow({ node }: { node: DocNode }) {
  const nested = isFolder(node)

  return (
    <Link
      to={node.path}
      className="group relative flex items-start gap-6 border-b border-[var(--color-hairline)] py-5 transition-transform duration-[200ms] ease-[var(--ease-out-soft)] hover:-translate-y-px motion-reduce:transform-none"
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-5 h-[2px] w-4 origin-left scale-x-0 bg-[var(--color-accent)] transition-transform duration-[200ms] ease-[var(--ease-out-soft)] group-hover:scale-x-100 motion-reduce:transition-none"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <h3 className="text-[var(--text-article)] font-semibold tracking-[-0.011em] text-[var(--color-ink)]">
            {node.title}
          </h3>
          {nested && (
            <span className="shrink-0 text-[0.6875rem] tabular-nums text-[var(--color-muted)]">
              {countPages(node)} pages
            </span>
          )}
        </div>
        {node.description && (
          <p className="mt-1 max-w-[62ch] text-[var(--text-ui)] leading-[1.65] text-[var(--color-secondary)]">
            {node.description}
          </p>
        )}
      </div>

      <span
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-[var(--color-border-strong)] transition-[transform,color] duration-[200ms] ease-[var(--ease-out-soft)] group-hover:translate-x-1 group-hover:text-[var(--color-ink)] motion-reduce:transform-none"
      >
        →
      </span>
    </Link>
  )
}
