/**
 * Navigation configuration — the single rename point for the documentation tree.
 *
 * Content lives in `linkeye-docs/docs/`. Directory names there are stable ids
 * that own the URL (`part-i-home` -> `/docs/part-i-home/...`, numeric prefixes
 * such as `01-introduction` are stripped). The labels below are what users see,
 * so renaming a top-level section is a one-line edit here: no component changes,
 * no route changes, no broken deep links.
 *
 * Nested sections take their label from their own `README.md` heading; only the
 * top level is pinned here, because only the top level is a product decision.
 */

/** Display labels, keyed by stable directory id. */
export const folderLabels: Record<string, string> = {
  'introduction': 'Introduction',
  'part-i-home': 'Part I — Home',
  'part-ii-infrastructure': 'Part II — Infrastructure',
  'part-iii-settings': 'Part III — Settings',
  'appendices': 'Appendices',
}

/** Top-level ordering. Any directory omitted here is appended alphabetically. */
export const folderOrder: string[] = [
  'introduction',
  'part-i-home',
  'part-ii-infrastructure',
  'part-iii-settings',
  'appendices',
]

/**
 * Fallback one-line summaries for the docs home and folder pages. A section's
 * `README.md` opening paragraph wins where one exists; this covers the rest.
 */
export const folderDescriptions: Record<string, string> = {
  'appendices': 'Reference material that supports the rest of the guide — terminology and support contacts.',
}
