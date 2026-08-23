import { useEffect } from 'react'
import { siteConfig } from '@/config/siteConfig'

/** Keeps `document.title` in step with the active route. */
export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    const suffix = `${siteConfig.productName} ${siteConfig.wordmarkSuffix}`
    document.title = title ? `${title} · ${suffix}` : suffix
  }, [title])
}
