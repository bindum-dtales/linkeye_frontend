/**
 * Recursive documentation tree, with drag-and-drop ordering.
 *
 * Renders whatever depth the backend returns — folders and pages are the same
 * row, so nesting is never capped at "folder → subcategory → page".
 *
 * Dragging uses the browser's own HTML5 drag-and-drop rather than a library:
 * a row is `draggable`, the row under the pointer decides from the cursor's
 * vertical position whether the drop lands before it, after it, or inside it
 * (folders only). Drops are reported as `{ parentId, beforeId }` — an anchor,
 * not an index — so the caller never has to reason about off-by-one when the
 * dragged node is removed from its old position.
 *
 * The up/down buttons and "Move to…" stay: they are the keyboard path, and
 * dragging is never the only way to do anything.
 */
import { useMemo, useState } from 'react'
import { Icon } from '@/components/primitives/Icon'
import type { DocNode } from '../api'
import { Button } from '../ui'

/** Where a dragged node should land: inside `parentId`, ahead of `beforeId`. */
export interface DropSpec {
  parentId: string | null
  /** `null` appends to the end of that parent's children. */
  beforeId: string | null
}

export interface TreeActions {
  onSelect: (node: DocNode) => void
  onCreateChild: (parent: DocNode) => void
  onMove: (node: DocNode) => void
  onDelete: (node: DocNode) => void
  /** `delta` is -1 for up, +1 for down; the page turns it into a reorder call. */
  onNudge: (node: DocNode, siblings: DocNode[], delta: -1 | 1) => void
  onDrop: (node: DocNode, target: DropSpec) => void
}

interface DocTreeProps extends TreeActions {
  nodes: DocNode[]
  selectedId?: string
  /** Ids of folders whose children are visible. */
  expanded: Set<string>
  onToggle: (id: string) => void
  /** Lowercased filter; a node survives if it or a descendant matches. */
  filter: string
}

type Position = 'before' | 'after' | 'inside'

interface DragState {
  /** The row being dragged, and every id it may not be dropped into. */
  node: DocNode
  forbidden: Set<string>
}

/** Drag context threaded down the recursion. */
interface Dnd {
  drag: DragState | null
  hint: { id: string; position: Position } | null
  start: (node: DocNode) => void
  over: (node: DocNode, siblings: DocNode[], event: React.DragEvent) => void
  leave: (node: DocNode) => void
  drop: (node: DocNode, siblings: DocNode[], event: React.DragEvent) => void
  end: () => void
}

function matches(node: DocNode, filter: string): boolean {
  if (!filter) return true
  if (node.title.toLowerCase().includes(filter) || node.slug.includes(filter)) return true
  return (node.children ?? []).some((child) => matches(child, filter))
}

/** The node itself plus its whole subtree — never a legal drop destination. */
function subtreeIds(node: DocNode, into = new Set<string>()): Set<string> {
  into.add(node.id)
  for (const child of node.children ?? []) subtreeIds(child, into)
  return into
}

/**
 * Reads the intended drop from where the cursor sits in the row.
 *
 * Folders give their middle half to "inside" so nesting is reachable without a
 * modifier key; pages split cleanly down the middle.
 */
function positionFor(event: React.DragEvent, isFolder: boolean): Position {
  const rect = event.currentTarget.getBoundingClientRect()
  const ratio = (event.clientY - rect.top) / (rect.height || 1)
  if (isFolder && ratio > 0.3 && ratio < 0.7) return 'inside'
  return ratio < 0.5 ? 'before' : 'after'
}

function resolveDrop(target: DocNode, siblings: DocNode[], position: Position, draggedId: string): DropSpec {
  if (position === 'inside') return { parentId: target.id, beforeId: null }

  const ordered = siblings.filter((s) => s.id !== draggedId)
  const index = ordered.findIndex((s) => s.id === target.id)
  const anchor = position === 'before' ? ordered[index] : ordered[index + 1]
  return { parentId: target.parentId, beforeId: anchor?.id ?? null }
}

function TreeRow({
  node,
  siblings,
  depth,
  selectedId,
  expanded,
  filter,
  onToggle,
  dnd,
  ...actions
}: {
  node: DocNode
  siblings: DocNode[]
  depth: number
  dnd: Dnd
} & Omit<DocTreeProps, 'nodes' | 'onDrop'>) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isFolder = node.kind === 'folder'
  const children = node.children ?? []
  // A filter reveals matches wherever they are, without changing saved state.
  const open = expanded.has(node.id) || (filter.length > 0 && children.length > 0)
  const selected = node.id === selectedId
  const index = siblings.findIndex((s) => s.id === node.id)

  const dragging = dnd.drag?.node.id === node.id
  const forbidden = dnd.drag != null && dnd.drag.forbidden.has(node.id)
  const hint = dnd.hint?.id === node.id ? dnd.hint.position : null

  return (
    <li>
      <div
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = 'move'
          // Firefox refuses to start a drag without payload; the id is also a
          // sane thing for anything else listening to receive.
          event.dataTransfer.setData('text/plain', node.id)
          dnd.start(node)
        }}
        onDragEnd={dnd.end}
        onDragOver={(event) => dnd.over(node, siblings, event)}
        onDragLeave={() => dnd.leave(node)}
        onDrop={(event) => {
          event.preventDefault()
          dnd.drop(node, siblings, event)
        }}
        className={[
          'group relative flex items-center gap-1 rounded-md pr-1 transition-colors duration-150',
          dragging ? 'opacity-40' : '',
          hint === 'inside'
            ? 'bg-[var(--color-accent-wash)] ring-1 ring-[var(--color-accent)]'
            : selected
              ? 'bg-[var(--color-surface-secondary)]'
              : 'hover:bg-[var(--color-surface-secondary)]',
        ].join(' ')}
        style={{ paddingLeft: `${depth * 0.75}rem` }}
      >
        {/* Insertion line. Accent alone is never the signal — the row it sits
            against, and the cursor, carry the meaning too. */}
        {(hint === 'before' || hint === 'after') && (
          <span
            aria-hidden="true"
            className={[
              'pointer-events-none absolute inset-x-0 h-[2px] bg-[var(--color-accent)]',
              hint === 'before' ? 'top-0' : 'bottom-0',
            ].join(' ')}
            style={{ marginLeft: `${depth * 0.75}rem` }}
          />
        )}

        {isFolder && children.length > 0 ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-label={open ? `Collapse ${node.title}` : `Expand ${node.title}`}
            aria-expanded={open}
            className="flex size-5 shrink-0 items-center justify-center rounded text-[var(--color-muted)] hover:text-[var(--color-ink)]"
          >
            <Icon name={open ? 'chevron-down' : 'chevron-right'} size={13} />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => actions.onSelect(node)}
          className="flex min-w-0 flex-1 cursor-grab items-center gap-1.5 py-1 text-left active:cursor-grabbing"
        >
          <Icon
            name={isFolder ? (open ? 'folder-open' : 'folder') : 'file'}
            size={13}
            className="shrink-0 text-[var(--color-muted)]"
          />
          <span
            className={[
              'truncate text-nav',
              selected ? 'font-semibold text-[var(--color-ink)]' : 'text-[var(--color-body)]',
              node.status === 'DRAFT' ? 'italic' : '',
              forbidden ? 'text-[var(--color-muted)]' : '',
            ].join(' ')}
            title={node.path}
          >
            {node.title}
          </span>
          {node.status === 'DRAFT' && (
            <span
              aria-label="Draft"
              title="Draft"
              className="size-1.5 shrink-0 rounded-full bg-[var(--color-accent)]"
            />
          )}
        </button>

        {/* Revealed on hover or focus — and pinned open while its menu is, so the
            menu does not vanish when the pointer leaves the row. */}
        <div
          className={[
            'flex shrink-0 items-center gap-px transition-opacity duration-150',
            menuOpen ? 'opacity-100' : 'opacity-0 focus-within:opacity-100 group-hover:opacity-100',
          ].join(' ')}
        >
          <Button
            variant="ghost"
            iconOnly
            icon="chevron-up"
            title="Move up"
            aria-label={`Move ${node.title} up`}
            disabled={index <= 0}
            onClick={() => actions.onNudge(node, siblings, -1)}
            className="size-6"
          />
          <Button
            variant="ghost"
            iconOnly
            icon="chevron-down"
            title="Move down"
            aria-label={`Move ${node.title} down`}
            disabled={index === siblings.length - 1}
            onClick={() => actions.onNudge(node, siblings, 1)}
            className="size-6"
          />
          {isFolder && (
            <Button
              variant="ghost"
              iconOnly
              icon="expand"
              title="Add inside this folder"
              aria-label={`Add inside ${node.title}`}
              onClick={() => actions.onCreateChild(node)}
              className="size-6"
            />
          )}
          <div className="relative">
            <Button
              variant="ghost"
              iconOnly
              icon="command"
              title="More actions"
              aria-label={`More actions for ${node.title}`}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              className="size-6"
            />
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                  onKeyDown={(event) => event.key === 'Escape' && setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[0_12px_28px_-12px_rgba(17,17,17,0.4)]">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-ui text-[var(--color-body)] hover:bg-[var(--color-surface-secondary)]"
                    onClick={() => {
                      setMenuOpen(false)
                      actions.onMove(node)
                    }}
                  >
                    <Icon name="arrow-right" size={13} /> Move to…
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-ui text-[#a11b1b] hover:bg-[#fdf3f3]"
                    onClick={() => {
                      setMenuOpen(false)
                      actions.onDelete(node)
                    }}
                  >
                    <Icon name="trash" size={13} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {open && children.length > 0 && (
        <ul>
          {children
            .filter((child) => matches(child, filter))
            .map((child) => (
              <TreeRow
                key={child.id}
                node={child}
                siblings={children}
                depth={depth + 1}
                selectedId={selectedId}
                expanded={expanded}
                filter={filter}
                onToggle={onToggle}
                dnd={dnd}
                {...actions}
              />
            ))}
        </ul>
      )}
    </li>
  )
}

export function DocTree({ nodes, filter, onDrop, ...rest }: DocTreeProps) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const [hint, setHint] = useState<{ id: string; position: Position } | null>(null)

  const visible = useMemo(() => nodes.filter((node) => matches(node, filter)), [nodes, filter])

  const dnd: Dnd = {
    drag,
    hint,
    start: (node) => setDrag({ node, forbidden: subtreeIds(node) }),
    end: () => {
      setDrag(null)
      setHint(null)
    },
    leave: (node) => setHint((current) => (current?.id === node.id ? null : current)),
    over: (node, siblings, event) => {
      if (!drag) return
      const position = positionFor(event, node.kind === 'folder')
      // A node may never land inside itself or its own subtree.
      const target = resolveDrop(node, siblings, position, drag.node.id)
      if (target.parentId !== null && drag.forbidden.has(target.parentId)) {
        event.dataTransfer.dropEffect = 'none'
        setHint(null)
        return
      }
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      setHint((current) =>
        current?.id === node.id && current.position === position ? current : { id: node.id, position },
      )
    },
    // The landing is read from the drop event itself, not from `hint`: the hint
    // is a render concern, and a drop that arrives before React has committed
    // the last dragover must still do the right thing.
    drop: (node, siblings, event) => {
      const dragged = drag?.node
      setDrag(null)
      setHint(null)
      if (!dragged) return
      const position = positionFor(event, node.kind === 'folder')
      const target = resolveDrop(node, siblings, position, dragged.id)
      if (target.parentId !== null && subtreeIds(dragged).has(target.parentId)) return
      // A drop that changes nothing still costs a request; skip it.
      if (target.parentId === dragged.parentId && target.beforeId === dragged.id) return
      onDrop(dragged, target)
    },
  }

  if (visible.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-ui text-[var(--color-muted)]">
        {filter ? 'No matching pages.' : 'No documentation yet.'}
      </p>
    )
  }

  return (
    <ul>
      {visible.map((node) => (
        <TreeRow key={node.id} node={node} siblings={nodes} depth={0} filter={filter} dnd={dnd} {...rest} />
      ))}
    </ul>
  )
}
