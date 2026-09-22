import { Link } from 'react-router-dom'
import { siteConfig } from '@/config/siteConfig'
import lightBgLogoUrl from '@/assets/LinkEye Logo For Light BG.svg'
import darkBgLogoUrl from '@/assets/LinkEye Logo For Dark BG.svg'

/**
 * Brand lockup — the LinkEye logo followed by the quiet documentation suffix.
 *
 * Two grounds, two assets. The light-background variant draws its wordmark in
 * #292929, which is right on the drawer's off-white but would all but vanish on
 * the black header; the dark-background variant draws it in white and leaves
 * the mark in full colour, which is exactly the contrast the old yellow header
 * could not give it. `onDark` picks between them rather than filtering one
 * asset, so neither is degraded.
 *
 * Sized by height so the header's 3.25rem identity row keeps its rhythm; the
 * width follows the asset's 16:3 ratio.
 */
export function Wordmark({ compact = false, onDark = false }: { compact?: boolean; onDark?: boolean }) {
  return (
    <Link
      to="/docs"
      className="group flex items-center gap-2.5"
      aria-label={`${siteConfig.productName} ${siteConfig.wordmarkSuffix} — documentation home`}
    >
      {/* Decorative: the link above carries the accessible name. */}
      <img
        src={onDark ? darkBgLogoUrl : lightBgLogoUrl}
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
