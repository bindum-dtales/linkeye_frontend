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
 */
import type { Crumb, DocFolder, DocHeading, DocIndex, DocNode, DocPage, NavRef, SearchEntry } from './docs.types'
import { API_BASE_URL } from './apiBase'
import { isFolder } from './docs.types'
import { normalizePath } from './routing'

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
        title: node.title,
        path: node.path,
        ...(node.description ? { description: node.description } : {}),
        breadcrumb: node.breadcrumb ?? [],
        order: node.order,
        hasIndex: node.hasIndex ?? false,
        headings: node.headings ?? [],
        children: (node.children ?? []).map(convert),
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
      title: node.title,
      ...(node.description ? { description: node.description } : {}),
      breadcrumb: node.breadcrumb ?? [],
      // Bodies are fetched per page by `loadContent`, never carried in the index.
      html: '',
      headings: node.headings ?? [],
      order: node.order,
      lastUpdated: asString(meta.lastUpdated) ?? node.updatedAt.slice(0, 10),
      ...(version ? { version } : {}),
      keywords: Array.isArray(meta.keywords) ? meta.keywords.map(String) : [],
      ...(node.prev ? { prev: node.prev } : {}),
      ...(node.next ? { next: node.next } : {}),
    }
    byPath[page.path] = page
    flat.push({ title: page.title, path: page.path, folderTitle: page.breadcrumb.at(-2)?.label ?? '' })
    return page
  }

  // A page at the root resolves by URL but has no place in a folder sidebar.
  const folders = tree.map(convert).filter(isFolder)
  return { tree: folders, byPath, foldersByPath, flat, searchEntries }
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
