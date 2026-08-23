/**
 * Central product/brand configuration.
 *
 * Everything the portal displays as identity comes from this file. Changing the
 * product name, wordmark, logo, accent colour or footer requires no component edits.
 *
 * The accent colour is mirrored into the CSS token layer at runtime (see
 * `src/lib/applyAccent.ts`), so `accentColor` here is the single source of truth.
 */
export interface SiteConfig {
  /** Visible product name, used in the wordmark and document titles. */
  productName: string
  /** Short suffix appended after the product name in the header lockup. */
  wordmarkSuffix: string
  /** Title of the documentation ecosystem, shown in the context bar. */
  documentationTitle: string
  tagline: string
  /**
   * Yellow accent. Used for indicators, underlines and section markers only —
   * it sits at 1.65:1 on white, so it is never text and never the sole signal
   * for a state.
   */
  accentColor: string
  /** Soft accent ground, used for filter-match highlighting. */
  accentColorSoft: string
  footerText: string
  copyrightHolder: string
  /** Utility links rendered in the header's right-hand cluster. */
  headerLinks: { label: string; href: string; external?: boolean }[]
  /** Grouped links rendered in the site footer. */
  footerLinkGroups: { title: string; links: { label: string; href: string }[] }[]
  /** Context-bar entries: the "where am I in the documentation ecosystem" row. */
  contextLinks: { label: string; href: string }[]
}

export const siteConfig: SiteConfig = {
  productName: 'LinkEye',
  wordmarkSuffix: 'Docs',
  documentationTitle: 'Agentic AI NetOps Platform',
  tagline:
    'A complete reference for navigating LinkEye — how each module works, how it connects to the rest of the platform, and how to perform the tasks NOC engineers, network managers and CIO stakeholders rely on most.',
  accentColor: '#f4c400',
  accentColorSoft: '#faedb8',
  footerText:
    'Product documentation for NOC engineers, network managers and CIO stakeholders.',
  copyrightHolder: 'LinkEye',
  headerLinks: [
    { label: 'Support', href: '/docs/appendices/b-support' },
    { label: 'Glossary', href: '/docs/appendices/a-glossary' },
    { label: 'Onboarding', href: '/docs/part-iii-settings/onboarding' },
  ],
  contextLinks: [
    { label: 'Documentation Home', href: '/docs' },
    { label: 'Introduction', href: '/docs/introduction' },
    { label: 'Home', href: '/docs/part-i-home' },
    { label: 'Infrastructure', href: '/docs/part-ii-infrastructure' },
    { label: 'Settings', href: '/docs/part-iii-settings' },
  ],
  footerLinkGroups: [
    {
      title: 'Getting Started',
      links: [
        { label: 'About LinkEye', href: '/docs/introduction/about-linkeye' },
        { label: 'Signing In', href: '/docs/introduction/signing-in' },
        {
          label: 'Conventions Used in This Guide',
          href: '/docs/introduction/conventions-used-in-this-guide',
        },
        { label: 'Overview', href: '/docs/part-i-home/overview' },
      ],
    },
    {
      title: 'Operations',
      links: [
        { label: 'Agentic NetOps', href: '/docs/part-i-home/agentic-netops' },
        { label: 'Digital Experience', href: '/docs/part-i-home/digital-experience' },
        { label: 'Assets Health', href: '/docs/part-ii-infrastructure/assets-health' },
        { label: 'Topology', href: '/docs/part-ii-infrastructure/topology' },
      ],
    },
    {
      title: 'Administration',
      links: [
        { label: 'Users', href: '/docs/part-iii-settings/users' },
        { label: 'Sites', href: '/docs/part-iii-settings/sites' },
        { label: 'Alert Configuration', href: '/docs/part-iii-settings/alert-configuration' },
        { label: 'Onboarding', href: '/docs/part-iii-settings/onboarding' },
      ],
    },
  ],
}
