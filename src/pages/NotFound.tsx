import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { topLevelFolders } from '@/lib/docs'

export function NotFound() {
  useDocumentTitle('Page not found')
  const folders = topLevelFolders().slice(0, 6)

  return (
    <div className="min-w-0 py-6">
      <div className="mb-5 flex items-center gap-2">
        <span aria-hidden="true" className="h-[2px] w-4 bg-[var(--color-accent)]" />
        <span className="eyebrow text-[var(--color-muted)]">Error 404</span>
      </div>

      <h1 className="text-[2.25rem] font-semibold leading-[1.08] tracking-[-0.033em] text-[var(--color-ink)] sm:text-[2.75rem]">
        Page not found
      </h1>

      <p className="mt-5 max-w-[52ch] text-[var(--text-lede)] leading-[1.65] text-[var(--color-secondary)]">
        The page you requested does not exist in this documentation set. It may have been moved or
        renamed. Use the navigation on the left, or start from one of the sections below.
      </p>

      <Link
        to="/docs"
        className="group relative mt-8 inline-block text-[var(--text-ui)] font-medium text-[var(--color-ink)]"
      >
        Documentation home
        <span
          aria-hidden="true"
          className="absolute inset-x-0 -bottom-1 h-[2px] bg-[var(--color-accent)] transition-transform duration-[180ms] ease-[var(--ease-out-soft)] group-hover:translate-x-1 motion-reduce:transition-none"
        />
      </Link>

      <ul className="mt-14 border-t border-[var(--color-ink)]">
        {folders.map((folder) => (
          <li key={folder.path}>
            <Link
              to={folder.path}
              className="group flex items-center justify-between gap-4 border-b border-[var(--color-hairline)] py-3.5 text-[var(--text-ui)] text-[var(--color-secondary)] transition-colors duration-150 hover:text-[var(--color-ink)]"
            >
              <span className="font-medium text-[var(--color-ink)]">{folder.title}</span>
              <span
                aria-hidden="true"
                className="text-[var(--color-border-strong)] transition-[transform,color] duration-[200ms] ease-[var(--ease-out-soft)] group-hover:translate-x-1 group-hover:text-[var(--color-ink)] motion-reduce:transform-none"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
