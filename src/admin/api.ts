/**
 * Typed client for the LinkEye documentation backend (`linkeye_back`).
 *
 * Every admin call goes through `request`, which unwraps the API's
 * `{ success, data }` envelope and turns `{ success: false, error }` into a
 * thrown `ApiError`. Nothing else in the admin UI touches `fetch`.
 *
 * The backend is the single source of truth: it owns slugs, paths, ordering,
 * markdown rendering and publish state. This module only transports.
 */

import { API_BASE_URL } from '@/lib/apiBase'

const TOKEN_KEY = 'linkeye.admin.token'

export const tokenStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token: string | null): void => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* private mode — the session simply does not survive a reload */
    }
  },
}

/** A failed API call, carrying the backend's stable error code. */
export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: { path: string; message: string }[]

  constructor(status: number, code: string, message: string, details?: { path: string; message: string }[]) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
  }
}

interface Envelope<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: { path: string; message: string }[] }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  const isForm = body instanceof FormData
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(API_BASE_URL + path, {
      method,
      headers,
      // The dashboard must never read a cached tree or a cached body: it is the
      // surface deciding what to publish, so a stale read there would publish
      // the wrong text.
      cache: 'no-store',
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', `Cannot reach the API at ${API_BASE_URL}. Is the backend running?`)
  }

  let envelope: Envelope<T>
  try {
    envelope = (await response.json()) as Envelope<T>
  } catch {
    throw new ApiError(response.status, 'BAD_RESPONSE', `Unexpected response (HTTP ${response.status})`)
  }

  if (!response.ok || !envelope.success) {
    const error = envelope.error
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? `Request failed (HTTP ${response.status})`,
      error?.details,
    )
  }
  return envelope.data as T
}

/* ------------------------------------------------------------------- types */

export type NodeType = 'FOLDER' | 'PAGE'
export type Status = 'DRAFT' | 'PUBLISHED'
export type Role = 'ADMIN' | 'EDITOR'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: Role
  createdAt?: string
}

export interface Heading {
  id: string
  text: string
  depth: 2 | 3 | 4
}

export interface Crumb {
  label: string
  href?: string
}

export interface NavRef {
  title: string
  path: string
  folderTitle: string
}

/**
 * A node as the backend serialises it. Tree responses omit `content`/`html`.
 *
 * `title`, `description`, `content` and `html` are always the PUBLISHED
 * version — the text a reader currently sees. Unpublished edits live in
 * `draft`, which the backend attaches only for a signed-in editor and only
 * while `hasDraft` is true.
 */
export interface DocNode {
  id: string
  kind: 'folder' | 'page'
  parentId: string | null
  slug: string
  path: string
  title: string
  description?: string
  order: number
  status: Status
  version: number
  metadata: unknown
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  headings: Heading[]
  /** True when edits are saved but not yet published. */
  hasDraft?: boolean
  /** The unpublished edits themselves; absent when nothing is pending. */
  draft?: { title: string; description: string; content: string; html: string; metadata?: unknown }
  hasIndex?: boolean
  content?: string
  html?: string
  breadcrumb?: Crumb[]
  children?: DocNode[]
  prev?: NavRef
  next?: NavRef
}

export interface Revision {
  id: string
  version: number
  title: string
  content: string | null
  createdAt: string
  author?: { id: string; name: string; email: string } | null
}

export interface MediaItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  alt: string | null
  createdAt: string
}

export interface SearchHit {
  title: string
  description: string
  category: string
  slug: string
  path: string
  score: number
  excerpt: string
}

export interface ReleaseNote {
  id: string
  version: string
  slug: string
  title: string
  releasedAt: string
  content: string
  html: string
  status: Status
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Fields the backend accepts on create; it derives slug, path and order itself. */
export interface NodeDraft {
  type: NodeType
  parentId?: string | null
  title: string
  slug?: string
  description?: string | null
  content?: string | null
  /**
   * Free-form bag on the node. Drafted like the editorial fields since
   * `supabase-migration-02-draft-metadata.sql`, so a change to it reaches
   * readers on Publish rather than on Save.
   */
  metadata?: Record<string, unknown> | null
  status?: Status
}

/* --------------------------------------------------------------- endpoints */

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: AdminUser }>('POST', '/api/auth/login', { email, password }),
    logout: () => request<{ loggedOut: boolean }>('POST', '/api/auth/logout'),
    me: () => request<AdminUser>('GET', '/api/auth/me'),
  },

  docs: {
    tree: () => request<DocNode[]>('GET', '/api/docs/tree'),
    byId: (id: string) => request<DocNode>('GET', `/api/docs/id/${id}`),
    revisions: (id: string) => request<Revision[]>('GET', `/api/docs/id/${id}/revisions`),
    create: (draft: NodeDraft) => request<DocNode>('POST', '/api/docs', draft),
    update: (id: string, patch: Partial<Omit<NodeDraft, 'type' | 'parentId' | 'status'>>) =>
      request<DocNode>('PUT', `/api/docs/${id}`, patch),
    remove: (id: string) => request<{ deleted: boolean }>('DELETE', `/api/docs/${id}`),
    /** Promotes any pending draft onto the live version and makes it public. */
    publish: (id: string) => request<DocNode>('POST', `/api/docs/${id}/publish`),
    unpublish: (id: string) => request<DocNode>('POST', `/api/docs/${id}/unpublish`),
    /** Throws away pending edits; the published version is left untouched. */
    discardDraft: (id: string) => request<DocNode>('POST', `/api/docs/${id}/discard-draft`),
    move: (id: string, parentId: string | null, order?: number) =>
      request<DocNode>('POST', `/api/docs/${id}/move`, { parentId, order }),
    reorder: (parentId: string | null, ids: string[]) =>
      request<DocNode[]>('POST', '/api/docs/reorder', { parentId, ids }),
  },

  search: (q: string, limit = 20) =>
    request<{ query: string; count: number; results: SearchHit[] }>(
      'GET',
      `/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),

  media: {
    list: (params: { type?: string; take?: number; skip?: number } = {}) => {
      const query = new URLSearchParams()
      if (params.type) query.set('type', params.type)
      query.set('take', String(params.take ?? 60))
      query.set('skip', String(params.skip ?? 0))
      return request<{ items: MediaItem[]; total: number }>('GET', `/api/media?${query}`)
    },
    upload: (file: File, alt?: string) => {
      const form = new FormData()
      form.append('file', file)
      if (alt) form.append('alt', alt)
      return request<MediaItem>('POST', '/api/media', form)
    },
    update: (id: string, changes: { alt?: string; file?: File }) => {
      const form = new FormData()
      if (changes.alt !== undefined) form.append('alt', changes.alt)
      if (changes.file) form.append('file', changes.file)
      return request<MediaItem>('PUT', `/api/media/${id}`, form)
    },
    remove: (id: string) => request<{ deleted: boolean }>('DELETE', `/api/media/${id}`),
  },

  releaseNotes: {
    list: () => request<ReleaseNote[]>('GET', '/api/release-notes'),
    create: (note: {
      version: string
      title: string
      slug?: string
      releasedAt?: string
      content: string
      status?: Status
    }) => request<ReleaseNote>('POST', '/api/release-notes', note),
    update: (
      id: string,
      patch: Partial<{ version: string; title: string; releasedAt: string; content: string; status: Status }>,
    ) => request<ReleaseNote>('PUT', `/api/release-notes/${id}`, patch),
    publish: (id: string) => request<ReleaseNote>('POST', `/api/release-notes/${id}/publish`),
    unpublish: (id: string) => request<ReleaseNote>('POST', `/api/release-notes/${id}/unpublish`),
    remove: (id: string) => request<{ deleted: boolean }>('DELETE', `/api/release-notes/${id}`),
  },
}

/* ----------------------------------------------------------------- helpers */

/** Depth-first walk of a tree response. */
export function walkTree(nodes: DocNode[], visit: (node: DocNode, depth: number) => void, depth = 0): void {
  for (const node of nodes) {
    visit(node, depth)
    if (node.children?.length) walkTree(node.children, visit, depth + 1)
  }
}

export function findNode(nodes: DocNode[], id: string): DocNode | undefined {
  let found: DocNode | undefined
  walkTree(nodes, (node) => {
    if (node.id === id) found = node
  })
  return found
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
