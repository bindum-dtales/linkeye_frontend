/**
 * Release notes.
 *
 * Same content pipeline as documentation pages — markdown in, backend-rendered
 * HTML out — so the preview here is the published article.
 */
import { useCallback, useEffect, useState } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PageHeader } from '../AdminApp'
import { api, ApiError, formatDate, type ReleaseNote } from '../api'
import { Banner, Button, EmptyState, Field, Input, Modal, StatusPill, Textarea } from '../ui'

interface Draft {
  version: string
  title: string
  releasedAt: string
  content: string
}

const today = () => new Date().toISOString().slice(0, 10)
const emptyDraft = (): Draft => ({ version: '', title: '', releasedAt: today(), content: '' })

export function ReleaseNotesPage() {
  const [notes, setNotes] = useState<ReleaseNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ReleaseNote | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [creating, setCreating] = useState(false)
  const [preview, setPreview] = useState<ReleaseNote | null>(null)
  const [busy, setBusy] = useState(false)

  useDocumentTitle('Release notes')

  const load = useCallback(async () => {
    try {
      setNotes(await api.releaseNotes.list())
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load release notes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function edit(note: ReleaseNote) {
    setSelected(note)
    setCreating(false)
    setDraft({
      version: note.version,
      title: note.title,
      releasedAt: note.releasedAt.slice(0, 10),
      content: note.content,
    })
  }

  function startNew() {
    setSelected(null)
    setCreating(true)
    setDraft(emptyDraft())
  }

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const saved = creating
        ? await api.releaseNotes.create({
            version: draft.version,
            title: draft.title,
            releasedAt: draft.releasedAt,
            content: draft.content,
          })
        : await api.releaseNotes.update(selected!.id, {
            version: draft.version,
            title: draft.title,
            releasedAt: draft.releasedAt,
            content: draft.content,
          })
      await load()
      setCreating(false)
      setSelected(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function setPublished(note: ReleaseNote, publish: boolean) {
    try {
      const updated = publish ? await api.releaseNotes.publish(note.id) : await api.releaseNotes.unpublish(note.id)
      if (selected?.id === note.id) setSelected(updated)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change the publish state.')
    }
  }

  async function remove(note: ReleaseNote) {
    if (!window.confirm(`Delete release note “${note.title}”?`)) return
    try {
      await api.releaseNotes.remove(note.id)
      if (selected?.id === note.id) setSelected(null)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed.')
    }
  }

  const editing = creating || selected !== null
  const canSave = draft.version.trim() !== '' && draft.title.trim() !== ''

  return (
    <>
      <PageHeader title="Release Notes" description={`${notes.length} entr${notes.length === 1 ? 'y' : 'ies'}`}>
        <Button variant="primary" icon="expand" onClick={startNew}>
          New release note
        </Button>
      </PageHeader>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[19rem] shrink-0 overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-page)] p-2">
          {loading ? (
            <p className="px-2 py-6 text-center text-ui text-[var(--color-muted)]">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="px-2 py-6 text-center text-ui text-[var(--color-muted)]">No release notes yet.</p>
          ) : (
            <ul className="flex flex-col gap-px">
              {notes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => edit(note)}
                    className={[
                      'w-full rounded-md px-2.5 py-2 text-left transition-colors duration-150',
                      selected?.id === note.id
                        ? 'bg-[var(--color-surface-secondary)]'
                        : 'hover:bg-[var(--color-surface-secondary)]',
                    ].join(' ')}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-[var(--font-mono)] text-micro text-[var(--color-ink)]">{note.version}</span>
                      <StatusPill status={note.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-nav text-[var(--color-body)]">{note.title}</span>
                    <span className="block text-micro text-[var(--color-muted)]">{formatDate(note.releasedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-[var(--color-surface)]">
          {error && (
            <div className="px-5 pt-4">
              <Banner onDismiss={() => setError(null)}>{error}</Banner>
            </div>
          )}

          {!editing ? (
            <EmptyState icon="file" title="Select or create a release note">
              Release notes carry a version, a date and markdown content, and publish independently of the documentation.
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                {selected && <StatusPill status={selected.status} />}
                {selected && (
                  <span className="text-micro text-[var(--color-muted)]">/{selected.slug}</span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {selected && (
                    <>
                      <Button icon="eye" onClick={() => setPreview(selected)}>
                        Preview
                      </Button>
                      <Button
                        variant="danger"
                        iconOnly
                        icon="trash"
                        title="Delete"
                        aria-label="Delete release note"
                        onClick={() => void remove(selected)}
                      />
                    </>
                  )}
                  <Button onClick={() => void save()} disabled={!canSave || busy}>
                    {busy ? 'Saving…' : creating ? 'Create' : 'Save'}
                  </Button>
                  {selected &&
                    (selected.status === 'PUBLISHED' ? (
                      <Button onClick={() => void setPublished(selected, false)}>Unpublish</Button>
                    ) : (
                      <Button variant="primary" icon="check" onClick={() => void setPublished(selected, true)}>
                        Publish
                      </Button>
                    ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Version" htmlFor="note-version">
                  <Input
                    id="note-version"
                    placeholder="2.4.0"
                    value={draft.version}
                    onChange={(event) => setDraft({ ...draft, version: event.target.value })}
                  />
                </Field>
                <Field label="Release date" htmlFor="note-date">
                  <Input
                    id="note-date"
                    type="date"
                    value={draft.releasedAt}
                    onChange={(event) => setDraft({ ...draft, releasedAt: event.target.value })}
                  />
                </Field>
              </div>

              <Field label="Title" htmlFor="note-title">
                <Input
                  id="note-title"
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
              </Field>

              <Field label="Content" htmlFor="note-content" hint="Markdown — headings, lists, links and tables all work.">
                <Textarea
                  id="note-content"
                  rows={16}
                  value={draft.content}
                  placeholder={'## Added\n\n- New documentation CMS.\n\n## Fixed\n\n- …'}
                  className="font-[var(--font-mono)] text-[0.8125rem] leading-[1.7]"
                  onChange={(event) => setDraft({ ...draft, content: event.target.value })}
                />
              </Field>
            </div>
          )}
        </section>
      </div>

      <Modal open={preview !== null} wide title={`Preview — ${preview?.title ?? ''}`} onClose={() => setPreview(null)}>
        <article className="doc-prose max-h-[70vh] overflow-y-auto">
          <h1 className="mb-1 text-title font-semibold tracking-[-0.02em] text-[var(--color-ink)]">{preview?.title}</h1>
          <p className="text-micro text-[var(--color-muted)]">
            {preview?.version} · {formatDate(preview?.releasedAt)}
          </p>
          <div dangerouslySetInnerHTML={{ __html: preview?.html ?? '' }} />
        </article>
      </Modal>
    </>
  )
}
