/**
 * Lets the active route publish its headings to the layout's right rail.
 *
 * The rail is owned by `DocsLayout` (it must be a sibling of `<main>` for the
 * sticky three-column geometry to work), but only the route knows the page's
 * headings. A tiny context bridges the two without prop-drilling through Outlet.
 */
import { createContext, useContext } from 'react'
import type { DocHeading } from './docs.types'

export interface RailValue {
  headings: DocHeading[]
  setHeadings: (headings: DocHeading[]) => void
}

export const RailContext = createContext<RailValue | null>(null)

export function useRail(): RailValue {
  const value = useContext(RailContext)
  if (!value) throw new Error('useRail must be used within a RailProvider')
  return value
}
