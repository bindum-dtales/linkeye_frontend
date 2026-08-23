/**
 * Build-time documentation compiler.
 *
 * Scans the authored documentation source (`linkeye-docs/docs/**\/*.md`),
 * compiles each file to sanitized HTML with syntax highlighting and stable
 * heading anchors, assembles the folder tree, rewrites relative `.md` links into
 * routes, wires the prev/next spine across folder boundaries, and emits
 * everything as the virtual module `virtual:docs-index`.
 *
 * The source is plain GitBook-style Markdown: a `README.md` is a section index,
 * numeric filename prefixes carry ordering, and the first `# Heading` of a file
 * is its title. None of that leaks past this file.
 *
 * Doing this at build time rather than in the browser means the client bundle
 * contains no markdown parser, no YAML parser, no sanitizer and no syntax
 * highlighter — only plain HTML strings. It also lets us fail the build on a
 * broken internal link.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import MarkdownIt from 'markdown-it'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'
import anchor from 'markdown-it-anchor'
import yaml from 'js-yaml'
import sanitizeHtml from 'sanitize-html'
import { createHighlighter, type Highlighter } from 'shiki'

const VIRTUAL_ID = 'virtual:docs-index'
const RESOLVED_ID = '\0' + VIRTUAL_ID

/**
 * Each page's compiled HTML is emitted as its own virtual module so Rollup can
 * split it into a separate chunk. The index module holds only metadata, keeping
 * the initial payload small; article bodies are fetched on navigation.
 */
const CONTENT_PREFIX = 'virtual:docs-content:'
const RESOLVED_CONTENT_PREFIX = '\0' + CONTENT_PREFIX

const CONTENT_DIR = path.resolve(process.cwd(), 'linkeye-docs/docs')
const NAV_CONFIG = path.resolve(process.cwd(), 'src/content/nav.config.ts')

/** A folder's index page, GitBook-style. */
const INDEX_FILE = 'README.md'

/**
 * Files at the source root that describe the collection rather than a page: the
 * documentation home covers both, so they are not routed. They are still mapped
 * to `/docs` so links pointing at them resolve.
 */
const ROOT_META_FILES = ['README.md', 'SUMMARY.md']

/** Longest first paragraph still promoted to a page lede. */
const LEDE_MAX_LENGTH = 260

const HIGHLIGHT_LANGS = [
  'bash', 'shell', 'json', 'yaml', 'typescript', 'javascript', 'tsx', 'jsx',
  'python', 'sql', 'http', 'ini', 'diff', 'text', 'html', 'css', 'toml',
]

/* ------------------------------------------------------------------ types */

interface Heading { id: string; text: string; depth: 2 | 3 | 4 }
interface Crumb { label: string; href?: string }
interface NavRef { title: string; path: string; folderTitle: string }

interface Frontmatter {
  title?: string
  description?: string
  order?: number
  lastUpdated?: string
  version?: string
  keywords?: string[]
}

interface PageNode {
  kind: 'page'
  slug: string
  path: string
  title: string
  description?: string
  breadcrumb: Crumb[]
  html: string
  headings: Heading[]
  order: number
  lastUpdated?: string
  version?: string
  keywords: string[]
  prev?: NavRef
  next?: NavRef
}

interface FolderNode {
  kind: 'folder'
  id: string
  title: string
  path: string
  description?: string
  breadcrumb: Crumb[]
  order: number
  /** True when the folder has a `README.md` body to render above its child list. */
  hasIndex: boolean
  headings: Heading[]
  children: Node[]
  /** Build-only: moved into its own chunk before the index is emitted. */
  indexHtml?: string
}

type Node = FolderNode | PageNode

/* -------------------------------------------------------------- utilities */

/**
 * `03-getting-started` -> `{ order: 3, slug: 'getting-started' }`.
 *
 * Applies to directories and files alike, so a numbered subfolder sorts among
 * its numbered sibling pages and neither carries its prefix into the URL.
 */
function parseSegment(base: string): { order: number; slug: string } {
  const m = /^(\d+)[-_](.+)$/.exec(base)
  if (m) return { order: Number(m[1]), slug: m[2] }
  return { order: 999, slug: base }
}

function parseFileName(name: string): { order: number; slug: string } {
  return parseSegment(name.replace(/\.md$/, ''))
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Normalises a frontmatter date to `YYYY-MM-DD`.
 *
 * YAML parses an unquoted `2026-08-12` into a `Date`, which `JSON.stringify`
 * then turns into a full ISO timestamp. Collapsing both forms to a plain date
 * string keeps the client's formatting simple and timezone-free.
 */
function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  }
  return undefined
}

/** Splits `---\nyaml\n---\nbody` into its two halves. */
function splitFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw)
  if (!m) return { data: {}, body: raw }
  const parsed = (yaml.load(m[1]) ?? {}) as Record<string, unknown>
  const data: Frontmatter = {
    ...(parsed as Frontmatter),
    lastUpdated: normalizeDate(parsed.lastUpdated),
    version: parsed.version === undefined ? undefined : String(parsed.version),
  }
  return { data, body: m[2] }
}

/**
 * Peels the authored `# Title` and its opening paragraph off a document.
 *
 * The shell renders the title and lede itself, so leaving them in the body
 * would print both twice. The paragraph is only promoted when it reads as a
 * standalone lede: a list, table row, quote or a sentence ending in a colon
 * introduces the block beneath it and has to stay where the author put it.
 */
function splitLede(raw: string): { title?: string; description?: string; body: string } {
  let lines = raw.split(/\r?\n/)
  const dropBlank = (): void => {
    while (lines.length && !lines[0].trim()) lines.shift()
  }

  dropBlank()
  let title: string | undefined
  const h1 = lines.length ? /^#\s+(.+?)\s*$/.exec(lines[0]) : null
  if (h1) {
    title = h1[1].trim()
    lines.shift()
  }

  dropBlank()
  let description: string | undefined
  const paragraph: string[] = []
  let end = 0
  while (end < lines.length && lines[end].trim()) {
    paragraph.push(lines[end].trim())
    end += 1
  }

  if (paragraph.length && !/^([-*+>|#]|\d+[.)]\s)/.test(paragraph[0])) {
    const text = paragraph.join(' ')
    const carriesMarkup = /[[\]`|]/.test(text)
    if (!carriesMarkup && !text.endsWith(':') && text.length <= LEDE_MAX_LENGTH) {
      description = text
      lines = lines.slice(end)
    }
  }

  return { title, description, body: lines.join('\n').trim() }
}

/**
 * Removes a hand-written "In this chapter/part/section" list from a folder
 * index. The folder page renders its children from the tree, so the authored
 * copy would be a second, drift-prone version of the same list.
 */
function stripContentsSection(body: string): string {
  const out: string[] = []
  let skipping = false
  for (const line of body.split('\n')) {
    if (/^##\s+/.test(line)) {
      skipping = /^##\s+In this (chapter|part|section)\b/i.test(line)
    }
    if (!skipping) out.push(line)
  }
  return out.join('\n').trim()
}

/** Reads the display labels/order/descriptions out of `nav.config.ts` by regex. */
function readNavConfig(): {
  labels: Record<string, string>
  order: string[]
  descriptions: Record<string, string>
} {
  const src = fs.readFileSync(NAV_CONFIG, 'utf8')

  const record = (name: string): Record<string, string> => {
    const block = new RegExp(`${name}[^=]*=\\s*{([\\s\\S]*?)\\n}`).exec(src)
    const out: Record<string, string> = {}
    if (!block) return out
    for (const line of block[1].split('\n')) {
      const m = /['"]([^'"]+)['"]\s*:\s*['"]([\s\S]*?)['"]\s*,?\s*$/.exec(line.trim())
      if (m) out[m[1]] = m[2]
    }
    return out
  }

  const orderBlock = /folderOrder[^=]*=\s*\[([\s\S]*?)\]/.exec(src)
  const order = orderBlock
    ? [...orderBlock[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])
    : []

  return { labels: record('folderLabels'), order, descriptions: record('folderDescriptions') }
}

/* ------------------------------------------------- markdown configuration */

/**
 * `:::note Title` ... `:::` callout containers.
 *
 * Implemented inline rather than pulling in markdown-it-container: it is a
 * ~40-line block rule and the dependency would only ever be used for this.
 */
function calloutPlugin(md: MarkdownIt): void {
  const VARIANTS = new Set(['note', 'tip', 'warning', 'caution', 'important'])

  md.block.ruler.before('fence', 'callout', (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    const line = state.src.slice(start, max)

    const open = /^:::\s*([a-z]+)\s*(.*)$/.exec(line)
    if (!open || !VARIANTS.has(open[1])) return false
    if (silent) return true

    let nextLine = startLine
    let found = false
    while (nextLine < endLine) {
      nextLine += 1
      if (nextLine >= endLine) break
      const s = state.bMarks[nextLine] + state.tShift[nextLine]
      const e = state.eMarks[nextLine]
      if (state.src.slice(s, e).trim() === ':::') {
        found = true
        break
      }
    }

    const variant = open[1]
    const title = open[2].trim()

    const tokenOpen = state.push('callout_open', 'div', 1)
    tokenOpen.info = variant
    tokenOpen.meta = { variant, title }
    tokenOpen.map = [startLine, nextLine]

    const oldParent = state.parentType
    const oldLineMax = state.lineMax
    state.lineMax = nextLine
    state.md.block.tokenize(state, startLine + 1, nextLine)
    state.lineMax = oldLineMax
    state.parentType = oldParent

    state.push('callout_close', 'div', -1)
    state.line = found ? nextLine + 1 : nextLine
    return true
  })

  md.renderer.rules.callout_open = (tokens, idx) => {
    const { variant, title } = tokens[idx].meta as { variant: string; title: string }
    const label = title || variant.charAt(0).toUpperCase() + variant.slice(1)
    // Rule + label only; the visual treatment is entirely in CSS.
    return (
      `<div class="doc-callout" data-variant="${md.utils.escapeHtml(variant)}">` +
      `<p class="doc-callout__title">${md.utils.escapeHtml(label)}</p>` +
      `<div class="doc-callout__body">`
    )
  }
  md.renderer.rules.callout_close = () => '</div></div>\n'
}

function createMarkdown(highlighter: Highlighter): MarkdownIt {
  const md: MarkdownIt = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false,
  })

  // Assigned after construction so the closure can reference `md` for escaping.
  md.options.highlight = (code: string, lang: string): string => {
    const language = HIGHLIGHT_LANGS.includes(lang) ? lang : 'text'
    const html = highlighter.codeToHtml(code, { lang: language, theme: 'github-light' })
    const label = md.utils.escapeHtml(lang || 'text')
    // Wrapper carries the language label and gives the copy button a mount point.
    return (
      `<div class="doc-code" data-language="${label}">` +
      `<div class="doc-code__header"><span class="doc-code__lang">${label}</span></div>` +
      `<div class="doc-code__body">${html}</div>` +
      `</div>`
    )
  }

  md.use(calloutPlugin)
  md.use(anchor, {
    level: [2, 3, 4],
    slugify,
    permalink: anchor.permalink.linkInsideHeader({
      symbol: '<span class="doc-anchor__icon" aria-hidden="true"></span>',
      placement: 'after',
      class: 'doc-anchor',
      ariaHidden: false,
    }),
  })

  // Tables get a scroll container so wide tables never scroll the page body.
  const passthrough: RenderRule = (tokens, idx, options, _env, self) =>
    self.renderToken(tokens, idx, options)

  const tableOpen = md.renderer.rules.table_open ?? passthrough
  md.renderer.rules.table_open = (tokens, idx, options, env, self) =>
    '<div class="doc-table-scroll">' + tableOpen(tokens, idx, options, env, self)

  const tableClose = md.renderer.rules.table_close ?? passthrough
  md.renderer.rules.table_close = (tokens, idx, options, env, self) =>
    tableClose(tokens, idx, options, env, self) + '</div>'

  return md
}

/* -------------------------------------------------------------- sanitizer */

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'blockquote',
    'code', 'pre', 'em', 'strong', 'del', 'hr', 'br', 'img', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'kbd', 'abbr', 'sup', 'sub',
    'figure', 'figcaption',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'class', 'aria-hidden', 'aria-label', 'title'],
    p: ['class'],
    ul: ['id', 'class'],
    ol: ['id', 'class', 'start'],
    li: ['id', 'class'],
    blockquote: ['class'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'class'],
    span: ['class', 'style'],
    div: ['class', 'data-variant', 'data-language'],
    pre: ['class', 'style', 'tabindex'],
    code: ['class', 'style'],
    th: ['align', 'scope'],
    td: ['align'],
    h2: ['id', 'class'],
    h3: ['id', 'class'],
    h4: ['id', 'class'],
    abbr: ['title'],
  },
  allowedStyles: {
    '*': {
      color: [/^#(0x)?[0-9a-f]+$/i, /^rgba?\(/],
      'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgba?\(/],
      'font-weight': [/^\d+$/, /^(bold|normal)$/],
      'font-style': [/^(italic|normal)$/],
      'text-decoration': [/^[\w\s-]+$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    // External links open in a new tab and are marked up safely.
    a: (tagName, attribs) => {
      const href = attribs.href ?? ''
      if (/^https?:\/\//.test(href)) {
        return {
          tagName,
          attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' },
        }
      }
      return { tagName, attribs }
    },
  },
}

/* ---------------------------------------------------------- tree assembly */

function collectHeadings(html: string): Heading[] {
  const out: Heading[] = []
  const re = /<h([234])[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const text = m[3]
      .replace(/<a class="doc-anchor"[\s\S]*?<\/a>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim()
    if (text) out.push({ id: m[2], text, depth: Number(m[1]) as 2 | 3 | 4 })
  }
  return out
}

/**
 * A compiled body awaiting link rewriting. Relative `.md` targets can only be
 * resolved once every file's route is known, so bodies are patched in a second
 * pass over these handles.
 */
interface Rewritable {
  /** Directory the links were authored relative to. */
  dir: string
  read: () => string
  write: (html: string) => void
}

interface BuildContext {
  md: MarkdownIt
  labels: Record<string, string>
  descriptions: Record<string, string>
  files: string[]
  /** Absolute source file -> the route that renders it. */
  fileRoutes: Map<string, string>
  rewrites: Rewritable[]
}

/**
 * Turns authored `[text](../other/page.md#anchor)` links into portal routes.
 * An unresolvable target is reported rather than silently left as a dead link.
 */
function rewriteRelativeLinks(
  html: string,
  dir: string,
  fileRoutes: Map<string, string>,
  broken: string[],
  source: string,
): string {
  return html.replace(/href="([^"]+)"/g, (whole, href: string) => {
    if (/^[a-z]+:/i.test(href) || href.startsWith('/') || href.startsWith('#')) return whole
    const [target, hash] = href.split('#')
    if (!/\.md$/i.test(target)) return whole

    const absolute = path.resolve(dir, decodeURIComponent(target))
    const route = fileRoutes.get(absolute)
    if (!route) {
      broken.push(`${source} -> ${href}`)
      return whole
    }
    return `href="${route}${hash ? '#' + hash : ''}"`
  })
}

function buildFolder(
  dir: string,
  dirName: string,
  parentSegments: string[],
  parentCrumbs: Crumb[],
  ctx: BuildContext,
): FolderNode {
  const { order: nameOrder, slug: id } = parseSegment(dirName)
  const segments = [...parentSegments, id]
  const folderPath = '/docs/' + segments.join('/')

  let title = ctx.labels[id] ?? titleCase(id)
  let description = ctx.descriptions[id]
  let order = nameOrder
  let indexHtml = ''
  let headings: Heading[] = []

  // A folder describes itself with `README.md`, GitBook-style.
  const indexFile = path.join(dir, INDEX_FILE)
  if (fs.existsSync(indexFile)) {
    ctx.files.push(indexFile)
    ctx.fileRoutes.set(indexFile, folderPath)

    const { data, body } = splitFrontmatter(fs.readFileSync(indexFile, 'utf8'))
    const lede = splitLede(body)
    if (!ctx.labels[id]) title = data.title ?? lede.title ?? title
    description = data.description ?? lede.description ?? description
    if (typeof data.order === 'number') order = data.order

    const remainder = stripContentsSection(lede.body)
    if (remainder) {
      indexHtml = sanitizeHtml(ctx.md.render(remainder), SANITIZE_OPTIONS)
      headings = collectHeadings(indexHtml)
    }
  }

  const crumbs: Crumb[] = [...parentCrumbs, { label: title, href: folderPath }]
  const children: Node[] = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === INDEX_FILE) continue

    if (entry.isDirectory()) {
      children.push(
        buildFolder(path.join(dir, entry.name), entry.name, segments, crumbs, ctx),
      )
      continue
    }
    if (!entry.name.endsWith('.md')) continue

    const filePath = path.join(dir, entry.name)
    ctx.files.push(filePath)
    children.push(buildPage(filePath, entry.name, segments, crumbs, ctx))
  }

  children.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))

  const folder: FolderNode = {
    kind: 'folder',
    id,
    title,
    path: folderPath,
    description,
    breadcrumb: [...parentCrumbs, { label: title }],
    order,
    hasIndex: indexHtml.length > 0,
    headings,
    children,
    indexHtml,
  }

  if (indexHtml) {
    ctx.rewrites.push({
      dir,
      read: () => folder.indexHtml ?? '',
      write: (html) => {
        folder.indexHtml = html
        folder.headings = collectHeadings(html)
      },
    })
  }

  return folder
}

function buildPage(
  filePath: string,
  fileName: string,
  parentSegments: string[],
  parentCrumbs: Crumb[],
  ctx: BuildContext,
): PageNode {
  const { order: fileOrder, slug } = parseFileName(fileName)
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, body } = splitFrontmatter(raw)
  const lede = splitLede(body)

  const title = data.title ?? lede.title ?? titleCase(slug)
  const pagePath = '/docs/' + [...parentSegments, slug].join('/')
  ctx.fileRoutes.set(filePath, pagePath)

  const rendered = ctx.md.render(lede.body)
  const html = sanitizeHtml(rendered, SANITIZE_OPTIONS)

  const page: PageNode = {
    kind: 'page',
    slug,
    path: pagePath,
    title,
    description: data.description ?? lede.description,
    breadcrumb: [...parentCrumbs, { label: title }],
    html,
    headings: collectHeadings(html),
    order: typeof data.order === 'number' ? data.order : fileOrder,
    lastUpdated: data.lastUpdated,
    version: data.version,
    keywords: data.keywords ?? [],
  }

  ctx.rewrites.push({
    dir: path.dirname(filePath),
    read: () => page.html,
    write: (updated) => {
      page.html = updated
      page.headings = collectHeadings(updated)
    },
  })

  return page
}

function titleCase(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/* ------------------------------------------------------------ index build */

async function buildIndex(): Promise<{
  code: string
  files: string[]
  pages: Record<string, string>
}> {
  const highlighter = await createHighlighter({
    themes: ['github-light'],
    langs: HIGHLIGHT_LANGS,
  })
  const md = createMarkdown(highlighter)
  const { labels, order: folderOrder, descriptions } = readNavConfig()

  const ctx: BuildContext = {
    md,
    labels,
    descriptions,
    files: [NAV_CONFIG],
    fileRoutes: new Map(),
    rewrites: [],
  }
  const rootCrumbs: Crumb[] = [{ label: 'Documentation', href: '/docs' }]

  // The root README/SUMMARY are the printed guide's front matter; the
  // documentation home covers both, so links to them land there.
  for (const name of ROOT_META_FILES) {
    const file = path.join(CONTENT_DIR, name)
    if (fs.existsSync(file)) {
      ctx.files.push(file)
      ctx.fileRoutes.set(file, '/docs')
    }
  }

  const dirs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)

  const tree: FolderNode[] = dirs.map((name) =>
    buildFolder(path.join(CONTENT_DIR, name), name, [], rootCrumbs, ctx),
  )

  // Top-level ordering comes from nav.config.ts; unlisted folders sort last.
  tree.sort((a, b) => {
    const ia = folderOrder.indexOf(a.id)
    const ib = folderOrder.indexOf(b.id)
    return (ia === -1 ? 1e6 : ia) - (ib === -1 ? 1e6 : ib) || a.id.localeCompare(b.id)
  })

  // Flatten in document order — this is the prev/next spine and it deliberately
  // crosses folder boundaries, matching the reference portal's behaviour.
  const flat: NavRef[] = []
  const byPath: Record<string, PageNode> = {}
  const foldersByPath: Record<string, FolderNode> = {}

  const walk = (node: Node, folderTitle: string): void => {
    if (node.kind === 'folder') {
      foldersByPath[node.path] = node
      // Search results and prev/next label a page with its immediate section.
      for (const child of node.children) walk(child, node.title)
      return
    }
    byPath[node.path] = node
    flat.push({ title: node.title, path: node.path, folderTitle })
  }
  for (const folder of tree) walk(folder, folder.title)

  for (let i = 0; i < flat.length; i += 1) {
    const page = byPath[flat[i].path]
    if (i > 0) page.prev = flat[i - 1]
    if (i < flat.length - 1) page.next = flat[i + 1]
  }

  const broken: string[] = []

  // Every route is known by now, so authored `.md` links can become real hrefs.
  for (const target of ctx.rewrites) {
    const source = path.relative(CONTENT_DIR, target.dir) || '.'
    target.write(
      rewriteRelativeLinks(target.read(), target.dir, ctx.fileRoutes, broken, source),
    )
  }

  // Fail loudly on internal links that do not resolve to a real route.
  const known = new Set([...Object.keys(byPath), ...Object.keys(foldersByPath), '/docs', '/'])
  const bodies = [
    ...Object.values(byPath).map((p) => [p.path, p.html] as const),
    ...Object.values(foldersByPath).map((f) => [f.path, f.indexHtml ?? ''] as const),
  ]
  for (const [where, html] of bodies) {
    for (const m of html.matchAll(/href="(\/[^"#?]*)(?:[#?][^"]*)?"/g)) {
      if (!known.has(m[1])) broken.push(`${where} -> ${m[1]}`)
    }
  }
  if (broken.length) {
    throw new Error(
      `[docs-plugin] ${broken.length} broken internal link(s):\n  ` + broken.join('\n  '),
    )
  }

  const searchEntries = Object.values(byPath).map((p) => {
    const folderTitle = flat.find((f) => f.path === p.path)?.folderTitle ?? ''
    return {
      path: p.path,
      title: p.title,
      description: p.description ?? '',
      folderTitle,
      haystack: [p.title, p.description ?? '', p.keywords.join(' '), folderTitle]
        .join(' ')
        .toLowerCase(),
    }
  })

  // Split the compiled HTML out of the index and into per-page modules.
  const pages: Record<string, string> = {}
  const stripHtml = (node: Node): Node => {
    if (node.kind === 'folder') {
      if (node.indexHtml) pages[node.path] = node.indexHtml
      return { ...node, indexHtml: undefined, children: node.children.map(stripHtml) }
    }
    pages[node.path] = node.html
    return { ...node, html: '' }
  }

  const leanTree = tree.map(stripHtml) as FolderNode[]
  const leanByPath: Record<string, PageNode> = {}
  const leanFolders: Record<string, FolderNode> = {}
  const collect = (node: Node): void => {
    if (node.kind === 'folder') {
      leanFolders[node.path] = node
      node.children.forEach(collect)
    } else {
      leanByPath[node.path] = node
    }
  }
  leanTree.forEach(collect)

  const index = {
    tree: leanTree,
    byPath: leanByPath,
    foldersByPath: leanFolders,
    flat,
    searchEntries,
  }

  const loaders = Object.keys(pages)
    .map(
      (p) =>
        `  ${JSON.stringify(p)}: () => import(${JSON.stringify(CONTENT_PREFIX + p)}),`,
    )
    .join('\n')

  const code =
    `export const docIndex = ${JSON.stringify(index)};\n` +
    `export const contentLoaders = {\n${loaders}\n};\n`

  return { code, files: ctx.files, pages }
}

/* ----------------------------------------------------------------- plugin */

export function docsPlugin(): Plugin {
  let cached: Awaited<ReturnType<typeof buildIndex>> | null = null

  const ensure = async () => {
    if (!cached) cached = await buildIndex()
    return cached
  }

  return {
    name: 'docs-plugin',
    enforce: 'pre',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
      if (id.startsWith(CONTENT_PREFIX)) {
        return RESOLVED_CONTENT_PREFIX + id.slice(CONTENT_PREFIX.length)
      }
      return null
    },

    async load(id) {
      if (id === RESOLVED_ID) {
        const built = await ensure()
        for (const file of built.files) this.addWatchFile(file)
        return built.code
      }

      if (id.startsWith(RESOLVED_CONTENT_PREFIX)) {
        const built = await ensure()
        const path = id.slice(RESOLVED_CONTENT_PREFIX.length)
        const html = built.pages[path]
        if (html === undefined) return null
        return `export const html = ${JSON.stringify(html)};\n`
      }

      return null
    },

    async handleHotUpdate(hmr) {
      if (!hmr.file.startsWith(CONTENT_DIR) && hmr.file !== NAV_CONFIG) return
      cached = null
      const mod = hmr.server.moduleGraph.getModuleById(RESOLVED_ID)
      if (mod) {
        hmr.server.moduleGraph.invalidateModule(mod)
        hmr.server.ws.send({ type: 'full-reload' })
      }
      return []
    },
  }
}
