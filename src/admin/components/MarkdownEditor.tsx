/**
 * Markdown editor with a formatting toolbar.
 *
 * The backend stores markdown and renders it server-side, so the editor's job
 * is to write correct markdown — not to render it. Every button inserts the
 * exact syntax the backend's pipeline understands, including its `:::note`
 * callouts and fenced code blocks.
 */
import { useCallback, useRef } from 'react'
import { Icon } from '@/components/primitives/Icon'
import { Button } from '../ui'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  /** Opens the media library; resolves with a markdown snippet to insert. */
  onPickMedia: (kind: 'image' | 'video' | 'file') => Promise<string | null>
}

const TABLE_SNIPPET = '\n| Column | Description |\n|---|---|\n| Value | What it means |\n'
const CODE_SNIPPET = '\n```bash\n\n```\n'
const CALLOUT_SNIPPET = '\n:::note Heads up\nSomething worth calling out.\n:::\n'

export function MarkdownEditor({ value, onChange, onPickMedia }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  /** Replaces the current selection and restores the caret inside the insert. */
  const replaceSelection = useCallback(
    (build: (selected: string) => { text: string; caretOffset?: number }) => {
      const textarea = ref.current
      if (!textarea) return
      const { selectionStart: start, selectionEnd: end } = textarea
      const selected = value.slice(start, end)
      const { text, caretOffset } = build(selected)

      onChange(value.slice(0, start) + text + value.slice(end))
      const caret = start + (caretOffset ?? text.length)
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(caret, caret)
      })
    },
    [value, onChange],
  )

  const wrap = (before: string, after = before) =>
    replaceSelection((selected) => ({
      text: `${before}${selected || 'text'}${after}`,
      caretOffset: selected ? undefined : before.length + 4,
    }))

  const prefixLines = (prefix: string | ((index: number) => string)) =>
    replaceSelection((selected) => ({
      text: (selected || 'List item')
        .split('\n')
        .map((line, index) => `${typeof prefix === 'string' ? prefix : prefix(index)}${line}`)
        .join('\n'),
    }))

  const insert = (snippet: string) => replaceSelection(() => ({ text: snippet }))

  async function insertMedia(kind: 'image' | 'video' | 'file') {
    const snippet = await onPickMedia(kind)
    if (snippet) insert(snippet)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-1 border-b border-[var(--color-hairline)] px-2 py-1.5">
        <ToolbarGroup>
          <ToolButton label="H2" title="Heading 2" onClick={() => prefixLines('## ')} />
          <ToolButton label="H3" title="Heading 3" onClick={() => prefixLines('### ')} />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolButton label="B" title="Bold" bold onClick={() => wrap('**')} />
          <ToolButton label="I" title="Italic" italic onClick={() => wrap('_')} />
          <ToolButton label="Code" title="Inline code" mono onClick={() => wrap('`')} />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolButton label="• List" title="Bulleted list" onClick={() => prefixLines('- ')} />
          <ToolButton label="1. List" title="Numbered list" onClick={() => prefixLines((i) => `${i + 1}. `)} />
          <ToolButton
            label="Quote"
            title="Block quote"
            onClick={() => prefixLines('> ')}
          />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolButton
            label="Link"
            title="Link"
            onClick={() =>
              replaceSelection((selected) => ({
                text: `[${selected || 'link text'}](https://)`,
                caretOffset: (selected || 'link text').length + 3 + 8,
              }))
            }
          />
          <ToolButton label="Table" title="Table" onClick={() => insert(TABLE_SNIPPET)} />
          <ToolButton label="Code block" title="Fenced code block" onClick={() => insert(CODE_SNIPPET)} />
          <ToolButton label="Callout" title="Note callout" onClick={() => insert(CALLOUT_SNIPPET)} />
        </ToolbarGroup>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="secondary" icon="image" onClick={() => void insertMedia('image')} className="h-7">
            Image
          </Button>
          <Button variant="secondary" icon="file" onClick={() => void insertMedia('video')} className="h-7">
            Video
          </Button>
          <Button variant="secondary" icon="upload" onClick={() => void insertMedia('file')} className="h-7">
            Attachment
          </Button>
        </div>
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck
        placeholder={'## Section heading\n\nWrite the page content in Markdown.'}
        className="min-h-0 flex-1 resize-none bg-[var(--color-surface)] px-5 py-4 font-[var(--font-mono)] text-[0.8125rem] leading-[1.7] text-[var(--color-body)] placeholder:text-[var(--color-muted)] focus:outline-none"
      />

      <p className="flex items-center gap-1.5 border-t border-[var(--color-hairline)] px-3 py-1.5 text-micro text-[var(--color-muted)]">
        <Icon name="command" size={12} />
        Markdown. Headings, lists, links, tables, code fences, <code className="font-[var(--font-mono)]">:::note</code>{' '}
        callouts and embedded media are all rendered by the backend.
      </p>
    </div>
  )
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-px border-r border-[var(--color-hairline)] pr-1.5 last:border-r-0">
      {children}
    </div>
  )
}

function ToolButton({
  label,
  title,
  onClick,
  bold,
  italic,
  mono,
}: {
  label: string
  title: string
  onClick: () => void
  bold?: boolean
  italic?: boolean
  mono?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={[
        'rounded px-1.5 py-1 text-micro text-[var(--color-secondary)] transition-colors duration-150',
        'hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-ink)]',
        bold ? 'font-bold' : '',
        italic ? 'italic' : '',
        mono ? 'font-[var(--font-mono)]' : '',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
