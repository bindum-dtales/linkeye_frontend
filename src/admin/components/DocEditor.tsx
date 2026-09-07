/**
 * Folder / page editor.
 *
 * Holds a local draft of the selected node and pushes changes through
 * `PUT /api/docs/:id`. Preview deliberately saves first and renders the `html`
 * the backend returns — the markdown pipeline is never reimplemented here, so
 * what the editor previews is exactly what the portal will publish.
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@/components/primitives/Icon'
import { api, ApiError, formatDate, type DocNode, type MediaItem, type Revision } from '../api'
import { Banner, Button, Field, Input, Modal, StatusPill, Textarea } from '../ui'
import { MarkdownEditor } from './MarkdownEditor'
import { MediaPickerDialog, markdownFor, type MediaKind } from './MediaPicker'

interface DocEditorProps {
  nodeId: string
  /** Bubbles a saved node up so the tree can refresh titles and status. */
  onSaved: (node: DocNode) => void
  onDeleted: (node: DocNode) => void
}

interface Draft {
  title: string
  slug: string
  description: string
  content: string
}

const draftOf = (node: DocNode): Draft => ({
  title: node.title,
  slug: node.slug,
  description: node.description ?? '',
  content: node.content ?? '',
})

export function DocEditor({ nodeId, onSaved, onDeleted }: DocEditorProps) {
  const [node, setNode] = useState<DocNode | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [revisions, setRevisions] = useState<Revision[] | null>(null)
  const [picker, setPicker] = useState<{ kind: MediaKind; resolve: (value: string | null) => void } | null>(null)

  useEffect(() => {
    let cancelled = false
    setNode(null)
    setDraft(null)
    setError(null)
    setNotice(null)
    api.docs
      .byId(nodeId)
      .then((loaded) => {
        if (cancelled) return
        setNode(loaded)
        setDraft(draftOf(loaded))
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Could not load this node.')
      })
    return () => {
      cancelled = true
    }
  }, [nodeId])

  const dirty =
    node != null &&
    draft != null &&
    (draft.title !== node.title ||
      draft.slug !== node.slug ||
      draft.description !== (node.description ?? '') ||
      draft.content !== (node.content ?? ''))

  /** Saves and returns the fresh node, or null when the save failed. */
  const save = useCallback(async (): Promise<DocNode | null> => {
    if (!node || !draft) return null
    setBusy(true)
    setError(null)
    try {
      const patch = {
        title: draft.title,
        description: draft.description || null,
        content: draft.content || null,
        ...(draft.slug !== node.slug ? { slug: draft.slug } : {}),
      }
      const saved = await api.docs.update(node.id, patch)
      setNode(saved)
      setDraft(draftOf(saved))
      setNotice('Saved.')
      onSaved(saved)
      return saved
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed.')
      return null
    } finally {
      setBusy(false)
    }
  }, [node, draft, onSaved])

  async function setPublished(publish: boolean) {
    if (!node) return
    setBusy(true)
    setError(null)
    try {
      // Save first so publishing never ships a stale body.
      if (dirty) await save()
      const updated = publish ? await api.docs.publish(node.id) : await api.docs.unpublish(node.id)
      setNode((current) => (current ? { ...current, ...updated } : updated))
      setNotice(publish ? 'Published to the public portal.' : 'Moved back to draft.')
      onSaved(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change the publish state.')
    } finally {
      setBusy(false)
    }
  }

  async function openPreview() {
    const current = dirty ? await save() : node
    if (current) setPreview(current.html ?? '')
  }

  async function remove() {
    if (!node) return
    if (!window.confirm(`Delete “${node.title}”? Everything inside it is deleted too.`)) return
    try {
      await api.docs.remove(node.id)
      onDeleted(node)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed.')
    }
  }

  const pickMedia = (kind: MediaKind) =>
    new Promise<string | null>((resolve) => setPicker({ kind, resolve }))

  function resolvePicker(item: MediaItem | null) {
    picker?.resolve(item ? markdownFor(item, picker.kind) : null)
    setPicker(null)
  }

  if (error && !node) {
    return (
      <div className="p-5">
        <Banner>{error}</Banner>
      </div>
    )
  }
  if (!node || !draft) {
    return <p className="p-5 text-ui text-[var(--color-muted)]">Loading…</p>
  }

  const isFolder = node.kind === 'folder'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* -- action bar -------------------------------------------------- */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-5 py-2.5">
        <Icon name={isFolder ? 'folder' : 'file'} size={14} className="text-[var(--color-muted)]" />
        <span className="text-micro text-[var(--color-muted)]" title={node.path}>
          {node.path}
        </span>
        <StatusPill status={node.status} />
        {dirty && <span className="text-micro text-[var(--color-muted)]">Unsaved changes</span>}

        <div className="ml-auto flex items-center gap-2">
          <Button icon="eye" onClick={() => void openPreview()} disabled={busy}>
            Preview
          </Button>
          <Button
            onClick={() => {
              setRevisions(null)
              void api.docs.revisions(node.id).then(setRevisions).catch(() => setRevisions([]))
            }}
            icon="refresh"
            title="Version history"
          >
            v{node.version}
          </Button>
          <Button variant="danger" iconOnly icon="trash" title="Delete" aria-label="Delete" onClick={() => void remove()} />
          <Button onClick={() => void save()} disabled={!dirty || busy}>
            {busy ? 'Saving…' : 'Save draft'}
          </Button>
          {node.status === 'PUBLISHED' ? (
            <Button variant="secondary" onClick={() => void setPublished(false)} disabled={busy}>
              Unpublish
            </Button>
          ) : (
            <Button variant="primary" icon="check" onClick={() => void setPublished(true)} disabled={busy}>
              Publish
            </Button>
          )}
        </div>
      </div>

      {(error || notice) && (
        <div className="shrink-0 px-5 pt-3">
          {error ? (
            <Banner onDismiss={() => setError(null)}>{error}</Banner>
          ) : (
            <Banner tone="success" onDismiss={() => setNotice(null)}>
              {notice}
            </Banner>
          )}
        </div>
      )}

      {/* -- metadata ---------------------------------------------------- */}
      <div className="grid shrink-0 gap-3 border-b border-[var(--color-hairline)] px-5 py-4 md:grid-cols-[2fr_1fr]">
        <Field label="Title" htmlFor="node-title">
          <Input
            id="node-title"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </Field>
        <Field
          label="URL slug"
          htmlFor="node-slug"
          hint="Changing this rewrites the URL of everything inside it."
        >
          <Input
            id="node-slug"
            value={draft.slug}
            onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Description" htmlFor="node-description" hint="Shown under the title and in search results.">
            <Textarea
              id="node-description"
              rows={2}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </Field>
        </div>
      </div>

      {/* -- body -------------------------------------------------------- */}
      {isFolder && (
        <p className="shrink-0 border-b border-[var(--color-hairline)] bg-[var(--color-accent-wash)] px-5 py-2 text-micro text-[var(--color-body)]">
          This is a folder. Anything written below appears as its section introduction, above the list of pages it contains.
        </p>
      )}
      <MarkdownEditor
        value={draft.content}
        onChange={(content) => setDraft({ ...draft, content })}
        onPickMedia={pickMedia}
      />

      {/* -- dialogs ----------------------------------------------------- */}
      <Modal open={preview !== null} wide title={`Preview — ${node.title}`} onClose={() => setPreview(null)}>
        <article className="doc-prose max-h-[70vh] overflow-y-auto">
          <h1 className="mb-2 text-title font-semibold tracking-[-0.02em] text-[var(--color-ink)]">{node.title}</h1>
          {node.description && <p className="text-lede text-[var(--color-secondary)]">{node.description}</p>}
          {preview ? (
            <div dangerouslySetInnerHTML={{ __html: preview }} />
          ) : (
            <p className="text-[var(--color-muted)]">This page has no content yet.</p>
          )}
        </article>
      </Modal>

      <Modal open={revisions !== null} title="Version history" onClose={() => setRevisions(null)}>
        {revisions?.length ? (
          <ul className="flex flex-col gap-2">
            {revisions.map((revision) => (
              <li
                key={revision.id}
                className="flex items-baseline justify-between gap-3 border-b border-[var(--color-hairline)] pb-2 last:border-0"
              >
                <span className="text-ui text-[var(--color-ink)]">
                  v{revision.version} · {revision.title}
                </span>
                <span className="shrink-0 text-micro text-[var(--color-muted)]">
                  {formatDate(revision.createdAt)}
                  {revision.author ? ` · ${revision.author.name}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ui text-[var(--color-muted)]">No saved versions yet.</p>
        )}
      </Modal>

      {picker && (
        <MediaPickerDialog
          open
          kind={picker.kind}
          onClose={() => resolvePicker(null)}
          onPick={(item) => resolvePicker(item)}
        />
      )}
    </div>
  )
}
