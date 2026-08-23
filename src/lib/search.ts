/**
 * Sidebar filter matching.
 *
 * The filter is deliberately tree-aware: it computes the set of node paths that
 * should stay visible, keeping every ancestor of a match so hierarchy and
 * indentation are preserved (audit §5, PRD Journey B). It never flattens the
 * tree into a result list.
 */
import type { DocNode } from './docs.types'
import { isFolder } from './docs.types'

export interface FilterResult {
  /** Paths that remain visible: matches plus all of their ancestors. */
  visible: Set<string>
  /** Paths that matched the query directly, for highlighting. */
  matched: Set<string>
  /** Folder paths that must be force-expanded to reveal a match. */
  expand: Set<string>
  matchCount: number
}

export const EMPTY_FILTER: FilterResult = {
  visible: new Set(),
  matched: new Set(),
  expand: new Set(),
  matchCount: 0,
}

export function normalize(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').trim()
}

function haystackFor(node: DocNode): string {
  if (isFolder(node)) return normalize(`${node.title} ${node.description ?? ''}`)
  return normalize(
    `${node.title} ${node.description ?? ''} ${node.keywords.join(' ')}`,
  )
}

/**
 * Walks the tree once, marking matches and back-filling their ancestors.
 * A matching folder keeps its whole subtree visible so the user can see what is
 * inside it; a matching page keeps only its ancestor chain.
 */
export function filterTree(nodes: DocNode[], rawQuery: string): FilterResult {
  const query = normalize(rawQuery)
  if (!query) return EMPTY_FILTER

  const visible = new Set<string>()
  const matched = new Set<string>()
  const expand = new Set<string>()
  let matchCount = 0

  const markSubtree = (node: DocNode): void => {
    visible.add(node.path)
    if (isFolder(node)) {
      expand.add(node.path)
      for (const child of node.children) markSubtree(child)
    }
  }

  const walk = (node: DocNode, ancestors: string[]): boolean => {
    const selfMatches = haystackFor(node).includes(query)

    if (selfMatches) {
      matched.add(node.path)
      if (!isFolder(node)) matchCount += 1
    }

    let descendantMatched = false
    if (isFolder(node)) {
      const nextAncestors = [...ancestors, node.path]
      for (const child of node.children) {
        if (walk(child, nextAncestors)) descendantMatched = true
      }
    }

    if (selfMatches && isFolder(node)) {
      // A folder title match reveals everything beneath it.
      markSubtree(node)
    }

    if (selfMatches || descendantMatched) {
      visible.add(node.path)
      for (const ancestor of ancestors) {
        visible.add(ancestor)
        expand.add(ancestor)
      }
      if (isFolder(node) && descendantMatched) expand.add(node.path)
      return true
    }

    return false
  }

  for (const node of nodes) walk(node, [])
  return { visible, matched, expand, matchCount }
}

/**
 * Splits a label around the matched substring so the UI can wrap the middle
 * segment in a highlight element. Returns `null` when there is no match.
 */
export function splitHighlight(
  label: string,
  rawQuery: string,
): { before: string; match: string; after: string } | null {
  const query = normalize(rawQuery)
  if (!query) return null
  const index = normalize(label).indexOf(query)
  if (index === -1) return null
  return {
    before: label.slice(0, index),
    match: label.slice(index, index + query.length),
    after: label.slice(index + query.length),
  }
}
