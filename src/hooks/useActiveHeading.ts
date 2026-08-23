/**
 * Scroll-spy for the "On This Page" rail.
 *
 * Computes the active heading from element positions on scroll, throttled to
 * one measurement per animation frame.
 *
 * This is deliberately not IntersectionObserver-based. An observer only reports
 * when a heading crosses the band, so scrolling through a section taller than
 * the band produces no callback and the rail goes stale — exactly the case a
 * long troubleshooting page hits. Measuring directly is a handful of
 * `getBoundingClientRect` calls per frame for a few dozen headings, which is
 * cheap and always correct.
 *
 * Article bodies are code-split, so the headings are often absent when this
 * first runs; a MutationObserver picks them up as soon as they land.
 */
import { useEffect, useState } from 'react'
import type { DocHeading } from '@/lib/docs.types'

/** A heading becomes current once its top passes below the sticky chrome. */
const ACTIVATION_OFFSET = 140

export function useActiveHeading(headings: DocHeading[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)

  useEffect(() => {
    if (headings.length === 0) {
      setActiveId(null)
      return
    }

    let frame = 0
    let elements: HTMLElement[] = []

    const collect = () => {
      elements = headings
        .map((h) => document.getElementById(h.id))
        .filter((el): el is HTMLElement => el !== null)
      return elements.length > 0
    }

    const measure = () => {
      frame = 0
      if (elements.length === 0 && !collect()) return

      // The active heading is the last one scrolled past the activation line.
      let current = elements[0]
      for (const el of elements) {
        if (el.getBoundingClientRect().top <= ACTIVATION_OFFSET) current = el
        else break
      }

      // At the very bottom of the page, favour the final heading — otherwise
      // a short trailing section can never become active.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom) current = elements[elements.length - 1]

      setActiveId(current.id)
    }

    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }

    collect()
    measure()

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    // Re-measure once the code-split article body lands in the DOM.
    const mutation = new MutationObserver(() => {
      if (collect()) schedule()
    })
    mutation.observe(document.body, { childList: true, subtree: true })

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      mutation.disconnect()
    }
  }, [headings])

  return activeId
}
