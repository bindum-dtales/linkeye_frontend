/**
 * The Documentation Home document — the one page that is a layout, not an article.
 *
 * `/docs` renders a fixed masthead and a section list rather than a body of
 * prose, so its editable text does not fit the shape of a normal page. It is
 * still stored as one, though: a root-level PAGE in the CMS with the reserved
 * slug below, using the columns the draft/publish workflow already understands.
 *
 *   title        -> the display heading ("LinkEye Docs")
 *   description  -> the intro paragraph under it
 *   content      -> optional prose rendered between the intro and the sections
 *   metadata     -> the two small labels, which have no column of their own
 *
 * The section list is deliberately absent from all of that: it is derived from
 * the live folder tree every render, so creating, renaming, reordering or
 * deleting a top-level folder shows up on the home page with nothing to edit
 * here and no second copy to keep in step.
 *
 * Both the portal and the CMS import this module, so the slug, the metadata
 * keys and the fallback text are defined once.
 */
import { siteConfig } from '@/config/siteConfig'

/**
 * Reserved slug of the home document. It lives at the root of the tree next to
 * the section folders, which puts it at `/docs/documentation-home` — a real,
 * publishable CMS path that the portal never links to, because the content is
 * rendered at `/docs` instead. `src/lib/docs.ts` drops it from the public
 * sidebar, search corpus and prev/next spine for that reason.
 */
export const HOME_SLUG = 'documentation-home'

/** Where the CMS stores the home document. */
export const HOME_PATH = `/docs/${HOME_SLUG}`

/** Keys inside the node's `metadata` object. */
export const HOME_META = {
  eyebrow: 'homeEyebrow',
  sectionsHeading: 'homeSectionsHeading',
} as const

/** The home page's editable text, with every field resolved to a real string. */
export interface HomeDoc {
  /** Small caps label above the heading. */
  eyebrow: string
  /** Display heading. */
  title: string
  /** Intro paragraph under the heading. */
  intro: string
  /** Heading over the section list. */
  sectionsHeading: string
  /** Optional prose between the intro and the section list; usually empty. */
  bodyHtml: string
}

/**
 * The text the page shows when the CMS has no home document yet, or cannot be
 * reached. These are the exact strings the page was hardcoded with, so an
 * unconfigured or offline portal renders precisely what it rendered before.
 */
export const homeDefaults = (): HomeDoc => ({
  eyebrow: siteConfig.documentationTitle,
  title: `${siteConfig.productName} ${siteConfig.wordmarkSuffix}`,
  intro: siteConfig.tagline,
  sectionsHeading: 'Documentation sections',
  bodyHtml: '',
})

/** A string from an untyped metadata bag, or undefined when absent or blank. */
const label = (metadata: unknown, key: string): string | undefined => {
  if (!metadata || typeof metadata !== 'object') return undefined
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value : undefined
}

/** The fields of a CMS node this page reads. Both API clients satisfy it. */
export interface HomeNodeLike {
  title?: string
  description?: string
  html?: string
  metadata?: unknown
}

/**
 * Maps a CMS node onto the page's text, falling back field by field.
 *
 * Per field rather than all-or-nothing: an editor who fills in the heading but
 * leaves the eyebrow blank gets the default eyebrow, not an empty line where
 * the label used to be.
 */
export function homeDocFrom(node: HomeNodeLike | null | undefined): HomeDoc {
  const fallback = homeDefaults()
  if (!node) return fallback
  return {
    eyebrow: label(node.metadata, HOME_META.eyebrow) ?? fallback.eyebrow,
    title: node.title?.trim() || fallback.title,
    intro: node.description?.trim() || fallback.intro,
    sectionsHeading: label(node.metadata, HOME_META.sectionsHeading) ?? fallback.sectionsHeading,
    bodyHtml: node.html ?? '',
  }
}
