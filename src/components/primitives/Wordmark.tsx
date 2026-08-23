import { Link } from 'react-router-dom'
import { siteConfig } from '@/config/siteConfig'

/**
 * Brand lockup — a drawn mark rather than an image asset, so the whole identity
 * lives in `siteConfig`. The accent sits on a single hairline inside the mark:
 * enough to register, not enough to shout.
 */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/docs"
      className="group flex items-center gap-2.5"
      aria-label={`${siteConfig.productName} ${siteConfig.wordmarkSuffix} — documentation home`}
    >
      <span
        aria-hidden="true"
        className="relative flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-[var(--color-ink)]"
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3.5 3h6.2L12.5 5.8V13H3.5V3z" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M5.7 6.6h4.2" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M5.7 9.2h2.8" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
        </svg>
      </span>

      {!compact && (
        <span className="text-[0.9375rem] leading-none tracking-[-0.015em] text-[var(--color-ink)]">
          <span className="font-semibold">{siteConfig.productName}</span>
          <span className="ml-1 font-normal text-[var(--color-muted)]">
            {siteConfig.wordmarkSuffix}
          </span>
        </span>
      )}
    </Link>
  )
}
