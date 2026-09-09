# Documentation Portal

An enterprise technical documentation portal built with React, TypeScript, Vite and
Tailwind CSS v4.

Structure and interaction benchmarked against the reference audited in
[`reference-audit.md`](./reference-audit.md); branding, content, colours and icons are
original. See [`IMPLEMENTATION-PLAN.md`](./IMPLEMENTATION-PLAN.md) for the architecture
rationale.

## Commands

```bash
npm install
npm run dev        # dev server with content hot-reload
npm run build      # typecheck + production build
npm run preview    # serve the production build
npm run typecheck
npm run lint
```

## Architecture

```
plugins/docs-plugin.ts   Build-time markdown compiler -> virtual:docs-index
src/config/siteConfig.ts Brand, accent colour, header/footer links
src/content/             Documentation markdown + nav.config.ts
src/lib/                 Typed schema, index accessors, routing, filter
src/components/docs/     Header, context bar, sidebar, breadcrumbs, TOC, prev/next
src/components/content/  Article body and content primitives
src/layouts/DocsLayout   Three-column sticky shell
```

**Client runtime dependencies are `react`, `react-dom` and `react-router-dom` only.**
Markdown parsing, YAML, HTML sanitisation and syntax highlighting all run in the Vite
plugin at build time; the browser receives pre-rendered, sanitised HTML strings. Each
page's body is code-split and fetched on navigation, so the initial payload carries
navigation metadata only.

The build **fails on a broken internal link**, naming the source page and the bad target.

## Adding a page

Drop a markdown file into a folder under `src/content/`. No component changes needed.

```markdown
---
title: Rate limiting
description: How request quotas are applied and observed.
order: 3
lastUpdated: 2026-08-19
version: "4.2"
keywords: [throttling, quota, 429]
---

Body content starts at `##` — the page title above supplies the `<h1>`.
```

The numeric filename prefix (`03-rate-limiting.md`) sets ordering and is stripped from
the URL. Nested subfolders work at any depth; add an optional `_folder.md` to give a
subfolder its own title and description.

Callouts use container syntax:

```markdown
:::note
Rendered as a monochrome outlined callout.
:::
```

Variants: `note`, `tip`, `important`, `warning`, `caution`.

## Renaming navigation

Display labels and ordering live in `src/content/nav.config.ts`. Directory names are
stable ids that own the URL, so renaming a label never breaks a deep link:

```ts
export const folderLabels: Record<string, string> = {
  'folder-1': 'Getting Started',   // URL stays /docs/folder-1/...
}
```

## Rebranding

Everything user-visible comes from `src/config/siteConfig.ts`: product name, wordmark,
documentation title, accent colour, footer text and all header/context/footer links.

## Admin dashboard (`/admin`)

A CMS for the documentation, served from the same app at `/admin` and lazy-loaded, so a
reader of the public portal never downloads it. It talks to the LinkEye documentation
backend (`../linkeye_back`) over its REST API — no mock data, no duplicated backend
logic.

```bash
cp .env.example .env      # VITE_API_URL -> the backend, default http://localhost:4000
npm run dev               # then open http://localhost:5173/admin
```

Local development auto-detects `localhost` / `127.0.0.1` and always uses `http://localhost:4000`. For a production build, set `VITE_API_URL` to the public backend origin before running `npm run build`.

The backend must be running and must list this origin in its `FRONTEND_URL` CORS
allow-list. Sign in with the admin account created by the backend's `import-docs` /
`create-admin` scripts.

| Screen | What it does |
|---|---|
| Documentation | Recursive tree at any depth — create, rename, delete, publish/unpublish; drag a row to reorder it among its siblings or onto a folder to nest it, with up/down arrows and "Move to…" as the keyboard path; markdown editor with a formatting toolbar; preview before publishing; version history; content search |
| Media | Upload, browse, reuse, replace, delete; filename, type, size, alt text and a copyable URL |
| Release Notes | Version, date, markdown body, draft/publish, delete |
| Settings | Signed-in account and the API endpoint in use |

```
src/admin/api.ts          Typed client for the backend; the only place that calls fetch
src/admin/auth.tsx        JWT session, route guard
src/admin/AdminApp.tsx    Sidebar shell and admin route table
src/admin/pages/          Login, Documentation, Media, Release Notes, Settings
src/admin/components/     Tree, editor, markdown toolbar, media picker
src/admin/ui.tsx          Buttons, fields, dialog, banners — built on the portal's tokens
```

Dragging uses the browser's own HTML5 drag-and-drop — no drag library. The row
under the pointer decides from the cursor's vertical position whether the drop
lands before it, after it, or inside it (folders only), and reports an anchor
(`{ parentId, beforeId }`) rather than an index, so nothing has to reason about
off-by-one once the dragged node leaves its old slot. A node can never be
dropped into itself or its own subtree. A same-parent reorder is applied
optimistically and rolled back if the request fails; a cross-folder move is not
predicted locally, because only the backend can compute the new slugs and paths.

The editor writes **markdown**, which the backend renders and sanitises. Preview saves
the draft and displays the HTML the backend returned, so what is previewed is exactly
what publishes — the markdown pipeline is never reimplemented on the client.

Still zero new runtime dependencies: the dashboard uses `react`, `react-dom` and
`react-router-dom`, the same three the portal already had.

## Deployment

The app uses `BrowserRouter`, so the host must serve the app shell for unknown paths.
Included: `public/_redirects` (Netlify/Cloudflare Pages), `vercel.json` (Vercel) and
`public/404.html` (GitHub Pages and a general fallback, which preserves the requested
deep URL through `sessionStorage`).

Routing is centralised in `src/lib/routing.ts` and `src/App.tsx`; switching to
`HashRouter` is a two-file change.

## Accessibility

16px root sizing, ~15px article text, semantic landmarks with unique names, skip link,
`aria-expanded` on every navigation group, `aria-current` for the active page and its
ancestors, a focus-trapped mobile drawer with Escape-to-close and focus restoration,
visible focus rings throughout, and `prefers-reduced-motion` support. All text and
UI-boundary colour pairs meet WCAG AA.
