/**
 * Inline SVG icon set.
 *
 * The portal needs about a dozen glyphs. A package would ship a registry, a
 * build step and a runtime for that — inline paths cost nothing and stay
 * colour-token aware via `currentColor`.
 */
import type { SVGProps } from 'react'

export type IconName =
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-left'
  | 'arrow-left'
  | 'arrow-right'
  | 'search'
  | 'close'
  | 'menu'
  | 'filter'
  | 'calendar'
  | 'copy'
  | 'check'
  | 'external'
  | 'book'
  | 'file'
  | 'expand'
  | 'collapse'
  | 'home'
  | 'folder'
  | 'folder-open'
  | 'command'
  | 'arrow-up-right'
  | 'chevron-up'
  | 'trash'
  | 'pencil'
  | 'image'
  | 'upload'
  | 'eye'
  | 'refresh'
  | 'logout'

const PATHS: Record<IconName, React.ReactNode> = {
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'arrow-left': <path d="M19 12H5m7-7-7 7 7 7" />,
  'arrow-right': <path d="M5 12h14m-7-7 7 7-7 7" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </>
  ),
  check: <path d="m4 12 5 5L20 6" />,
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
    </>
  ),
  book: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" />
      <path d="M4 19a2 2 0 0 0 2 2h13" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5" />
    </>
  ),
  expand: <path d="M12 5v14M5 12h14" />,
  collapse: <path d="M5 12h14" />,
  home: <path d="m3 11 9-8 9 8M6 10v10h12V10" />,
  /* Minimal line folder — reads at 13px without turning into a filled square. */
  folder: <path d="M3 7a1 1 0 0 1 1-1h4.6a1 1 0 0 1 .8.4L10.8 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" />,
  'folder-open': (
    <>
      <path d="M3 7a1 1 0 0 1 1-1h4.6a1 1 0 0 1 .8.4L10.8 8H19a1 1 0 0 1 1 1v1" />
      <path d="M3 19V7m0 12h15.2a1 1 0 0 0 .96-.72l1.7-6A1 1 0 0 0 19.9 11H7.5a1 1 0 0 0-.96.72l-1.7 6A1 1 0 0 1 3.88 19H3z" />
    </>
  ),
  command: <path d="M15 6a3 3 0 1 1 3 3h-3V6zM9 6a3 3 0 1 0-3 3h3V6zM15 18a3 3 0 1 0 3-3h-3v3zM9 18a3 3 0 1 1-3-3h3v3zM9 9h6v6H9z" />,
  'arrow-up-right': <path d="M7 17 17 7M9 7h8v8" />,

  /* -- admin dashboard ---------------------------------------------------- */
  'chevron-up': <path d="m6 15 6-6 6 6" />,
  trash: (
    <>
      <path d="M4 7h16M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
      <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M10 11v6M14 11v6" />
    </>
  ),
  pencil: <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3zM14.5 6.5l3 3" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 5-5 4 4 3-2 4 4" />
    </>
  ),
  upload: <path d="M12 16V4m-5 5 5-5 5 5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />,
  eye: (
    <>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  refresh: <path d="M20 11a8 8 0 1 0-.7 4M20 5v6h-6" />,
  logout: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10" />,
}

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  /** Rendered size in pixels. */
  size?: number
}

export function Icon({ name, size = 16, className, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
