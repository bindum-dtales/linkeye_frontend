# Implementation Plan — Documentation Portal

Derived from `PRD.md`, `TRD.md`, `UI-UX-DESIGN-BRIEF.md`, `CLAUDE.md` and `reference-audit.md`.
**Status: awaiting approval. No application code written yet.**

---

## 0. Starting point

The repository contains **only** the five specification markdown files. There is no `package.json`,
no source tree, no build tooling, no git history, no backend, no existing routes and no existing
components.

Consequences:

- CLAUDE.md's "preserve the existing stack" / "do not break existing routes or APIs" rules are
  **vacuously satisfied** — there is nothing to preserve. MASTER-CLAUDE-PROMPT.md's fallback applies:
  *"If the project is empty, choose a clean React + TypeScript + Vite architecture."*
- Nothing in this plan modifies or deletes an existing application file. The only pre-existing files
  touched are none; `reference-audit.md` and this plan are new additions.

**Must be preserved:** the five specification `.md` files, verbatim. They are the contract and are
never edited by the implementation.

---

## 1. Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 19 + TypeScript (strict) | TRD §1 |
| Build | Vite 7 | TRD §1 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first `@theme`) | TRD §1, §11; v4 gives a native design-token layer |
| Routing | React Router 7 (`BrowserRouter`) | TRD §4 — **see open question Q1** |
| Content | Markdown + YAML frontmatter, **compiled at build time** | TRD §8, §9 |
| Markdown | `markdown-it` + `markdown-it-anchor` + `js-yaml` + `sanitize-html` — **devDependencies only** | see §3 |
| Highlighting | `shiki` at build time, emitting static HTML | zero client-side highlighter JS |
| Icons | Hand-authored inline SVG primitives, no icon package | reference uses ~12 glyphs; a package is unjustified |
| Component lib | **None.** No shadcn/Radix. | TRD §9 "avoid large UI libraries when a small primitive is enough" — **see Q2** |
| Animation | CSS transitions only, `prefers-reduced-motion` respected | brief §7 forbids decorative motion |
| Package manager | npm (Node 24.18, npm 11.6 present; no pnpm/bun on this machine) | environment |

**Client-side runtime dependencies: `react`, `react-dom`, `react-router-dom`. That is all.**
Everything markdown-related runs in the Vite plugin at build time and ships as plain HTML strings.

---

## 2. Documentation data structure

### 2.1 Authoring layout

```
src/content/
├── nav.config.ts             ← THE single rename point (FR-10 / CLAUDE.md "data-driven")
├── folder-1/
│   ├── 01-overview.md
│   ├── 02-architecture.md
│   └── concepts/             ← nested subfolder, arbitrary depth
│       ├── _folder.md        ← optional: title/description/order for the subfolder itself
│       └── 01-data-model.md
├── folder-2/ … folder-10/
└── release-notes/
    ├── 01-2026-08.md
    └── 02-2026-07.md
```

Ordering comes from the numeric filename prefix, overridable by frontmatter `order`.
The prefix is stripped from the URL slug, so `01-overview.md` → `/docs/folder-1/overview`.

### 2.2 Frontmatter contract

```yaml
---
title: Data model
description: How documents, folders and versions relate.
order: 1
lastUpdated: 2026-08-19
version: "2.4"
keywords: [schema, model, entities]      # feeds sidebar filter (FR-03)
---
```

### 2.3 Typed schema (`src/lib/docs.types.ts`)

```ts
export interface DocHeading { id: string; text: string; depth: 2 | 3 | 4 }

export interface DocPage {
  kind: 'page'
  slug: string            // "overview"
  path: string            // "/docs/folder-1/overview"  — canonical, deep-linkable
  title: string
  description?: string
  breadcrumb: Crumb[]     // precomputed at build time
  html: string            // sanitized, highlighted, anchored
  headings: DocHeading[]  // drives On This Page
  order: number
  lastUpdated?: string
  version?: string
  keywords: string[]
  prev?: NavRef           // flattened document order, crosses folder boundaries
  next?: NavRef
}

export interface DocFolder {
  kind: 'folder'
  id: string              // "folder-1"     — stable, never renamed
  title: string           // "Folder 1"     — display label, renameable
  path: string
  description?: string
  order: number
  children: Array<DocFolder | DocPage>
}

export type DocNode = DocFolder | DocPage
export interface DocIndex { tree: DocFolder[]; byPath: Record<string, DocPage>; flat: NavRef[] }
```

`DocFolder` is recursive, so nested subfolders (PRD §5 "optional nested subfolders") need no new type.

### 2.4 `nav.config.ts` — the rename point

```ts
export const siteConfig = { name: '…', productName: '…', tagline: '…' }

export const folderLabels: Record<string, string> = {
  'folder-1': 'Folder 1',
  // …
  'folder-10': 'Folder 10',
  'release-notes': 'Release Notes',
}

export const folderOrder: string[] = ['folder-1', …, 'folder-10', 'release-notes']
```

Directory names stay `folder-1`…`folder-10` (stable IDs and URLs); **display labels and ordering come
from this one file.** Renaming "Folder 3" to "Deployment" is a one-line edit with zero component or
URL churn — exactly what CLAUDE.md and MASTER-CLAUDE-PROMPT.md require.

### 2.5 Build-time pipeline (`plugins/docs-plugin.ts`)

A small Vite plugin that, on start and on HMR:

1. `import.meta.glob`-scans `src/content/**/*.md`
2. splits frontmatter (`js-yaml`) from body
3. renders with `markdown-it` (GFM tables, fenced code) + `markdown-it-anchor` (stable heading ids)
4. highlights fences with `shiki`, emitting static themed HTML — **no highlighter ships to the browser**
5. rewrites internal `.md` links to portal routes, and flags any that don't resolve
6. sanitizes with `sanitize-html` against an explicit allowlist (TRD §8 "do not allow unsafe HTML")
7. extracts `headings[]` for the On-This-Page rail
8. builds the folder tree, applies `nav.config.ts` labels/order
9. flattens the tree in document order and wires `prev` / `next` **across folder boundaries**
   (matching the reference, per audit §8)
10. emits a typed virtual module `virtual:docs-index`

Benefits: no markdown parser in the client bundle, no runtime parse cost, no layout shift, link
validation at build time (CLAUDE.md "no broken links"), and adding a page = dropping in a `.md` file
(FR-10).

---

## 3. Routing

`BrowserRouter`, all paths defined in `src/routes.tsx`:

| Route | Purpose |
|---|---|
| `/` | redirect → `/docs` |
| `/docs` | documentation home: folder grid / entry points |
| `/docs/*` | **catch-all**, resolved against `DocIndex.byPath` |
| `*` | 404 with a route back into the tree |

A single catch-all under `/docs` handles arbitrary nesting depth
(`/docs/folder-1/concepts/data-model`) without enumerating route patterns — this is what gives
PRD §5 "optional nested subfolders" and CLAUDE.md "deep URL hierarchy" for free.
If a path matches a **folder** rather than a page, a folder-overview page is rendered listing its children.

All routing is centralised behind `src/lib/routing.ts` (`toHref()`, `useDocPath()`) so the
`BrowserRouter` → `HashRouter` swap in Q1 is a two-file change, not a sweep.

---

## 4. Component architecture

```
src/
├── main.tsx
├── App.tsx                       — router + providers
├── routes.tsx
├── layouts/
│   └── DocsLayout.tsx            — the 3-column sticky shell; owns sidebar-open state
├── components/
│   ├── docs/
│   │   ├── DocsHeader.tsx        — brand, utility actions, global search trigger, mobile toggle
│   │   ├── DocsContextBar.tsx    — product/documentation context row (audit §10);
│   │   │                           uses the data-title bold-width reservation trick
│   │   ├── DocsSidebar.tsx       — <nav aria-label="Documentation">, sticky, own scroll
│   │   ├── DocsSidebarItem.tsx   — recursive; aria-expanded / aria-current; active pill
│   │   ├── DocsSearch.tsx        — in-tree filter; hides non-matches in place (audit §5)
│   │   ├── SidebarExpandControls.tsx — Expand all / Collapse all
│   │   ├── Breadcrumbs.tsx       — <nav aria-label="Breadcrumb"><ol>; last = aria-current="page"
│   │   ├── DocsArticle.tsx       — title block, meta, rendered body, anchor targets
│   │   ├── OnThisPage.tsx        — scroll-spy + sliding 3px indicator (audit §7)
│   │   ├── PrevNext.tsx          — rendered above and below the article
│   │   ├── DocsFooter.tsx
│   │   ├── MobileNavDrawer.tsx   — accessible drawer: focus trap, Esc, inert background
│   │   └── PageMeta.tsx          — last-updated / version
│   ├── content/                  — primitives the compiled HTML is hydrated into
│   │   ├── CodeBlock.tsx         — language label + copy button over pre-highlighted markup
│   │   ├── Callout.tsx           — note / tip / warning / caution, monochrome-outlined
│   │   ├── DocTable.tsx          — wrapped in an overflow-x scroll container
│   │   ├── HeadingAnchor.tsx     — hover-revealed copy-link
│   │   └── DocImage.tsx          — explicit width/height, no CLS
│   └── primitives/
│       ├── Icon.tsx              — inline SVG set (chevron, search, close, menu, link, copy, calendar…)
│       ├── VisuallyHidden.tsx
│       └── SkipLink.tsx
├── hooks/
│   ├── useActiveHeading.ts       — IntersectionObserver scroll-spy
│   ├── useDocTree.ts             — tree + active-ancestor resolution
│   ├── useTreeFilter.ts          — search/filter state and matching
│   ├── useExpandedFolders.ts     — expand/collapse, localStorage-persisted (TRD §6)
│   └── useMediaQuery.ts
├── lib/
│   ├── docs.types.ts
│   ├── docs.ts                   — reads virtual:docs-index; lookup/flatten helpers
│   ├── routing.ts                — single source of href construction
│   └── search.ts                 — normalize, match, highlight
├── content/                      — see §2.1
├── styles/
│   ├── tokens.css                — @theme design tokens (TRD §11)
│   └── index.css
└── plugins/docs-plugin.ts
```

**Design-token layer** (`styles/tokens.css`, Tailwind v4 `@theme`) — nothing hardcoded in components:
`--color-page`, `--color-surface`, `--color-border-subtle`, `--color-border`, `--color-text`,
`--color-text-secondary`, `--color-text-muted`, `--color-link`, `--color-nav-active-bg`,
`--color-nav-active-fg`, `--color-code-bg`, `--sidebar-w`, `--rail-w`, `--header-h`,
`--article-max-w`, plus the type scale.

---

## 5. Layout & visual mapping (audit → build)

| Audit finding | Implementation |
|---|---|
| flex row, sticky asides `top:0` | CSS grid `[sidebar] [article] [rail]`, both rails `position:sticky; top:var(--header-h)` |
| 350 / fluid / 280 | `--sidebar-w:320px`, `--rail-w:264px` (tightened; the reference's 350px is generous for 11px links) |
| article body 12px | **15px / 1.7** — deliberate deviation, audit §13 item 1 |
| active pill `#141414`/`#fff` r5 | same treatment, neutral-950 token |
| 16px indent per level | `--nav-indent:16px` |
| `max-height` 0.9s expand | `grid-template-rows: 0fr → 1fr`, 180ms, reduced-motion aware |
| breadcrumb 11px `#707070`, "\|" sep | 12px, `--color-text-muted`, `/` separator (pipe is a PAN signature) |
| prev/next 50/50, circular chevron | same, rendered twice |
| OTP 3px sliding indicator | same, `transition:top .2s` |
| callouts monochrome outlined | same, 1px border + dark icon gutter, no colour fills |
| ≤768px TOC inline above article | same component, responsive placement |
| ≤768px right rail → full-width block | same |
| accent `#fa582c` | restrained blue `--color-link`, WCAG AA verified |
| `html{font-size:10px}` | rejected — 16px root |
| `767.97px` breakpoints | Tailwind `sm 640 / md 768 / lg 1024 / xl 1280` |

---

## 6. Accessibility plan (PRD FR-09, TRD §10)

- Landmarks: `<header>`, `<nav aria-label="Documentation">`, `<nav aria-label="Breadcrumb">`,
  `<main id="content">`, `<aside aria-label="On this page">`, `<footer>`; skip-link to `#content`.
- `aria-expanded` on every folder toggle; `aria-current="page"` on the active page and
  `aria-current="location"` on active ancestors.
- Search: `role="searchbox"`, `aria-controls` the tree, live result count via `aria-live="polite"`,
  Escape clears, explicit empty state.
- Mobile drawer: focus trap, restore focus on close, Escape closes, background `inert`.
- Heading hierarchy: one `<h1>` per page; compiled markdown demoted so article headings start at `h2`.
- Visible focus rings on every interactive element — never `outline:none` without a replacement.
- All colour pairs checked to **WCAG AA (4.5:1 text / 3:1 UI)** before merge.
- `prefers-reduced-motion: reduce` disables all transitions.

---

## 7. Search / filter (FR-03)

V1, client-side, over the build-time index:

- normalize case + diacritics; match `title`, `description`, `keywords`
- **hide non-matching nodes in place, keeping ancestors visible** — hierarchy context preserved
  (audit §5), not a flat result list
- auto-expand ancestors of matches; highlight the matched substring
- keyboard: ↑/↓ move, Enter opens, Escape clears and restores the tree
- empty state: "No pages match *<query>*" + a clear button
- no debounce needed — the index is a few hundred entries in memory

---

## 8. Content

Every page gets **original technical documentation prose** — no lorem ipsum, per CLAUDE.md's
definition of done. Planned volume:

- 10 folders × 3–5 pages, several with a nested subfolder → **~40 pages**
- Release Notes: 4–5 dated releases with Added / Changed / Fixed / Deprecated sections
- Coverage across pages of every required primitive: h2–h4, paragraphs, ordered + unordered lists,
  inline links, internal cross-links, code blocks with language labels, tables, all four callout
  variants, images with fixed dimensions

**This is where I need direction — see Q3.**

---

## 9. Delivery sequence

| Phase | Work | Verification |
|---|---|---|
| 1 | Scaffold Vite + TS strict + Tailwind v4 + tokens | `npm run build`, `tsc --noEmit` |
| 2 | `docs-plugin.ts` + schema + `nav.config.ts` + 2 sample pages | index emits; HMR works |
| 3 | `DocsLayout` shell, header, context bar, footer | three-column geometry vs audit §2 |
| 4 | Sidebar: recursive items, expand/collapse, active states, persistence | FR-01, FR-02 |
| 5 | Article: breadcrumbs, title block, content primitives, prev/next | FR-05, FR-07 |
| 6 | On This Page + scroll-spy + heading anchors | FR-06 |
| 7 | Search/filter | FR-03 |
| 8 | Responsive: mobile drawer, inline TOC, stacked rail | FR-08 |
| 9 | Full content authoring (~40 pages + release notes) | no lorem, no broken links |
| 10 | A11y pass, Lighthouse, deep-link + refresh tests, console-error sweep | TRD §12 |
| 11 | **Visual re-audit against the reference**, fix discrepancies | CLAUDE.md def. of done |

---

## 10. Files created / modified

**Created:** everything under `src/`, `plugins/`, plus `package.json`, `tsconfig*.json`,
`vite.config.ts`, `index.html`, `.gitignore`, `eslint.config.js`, `README.md`, `reference-audit.md`,
`IMPLEMENTATION-PLAN.md`. Approximately 45 source files + ~40 content markdown files.

**Modified:** none. No existing file is edited or deleted.

---

## 11. Open questions

**Q1 — Hosting / router.** TRD §4 warns against introducing server-rewrite requirements without
confirming the hosting setup. `BrowserRouter` gives clean `/docs/folder-1/overview` URLs but needs a
SPA fallback rewrite; `HashRouter` (`#/docs/folder-1/overview`) works on any static host with none.
I plan `BrowserRouter` + a `public/404.html` fallback, with all href construction centralised so a
switch is trivial. Confirm the deployment target.

**Q2 — shadcn/ui.** TRD lists it "only where useful"; CLAUDE.md lists the shadcn skill as high
priority. The only component with real justification is the mobile drawer, and pulling Radix in for
one drawer contradicts "avoid large UI libraries when a small primitive is enough". I plan a
hand-built accessible drawer. Say the word if you want shadcn included regardless.

**Q3 — Content subject matter.** The folders must be named `Folder 1`…`Folder 10`, but the *pages*
inside need real prose. The parent directory is `linkeye`. Options: (a) write neutral
platform-documentation content for a generic "LinkEye" product, (b) you supply the subject matter,
(c) fully domain-neutral content about the portal itself. **(a) is my default** unless you say otherwise.

**Q4 — Brand identity.** The brief requires original branding. I plan a wordmark set from
`siteConfig` (no logo asset) and a restrained blue accent. Supply a name/accent if you have one.

---

## 12. Conflict register

| # | Item | Status |
|---|---|---|
| 1 | `claude.zip` not in this repo — it is at `~/Desktop/claude.zip` | Resolved: inspected there; its 96 skill archives are already installed under `~/.claude/skills/` |
| 2 | CLAUDE.md expects a "react / react fundamentals" skill; the installed **`react`** skill is a *json-render JSON-spec renderer*, unrelated to this project | Do **not** use `react`. Use `react-fundamentals-19`, `react-hooks-complete`, `react-patterns`, `react-typescript`, `react-best-practices`, `react-performance` |
| 3 | Two competing Tailwind skill families (v3-era `tailwindcss-*` and `tailwind-v4` / `tailwind-4-docs`) | Use the **v4** guidance; treat v3 material as legacy |
| 4 | `react-vite-dashboard` and `code-to-design` are Stitch/dashboard-oriented; the brief explicitly forbids a dashboard look | Excluded |
| 5 | Large 3D/GSAP/Three/Spline/Lottie skill set installed | Excluded per CLAUDE.md |
| 6 | TRD §1 suggests shadcn/ui; TRD §9 says avoid large UI libraries | See Q2 |
| 7 | Reference article body is 12px | Deviating to 15px; recorded in audit §13 and §5 above |
| 8 | Reference sidebar has no hover feedback | Adding hover state; deviation recorded |
| 9 | Router vs static hosting | See Q1 |
| 10 | No pnpm/bun on this machine | Using npm 11.6 / Node 24.18 |
| 11 | Not a git repository | Will offer `git init` before implementation |
| 12 | Reference is a DITA/AEM/Coveo system; several behaviours are artifacts of that pipeline, not design intent | Structural patterns copied, platform machinery not reproduced (audit §13) |
