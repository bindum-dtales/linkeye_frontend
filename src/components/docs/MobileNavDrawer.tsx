/**
 * Mobile navigation drawer.
 *
 * Hand-built: focus trap, Escape to close, scroll lock, backdrop and focus
 * restoration are all native APIs, none of which justify a dependency.
 */
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { Icon } from '@/components/primitives/Icon'
import { Wordmark } from '@/components/primitives/Wordmark'
import { DocsSidebar } from './DocsSidebar'

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
  currentPath: string
  query: string
  onQueryChange: (value: string) => void
  isExpanded: (path: string) => boolean
  onToggle: (path: string) => void
  onExpandAll: () => void
  onCollapseAll: () => void
  searchRef?: RefObject<HTMLInputElement | null>
}

export function MobileNavDrawer({ open, onClose, searchRef, ...sidebarProps }: MobileNavDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open, onClose)

  // Close if the viewport grows past the breakpoint while the drawer is open.
  useEffect(() => {
    if (!open) return
    const list = window.matchMedia('(min-width: 1024px)')
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) onClose()
    }
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation"
        tabIndex={-1}
        className="absolute inset-0 bg-[#111111]/25 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Documentation navigation"
        className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col border-r border-[var(--color-border)] bg-[var(--color-page)]"
      >
        <div className="flex h-[3.25rem] shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
          <Wordmark />
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 flex size-8 items-center justify-center rounded-md text-[var(--color-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-ink)]"
            aria-label="Close navigation"
          >
            <Icon name="close" size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-4 py-5">
          <DocsSidebar {...sidebarProps} searchRef={searchRef} onNavigate={onClose} />
        </div>
      </div>
    </div>
  )
}
