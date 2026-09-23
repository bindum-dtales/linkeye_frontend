/**
 * Folder / page editor.
 *
 * Three states, and the difference between them is the whole publish workflow:
 *
 *   Unsaved changes — typed into the form, not sent anywhere yet.
 *   Saved as a draft — stored by `PUT /api/docs/:id`. For a PUBLISHED node the
 *     backend parks these in its draft columns, so readers keep seeing the
 *     published version; for a DRAFT node there is nothing public to protect
 *     and the save lands directly.
 *   Published — `POST /api/docs/:id/publish` promotes the draft onto the live
 *     version, which is the only action that changes what readers see.
 *
 * The editing buffer therefore seeds from `node.draft` when one exists and
 * falls back to the published fields, so reopening a page shows the work in
 * progress rather than the last published text.
 *
 * Preview deliberately saves first and renders the `html` the backend returns —
 * the markdown pipeline is never reimplemented here, so what the editor
 * previews is exactly what the portal will publish.
 *
 * One node is edited slightly differently: the Documentation Home document,
 * which is a masthead rather than an article. It swaps the URL-slug field for
 * the two labels the portal renders around the section list, and relabels
 * title and description to what the reader actually sees. Everything else —
 * the buffer, the dirty check, save, publish, discard, preview, history — is
 * the same code path as every other page, because it is the same workflow.
 */
import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@/components/primitives/Icon'
import { HOME_META, HOME_SLUG, homeDefaults } from '@/lib/homeDoc'
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
  /** Home document only; stored in `metadata`, drafted like everything else. */
  eyebrow: string
  sectionsHeading: string
}

/** True for the reserved root page whose content the portal renders at `/docs`. */
const isHomeDoc = (node: DocNode): boolean =>
  node.kind === 'page' && node.parentId === null && node.slug === HOME_SLUG

/** A string out of the node's untyped metadata bag. */
const metaString = (metadata: unknown, key: string): string => {
  if (!metadata || typeof metadata !== 'object') return ''
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : ''
}

/**
 * The buffer to edit: pending changes when the node has them, otherwise the
 * published text. `slug` is never drafted — it rewrites `path` across the
 * subtree, so the backend applies it immediately in both cases.
 */
const draftOf = (node: DocNode): Draft => {
  // Pending metadata when there is some, the published bag otherwise — the
  // same precedence the text fields above use.
  const metadata = node.draft?.metadata ?? node.metadata
  return {
    title: node.draft?.title ?? node.title,
    slug: node.slug,
    description: node.draft?.description ?? node.description ?? '',
    content: node.draft?.content ?? node.content ?? '',
    eyebrow: metaString(metadata, HOME_META.eyebrow),
    sectionsHeading: metaString(metadata, HOME_META.sectionsHeading),
  }
}

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

  // Measured against the working copy (`draftOf`), so typing back to the last
  // saved draft clears "Unsaved changes" rather than comparing to what is live.
  const saved = node ? draftOf(node) : null
  const dirty =
    draft != null &&
    saved != null &&
    (draft.title !== saved.title ||
      draft.slug !== saved.slug ||
      draft.description !== saved.description ||
      draft.content !== saved.content ||
      draft.eyebrow !== saved.eyebrow ||
      draft.sectionsHeading !== saved.sectionsHeading)

  /** Edits are waiting behind the published version, or are about to be. */
  const pending = Boolean(node?.hasDraft) || dirty
  /** Publishing is only meaningful when something would actually change. */
  const canPublish = Boolean(node) && (pending || node!.status !== 'PUBLISHED')

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
        // Merged onto whatever the node already carries: `metadata` is a shared
        // bag (the importer writes lastUpdated, version and keywords into it),
        // so writing only these two keys would drop the rest.
        ...(isHomeDoc(node)
          ? {
              metadata: {
                ...((node.draft?.metadata ?? node.metadata ?? {}) as Record<string, unknown>),
                [HOME_META.eyebrow]: draft.eyebrow,
                [HOME_META.sectionsHeading]: draft.sectionsHeading,
              },
            }
          : {}),
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
      // Publish saves first, so the button always ships exactly what is on
      // screen — never the previous draft.
      if (dirty && !(await save())) return
      const updated = publish ? await api.docs.publish(node.id) : await api.docs.unpublish(node.id)
      setNode(updated)
      setDraft(draftOf(updated))
      setNotice(publish ? 'Published successfully. The public documentation now shows this version.' : 'Unpublished. Readers can no longer see this page.')
      onSaved(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change the publish state.')
    } finally {
      setBusy(false)
    }
  }

  /** Drops pending edits and returns the editor to the published version. */
  async function discard() {
    if (!node) return
    if (!window.confirm(`Discard unpublished changes to “${node.title}”? The published version stays as it is.`)) return
    setBusy(true)
    setError(null)
    try {
      const reverted = await api.docs.discardDraft(node.id)
      setNode(reverted)
      setDraft(draftOf(reverted))
      setNotice('Unpublished changes discarded.')
      onSaved(reverted)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not discard the changes.')
    } finally {
      setBusy(false)
    }
  }

  async function openPreview() {
    const current = dirty ? await save() : node
    // Preview shows what Publish would make live: the draft when one exists.
    if (current) setPreview(current.draft?.html ?? current.html ?? '')
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
  const isHome = isHomeDoc(node)
  const defaults = homeDefaults()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* -- action bar -------------------------------------------------- */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-5 py-2.5">
        <Icon name={isFolder ? 'folder' : 'file'} size={14} className="text-[var(--color-muted)]" />
        <span className="text-micro text-[var(--color-muted)]" title={node.path}>
          {node.path}
        </span>
        <StatusPill status={node.status} hasDraft={pending} />
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
          {/* Deleting the home document would silently drop `/docs` back to the
              built-in text, which is a confusing way to spell "revert". */}
          {!isHome && (
            <Button variant="danger" iconOnly icon="trash" title="Delete" aria-label="Delete" onClick={() => void remove()} />
          )}
          {/* Only offered once there is something saved to throw away. */}
          {node.hasDraft && !dirty && (
            <Button variant="ghost" onClick={() => void discard()} disabled={busy}>
              Discard changes
            </Button>
          )}
          {node.status === 'PUBLISHED' && (
            <Button variant="secondary" onClick={() => void setPublished(false)} disabled={busy}>
              Unpublish
            </Button>
          )}
          <Button onClick={() => void save()} disabled={!dirty || busy}>
            {busy ? 'Saving…' : 'Save draft'}
          </Button>
          {/* Always present, including on an already-published page: republishing
              an edit is the common case, and hiding the button behind the
              published state is what made edits look like they never shipped. */}
          <Button
            variant="primary"
            icon="check"
            onClick={() => void setPublished(true)}
            disabled={busy || !canPublish}
            title={
              canPublish
                ? 'Save and make this version visible to readers'
                : 'Nothing to publish — the live version already matches this one'
            }
          >
            {node.status === 'PUBLISHED' ? 'Publish changes' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Reuses the folder-hint strip below, so the editor gains no new visual
          language — just the one fact the workflow depends on. */}
      {node.hasDraft && (
        <p className="shrink-0 border-b border-[var(--color-hairline)] bg-[var(--color-accent-wash)] px-5 py-2 text-micro text-[var(--color-body)]">
          Readers still see the published version. Press <strong className="font-semibold">Publish changes</strong> to
          make these edits live.
        </p>
      )}

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
        <Field
          label={isHome ? 'Display heading' : 'Title'}
          htmlFor="node-title"
          {...(isHome ? { hint: `The large heading on /docs. Blank falls back to “${defaults.title}”.` } : {})}
        >
          <Input
            id="node-title"
            value={draft.title}
            placeholder={isHome ? defaults.title : undefined}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </Field>

        {/* The home document's URL is reserved — the portal renders it at
            /docs and finds it by that slug — so the slug field is replaced by
            the label that sits above the heading. */}
        {isHome ? (
          <Field label="Eyebrow label" htmlFor="home-eyebrow" hint="Small caps line above the heading.">
            <Input
              id="home-eyebrow"
              value={draft.eyebrow}
              placeholder={defaults.eyebrow}
              onChange={(event) => setDraft({ ...draft, eyebrow: event.target.value })}
            />
          </Field>
        ) : (
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
        )}

        <div className={isHome ? undefined : 'md:col-span-2'}>
          <Field
            label={isHome ? 'Intro paragraph' : 'Description'}
            htmlFor="node-description"
            hint={
              isHome
                ? 'The paragraph under the heading.'
                : 'Shown under the title and in search results.'
            }
          >
            <Textarea
              id="node-description"
              rows={2}
              value={draft.description}
              placeholder={isHome ? defaults.intro : undefined}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </Field>
        </div>

        {isHome && (
          <Field
            label="Section list heading"
            htmlFor="home-sections-heading"
            hint="Sits above the list of documentation sections."
          >
            <Input
              id="home-sections-heading"
              value={draft.sectionsHeading}
              placeholder={defaults.sectionsHeading}
              onChange={(event) => setDraft({ ...draft, sectionsHeading: event.target.value })}
            />
          </Field>
        )}
      </div>

      {/* -- body -------------------------------------------------------- */}
      {isFolder && (
        <p className="shrink-0 border-b border-[var(--color-hairline)] bg-[var(--color-accent-wash)] px-5 py-2 text-micro text-[var(--color-body)]">
          This is a folder. Anything written below appears as its section introduction, above the list of pages it contains.
        </p>
      )}
      {isHome && (
        <p className="shrink-0 border-b border-[var(--color-hairline)] bg-[var(--color-accent-wash)] px-5 py-2 text-micro text-[var(--color-body)]">
          This is the <strong className="font-semibold">/docs</strong> landing page. The list of sections below the
          intro is built from the top-level folders automatically — add, rename, reorder or delete a folder and the
          page follows. Anything written here appears between the intro and that list.
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
