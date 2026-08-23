import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { DocHeading } from '@/lib/docs.types'
import { RailContext } from '@/lib/railContext'

/**
 * Supplies the rail context and hands the current headings to its children via
 * a render prop, so the layout can place the rail as a sibling of `<main>`.
 */
export function RailProvider({ children }: { children: (headings: DocHeading[]) => ReactNode }) {
  const [headings, setHeadings] = useState<DocHeading[]>([])
  const value = useMemo(() => ({ headings, setHeadings }), [headings])

  return <RailContext.Provider value={value}>{children(headings)}</RailContext.Provider>
}
