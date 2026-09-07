/**
 * Media grid, shared by the Media library screen and the editor's picker.
 *
 * Uploads go straight to `POST /api/media`; the grid then shows whatever the
 * backend reports, so "reuse" is simply picking an existing row again.
 */
/* eslint-disable react-refresh/only-export-components -- the grid, its hook and the snippet helper are one unit. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/primitives/Icon'
import { api, ApiError, formatBytes, formatDate, type MediaItem } from '../api'
import { Banner, Button, EmptyState, Modal } from '../ui'

export type MediaKind = 'image' | 'video' | 'file'

/** Backend filters on a MIME prefix; `file` means "everything else". */
const MIME_PREFIX: Record<MediaKind, string | undefined> = {
  image: 'image',
  video: 'video',
  file: undefined,
}

export function markdownFor(item: MediaItem, kind: MediaKind): string {
  if (kind === 'image' || item.mimeType.startsWith('image/')) {
    return `![${item.alt ?? item.originalName}](${item.url})`
  }
  if (kind === 'video' || item.mimeType.startsWith('video/')) {
    return `<video src="${item.url}" controls width="720"></video>`
  }
  return `[${item.originalName}](${item.url})`
}

export function useMediaLibrary(kind?: MediaKind) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.media.list({ type: kind ? MIME_PREFIX[kind] : undefined })
      setItems(result.items)
      setTotal(result.total)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the media library.')
    } finally {
      setLoading(false)
    }
  }, [kind])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, total, error, loading, reload, setError }
}

export function UploadButton({
  onUploaded,
  onError,
  label = 'Upload',
}: {
  onUploaded: (item: MediaItem) => void
  onError: (message: string) => void
  label?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    try {
      for (const file of Array.from(files)) onUploaded(await api.media.upload(file))
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Upload failed.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => void onFiles(event.target.files)}
      />
      <Button variant="primary" icon="upload" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? 'Uploading…' : label}
      </Button>
    </>
  )
}

export function MediaCard({
  item,
  onClick,
  actions,
}: {
  item: MediaItem
  onClick?: () => void
  actions?: React.ReactNode
}) {
  const isImage = item.mimeType.startsWith('image/')
  const isVideo = item.mimeType.startsWith('video/')

  return (
    <li className="group flex flex-col overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className="flex h-28 items-center justify-center overflow-hidden bg-[var(--color-surface-sunken)] disabled:cursor-default"
      >
        {isImage ? (
          <img src={item.url} alt={item.alt ?? item.originalName} loading="lazy" className="size-full object-cover" />
        ) : (
          <Icon name={isVideo ? 'eye' : 'file'} size={22} className="text-[var(--color-border-strong)]" />
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-2.5 py-2">
        <p className="truncate text-micro font-medium text-[var(--color-ink)]" title={item.originalName}>
          {item.originalName}
        </p>
        <p className="text-micro text-[var(--color-muted)]">
          {item.mimeType} · {formatBytes(item.size)} · {formatDate(item.createdAt)}
        </p>
        {actions && <div className="mt-1.5 flex items-center gap-1">{actions}</div>}
      </div>
    </li>
  )
}

export function MediaPickerDialog({
  open,
  kind,
  onClose,
  onPick,
}: {
  open: boolean
  kind: MediaKind
  onClose: () => void
  onPick: (item: MediaItem) => void
}) {
  const { items, error, loading, reload, setError } = useMediaLibrary(kind)

  const heading = { image: 'Insert an image', video: 'Insert a video', file: 'Attach a file' }[kind]

  return (
    <Modal
      open={open}
      wide
      title={heading}
      onClose={onClose}
      footer={
        <>
          <UploadButton onUploaded={() => void reload()} onError={setError} />
          <Button onClick={onClose}>Cancel</Button>
        </>
      }
    >
      {error && <Banner onDismiss={() => setError(null)}>{error}</Banner>}

      {loading ? (
        <p className="py-10 text-center text-ui text-[var(--color-muted)]">Loading media…</p>
      ) : items.length === 0 ? (
        <EmptyState icon="image" title="Nothing here yet">
          Upload a file to add it to the library — it stays available for every other page.
        </EmptyState>
      ) : (
        <ul className="grid max-h-[26rem] grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3 overflow-y-auto">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} onClick={() => onPick(item)} />
          ))}
        </ul>
      )}
    </Modal>
  )
}
