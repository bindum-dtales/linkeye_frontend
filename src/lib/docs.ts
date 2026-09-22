/**
 * Accessors over the published documentation index.
 *
 * The index comes from the backend CMS (`GET /api/docs/index`) and is fetched
 * once by `loadDocsIndex()` before React mounts. The request is anonymous — no
 * token, no cookies — so the backend serves published nodes only.
 *
 * Everything below stays synchronous, exactly as when the index was a
 * build-time virtual module, so the component layer is unchanged. Article
 * bodies still arrive lazily, now from the API instead of a code-split chunk.
 *
 * This is also the one place where the published tree becomes the *presented*
 * tree: titles are normalised for display and hidden branches are dropped as
 * the payload is adapted (see `displayTitle` and `nav.config.ts`). Doing it
 * here rather than in the components means every surface — sidebar,
 * breadcrumbs, search, prev/next, `<title>` — sees the same titles, and none of
 * them needs to know the rule.
 */
import type { Crumb, DocFolder, DocHeading, DocIndex, DocNode, DocPage, NavRef, SearchEntry } from './docs.types'
import { API_BASE_URL } from './apiBase'
import { isFolder } from './docs.types'
import { normalizePath } from './routing'
import { folderLabels, hiddenFolderSlugs, hiddenFolderTitles } from '@/content/nav.config'

/** One node of the backend's `/api/docs/index` payload. */
interface ApiNode {
  kind: 'folder' | 'page'
  id: string
  slug: string
  path: string
  title: string
  description?: string
  order: number
  updatedAt: string
  headings?: DocHeading[]
  breadcrumb?: Crumb[]
  hasIndex?: boolean
  children?: ApiNode[]
  prev?: NavRef
  next?: NavRef
  metadata?: Record<string, unknown> | null
}

const EMPTY: DocIndex = { tree: [], byPath: {}, foldersByPath: {}, flat: [], searchEntries: [] }

let docs: DocIndex = EMPTY

/*
 * The index is a mutable module store: `loadDocsIndex` can run again while the
 * app is mounted (the CMS publishes at any time), so React subscribes to it
 * through `useSyncExternalStore` in `App`. `version` is the store snapshot —
 * it only changes when the payload really changed, so an unchanged refresh
 * re-renders nothing.
 */
let version = 0
let payload = ''
const listeners = new Set<() => void>()

export function subscribeDocs(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const docsVersion = (): number => version

const asString = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined)

/* ------------------------------------------------- display normalisation */

/**
 * Print-document numbering, as carried by legacy page titles: `2. `, `3.1.1 `,
 * `7.1 — `. Anchored, and it requires whitespace after the number, so a title
 * that legitimately opens with a figure (`802.1X Profiles`, `5G Links`) is left
 * alone.
 */
const NUMERIC_PREFIX = /^\s*\d+(?:\.\d+)*[.)]?(?:\s*[-–—:])?\s+/

/** Printed-book section labels: `Part I — Home`, `Part III: Settings`. */
const PART_PREFIX = /^\s*part\s+[ivxlcdm]+\s*[-–—:.]?\s+/i

/**
 * The title a reader sees, derived from the title the CMS stores.
 *
 * A documentation portal is not a paginated book: the hierarchy is carried by
 * the sidebar nesting, so the numbering and `Part N` labels that came across
 * from the printed guide are stripped here rather than hidden in CSS — every
 * surface (sidebar, breadcrumbs, search, prev/next, `<title>`) reads the title
 * through this function, so none of them can disagree.
 *
 * Stripping never returns an empty string: if a title is *only* a number, the
 * original stands, because a blank navigation row is worse than a numbered one.
 */
export function displayTitle(title: string): string {
  let out = title.trim().replace(/\s+/g, ' ')
  for (const pattern of [PART_PREFIX, NUMERIC_PREFIX]) {
    const stripped = out.replace(pattern, '').trim()
    if (stripped) out = stripped
  }
  return out
}

/** Applies the `nav.config.ts` label override for a folder, then normalises. */
const folderTitle = (slug: string, title: string): string =>
  displayTitle(folderLabels[slug] ?? title)

/** `/docs/monitoring-insights/overview` -> `monitoring-insights`. */
const parentSlug = (path: string): string =>
  path.split('/').filter(Boolean).slice(0, -1).at(-1) ?? ''

/**
 * The owning section's label for a reference that names it by title.
 *
 * Prev/next links and search results carry the section as a *title*, not a
 * slug, so an override keyed by slug cannot be looked up directly. The route
 * supplies the missing key: the second-to-last segment of a page's path is the
 * slug of the folder that holds it. Without this, prev/next and search would be
 * the two surfaces still showing a renamed section under its old name.
 */
const sectionLabel = (path: string, title: string): string =>
  folderTitle(parentSlug(path), title)

/** True for a node that must not appear in the public portal. */
function isHidden(node: ApiNode): boolean {
  if (node.kind !== 'folder') return false
  const slug = node.slug.toLowerCase()
  const title = displayTitle(node.title).toLowerCase()
  return hiddenFolderSlugs.includes(slug) || hiddenFolderTitles.includes(title)
}

/**
 * Breadcrumb labels are rendered by the CMS against the stored titles, so they
 * carry the same numbering and the same pre-rename section names. Re-deriving
 * them here keeps the trail identical to the sidebar it mirrors.
 */
function adaptCrumbs(crumbs: Crumb[]): Crumb[] {
  return crumbs.map((crumb) => {
    const slug = crumb.href ? crumb.href.split('/').filter(Boolean).at(-1) ?? '' : ''
    return { ...crumb, label: slug ? folderTitle(slug, crumb.label) : displayTitle(crumb.label) }
  })
}

const adaptRef = (ref: NavRef): NavRef => ({
  ...ref,
  title: displayTitle(ref.title),
  folderTitle: sectionLabel(ref.path, ref.folderTitle),
})

/**
 * Maps the API's node shape onto the portal's `DocNode`.
 *
 * The two are already near-identical; only the optional frontmatter fields the
 * CMS keeps in `metadata` need unpacking, and pages carry no body here.
 */
function adapt(tree: ApiNode[], searchEntries: SearchEntry[]): DocIndex {
  const byPath: Record<string, DocPage> = {}
  const foldersByPath: Record<string, DocFolder> = {}
  const flat: NavRef[] = []

  const convert = (node: ApiNode): DocNode => {
    if (node.kind === 'folder') {
      const folder: DocFolder = {
        kind: 'folder',
        id: node.id,
        title: folderTitle(node.slug, node.title),
        path: node.path,
        ...(node.description ? { description: node.description } : {}),
        breadcrumb: adaptCrumbs(node.breadcrumb ?? []),
        order: node.order,
        hasIndex: node.hasIndex ?? false,
        headings: node.headings ?? [],
        // Hidden branches are dropped here, so nothing downstream — sidebar,
        // folder listings, page counts — has to know they ever existed.
        children: (node.children ?? []).filter((child) => !isHidden(child)).map(convert),
      }
      foldersByPath[folder.path] = folder
      return folder
    }

    const meta = (node.metadata ?? {}) as Record<string, unknown>
    const version = asString(meta.version)
    const page: DocPage = {
      kind: 'page',
      slug: node.slug,
      path: node.path,
      title: displayTitle(node.title),
      ...(node.description ? { description: node.description } : {}),
      breadcrumb: adaptCrumbs(node.breadcrumb ?? []),
      // Bodies are fetched per page by `loadContent`, never carried in the index.
      html: '',
      headings: node.headings ?? [],
      order: node.order,
      lastUpdated: asString(meta.lastUpdated) ?? node.updatedAt.slice(0, 10),
      ...(version ? { version } : {}),
      keywords: Array.isArray(meta.keywords) ? meta.keywords.map(String) : [],
      ...(node.prev ? { prev: adaptRef(node.prev) } : {}),
      ...(node.next ? { next: adaptRef(node.next) } : {}),
    }
    byPath[page.path] = page
    flat.push({ title: page.title, path: page.path, folderTitle: page.breadcrumb.at(-2)?.label ?? '' })
    return page
  }

  // A page at the root resolves by URL but has no place in a folder sidebar.
  const folders = tree.filter((node) => !isHidden(node)).map(convert).filter(isFolder)

  // The search corpus is built by the CMS from the stored titles, so it is
  // re-derived against the same rules — and entries under a hidden branch are
  // dropped, or search would be a back door into content the sidebar hides.
  const entries = searchEntries
    .filter((entry) => byPath[normalizePath(entry.path)] !== undefined)
    .map((entry) => ({
      ...entry,
      title: displayTitle(entry.title),
      folderTitle: sectionLabel(entry.path, entry.folderTitle),
    }))

  return { tree: folders, byPath, foldersByPath, flat, searchEntries: entries }
}

interface Envelope<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

async function get<T>(path: string): Promise<T> {
  // No credentials and no Authorization header: the portal is a public reader,
  // so the backend's optional auth sees an anonymous request and hides drafts.
  //
  // `no-store` because documentation changes the moment an editor presses
  // Publish. The backend already answers `Cache-Control: no-store`, but this
  // also rules out the browser's heuristic freshness and any intermediary
  // between Hostinger and the API, so a reader never holds a version the CMS
  // has already replaced.
  const response = await fetch(API_BASE_URL + path, { cache: 'no-store' })
  const body = (await response.json()) as Envelope<T>
  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.error?.message ?? `Request failed (${response.status})`)
  }
  return body.data
}

/**
 * Loads the navigation index: once before the app mounts, and again whenever
 * the tab is brought back into view, so content published in the CMS while the
 * portal sat open is picked up without a manual reload. Rejects when the
 * backend is unreachable so the boot caller can show a real error.
 */
export async function loadDocsIndex(): Promise<void> {
  inFlight ??= get<{ tree: ApiNode[]; searchEntries?: SearchEntry[] }>('/api/docs/index').finally(() => {
    inFlight = null
  })
  const data = await inFlight

  const next = JSON.stringify(data)
  if (next === payload) return
  payload = next

  docs = adapt(data.tree ?? [], data.searchEntries ?? [])
  // Bodies may have been edited alongside the tree; drop them rather than serve
  // a stale article on the next visit.
  contentCache.clear()
  version += 1
  for (const listener of listeners) listener()
}

/** Coalesces overlapping refreshes — visibility and focus can fire together. */
let inFlight: Promise<{ tree: ApiNode[]; searchEntries?: SearchEntry[] }> | null = null

export function getPage(pathname: string): DocPage | undefined {
  return docs.byPath[normalizePath(pathname)]
}

export function getFolder(pathname: string): DocFolder | undefined {
  return docs.foldersByPath[normalizePath(pathname)]
}

export const topLevelFolders = (): DocFolder[] => docs.tree

/** In-memory cache of article bodies already fetched this session. */
const contentCache = new Map<string, string>()

export function getCachedContent(path: string): string | undefined {
  return contentCache.get(normalizePath(path))
}

/**
 * Fetches a page's rendered HTML from the CMS. The backend owns the markdown
 * pipeline, so this only transports; subsequent calls resolve from cache, so
 * returning to a page is instant.
 */
export async function loadContent(path: string): Promise<string> {
  const key = normalizePath(path)
  const cached = contentCache.get(key)
  if (cached !== undefined) return cached
  if (key === '/docs' || !key.startsWith('/docs/')) return ''

  let html: string
  try {
    html = (await get<{ html?: string }>(`/api/docs${key.slice('/docs'.length)}`)).html ?? ''
  } catch {
    // Rendered through the same prose styles as a body, so the reader sees the
    // failure in place rather than an empty article.
    return '<p>This page could not be loaded. Please refresh to try again.</p>'
  }
  contentCache.set(key, html)
  return html
}

/** Counts every page beneath a node — used for folder summaries. */
export function countPages(node: DocNode): number {
  if (!isFolder(node)) return 1
  return node.children.reduce((total, child) => total + countPages(child), 0)
}

/**
 * Returns the set of folder paths that must be expanded for `pathname` to be
 * visible in the sidebar, i.e. every ancestor of the active page.
 */
export function ancestorFolderPaths(pathname: string): string[] {
  const current = normalizePath(pathname)
  const out: string[] = []

  const walk = (nodes: DocNode[], trail: string[]): boolean => {
    for (const node of nodes) {
      if (isFolder(node)) {
        const nextTrail = [...trail, node.path]
        if (current === node.path) {
          out.push(...nextTrail)
          return true
        }
        if (walk(node.children, nextTrail)) return true
      } else if (node.path === current) {
        out.push(...trail)
        return true
      }
    }
    return false
  }

  walk(docs.tree, [])
  return out
}

/** Every folder path in the tree, for the "Expand all" control. */
export function allFolderPaths(): string[] {
  const out: string[] = []
  const walk = (nodes: DocNode[]): void => {
    for (const node of nodes) {
      if (isFolder(node)) {
        out.push(node.path)
        walk(node.children)
      }
    }
  }
  walk(docs.tree)
  return out
}
