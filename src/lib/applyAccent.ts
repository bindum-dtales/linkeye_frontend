/**
 * Mirrors the configured accent colour into the CSS token layer, so
 * `siteConfig` stays the single source of truth for brand colour without
 * needing a stylesheet rebuild.
 */
import { siteConfig } from '@/config/siteConfig'

export function applyAccent(): void {
  const root = document.documentElement
  root.style.setProperty('--color-accent', siteConfig.accentColor)
  root.style.setProperty('--color-accent-soft', siteConfig.accentColorSoft)
}
