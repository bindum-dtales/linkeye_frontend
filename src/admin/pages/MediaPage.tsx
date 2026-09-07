/**
 * Media library.
 *
 * Browse, upload, replace, edit alt text, copy a URL for reuse, delete. The
 * backend owns storage and validation; this screen is a view over it.
 */
import { useRef, useState } from 'react'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PageHeader } from '../AdminApp'
import { api, ApiError, type MediaItem } from '../api'
import { Banner, Button, EmptyState, Field, Input, Modal, Select } from '../ui'
import { MediaCard, UploadButton, useMediaLibrary, type MediaKind } from '../components/MediaPicker'

export function MediaPage() {
  const [kind, setKind] = useState<MediaKind | 'all'>('all')
  const { items, total, error, loading, reload, setError } = useMediaLibrary(kind === 'all' ? undefined : kind)
  const [editing, setEditing] = useState<MediaItem | null>(null)
  const [alt, setAlt] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const replaceInput = useRef<HTMLInputElement>(null)

  useDocumentTitle('Media library')

  async function copyUrl(item: MediaItem) {
    try {
      await navigator.clipboard.writeText(item.url)
      setCopied(item.id)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      setError('Could not copy to the clipboard — the URL is shown in the details dialog.')
    }
  }

  async function remove(item: MediaItem) {
    if (!window.confirm(`Delete ${item.originalName}? Pages already using it will show a broken link.`)) return
    try {
      await api.media.remove(item.id)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed.')
    }
  }

  async function saveAlt() {
    if (!editing) return
    try {
      await api.media.update(editing.id, { alt })
      setEditing(null)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.')
    }
  }

  async function replaceFile(file: File | undefined) {
    if (!editing || !file) return
    try {
      await api.media.update(editing.id, { file })
      setEditing(null)
      await reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Replace failed.')
    }
  }

  return (
    <>
      <PageHeader title="Media" description={`${total} file${total === 1 ? '' : 's'} available to reuse`}>
        <Select
          value={kind}
          aria-label="Filter by type"
          className="h-8 w-36"
          onChange={(event) => setKind(event.target.value as MediaKind | 'all')}
        >
          <option value="all">All files</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </Select>
        <UploadButton onUploaded={() => void reload()} onError={setError} label="Upload file" />
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {error && (
          <div className="mb-4">
            <Banner onDismiss={() => setError(null)}>{error}</Banner>
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-ui text-[var(--color-muted)]">Loading media…</p>
        ) : items.length === 0 ? (
          <EmptyState icon="image" title="No media yet">
            Upload images, videos, PDFs or other attachments here, then insert them into any page from the editor.
          </EmptyState>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-4">
            {items.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                actions={
                  <>
                    <Button
                      variant="ghost"
                      icon={copied === item.id ? 'check' : 'copy'}
                      className="h-6 px-1.5"
                      onClick={() => void copyUrl(item)}
                    >
                      {copied === item.id ? 'Copied' : 'Copy URL'}
                    </Button>
                    <Button
                      variant="ghost"
                      iconOnly
                      icon="pencil"
                      title="Edit or replace"
                      aria-label={`Edit ${item.originalName}`}
                      className="size-6"
                      onClick={() => {
                        setEditing(item)
                        setAlt(item.alt ?? '')
                      }}
                    />
                    <Button
                      variant="ghost"
                      iconOnly
                      icon="trash"
                      title="Delete"
                      aria-label={`Delete ${item.originalName}`}
                      className="size-6"
                      onClick={() => void remove(item)}
                    />
                  </>
                }
              />
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={editing !== null}
        title={editing?.originalName ?? ''}
        onClose={() => setEditing(null)}
        footer={
          <>
            <Button onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => void saveAlt()}>
              Save
            </Button>
          </>
        }
      >
        <Field label="Public URL" hint="Paste this anywhere, or use the Image button in the editor.">
          <Input readOnly value={editing?.url ?? ''} onFocus={(event) => event.currentTarget.select()} />
        </Field>

        <Field label="Alt text" htmlFor="media-alt" hint="Describes the image for screen readers and when it fails to load.">
          <Input id="media-alt" value={alt} onChange={(event) => setAlt(event.target.value)} />
        </Field>

        <div>
          <input
            ref={replaceInput}
            type="file"
            className="hidden"
            onChange={(event) => void replaceFile(event.target.files?.[0])}
          />
          <Button icon="upload" onClick={() => replaceInput.current?.click()}>
            Replace file
          </Button>
          <p className="mt-1.5 text-micro text-[var(--color-muted)]">
            Pages keep pointing at this item, so the new file appears everywhere it is used.
          </p>
        </div>
      </Modal>
    </>
  )
}
