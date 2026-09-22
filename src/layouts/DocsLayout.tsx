/**
 * Three-column documentation shell.
 *
 * Sticky (not fixed) rails pinned below the sticky header, a fluid reading
 * column between them. The article sits on a white surface over the warm
 * off-white page ground, separated by a hairline rather than a shadow.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { DocsHeader } from '@/components/docs/DocsHeader'
import { DocsSidebar } from '@/components/docs/DocsSidebar'
import { DocsFooter } from '@/components/docs/DocsFooter'
import { MobileNavDrawer } from '@/components/docs/MobileNavDrawer'
import { OnThisPage } from '@/components/docs/OnThisPage'
import { RailProvider } from '@/components/docs/RailProvider'
import { PageTransition } from '@/components/motion/PageTransition'
import { SkipLink } from '@/components/primitives/SkipLink'
import { useExpandedFolders } from '@/hooks/useExpandedFolders'
import { normalizePath } from '@/lib/routing'

/** Height of the sticky header; the rails pin directly below it. */
const CHROME_OFFSET = '5.75rem'

export function DocsLayout() {
  const location = useLocation()
  const currentPath = normalizePath(location.pathname)

  const [query, setQuery] = useState('')
  const [navOpen, setNavOpen] = useState(false)
  const desktopSearchRef = useRef<HTMLInputElement>(null)
  const mobileSearchRef = useRef<HTMLInputElement>(null)

  const { isExpanded, toggle, expandAll, collapseAll } = useExpandedFolders(currentPath)

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  // Reset scroll on navigation, but leave hash links alone so deep anchors land.
  useEffect(() => {
    if (location.hash) return
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname, location.hash])

  const focusSearch = useCallback(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      desktopSearchRef.current?.focus()
      desktopSearchRef.current?.select()
    } else {
      setNavOpen(true)
      window.setTimeout(() => mobileSearchRef.current?.focus(), 80)
    }
  }, [])

  // ⌘K / Ctrl+K, and `/`, focus the filter from anywhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCommandK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)
      const isSlash = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey
      if (!isCommandK && !isSlash) return

      const target = event.target as HTMLElement | null
      if (isSlash && target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (isSlash && target?.isContentEditable) return

      event.preventDefault()
      focusSearch()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [focusSearch])

  const sidebarProps = {
    currentPath,
    query,
    onQueryChange: setQuery,
    isExpanded,
    onToggle: toggle,
    onExpandAll: expandAll,
    onCollapseAll: collapseAll,
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />

      <div className="sticky top-0 z-40">
        <DocsHeader onOpenNav={() => setNavOpen(true)} onOpenSearch={focusSearch} />
      </div>

      <RailProvider>
        {(headings) => (
          <div className="mx-auto flex w-full max-w-[1680px] flex-1 px-0 sm:px-6 lg:px-8">
            {/* ------------------------------------------------- left rail */}
            {/* DocsSidebar renders the <nav> landmark itself. */}
            <div
              className="sticky hidden shrink-0 self-start lg:block"
              style={{
                top: CHROME_OFFSET,
                width: 'var(--spacing-sidebar)',
                height: `calc(100vh - ${CHROME_OFFSET})`,
              }}
            >
              <div className="flex h-full flex-col py-8 pr-8">
                <DocsSidebar {...sidebarProps} searchRef={desktopSearchRef} />
              </div>
            </div>

            {/* -------------------------------------------- reading column */}
            <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
              {/* Padding steps up only once the column is wide enough to give
                  it away — below xl the sidebar already takes its share. */}
              <div className="min-h-[calc(100vh-5.75rem)] border-x border-[var(--color-hairline)] bg-[var(--color-surface)] px-5 py-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
                <PageTransition routeKey={currentPath}>
                  <Outlet />
                </PageTransition>
              </div>
            </main>

            {/* ------------------------------------------------ right rail */}
            {/* Omitted entirely when there is too little to navigate, so the
                reading column reclaims the width instead of sitting beside an
                empty column.

                From 2xl rather than xl: a third column at 1280 left the reading
                measure around 470px, well under the 700–800px this portal reads
                at. Below 2xl the same list renders inside the article (see
                DocsArticle), so nothing is lost — it just moves. */}
            {headings.length >= 2 && (
              <aside
                aria-label="On this page"
                className="sticky hidden shrink-0 self-start 2xl:block"
                style={{
                  top: CHROME_OFFSET,
                  width: 'var(--spacing-rail)',
                  maxHeight: `calc(100vh - ${CHROME_OFFSET})`,
                }}
              >
                <div className="rail-scroll max-h-full overflow-y-auto py-10 pl-10 pr-2">
                  <OnThisPage headings={headings} />
                </div>
              </aside>
            )}
          </div>
        )}
      </RailProvider>

      <DocsFooter />

      <MobileNavDrawer
        open={navOpen}
        onClose={() => setNavOpen(false)}
        searchRef={mobileSearchRef}
        {...sidebarProps}
      />
    </div>
  )
}
