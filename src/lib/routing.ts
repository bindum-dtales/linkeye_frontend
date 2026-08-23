/**
 * Centralised route construction.
 *
 * Every href in the application is built here. Swapping `BrowserRouter` for
 * `HashRouter` later means changing `App.tsx` and `toHref` — nothing else.
 */

/** Root of the documentation tree. */
export const DOCS_ROOT = '/docs'

/**
 * Normalises an internal path into an href.
 * With BrowserRouter this is an identity function; with HashRouter it would
 * prefix `#`.
 */
export function toHref(path: string): string {
  return path
}

/** Strips a trailing slash so `/docs/folder-1/` and `/docs/folder-1` match. */
export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

/** True when `candidate` is the given path or one of its descendants. */
export function isAncestorPath(candidate: string, current: string): boolean {
  return current === candidate || current.startsWith(candidate + '/')
}

export function isExternal(href: string): boolean {
  return /^(https?:)?\/\//.test(href) || href.startsWith('mailto:')
}
