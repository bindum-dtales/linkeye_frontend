import { Link } from 'react-router-dom'
import { siteConfig } from '@/config/siteConfig'

/** Minimal footer: identity, three short link columns, a hairline, a line of fine print. */
export function DocsFooter() {
  return (
    <footer className="border-t border-[var(--color-border)]">
      <div className="mx-auto max-w-[1680px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <p className="text-[var(--text-ui)] font-semibold tracking-[-0.011em] text-[var(--color-ink)]">
              {siteConfig.productName}{' '}
              <span className="font-normal text-[var(--color-muted)]">
                {siteConfig.wordmarkSuffix}
              </span>
            </p>
            <span aria-hidden="true" className="mt-3 block h-[2px] w-6 bg-[var(--color-accent)]" />
            <p className="mt-3 text-[var(--text-micro)] leading-relaxed text-[var(--color-muted)]">
              {siteConfig.footerText}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-6">
            {siteConfig.footerLinkGroups.map((group) => (
              <nav key={group.title} aria-label={`Footer: ${group.title}`}>
                <p className="eyebrow text-[var(--color-muted)]">{group.title}</p>
                <ul className="mt-3 space-y-1.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        to={link.href}
                        className="group relative inline-block text-[var(--text-micro)] text-[var(--color-secondary)] transition-colors duration-150 hover:text-[var(--color-ink)]"
                      >
                        {link.label}
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-[var(--color-accent)] transition-transform duration-150 ease-[var(--ease-out-soft)] group-hover:scale-x-100 motion-reduce:transition-none"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--color-hairline)] pt-5">
          <p className="text-[0.6875rem] text-[var(--color-muted)]">
            © {new Date().getFullYear()} {siteConfig.copyrightHolder}
          </p>
        </div>
      </div>
    </footer>
  )
}
