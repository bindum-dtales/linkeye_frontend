/**
 * Documentation filter.
 *
 * Compact control with a ⌘K hint. Filters the tree in place rather than
 * producing a flat result list, so folder context and indentation survive.
 * Escape clears; ⌘K / `/` from anywhere focuses.
 */
import { forwardRef, useState } from 'react'
import { Icon } from '@/components/primitives/Icon'

interface DocsSearchProps {
  value: string
  onChange: (value: string) => void
  matchCount: number
  resultsId: string
}

export const DocsSearch = forwardRef<HTMLInputElement, DocsSearchProps>(
  function DocsSearch({ value, onChange, matchCount, resultsId }, ref) {
    const [focused, setFocused] = useState(false)
    const filtering = value.trim().length > 0

    return (
      <div>
        <div
          className={[
            'relative flex items-center rounded-md border bg-[var(--color-surface)] transition-colors duration-150',
            focused ? 'border-[var(--color-ink)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
          ].join(' ')}
        >
          {/* Accent hairline on focus — a tick, not a glow. */}
          <span
            aria-hidden="true"
            className={[
              'absolute inset-x-2 -bottom-px h-[2px] origin-left bg-[var(--color-accent)] transition-transform duration-150 ease-[var(--ease-out-soft)] motion-reduce:transition-none',
              focused ? 'scale-x-100' : 'scale-x-0',
            ].join(' ')}
          />

          <Icon
            name="search"
            size={14}
            className="pointer-events-none ml-2.5 shrink-0 text-[var(--color-muted)]"
          />

          <input
            id="docs-filter"
            ref={ref}
            type="search"
            role="searchbox"
            value={value}
            autoComplete="off"
            spellCheck={false}
            placeholder="Search documentation"
            aria-label="Search documentation"
            aria-describedby={`${resultsId}-status`}
            aria-controls={resultsId}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                onChange('')
                event.currentTarget.blur()
              }
            }}
            className="min-w-0 flex-1 bg-transparent px-2 py-[0.4375rem] text-[var(--text-nav)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />

          {filtering ? (
            <button
              type="button"
              onClick={() => onChange('')}
              className="mr-1.5 flex size-5 shrink-0 items-center justify-center rounded text-[var(--color-muted)] transition-colors duration-150 hover:text-[var(--color-ink)]"
              aria-label="Clear filter"
            >
              <Icon name="close" size={12} />
            </button>
          ) : (
            <kbd className="mr-2 hidden shrink-0 items-center gap-0.5 font-sans text-[0.625rem] font-medium text-[var(--color-muted)] lg:flex">
              <span className="text-[0.6875rem] leading-none">⌘</span>K
            </kbd>
          )}
        </div>

        <p
          id={`${resultsId}-status`}
          aria-live="polite"
          className={
            filtering
              ? 'mt-2 text-[0.6875rem] tracking-[0.01em] text-[var(--color-muted)]'
              : 'sr-only'
          }
        >
          {filtering
            ? `${matchCount} ${matchCount === 1 ? 'page matches' : 'pages match'} “${value.trim()}”`
            : 'No filter applied'}
        </p>
      </div>
    )
  },
)
