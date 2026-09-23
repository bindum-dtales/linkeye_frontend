/**
 * The Documentation Home row, pinned above the tree.
 *
 * It is a real CMS node — a root-level page with a reserved slug — but it is
 * not a peer of the section folders: it is the page they are listed on. So it
 * sits outside the draggable tree, above a rule, with a home icon instead of a
 * file icon and no reorder, move, nest or delete affordances. Everything else
 * about it (selection state, the draft dot, the editor it opens) is the same
 * language the tree rows already use.
 *
 * Before anyone has created it, the same row acts as the thing that does: the
 * portal is already rendering its built-in text at `/docs`, so this offers to
 * capture that text as a document the CMS owns.
 */
import { Icon } from '@/components/primitives/Icon'
import type { DocNode } from '../api'

interface HomeDocRowProps {
  /** The stored home document, or null when one has not been created yet. */
  node: DocNode | null
  selected: boolean
  busy: boolean
  onSelect: () => void
  onCreate: () => void
}

export function HomeDocRow({ node, selected, busy, onSelect, onCreate }: HomeDocRowProps) {
  const pending = node != null && (node.status === 'DRAFT' || node.hasDraft)

  return (
    <div className="mb-1 border-b border-[var(--color-hairline)] pb-1">
      <button
        type="button"
        disabled={busy}
        onClick={node ? onSelect : onCreate}
        title={node ? node.path : 'Not set up yet — the portal is showing its built-in text'}
        className={[
          'flex w-full min-w-0 items-center gap-1.5 rounded-md px-1 py-1 text-left transition-colors duration-150 disabled:opacity-60',
          selected ? 'bg-[var(--color-surface-secondary)]' : 'hover:bg-[var(--color-surface-secondary)]',
        ].join(' ')}
      >
        <span className="flex size-5 shrink-0 items-center justify-center">
          <Icon name="home" size={13} className="text-[var(--color-muted)]" />
        </span>

        <span
          className={[
            'truncate text-nav',
            selected ? 'font-semibold text-[var(--color-ink)]' : 'text-[var(--color-body)]',
            node?.status === 'DRAFT' ? 'italic' : '',
          ].join(' ')}
        >
          Documentation Home
        </span>

        {pending && (
          <span
            aria-label={node?.status === 'DRAFT' ? 'Draft' : 'Unpublished changes'}
            title={node?.status === 'DRAFT' ? 'Draft' : 'Unpublished changes'}
            className="size-1.5 shrink-0 rounded-full bg-[var(--color-accent)]"
          />
        )}

        <span className="ml-auto shrink-0 pl-2 text-micro text-[var(--color-muted)]">
          {node ? '/docs' : busy ? 'Setting up…' : 'Set up'}
        </span>
      </button>
    </div>
  )
}
