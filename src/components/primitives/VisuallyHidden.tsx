import type { ReactNode } from 'react'

/** Visible to assistive technology, removed from the visual layout. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>
}
