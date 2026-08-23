# Technical Requirements Document --- Documentation Portal

## 1. Architecture

Recommended frontend architecture:

-   React
-   TypeScript
-   Vite
-   Tailwind CSS
-   React Router
-   MD/MDX or structured content files
-   shadcn/ui only where useful
-   Lucide icons or existing icon system

Use the existing repository stack if one already exists.

## 2. Application structure

Recommended:

src/ components/ docs/ DocsHeader.tsx DocsContextBar.tsx DocsSidebar.tsx
DocsSidebarItem.tsx DocsSearch.tsx Breadcrumbs.tsx DocsArticle.tsx
OnThisPage.tsx CodeBlock.tsx Callout.tsx PrevNext.tsx DocsFooter.tsx
data/ docs.ts navigation.ts content/ folder-1/ folder-2/ ...
release-notes/ layouts/ DocsLayout.tsx pages/ docs/ styles/

Adapt this to the repository rather than blindly replacing its
structure.

## 3. Documentation schema

Use a typed schema similar to:

type DocPage = { slug: string; title: string; description?: string;
folder: string; order: number; content: string; headings?:
DocHeading\[\]; lastUpdated?: string; version?: string; };

type DocFolder = { id: string; title: string; order: number; children:
Array\<DocFolder \| DocPage\>; };

The UI must consume this model.

## 4. Routing

Recommended URL shape:

/docs/folder-1/page-name /docs/folder-2/page-name ...
/docs/release-notes

If the existing application uses HashRouter, preserve it and use:

#/docs/folder-1/page-name

Do not introduce server rewrite requirements into a static hosting
deployment without confirming the hosting setup.

## 5. Layout behavior

Desktop: - fixed/sticky documentation header - persistent left
navigation - centered article reading area - right-side contextual TOC
when content warrants it

Tablet: - reduced sidebar width - article remains comfortable to read -
TOC can collapse

Mobile: - navigation becomes a drawer/sheet - article occupies full
width - On This Page becomes collapsible - header remains compact

## 6. Navigation state

Sidebar must support: - expanded folders - collapsed folders - active
page - active ancestor - hover - keyboard focus - filtered state - empty
search state

Persist expanded/collapsed state in localStorage only if it improves UX.

## 7. Search/filter implementation

V1: - client-side filtering - normalize case - match titles and
descriptions - debounce only if required - show hierarchy context -
keyboard accessible

Future: - full-text index - fuzzy matching - search analytics

## 8. Content rendering

Markdown/MDX renderer must support: - H1-H4 - paragraphs - links -
lists - tables - blockquotes - code - syntax highlighting - callouts -
images - anchors

Do not allow unsafe HTML unless explicitly sanitized.

## 9. Performance

-   Lazy-load noncritical content
-   Avoid unnecessary client-side rendering
-   Use stable layout dimensions for images
-   Avoid large UI libraries when a small primitive is enough
-   Optimize icons and fonts
-   Avoid animation libraries for basic navigation
-   Measure with Lighthouse after implementation

## 10. Accessibility

Required: - semantic header/nav/main/footer - landmark labels - keyboard
navigation - visible focus - aria-expanded for expandable folders -
aria-current for current page - correct heading hierarchy - accessible
mobile drawer - sufficient contrast - reduced-motion support

## 11. Visual implementation

Use a design-token layer for: - page background - surface - border -
primary text - secondary text - link - hover - active navigation - code
background - spacing - typography

Do not hardcode the same values throughout components.

## 12. Testing

Before completion: - build succeeds - typecheck succeeds - lint succeeds
if configured - no console errors - all navigation links resolve -
refresh on deep URL works - mobile drawer works - sidebar filtering
works - keyboard navigation works - previous/next ordering is correct
