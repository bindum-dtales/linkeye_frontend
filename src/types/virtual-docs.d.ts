declare module 'virtual:docs-index' {
  import type { DocIndex } from '@/lib/docs.types'

  export const docIndex: DocIndex

  /**
   * Per-page article HTML, code-split into its own chunk and fetched on
   * navigation. Keeps the initial payload to navigation metadata only.
   */
  export const contentLoaders: Record<string, () => Promise<{ html: string }>>
}
