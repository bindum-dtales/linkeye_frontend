/**
 * Previous / Next navigation.
 *
 * Text and arrows on a hairline, not cards. Ordering follows the flattened
 * document spine and crosses folder boundaries, so the last page of one folder
 * leads into the first page of the next.
 */
import { Link } from 'react-router-dom'
import type { NavRef } from '@/lib/docs.types'

export function PrevNext({ prev, next }: { prev?: NavRef; next?: NavRef }) {
  if (!prev && !next) return null

  return (
    <nav
      aria-label="Previous and next page"
      className="flex items-start justify-between gap-8 border-t border-[var(--color-hairline)] pt-6"
    >
      <div className="min-w-0 flex-1">
        {prev && (
          <Link to={prev.path} className="group inline-flex max-w-full flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-[var(--color-muted)] transition-colors duration-150 group-hover:text-[var(--color-ink)]">
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-[180ms] ease-[var(--ease-out-soft)] group-hover:-translate-x-1 motion-reduce:transform-none"
              >
                ←
              </span>
              Previous
            </span>
            <span className="relative truncate text-[0.9375rem] font-medium tracking-[-0.011em] text-[var(--color-ink)]">
              {prev.title}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-left scale-x-0 bg-[var(--color-accent)] transition-transform duration-[180ms] ease-[var(--ease-out-soft)] group-hover:scale-x-100 motion-reduce:transition-none"
              />
            </span>
            <span className="truncate text-[0.6875rem] text-[var(--color-muted)]">
              {prev.folderTitle}
            </span>
          </Link>
        )}
      </div>

      <div className="flex min-w-0 flex-1 justify-end">
        {next && (
          <Link
            to={next.path}
            className="group inline-flex max-w-full flex-col items-end gap-1.5 text-right"
          >
            <span className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.09em] text-[var(--color-muted)] transition-colors duration-150 group-hover:text-[var(--color-ink)]">
              Next
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-[180ms] ease-[var(--ease-out-soft)] group-hover:translate-x-1 motion-reduce:transform-none"
              >
                →
              </span>
            </span>
            <span className="relative truncate text-[0.9375rem] font-medium tracking-[-0.011em] text-[var(--color-ink)]">
              {next.title}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-right scale-x-0 bg-[var(--color-accent)] transition-transform duration-[180ms] ease-[var(--ease-out-soft)] group-hover:scale-x-100 motion-reduce:transition-none"
              />
            </span>
            <span className="truncate text-[0.6875rem] text-[var(--color-muted)]">
              {next.folderTitle}
            </span>
          </Link>
        )}
      </div>
    </nav>
  )
}
