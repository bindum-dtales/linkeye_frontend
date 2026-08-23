import { Link } from 'react-router-dom'
import { siteConfig } from '@/config/siteConfig'
import logoUrl from '@/assets/LinkEye Logo For Light BG.svg'

/**
 * Brand lockup — the LinkEye logo followed by the quiet documentation suffix.
 *
 * The light-background variant is the right one for both grounds it sits on:
 * the drawer's off-white page colour, and the yellow header, whose text token
 * is the same #292929 the logo's wordmark is drawn in. The dark-background
 * variant is white-on-transparent and would fail contrast on either.
 *
 * Sized by height so the header's 3.25rem identity row keeps its rhythm; the
 * width follows the asset's 16:3 ratio.
 */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/docs"
      className="group flex items-center gap-2.5"
      aria-label={`${siteConfig.productName} ${siteConfig.wordmarkSuffix} — documentation home`}
    >
      {/* Decorative: the link above carries the accessible name. */}
      <img
        src={logoUrl}
        alt=""
        width={117}
        height={22}
        className="h-[1.375rem] w-auto shrink-0"
      />

      {!compact && (
        <span className="text-[0.9375rem] font-normal leading-none tracking-[-0.015em] text-[var(--color-muted)]">
          {siteConfig.wordmarkSuffix}
        </span>
      )}
    </Link>
  )
}
