/**
 * Persistent documentation navigation.
 *
 * An eyebrow label over an accent tick, the filter, then the tree. Sticky and
 * independently scrollable, with expand-all / collapse-all kept as quiet text.
 */
import { useId, useMemo } from 'react'
import type { RefObject } from 'react'
import { topLevelFolders } from '@/lib/docs'
import { filterTree } from '@/lib/search'
import { DocsSearch } from './DocsSearch'
import { DocsSidebarItem } from './DocsSidebarItem'

interface DocsSidebarProps {
  currentPath: string
  query: string
  onQueryChange: (value: string) => void
  isExpanded: (path: string) => boolean
  onToggle: (path: string) => void
  onExpandAll: () => void
  onCollapseAll: () => void
  searchRef?: RefObject<HTMLInputElement | null>
  /** Supplied by the mobile drawer so selecting a page closes it. */
  onNavigate?: () => void
}

export function DocsSidebar({
  currentPath,
  query,
  onQueryChange,
  isExpanded,
  onToggle,
  onExpandAll,
  onCollapseAll,
  searchRef,
  onNavigate,
}: DocsSidebarProps) {
  const tree = topLevelFolders()
  const treeId = useId()
  const filter = useMemo(() => filterTree(tree, query), [tree, query])

  const filtering = query.trim().length > 0
  const noResults = filtering && filter.visible.size === 0

  return (
    <nav aria-label="Documentation" className="flex h-full flex-col">
      <div className="shrink-0 pb-4">
        <div className="mb-3 flex items-center gap-2">
          <span aria-hidden="true" className="h-[2px] w-4 bg-[var(--color-accent)]" />
          <span className="eyebrow text-[var(--color-ink)]">Documentation</span>
        </div>

        <DocsSearch
          ref={searchRef}
          value={query}
          onChange={onQueryChange}
          matchCount={filter.matchCount}
          resultsId={treeId}
        />
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-[var(--color-hairline)] pt-2.5 text-[0.6875rem] text-[var(--color-muted)]">
        <button
          type="button"
          onClick={onExpandAll}
          className="transition-colors duration-150 hover:text-[var(--color-ink)]"
        >
          Expand all
        </button>
        <span aria-hidden="true" className="h-2.5 w-px bg-[var(--color-border)]" />
        <button
          type="button"
          onClick={onCollapseAll}
          className="transition-colors duration-150 hover:text-[var(--color-ink)]"
        >
          Collapse all
        </button>
      </div>

      <div className="rail-scroll -ml-px min-h-0 flex-1 overflow-y-auto py-3 pr-1">
        {noResults ? (
          <div className="px-1 py-10">
            <p className="text-[var(--text-nav)] font-medium text-[var(--color-ink)]">
              No matching pages
            </p>
            <p className="mt-1 text-[0.6875rem] leading-relaxed text-[var(--color-muted)]">
              Nothing matches “{query.trim()}”. Try a shorter term.
            </p>
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="group relative mt-3 text-[0.6875rem] font-medium text-[var(--color-ink)]"
            >
              Clear filter
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-left bg-[var(--color-accent)] transition-transform duration-150 group-hover:scale-x-100 motion-reduce:transition-none"
              />
            </button>
          </div>
        ) : (
          <ul id={treeId}>
            {tree.map((folder) => (
              <DocsSidebarItem
                key={folder.path}
                node={folder}
                depth={0}
                currentPath={currentPath}
                isExpanded={isExpanded}
                onToggle={onToggle}
                filter={filter}
                query={query}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        )}
      </div>
    </nav>
  )
}
