/**
 * Recursive sidebar node.
 *
 * Folders get a minimal line icon and a chevron; pages are quiet text rows that
 * pick up a short accent rule when active. No pills, no fills — active state is
 * carried by ink colour and weight, with the accent as reinforcement (it sits at
 * 1.65:1, so it can never be the only signal).
 */
import { Link } from 'react-router-dom'
import type { DocNode } from '@/lib/docs.types'
import { isFolder } from '@/lib/docs.types'
import { Icon } from '@/components/primitives/Icon'
import { isAncestorPath } from '@/lib/routing'
import { splitHighlight } from '@/lib/search'
import type { FilterResult } from '@/lib/search'

interface SidebarItemProps {
  node: DocNode
  depth: number
  currentPath: string
  isExpanded: (path: string) => boolean
  onToggle: (path: string) => void
  filter: FilterResult
  query: string
  onNavigate?: () => void
}

/** Wraps the matched substring so the filter hit is visible. */
function Label({ text, query }: { text: string; query: string }) {
  const parts = splitHighlight(text, query)
  if (!parts) return <>{text}</>
  return (
    <>
      {parts.before}
      <mark className="bg-[var(--color-accent-soft)] text-[var(--color-ink)]">{parts.match}</mark>
      {parts.after}
    </>
  )
}

export function DocsSidebarItem({
  node,
  depth,
  currentPath,
  isExpanded,
  onToggle,
  filter,
  query,
  onNavigate,
}: SidebarItemProps) {
  const filtering = query.trim().length > 0

  // While filtering, the filter result drives visibility — branches without a
  // match are hidden, but every ancestor of a match stays put.
  if (filtering && !filter.visible.has(node.path)) return null

  /* ------------------------------------------------------------- page row */

  if (!isFolder(node)) {
    const active = currentPath === node.path
    return (
      <li className="relative">
        <Link
          to={node.path}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
          className={[
            'group relative block py-[0.3125rem] pr-3 text-[var(--text-nav)] leading-[1.45] transition-colors duration-150',
            active
              ? 'font-medium text-[var(--color-ink)]'
              : 'text-[var(--color-secondary)] hover:text-[var(--color-ink)]',
          ].join(' ')}
        >
          {/* Accent rule on the active page; a hairline appears on hover. */}
          <span
            aria-hidden="true"
            className={[
              'absolute left-0 top-1/2 h-[calc(100%-6px)] w-[2px] -translate-y-1/2 transition-colors duration-150',
              active
                ? 'bg-[var(--color-accent)]'
                : 'bg-transparent group-hover:bg-[var(--color-border-strong)]',
            ].join(' ')}
          />
          <Label text={node.title} query={query} />
          {filtering && filter.matched.has(node.path) && !splitHighlight(node.title, query) && (
            <span className="mt-px block text-[0.6875rem] italic text-[var(--color-muted)]">
              matches keywords
            </span>
          )}
        </Link>
      </li>
    )
  }

  /* ----------------------------------------------------------- folder row */

  const expanded = filtering ? filter.expand.has(node.path) : isExpanded(node.path)
  const isTopLevel = depth === 0
  const onActiveBranch = isAncestorPath(node.path, currentPath)
  const isFolderPage = currentPath === node.path
  const panelId = `nav-panel-${node.path.replace(/\//g, '-')}`

  return (
    <li className={isTopLevel ? 'py-px' : ''}>
      <div className="flex items-center" style={{ paddingLeft: `${depth * 14}px` }}>
        <button
          type="button"
          onClick={() => onToggle(node.path)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex size-6 shrink-0 items-center justify-center rounded text-[var(--color-muted)] transition-colors duration-150 hover:text-[var(--color-ink)]"
        >
          <Icon
            name="chevron-right"
            size={12}
            className={[
              'transition-transform duration-[180ms] ease-[var(--ease-out-soft)] motion-reduce:transition-none',
              expanded ? 'rotate-90' : '',
            ].join(' ')}
          />
          <span className="sr-only">
            {expanded ? 'Collapse' : 'Expand'} {node.title}
          </span>
        </button>

        <Link
          to={node.path}
          onClick={onNavigate}
          aria-current={isFolderPage ? 'page' : onActiveBranch ? 'location' : undefined}
          className={[
            'group flex min-w-0 flex-1 items-center gap-2 py-[0.3125rem] pr-2 transition-colors duration-150',
            isTopLevel
              ? 'text-[var(--text-nav-group)] tracking-[-0.008em]'
              : 'text-[var(--text-nav)]',
            onActiveBranch || isFolderPage
              ? 'font-semibold text-[var(--color-ink)]'
              : 'font-medium text-[var(--color-ink)]/85 hover:text-[var(--color-ink)]',
          ].join(' ')}
        >
          {isTopLevel && (
            <Icon
              name={expanded ? 'folder-open' : 'folder'}
              size={13}
              className={[
                'shrink-0 transition-colors duration-150',
                onActiveBranch ? 'text-[var(--color-ink)]' : 'text-[var(--color-muted)]',
              ].join(' ')}
            />
          )}
          <span className="min-w-0 truncate">
            <Label text={node.title} query={query} />
          </span>
        </Link>
      </div>

      {/* 0fr -> 1fr animates cleanly for any content height. */}
      <div
        id={panelId}
        className={[
          'grid transition-[grid-template-rows] duration-[200ms] ease-[var(--ease-out-soft)] motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="overflow-hidden">
          <ul
            className={
              isTopLevel
                ? 'mb-2 ml-[11px] border-l border-[var(--color-hairline)] pt-0.5'
                : 'ml-[11px] border-l border-[var(--color-hairline)]'
            }
          >
            {node.children.map((child) => (
              <DocsSidebarItem
                key={child.path}
                node={child}
                depth={depth + 1}
                currentPath={currentPath}
                isExpanded={isExpanded}
                onToggle={onToggle}
                filter={filter}
                query={query}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      </div>
    </li>
  )
}
