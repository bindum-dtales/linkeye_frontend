/**
 * Sidebar expand/collapse state.
 *
 * Persisted to localStorage (TRD §6 — permitted "only if it improves UX"; on a
 * 40-page tree, losing your place on every navigation is the worse outcome).
 * Ancestors of the active page are always expanded, so a deep link never lands
 * on a collapsed tree.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { allFolderPaths, ancestorFolderPaths } from '@/lib/docs'

const STORAGE_KEY = 'docs:expanded-folders'

function readStored(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function useExpandedFolders(activePath: string) {
  const [stored, setStored] = useState<Set<string>>(() => new Set(readStored()))

  // Ancestors of the current page are expanded implicitly, never stored.
  const implicit = useMemo(() => new Set(ancestorFolderPaths(activePath)), [activePath])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...stored]))
    } catch {
      /* storage unavailable (private mode, quota) — expansion is non-essential */
    }
  }, [stored])

  const isExpanded = useCallback(
    (path: string) => implicit.has(path) || stored.has(path),
    [implicit, stored],
  )

  const toggle = useCallback(
    (path: string) => {
      setStored((prev) => {
        const next = new Set(prev)
        // An implicitly-open ancestor is closed by explicitly storing it closed,
        // which we model by removing it and letting `implicit` win only while it
        // is still an ancestor. Toggling the active branch shut is therefore a
        // no-op by design: the current page must stay reachable.
        if (next.has(path)) next.delete(path)
        else next.add(path)
        return next
      })
    },
    [],
  )

  const expandAll = useCallback(() => setStored(new Set(allFolderPaths())), [])
  const collapseAll = useCallback(() => setStored(new Set()), [])

  return { isExpanded, toggle, expandAll, collapseAll }
}
