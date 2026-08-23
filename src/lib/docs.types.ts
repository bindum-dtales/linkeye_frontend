/**
 * Typed documentation schema.
 *
 * The entire portal UI is driven by these types. Nothing in the component layer
 * knows about markdown, frontmatter or the file system — the build-time plugin
 * (`plugins/docs-plugin.ts`) compiles `linkeye-docs/docs/**` into a `DocIndex`
 * and the components consume only that.
 */

/** A heading extracted from an article body; drives the "On This Page" rail. */
export interface DocHeading {
  /** Stable slug used as the anchor target, e.g. `configuration-files`. */
  id: string
  text: string
  /** Article bodies start at h2 — h1 is the page title, rendered by the shell. */
  depth: 2 | 3 | 4
}

/** One segment of a breadcrumb trail. Precomputed at build time. */
export interface Crumb {
  label: string
  /** Absent on the current page, which is rendered as static text. */
  href?: string
}

/** A lightweight reference used for prev/next and search results. */
export interface NavRef {
  title: string
  path: string
  /** Display label of the owning section, e.g. `Part I — Home`. */
  folderTitle: string
}

export interface DocPage {
  kind: 'page'
  /** URL segment, e.g. `getting-started`. Numeric file prefixes are stripped. */
  slug: string
  /** Canonical, deep-linkable route, e.g. `/docs/introduction/signing-in`. */
  path: string
  title: string
  description?: string
  breadcrumb: Crumb[]
  /** Sanitized, highlighted, anchored HTML produced at build time. */
  html: string
  headings: DocHeading[]
  order: number
  lastUpdated?: string
  version?: string
  /** Extra terms matched by the sidebar filter, beyond title and description. */
  keywords: string[]
  prev?: NavRef
  next?: NavRef
}

export interface DocFolder {
  kind: 'folder'
  /** Stable directory id, e.g. `part-i-home`. Never changes; owns the URL. */
  id: string
  /** Display label from `nav.config.ts` or the section's `README.md` heading. */
  title: string
  path: string
  description?: string
  breadcrumb: Crumb[]
  order: number
  /**
   * True when the section's `README.md` carries prose of its own, which the
   * folder page renders above its contents list.
   */
  hasIndex: boolean
  /** Headings of that index body; empty when there is none. */
  headings: DocHeading[]
  /** Recursive — a folder may contain pages and further subfolders. */
  children: DocNode[]
}

export type DocNode = DocFolder | DocPage

export interface DocIndex {
  /** Top-level folders, ordered per `nav.config.ts`. */
  tree: DocFolder[]
  /** Every page keyed by canonical path, for O(1) route resolution. */
  byPath: Record<string, DocPage>
  /** Every folder keyed by canonical path, for folder-overview routes. */
  foldersByPath: Record<string, DocFolder>
  /** Document order across the whole tree — the prev/next spine. */
  flat: NavRef[]
  /** Flattened search corpus. */
  searchEntries: SearchEntry[]
}

export interface SearchEntry {
  path: string
  title: string
  description: string
  folderTitle: string
  /** Pre-lowercased haystack: title + description + keywords + folder title. */
  haystack: string
}

export const isFolder = (node: DocNode): node is DocFolder => node.kind === 'folder'
export const isPage = (node: DocNode): node is DocPage => node.kind === 'page'
