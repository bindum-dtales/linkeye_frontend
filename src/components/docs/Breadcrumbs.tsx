/**
 * Breadcrumb trail — small, muted, hairline separators, ink for the current
 * page. Hover reveals a short accent underline.
 */
import { Link } from 'react-router-dom'
import type { Crumb } from '@/lib/docs.types'

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-y-1 text-[var(--text-micro)]">
        {items.map((crumb, index) => {
          const last = index === items.length - 1
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center">
              {index > 0 && (
                <span aria-hidden="true" className="px-2 text-[var(--color-border-strong)]">
                  /
                </span>
              )}
              {crumb.href && !last ? (
                <Link
                  to={crumb.href}
                  className="group relative text-[var(--color-muted)] transition-colors duration-150 hover:text-[var(--color-ink)]"
                >
                  {crumb.label}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-[var(--color-accent)] transition-transform duration-150 ease-[var(--ease-out-soft)] group-hover:scale-x-100 motion-reduce:transition-none"
                  />
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className="font-medium text-[var(--color-ink)]"
                >
                  {crumb.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
