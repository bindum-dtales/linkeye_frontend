import { Icon } from '@/components/primitives/Icon'

interface PageMetaProps {
  lastUpdated?: string
  version?: string
}

/** A single quiet metadata line beneath the article title. */
export function PageMeta({ lastUpdated, version }: PageMetaProps) {
  if (!lastUpdated && !version) return null

  const formatted = lastUpdated
    ? new Date(`${lastUpdated}T00:00:00Z`).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[var(--text-micro)] text-[var(--color-muted)]">
      {formatted && (
        <span className="flex items-center gap-1.5">
          <Icon name="calendar" size={12} />
          Updated {formatted}
        </span>
      )}
      {version && (
        <span className="font-mono text-[0.6875rem] tracking-tight">Version {version}</span>
      )}
    </div>
  )
}
