/**
 * Documentation manager: the recursive tree on the left, the editor on the right.
 *
 * Every structural operation is a single backend call — the frontend never
 * recomputes slugs, paths or sibling order, it just reloads the tree afterwards
 * and shows what the backend decided.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '@/components/primitives/Icon'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { HOME_META, HOME_SLUG, homeDefaults } from '@/lib/homeDoc'
import { PageHeader } from '../AdminApp'
import { api, ApiError, findNode, walkTree, type DocNode, type NodeType, type SearchHit } from '../api'
import { Banner, Button, EmptyState, Field, Input, Modal, Select } from '../ui'
import { DocTree, type DropSpec } from '../components/DocTree'
import { DocEditor } from '../components/DocEditor'
import { HomeDocRow } from '../components/HomeDocRow'

interface CreateTarget {
  parentId: string | null
  parentTitle: string
}

/** Children of a parent, or the roots when `parentId` is null. */
function siblingsOf(nodes: DocNode[], parentId: string | null): DocNode[] {
  return parentId === null ? nodes : (findNode(nodes, parentId)?.children ?? [])
}

/**
 * Applies a new sibling order to one parent, in place in the tree.
 *
 * Only used for a same-parent reorder, where nothing but the order changes —
 * a cross-folder move rewrites slugs and paths for the whole subtree, which
 * only the backend can compute, so that case is never predicted locally.
 */
function reorderLocally(nodes: DocNode[], parentId: string | null, ids: string[]): DocNode[] {
  const sort = (list: DocNode[]) =>
    ids.map((id) => list.find((n) => n.id === id)).filter((n): n is DocNode => n != null)

  if (parentId === null) return sort(nodes)
  const walk = (list: DocNode[]): DocNode[] =>
    list.map((node) =>
      node.id === parentId
        ? { ...node, children: sort(node.children ?? []) }
        : node.children
          ? { ...node, children: walk(node.children) }
          : node,
    )
  return walk(nodes)
}

export function DocumentationPage() {
  const [tree, setTree] = useState<DocNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')
  const [hits, setHits] = useState<SearchHit[] | null>(null)

  const [createTarget, setCreateTarget] = useState<CreateTarget | null>(null)
  const [createType, setCreateType] = useState<NodeType>('PAGE')
  const [createTitle, setCreateTitle] = useState('')
  const [creatingHome, setCreatingHome] = useState(false)
  const [moving, setMoving] = useState<DocNode | null>(null)
  const [moveParent, setMoveParent] = useState<string>('')
  /** Bumped after a move so the editor remounts and shows the node's new path. */
  const [editorEpoch, setEditorEpoch] = useState(0)

  useDocumentTitle('Documentation manager')

  const loadTree = useCallback(async (): Promise<DocNode[]> => {
    try {
      const nodes = await api.docs.tree()
      setTree(nodes)
      setError(null)
      return nodes
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the documentation tree.')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTree().then((nodes) => {
      // Open the top level so the client sees structure immediately.
      setExpanded(new Set(nodes.filter((node) => node.kind === 'folder').map((node) => node.id)))
    })
  }, [loadTree])

  /*
   * The home document is a root node like any other as far as the backend is
   * concerned, but it is not a section: it is the page the sections are listed
   * on. So it is lifted out of `tree` here and pinned above it, which also
   * keeps it out of the drag-and-drop ordering it has no place in.
   */
  const homeNode = useMemo(
    () => tree.find((node) => node.kind === 'page' && node.slug === HOME_SLUG) ?? null,
    [tree],
  )
  const sectionTree = useMemo(() => tree.filter((node) => node.id !== homeNode?.id), [tree, homeNode])

  /**
   * Creates the home document, seeded with the text the portal is already
   * rendering from its built-in defaults — so the first save is a starting
   * point rather than a blank page, and nothing on `/docs` changes until it is
   * published.
   */
  async function createHome() {
    setCreatingHome(true)
    const defaults = homeDefaults()
    try {
      const node = await api.docs.create({
        type: 'PAGE',
        parentId: null,
        title: defaults.title,
        slug: HOME_SLUG,
        description: defaults.intro,
        metadata: {
          [HOME_META.eyebrow]: defaults.eyebrow,
          [HOME_META.sectionsHeading]: defaults.sectionsHeading,
        },
      })
      await loadTree()
      setSelectedId(node.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not set up the Documentation Home page.')
    } finally {
      setCreatingHome(false)
    }
  }

  /** Flat list of folders, for the "move to" and "create in" pickers. */
  const folders = useMemo(() => {
    const out: { id: string; label: string }[] = []
    walkTree(tree, (node, depth) => {
      if (node.kind === 'folder') out.push({ id: node.id, label: `${'— '.repeat(depth)}${node.title}` })
    })
    return out
  }, [tree])

  const byPath = useMemo(() => {
    const map = new Map<string, DocNode>()
    walkTree(tree, (node) => map.set(node.path, node))
    return map
  }, [tree])

  /** Expands every ancestor of a node so a search result is visible when selected. */
  const revealAncestors = useCallback(
    (target: DocNode) => {
      const ids = new Set(expanded)
      let parentId = target.parentId
      const byId = new Map<string, DocNode>()
      walkTree(tree, (node) => byId.set(node.id, node))
      while (parentId) {
        ids.add(parentId)
        parentId = byId.get(parentId)?.parentId ?? null
      }
      setExpanded(ids)
    },
    [expanded, tree],
  )

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function runSearch(query: string) {
    if (!query.trim()) {
      setHits(null)
      return
    }
    try {
      setHits((await api.search(query, 15)).results)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed.')
    }
  }

  async function create() {
    if (!createTarget || !createTitle.trim()) return
    try {
      const node = await api.docs.create({
        type: createType,
        parentId: createTarget.parentId,
        title: createTitle.trim(),
      })
      setCreateTarget(null)
      setCreateTitle('')
      await loadTree()
      if (createTarget.parentId) setExpanded((current) => new Set(current).add(createTarget.parentId!))
      setSelectedId(node.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create that item.')
    }
  }

  async function nudge(node: DocNode, siblings: DocNode[], delta: -1 | 1) {
    const ids = siblings.map((s) => s.id)
    const from = ids.indexOf(node.id)
    const to = from + delta
    if (to < 0 || to >= ids.length) return
    ;[ids[from], ids[to]] = [ids[to]!, ids[from]!]
    try {
      await api.docs.reorder(node.parentId, ids)
      await loadTree()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reorder.')
    }
  }

  /**
   * True when the open editor is the moved node or sits inside it — its path
   * has just been rewritten, so it has to be reloaded rather than left stale.
   */
  function editorAffectedBy(moved: DocNode): boolean {
    const open = selectedId ? findNode(tree, selectedId) : undefined
    return open != null && (open.id === moved.id || open.path.startsWith(`${moved.path}/`))
  }

  async function move() {
    if (!moving) return
    const affectsEditor = editorAffectedBy(moving)
    try {
      await api.docs.move(moving.id, moveParent || null)
      setMoving(null)
      await loadTree()
      if (affectsEditor) setEditorEpoch((epoch) => epoch + 1)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not move that item.')
    }
  }

  /** Applies a drag-and-drop landing reported by the tree. */
  async function drop(dragged: DocNode, target: DropSpec) {
    const ids = siblingsOf(tree, target.parentId)
      .map((node) => node.id)
      .filter((id) => id !== dragged.id)
    const at = target.beforeId ? ids.indexOf(target.beforeId) : -1
    ids.splice(at === -1 ? ids.length : at, 0, dragged.id)

    if (target.parentId === dragged.parentId) {
      // Order-only change: safe to show immediately, and to undo if it fails.
      const previous = tree
      setTree(reorderLocally(tree, target.parentId, ids))
      try {
        await api.docs.reorder(target.parentId, ids)
      } catch (err) {
        setTree(previous)
        setError(err instanceof ApiError ? err.message : 'Could not reorder.')
      }
      return
    }

    const affectsEditor = editorAffectedBy(dragged)
    try {
      // `move` appends; a second call positions it when the drop was not at the end.
      await api.docs.move(dragged.id, target.parentId)
      if (target.beforeId) await api.docs.reorder(target.parentId, ids)
      if (target.parentId) setExpanded((current) => new Set(current).add(target.parentId!))
      if (affectsEditor) setEditorEpoch((epoch) => epoch + 1)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not move that item.')
    } finally {
      await loadTree()
    }
  }

  async function remove(node: DocNode) {
    if (!window.confirm(`Delete “${node.title}”? Everything inside it is deleted too.`)) return
    try {
      await api.docs.remove(node.id)
      if (selectedId === node.id) setSelectedId(undefined)
      await loadTree()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete that item.')
    }
  }

  return (
    <>
      <PageHeader title="Documentation" description="Folders, pages and publishing">
        <Button
          icon="expand"
          onClick={() => {
            setCreateType('FOLDER')
            setCreateTarget({ parentId: null, parentTitle: 'Top level' })
          }}
        >
          New folder
        </Button>
        <Button
          variant="primary"
          icon="expand"
          onClick={() => {
            setCreateType('PAGE')
            setCreateTarget({ parentId: null, parentTitle: 'Top level' })
          }}
        >
          New page
        </Button>
      </PageHeader>

      <div className="flex min-h-0 flex-1">
        {/* -- tree -------------------------------------------------------- */}
        <aside className="flex w-[21rem] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-page)]">
          <div className="shrink-0 border-b border-[var(--color-hairline)] p-2.5">
            <div className="relative">
              <Icon
                name="search"
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
              />
              <Input
                type="search"
                placeholder="Filter or search content…"
                value={filter}
                className="pl-7"
                onChange={(event) => {
                  setFilter(event.target.value)
                  if (!event.target.value) setHits(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void runSearch(filter)
                }}
              />
            </div>
            <p className="mt-1.5 text-micro text-[var(--color-muted)]">
              Filters titles as you type. Press Enter to search page content.
            </p>
            <p className="mt-1 text-micro text-[var(--color-muted)]">
              Drag a row to reorder it, or onto a folder to nest it. The arrows and “Move to…” do the same from the
              keyboard.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {hits ? (
              <>
                <div className="mb-1 flex items-center justify-between px-1">
                  <span className="eyebrow text-[var(--color-muted)]">{hits.length} content matches</span>
                  <button
                    type="button"
                    onClick={() => setHits(null)}
                    className="text-micro text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  >
                    Back to tree
                  </button>
                </div>
                {hits.length === 0 && <p className="px-1 py-4 text-ui text-[var(--color-muted)]">No matches.</p>}
                <ul className="flex flex-col gap-px">
                  {hits.map((hit) => {
                    const node = byPath.get(hit.path)
                    return (
                      <li key={hit.path}>
                        <button
                          type="button"
                          disabled={!node}
                          onClick={() => {
                            if (!node) return
                            revealAncestors(node)
                            setSelectedId(node.id)
                            setHits(null)
                          }}
                          className="w-full rounded-md px-2 py-1.5 text-left hover:bg-[var(--color-surface-secondary)] disabled:opacity-50"
                        >
                          <span className="block truncate text-nav font-medium text-[var(--color-ink)]">
                            {hit.title}
                          </span>
                          <span className="block truncate text-micro text-[var(--color-muted)]">{hit.category}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : loading ? (
              <p className="px-2 py-6 text-center text-ui text-[var(--color-muted)]">Loading tree…</p>
            ) : (
              <>
                {/* Pinned above the tree, and above the filter's reach: it is
                    one fixed row, so hunting for it is never the problem. */}
                <HomeDocRow
                  node={homeNode}
                  selected={homeNode != null && homeNode.id === selectedId}
                  busy={creatingHome}
                  onSelect={() => homeNode && setSelectedId(homeNode.id)}
                  onCreate={() => void createHome()}
                />
                <DocTree
                  nodes={sectionTree}
                filter={filter.trim().toLowerCase()}
                selectedId={selectedId}
                expanded={expanded}
                onToggle={toggle}
                onSelect={(node) => setSelectedId(node.id)}
                onCreateChild={(parent) => {
                  setCreateType('PAGE')
                  setCreateTarget({ parentId: parent.id, parentTitle: parent.title })
                }}
                onNudge={(node, siblings, delta) => void nudge(node, siblings, delta)}
                onDrop={(node, target) => void drop(node, target)}
                onMove={(node) => {
                  setMoving(node)
                  setMoveParent(node.parentId ?? '')
                }}
                  onDelete={(node) => void remove(node)}
                />
              </>
            )}
          </div>
        </aside>

        {/* -- editor ------------------------------------------------------ */}
        <section className="flex min-w-0 flex-1 flex-col bg-[var(--color-surface)]">
          {error && (
            <div className="shrink-0 px-5 pt-3">
              <Banner onDismiss={() => setError(null)}>{error}</Banner>
            </div>
          )}
          {selectedId ? (
            <DocEditor
              key={`${selectedId}:${editorEpoch}`}
              nodeId={selectedId}
              onSaved={() => void loadTree()}
              onDeleted={() => {
                setSelectedId(undefined)
                void loadTree()
              }}
            />
          ) : (
            <EmptyState icon="book" title="Select a page to edit">
              Pick anything in the tree, or create a folder and start adding pages inside it.
            </EmptyState>
          )}
        </section>
      </div>

      {/* -- create ------------------------------------------------------- */}
      <Modal
        open={createTarget !== null}
        title={createType === 'FOLDER' ? 'New folder' : 'New page'}
        onClose={() => setCreateTarget(null)}
        footer={
          <>
            <Button onClick={() => setCreateTarget(null)}>Cancel</Button>
            <Button variant="primary" disabled={!createTitle.trim()} onClick={() => void create()}>
              Create
            </Button>
          </>
        }
      >
        <Field label="Type" htmlFor="create-type">
          <Select
            id="create-type"
            value={createType}
            onChange={(event) => setCreateType(event.target.value as NodeType)}
          >
            <option value="PAGE">Page — holds content</option>
            <option value="FOLDER">Folder — holds pages and other folders</option>
          </Select>
        </Field>

        <Field label="Title" htmlFor="create-title" hint="The URL slug is generated from this and can be changed later.">
          <Input
            id="create-title"
            autoFocus
            value={createTitle}
            onChange={(event) => setCreateTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void create()
            }}
          />
        </Field>

        <Field label="Location" htmlFor="create-parent">
          <Select
            id="create-parent"
            value={createTarget?.parentId ?? ''}
            onChange={(event) =>
              setCreateTarget({
                parentId: event.target.value || null,
                parentTitle: event.target.selectedOptions[0]?.text ?? 'Top level',
              })
            }
          >
            <option value="">Top level</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.label}
              </option>
            ))}
          </Select>
        </Field>

        <p className="text-micro text-[var(--color-muted)]">New items start as drafts and stay off the public portal until published.</p>
      </Modal>

      {/* -- move --------------------------------------------------------- */}
      <Modal
        open={moving !== null}
        title={`Move “${moving?.title ?? ''}”`}
        onClose={() => setMoving(null)}
        footer={
          <>
            <Button onClick={() => setMoving(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => void move()}>
              Move
            </Button>
          </>
        }
      >
        <Field label="New location" htmlFor="move-parent" hint="It is added at the end; use the arrows to position it.">
          <Select id="move-parent" value={moveParent} onChange={(event) => setMoveParent(event.target.value)}>
            <option value="">Top level</option>
            {folders
              .filter((folder) => folder.id !== moving?.id)
              .map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.label}
                </option>
              ))}
          </Select>
        </Field>
      </Modal>
    </>
  )
}
