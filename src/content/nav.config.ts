/**
 * Navigation presentation overrides — the single rename/hide point for the
 * published documentation tree.
 *
 * The tree itself comes from the CMS (`GET /api/docs/index`), which owns the
 * stable slugs that form the URLs. This file owns only what the reader *sees*,
 * so a section can be relabelled or kept out of the public portal without
 * touching the backend, the database or a single route.
 *
 * Applied in `src/lib/docs.ts` as the API payload is adapted, which means an
 * override reaches the sidebar, breadcrumbs, top navigation, search, prev/next
 * and the document title at once.
 */

/**
 * Display labels, keyed by the CMS folder slug.
 *
 * Only entries that differ from the CMS title need to be listed; everything
 * else falls through to the published title.
 */
export const folderLabels: Record<string, string> = {
  /*
   * The four reader-facing categories, pinned.
   *
   * They replace the printed guide's "Part I / II / III" and the product's own
   * menu words ("Home", "Infrastructure", "Settings"), which described where a
   * feature lives in the app rather than what the reader will find. Pinned
   * rather than taken from the CMS because these same four names are also the
   * top-navigation tabs and the footer column headings: one list, so the three
   * surfaces cannot drift apart. Renaming a section is this line plus the
   * matching entry in `siteConfig.contextLinks`.
   */
  'getting-started': 'Getting Started',
  'monitoring-insights': 'Observability & Insights',
  'infrastructure-inventory': 'Infrastructure & Inventory',
  'administration-configuration': 'Administration & Configuration',
}

/**
 * Folders kept out of the public portal.
 *
 * Non-production scratch space stays in the CMS — where editors still need it —
 * but never reaches the public sidebar, search index or section list. Matched
 * on the CMS slug; `hiddenFolderTitles` is the belt-and-braces match for the
 * same folders created under a different slug.
 */
export const hiddenFolderSlugs: string[] = ['test-folder', 'test', 'tests', 'testing', 'sandbox', 'scratch']

/** Exact (case-insensitive) titles hidden alongside `hiddenFolderSlugs`. */
export const hiddenFolderTitles: string[] = ['test folder', 'test']
