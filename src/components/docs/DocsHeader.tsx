/**
 * Documentation header.
 *
 * Both rows sit on one continuous yellow ground: the `<header>` element is the
 * only thing that paints a background, and neither row nor any child sets one,
 * so there is no seam or white strip between them.
 *
 * The header re-scopes the neutral text/border tokens to values that hold up on
 * yellow. Nested components (Wordmark, Icon) read those same variables, so they
 * adapt through the cascade rather than needing header-specific props.
 */
import { Link, useLocation } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { siteConfig } from '@/config/siteConfig'
import { Icon } from '@/components/primitives/Icon'
import { Wordmark } from '@/components/primitives/Wordmark'
import { isAncestorPath, isExternal, normalizePath } from '@/lib/routing'

interface DocsHeaderProps {
  onOpenNav: () => void
  onOpenSearch: () => void
}

/**
 * Token overrides scoped to the header. The page's greys measure 3.2–3.9:1 on
 * yellow and would fail AA, so they step down to charcoals that clear 4.5:1.
 */
const ON_YELLOW: CSSProperties = {
  '--color-ink': '#111111',
  '--color-secondary': '#292929',
  '--color-muted': '#555555',
  '--color-border': 'rgba(17, 17, 17, 0.18)',
  '--color-border-strong': 'rgba(17, 17, 17, 0.34)',
} as CSSProperties

export function DocsHeader({ onOpenNav, onOpenSearch }: DocsHeaderProps) {
  const { pathname } = useLocation()
  const current = normalizePath(pathname)

  return (
    <header
      style={ON_YELLOW}
      /* Opaque and flat: stays exactly this colour while sticky — no blur,
         no transparency, no shadow. */
      className="border-b border-[rgba(17,17,17,0.15)] bg-[var(--color-accent)]"
    >
      {/* ---------------------------------------------------- identity row */}
      <div className="mx-auto flex h-[3.25rem] max-w-[1680px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenNav}
          className="-ml-1.5 flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--color-ink)] transition-colors duration-[180ms] hover:bg-[rgba(17,17,17,0.08)] lg:hidden"
          aria-label="Open documentation navigation"
        >
          <Icon name="menu" size={18} />
        </button>

        <Wordmark />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SearchTrigger onClick={onOpenSearch} />

          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-[rgba(17,17,17,0.2)] md:block"
          />

          <nav aria-label="Utility" className="hidden items-center md:flex">
            {siteConfig.headerLinks.map((link) => (
              <UtilityLink key={link.label} {...link} />
            ))}
          </nav>
        </div>
      </div>

      {/* ----------------------------------------------------- context row */}
      <div className="mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-8">
        <div className="no-scrollbar flex items-stretch gap-6 overflow-x-auto">
          <span className="hidden shrink-0 items-center py-2.5 pr-2 text-[var(--text-micro)] font-medium tracking-[-0.005em] text-[var(--color-secondary)] lg:flex">
            {siteConfig.documentationTitle}
          </span>

          <nav aria-label="Documentation sections" className="flex items-stretch">
            {siteConfig.contextLinks.map((link) => {
              const active =
                link.href === '/docs' ? current === '/docs' : isAncestorPath(link.href, current)

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  data-title={link.label}
                  aria-current={active ? 'true' : undefined}
                  className={[
                    'no-reflow-bold group relative shrink-0 whitespace-nowrap px-3 py-2.5 text-[var(--text-micro)] transition-colors duration-[180ms] first:pl-0 lg:first:pl-3',
                    active
                      ? 'font-semibold text-[var(--color-ink)]'
                      : 'font-medium text-[var(--color-secondary)] hover:text-[var(--color-ink)]',
                  ].join(' ')}
                >
                  {link.label}
                  {/* Black underline, inset from the label, growing from the
                      left. Weight also shifts, so the bar is reinforcement. */}
                  <span
                    aria-hidden="true"
                    className={[
                      'absolute inset-x-3 bottom-[3px] h-[2px] origin-left bg-[#111111] transition-transform duration-[200ms] ease-[var(--ease-out-soft)] first:inset-x-0 motion-reduce:transition-none',
                      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                    ].join(' ')}
                  />
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}

/** White field for contrast against the yellow ground; black hairline on focus. */
function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-8 shrink-0 items-center gap-2 rounded-md border border-[rgba(17,17,17,0.22)] bg-[var(--color-surface)] pl-2.5 pr-2 text-left transition-colors duration-[180ms] hover:border-[rgba(17,17,17,0.45)] focus-visible:border-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111] sm:w-[15.5rem]"
    >
      <Icon name="search" size={14} className="shrink-0 text-[#292929]" />
      <span className="hidden flex-1 truncate whitespace-nowrap text-[var(--text-micro)] text-[#555555] sm:block">
        Search documentation
      </span>
      <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-[rgba(17,17,17,0.18)] bg-[var(--color-page)] px-1 py-px font-sans text-[0.625rem] font-medium text-[#555555] sm:flex">
        <span className="text-[0.6875rem] leading-none">⌘</span>K
      </kbd>
    </button>
  )
}

function UtilityLink({ label, href }: { label: string; href: string }) {
  const className =
    'group relative rounded px-2.5 py-1.5 text-[var(--text-micro)] font-medium text-[var(--color-secondary)] transition-colors duration-[180ms] hover:text-[var(--color-ink)]'

  const underline = (
    <span
      aria-hidden="true"
      className="absolute inset-x-2.5 bottom-1 h-px origin-left scale-x-0 bg-[#111111] transition-transform duration-[180ms] ease-[var(--ease-out-soft)] group-hover:scale-x-100 motion-reduce:transition-none"
    />
  )

  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
        {underline}
      </a>
    )
  }

  return (
    <Link to={href} className={className}>
      {label}
      {underline}
    </Link>
  )
}
