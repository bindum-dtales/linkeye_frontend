/**
 * Documentation header.
 *
 * Both rows sit on one continuous black ground: the `<header>` element is the
 * only thing that paints a background, and neither row nor any child sets one,
 * so there is no seam or white strip between them.
 *
 * Black rather than the yellow this used to be. A full-width yellow bar is the
 * loudest thing on the page and competes with the article; it also drops the
 * logo to roughly 1.6:1 against its own ground. On black the logo renders in
 * full colour and the chrome recedes, which is what chrome is for. Yellow stays
 * on as the accent it always was — the active tab, hover underlines, section
 * ticks — never as a field.
 *
 * The header re-scopes the neutral text/border tokens to values that hold up on
 * black. Nested components (Wordmark, Icon) read those same variables, so they
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
 * Token overrides scoped to the header. The page's near-blacks are invisible on
 * black, so the neutral ramp is inverted: white for the active/emphasis step,
 * then two translucent whites that still clear 4.5:1 on #000 (0.78 ≈ 12.6:1,
 * 0.66 ≈ 8.7:1). The base `:focus-visible` ring reads `--color-ink`, so it
 * turns white inside the header without a second rule.
 */
const ON_BLACK: CSSProperties = {
  '--color-ink': '#ffffff',
  '--color-secondary': 'rgba(255, 255, 255, 0.78)',
  '--color-muted': 'rgba(255, 255, 255, 0.66)',
  '--color-border': 'rgba(255, 255, 255, 0.18)',
  '--color-border-strong': 'rgba(255, 255, 255, 0.34)',
  /* Top-nav links: white at rest, gold on hover. Scoped here so both the
     context row and the utility row read one pair of values. */
  '--color-nav': '#ffffff',
  '--color-nav-hover': '#ffd230',
} as CSSProperties

export function DocsHeader({ onOpenNav, onOpenSearch }: DocsHeaderProps) {
  const { pathname } = useLocation()
  const current = normalizePath(pathname)

  return (
    <header
      style={ON_BLACK}
      /* Opaque and flat: stays exactly this colour while sticky — no blur,
         no transparency, no shadow. */
      className="border-b border-[rgba(255,255,255,0.12)] bg-[#000000]"
    >
      {/* ---------------------------------------------------- identity row */}
      <div className="mx-auto flex h-[3.25rem] max-w-[1680px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenNav}
          className="-ml-1.5 flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--color-ink)] transition-colors duration-[180ms] hover:bg-[rgba(255,255,255,0.12)] lg:hidden"
          aria-label="Open documentation navigation"
        >
          <Icon name="menu" size={18} />
        </button>

        <Wordmark onDark />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SearchTrigger onClick={onOpenSearch} />

          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-[rgba(255,255,255,0.2)] md:block"
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
                      : 'font-medium text-[var(--color-nav)] hover:text-[var(--color-nav-hover)]',
                  ].join(' ')}
                >
                  {link.label}
                  {/* Gold underline, inset from the label, growing from the
                      left. Weight and colour also shift, so the bar is
                      reinforcement rather than the only signal — which is the
                      only way an accent at this contrast may be used. */}
                  <span
                    aria-hidden="true"
                    className={[
                      'absolute inset-x-3 bottom-[3px] h-[2px] origin-left bg-[var(--color-accent)] transition-transform duration-[200ms] ease-[var(--ease-out-soft)] first:inset-x-0 motion-reduce:transition-none',
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

/** Lifted field on the black ground; white hairline and ring on focus. */
function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-8 shrink-0 items-center gap-2 rounded-md border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.07)] pl-2.5 pr-2 text-left transition-colors duration-[180ms] hover:border-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.12)] focus-visible:border-[#ffffff] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ffffff] sm:w-[15.5rem]"
    >
      <Icon name="search" size={14} className="shrink-0 text-[rgba(255,255,255,0.78)]" />
      <span className="hidden flex-1 truncate whitespace-nowrap text-[var(--text-micro)] text-[rgba(255,255,255,0.66)] sm:block">
        Search documentation
      </span>
      <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.08)] px-1 py-px font-sans text-[0.625rem] font-medium text-[rgba(255,255,255,0.66)] sm:flex">
        <span className="text-[0.6875rem] leading-none">⌘</span>K
      </kbd>
    </button>
  )
}

function UtilityLink({ label, href }: { label: string; href: string }) {
  const className =
    'group relative rounded px-2.5 py-1.5 text-[var(--text-micro)] font-medium text-[var(--color-nav)] transition-colors duration-[180ms] hover:text-[var(--color-nav-hover)]'

  const underline = (
    <span
      aria-hidden="true"
      className="absolute inset-x-2.5 bottom-1 h-px origin-left scale-x-0 bg-[var(--color-accent)] transition-transform duration-[180ms] ease-[var(--ease-out-soft)] group-hover:scale-x-100 motion-reduce:transition-none"
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
