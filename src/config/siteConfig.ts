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
    'A complete reference for navigating LinkEye how each module works, how it connects to the rest of the platform, and how to perform the tasks NOC engineers, network managers and CIO stakeholders rely on most.',
  accentColor: '#f4c400',
  accentColorSoft: '#faedb8',
  footerText:
    'Product documentation for NOC engineers, network managers and CIO stakeholders.',
  copyrightHolder: 'LinkEye',
  headerLinks: [
    { label: 'Support', href: '/docs/reference/support-contact' },
    { label: 'Glossary', href: '/docs/reference/glossary' },
    { label: 'Onboarding', href: '/docs/administration-configuration/onboarding' },
  ],
  /*
   * The documentation home plus the four reader-facing sections. The labels are
   * deliberately descriptive rather than a mirror of the product's own menu:
   * a tab called "Home" collided with the documentation homepage concept and
   * told the reader nothing about what the section contains.
   *
   * These must stay in step with the section labels in the sidebar, which come
   * from the CMS by way of `src/content/nav.config.ts`.
   */
  contextLinks: [
    { label: 'Documentation Home', href: '/docs' },
    { label: 'Getting Started', href: '/docs/getting-started' },
    { label: 'Observability & Insights', href: '/docs/monitoring-insights' },
    { label: 'Infrastructure & Inventory', href: '/docs/infrastructure-inventory' },
    { label: 'Administration & Configuration', href: '/docs/administration-configuration' },
  ],
  /* Same vocabulary as the sidebar and the tabs above — three navigation
     surfaces, one set of category names. */
  footerLinkGroups: [
    {
      title: 'Getting Started',
      links: [
        { label: 'About LinkEye', href: '/docs/getting-started/about-linkeye' },
        { label: 'Signing In', href: '/docs/getting-started/signing-in' },
        {
          label: 'Documentation Conventions',
          href: '/docs/getting-started/documentation-conventions',
        },
        { label: 'Glossary', href: '/docs/reference/glossary' },
      ],
    },
    {
      title: 'Observability & Insights',
      links: [
        { label: 'Overview', href: '/docs/monitoring-insights/overview' },
        { label: 'Agentic NetOps', href: '/docs/monitoring-insights/agentic-netops' },
        { label: 'Digital Experience', href: '/docs/monitoring-insights/digital-experience' },
        { label: 'CIO Insights', href: '/docs/monitoring-insights/cio-insights' },
      ],
    },
    {
      title: 'Infrastructure & Inventory',
      links: [
        { label: 'Assets Health', href: '/docs/infrastructure-inventory/assets-health' },
        { label: 'Topology', href: '/docs/infrastructure-inventory/topology' },
        { label: 'Inventory', href: '/docs/infrastructure-inventory/inventory' },
        { label: 'Logs', href: '/docs/infrastructure-inventory/logs' },
      ],
    },
    {
      title: 'Administration & Configuration',
      links: [
        { label: 'User Management', href: '/docs/administration-configuration/user-management' },
        { label: 'Site Management', href: '/docs/administration-configuration/site-management' },
        {
          label: 'Alert Configuration',
          href: '/docs/administration-configuration/alert-configuration',
        },
        { label: 'Onboarding', href: '/docs/administration-configuration/onboarding' },
      ],
    },
  ],
}
