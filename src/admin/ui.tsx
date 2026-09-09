/**
 * Admin UI primitives.
 *
 * Deliberately one small file: the dashboard needs a button, a few inputs, a
 * dialog and two status affordances, all built from the portal's existing
 * token layer (`src/styles/tokens.css`) so the CMS reads as the same product.
 */
import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Icon, type IconName } from '@/components/primitives/Icon'

/* ----------------------------------------------------------------- button */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--color-ink)] text-white border-[var(--color-ink)] hover:bg-[#000] disabled:bg-[var(--color-border-strong)] disabled:border-[var(--color-border-strong)]',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]',
  ghost:
    'bg-transparent text-[var(--color-secondary)] border-transparent hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-ink)]',
  danger:
    'bg-[var(--color-surface)] text-[#a11b1b] border-[var(--color-border)] hover:border-[#a11b1b] hover:bg-[#fdf3f3]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: IconName
  /** Renders a compact square button; pair with `title` for the label. */
  iconOnly?: boolean
}

export function Button({
  variant = 'secondary',
  icon,
  iconOnly = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={[
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border text-ui font-medium',
        'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55',
        iconOnly ? 'size-8' : 'h-8 px-2.5',
        VARIANTS[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  )
}

/* ------------------------------------------------------------ form fields */

const CONTROL =
  'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 ' +
  'text-ui text-[var(--color-ink)] placeholder:text-[var(--color-muted)] ' +
  'transition-colors duration-150 hover:border-[var(--color-border-strong)] focus:border-[var(--color-ink)] focus:outline-none'

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="eyebrow text-[var(--color-muted)]">
        {label}
      </label>
      {children}
      {hint && <p className="text-micro text-[var(--color-muted)]">{hint}</p>}
    </div>
  )
}

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${CONTROL} ${className}`} {...rest} />
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${CONTROL} ${className}`} {...rest} />
}

export function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${CONTROL} ${className}`} {...rest} />
}

/* ---------------------------------------------------------------- status */

/**
 * Publication state of a node, in the three forms it can take:
 *
 *   Draft               — never published; invisible to readers.
 *   Published           — live, and the editor matches what readers see.
 *   Unpublished changes — live, but edits are saved and waiting behind it.
 */
export function StatusPill({
  status,
  hasDraft = false,
}: {
  status: 'DRAFT' | 'PUBLISHED'
  hasDraft?: boolean
}) {
  const published = status === 'PUBLISHED'
  const pending = published && hasDraft
  return (
    <span
      className={[
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-px text-eyebrow font-medium uppercase tracking-[0.06em]',
        published && !pending
          ? 'border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-ink)]'
          : 'border-[rgba(17,17,17,0.15)] bg-[var(--color-accent-wash)] text-[var(--color-body)]',
      ].join(' ')}
    >
      {/* The dot is redundant with the label on purpose — the accent alone is never the signal. */}
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${published && !pending ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-accent)]'}`}
      />
      {pending ? 'Unpublished changes' : published ? 'Published' : 'Draft'}
    </span>
  )
}

/** Inline error/success banner. `onDismiss` renders a close affordance. */
export function Banner({
  tone = 'error',
  children,
  onDismiss,
}: {
  tone?: 'error' | 'success' | 'info'
  children: ReactNode
  onDismiss?: () => void
}) {
  const tones = {
    error: 'border-[#e6bcbc] bg-[#fdf3f3] text-[#8c1919]',
    success: 'border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-ink)]',
    info: 'border-[rgba(17,17,17,0.15)] bg-[var(--color-accent-wash)] text-[var(--color-body)]',
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-md border px-3 py-2 text-ui ${tones[tone]}`}>
      <span className="min-w-0 flex-1">{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-mr-1 shrink-0 opacity-70 hover:opacity-100">
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <Icon name={icon} size={22} className="text-[var(--color-border-strong)]" />
      <p className="text-ui font-medium text-[var(--color-ink)]">{title}</p>
      {children && <p className="max-w-sm text-ui text-[var(--color-muted)]">{children}</p>}
    </div>
  )
}

/* ---------------------------------------------------------------- dialog */

/**
 * Modal built on `<dialog>` — the platform already provides the focus trap,
 * the backdrop and Escape-to-close, so none of that is reimplemented here.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Wide enough for the media grid and the page preview. */
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      className={[
        wide ? 'w-[min(64rem,calc(100vw-2rem))]' : 'w-[min(34rem,calc(100vw-2rem))]',
        'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0',
        'text-[var(--color-body)] shadow-[0_24px_60px_-20px_rgba(17,17,17,0.35)]',
        'backdrop:bg-[rgba(17,17,17,0.3)] backdrop:backdrop-blur-[2px]',
      ].join(' ')}
    >
      {open && (
        <form method="dialog" onSubmit={(event) => event.preventDefault()}>
          <header className="flex items-center justify-between border-b border-[var(--color-hairline)] px-4 py-3">
            <h2 className="text-ui font-semibold text-[var(--color-ink)]">{title}</h2>
            <Button variant="ghost" iconOnly icon="close" onClick={onClose} title="Close" aria-label="Close" />
          </header>
          <div className="flex flex-col gap-4 px-4 py-4">{children}</div>
          {footer && (
            <footer className="flex justify-end gap-2 border-t border-[var(--color-hairline)] px-4 py-3">{footer}</footer>
          )}
        </form>
      )}
    </dialog>
  )
}
