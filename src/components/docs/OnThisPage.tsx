/**
 * "On This Page" rail.
 *
 * A quiet editorial index: no box, no card, one hairline spine with a short
 * accent indicator that slides to the active heading. The active item also
 * shifts to ink and medium weight, so the indicator is reinforcement rather
 * than the sole signal.
 */
import { useEffect, useRef, useState } from 'react'
import type { DocHeading } from '@/lib/docs.types'
import { useActiveHeading } from '@/hooks/useActiveHeading'
import { Icon } from '@/components/primitives/Icon'

interface OnThisPageProps {
  headings: DocHeading[]
  /** Renders as a collapsible block rather than a rail (mobile placement). */
  collapsible?: boolean
}

export function OnThisPage({ headings, collapsible = false }: OnThisPageProps) {
  const activeId = useActiveHeading(headings)
  const listRef = useRef<HTMLUListElement>(null)
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null)
  const [open, setOpen] = useState(!collapsible)

  useEffect(() => {
    if (!activeId || !listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-heading="${CSS.escape(activeId)}"]`,
    )
    if (!el) {
      setIndicator(null)
      return
    }
    setIndicator({ top: el.offsetTop, height: el.offsetHeight })
  }, [activeId, headings, open])

  if (headings.length < 2) return null

  const label = (
    <span className="eyebrow text-[var(--color-muted)]">On this page</span>
  )

  const list = (
    <div className="relative mt-3.5">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-px bg-[var(--color-hairline)]"
      />
      {indicator && (
        <span
          aria-hidden="true"
          className="absolute left-0 w-[2px] bg-[var(--color-accent)] transition-[top,height] duration-[220ms] ease-[var(--ease-out-soft)] motion-reduce:transition-none"
          style={{ top: indicator.top, height: indicator.height }}
        />
      )}
      <ul ref={listRef}>
        {headings.map((h) => {
          const active = h.id === activeId
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                data-heading={h.id}
                aria-current={active ? 'true' : undefined}
                style={{ paddingLeft: `${14 + (h.depth - 2) * 12}px` }}
                className={[
                  'block py-[0.3125rem] pr-1 text-[var(--text-micro)] leading-[1.5] transition-colors duration-150',
                  active
                    ? 'font-medium text-[var(--color-ink)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]',
                ].join(' ')}
              >
                {h.text}
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )

  if (!collapsible) {
    return (
      <div>
        {label}
        {list}
      </div>
    )
  }

  return (
    <div className="border-y border-[var(--color-hairline)] py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="otp-mobile-panel"
        className="flex w-full items-center justify-between gap-2"
      >
        {label}
        <Icon
          name="chevron-down"
          size={14}
          className={[
            'text-[var(--color-muted)] transition-transform duration-[200ms] ease-[var(--ease-out-soft)] motion-reduce:transition-none',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>
      <div
        id="otp-mobile-panel"
        className={[
          'grid transition-[grid-template-rows] duration-[200ms] ease-[var(--ease-out-soft)] motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="overflow-hidden">{list}</div>
      </div>
    </div>
  )
}
