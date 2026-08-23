# Documentation Portal --- Claude Code Instructions

## Mission

Build a production-quality documentation portal inspired very closely by
the information architecture, layout, navigation model, density,
typography hierarchy, search behavior, code/content presentation, and
responsive behavior of:

https://docs.paloaltonetworks.com/strata-cloud-manager/aiops/about

The reference site is the design and UX benchmark only. Do NOT copy Palo
Alto Networks branding, logos, proprietary assets, copyrighted
documentation text, or product-specific content. Replace them with our
own neutral documentation content and the folder naming defined below.

## Primary requirement

The result must feel like a mature enterprise documentation portal
rather than a marketing website.

Use the reference site as the visual/structural benchmark: -
Documentation-home style header - Product/documentation context bar -
Persistent left table-of-contents/navigation - Main documentation
reading column - Right-side "On This Page" navigation where
appropriate - Breadcrumbs - Previous/Next navigation - Dense but highly
readable documentation typography - Expand/collapse navigation groups -
Search/filter interaction in the documentation tree - Responsive
behavior for tablet/mobile - Sticky/fixed navigation where appropriate -
Clear active-page states - Link-heavy documentation architecture - Deep
URL hierarchy

## Navigation naming

Instead of the reference site's product/category names, use exactly: -
Folder 1 - Folder 2 - Folder 3 - Folder 4 - Folder 5 - Folder 6 - Folder
7 - Folder 8 - Folder 9 - Folder 10 - Release Notes

The implementation must make these folder names data-driven so they can
later be renamed from one configuration file.

## Engineering rules

-   First inspect the existing repository before changing anything.
-   Preserve the existing stack unless there is a strong technical
    reason not to.
-   Prefer React + TypeScript + Vite if the repository already uses it.
-   Use Tailwind CSS if already installed.
-   Use accessible semantic HTML.
-   Do not introduce unnecessary dependencies.
-   Keep documentation content separate from UI components.
-   Use a typed documentation schema.
-   Do not hardcode every navigation item into JSX.
-   Do not break existing routes or APIs unless the project explicitly
    has no existing application to preserve.
-   Do not modify backend/API behavior unless explicitly required.
-   Keep components modular and maintainable.
-   Build reusable primitives for Header, Breadcrumbs, Sidebar, Search,
    TOC, Article, CodeBlock, Callout, PrevNext, Footer.
-   Support deep links and page refreshes.
-   Ensure keyboard navigation and visible focus states.
-   Meet WCAG AA contrast requirements.
-   Optimize for fast initial load and documentation navigation.

## Content/data architecture

Create a documentation model similar to:

Documentation Folder 1 Page 1 Page 2 Folder 2 Page 1 Page 2 ... Release
Notes

Each page should support: - title - description/intro - breadcrumb
path - markdown/MDX content - headings - paragraphs - ordered/unordered
lists - links - code blocks with language labels - tables - callouts -
images - previous page - next page - on-page heading navigation - last
updated metadata - optional version metadata

## Search

Implement documentation-tree filtering/search: - Search field in the
documentation navigation area - Instant filtering - Match page titles
and useful metadata - Highlight active result - Keyboard accessible -
Empty state - Escape/clear behavior

## Visual quality

Do not create a generic dashboard. Do not create a flashy SaaS landing
page. Do not use gradients unless the reference audit proves they are
necessary. Prioritize: - restrained enterprise UI - clean
whites/near-whites and neutral borders - strong typography hierarchy -
compact navigation - subtle interaction states - generous reading
width - precise spacing - excellent alignment - professional
documentation density

## Reference audit

Before implementation: 1. Open the supplied reference URL. 2. Audit
desktop and responsive structure. 3. Identify exact regions, dimensions,
spacing relationships, typography scale, borders, shadows, icon usage,
sticky behavior, navigation behavior and page hierarchy. 4. Document
findings in `reference-audit.md`. 5. Compare the implementation against
the reference after the first build. 6. Fix visual discrepancies before
declaring completion.

## Skills

The provided `claude.zip` contains the user's installed Claude skills.
Use relevant skills selectively rather than forcing every skill into the
project. Highest priority: - react / react fundamentals / react best
practices - typescript expert - tailwind / tailwind advanced components
/ responsive / accessibility - shadcn - design / modern web design /
taste-design - web performance optimization - accessibility compliance -
motion/framer only where subtle documentation interactions benefit -
code-to-design for visual audit if useful

Avoid unnecessary 3D/WebGL/R3F/Three.js/Spline/Lottie/GSAP-heavy
implementation for the core documentation portal unless a reference
audit demonstrates a real need.

## Definition of done

The portal is complete only when: - the information architecture mirrors
the reference documentation model - all left-navigation folders exist
with the required names - Release Notes exists - article pages have
matching documentation-style structure - breadcrumbs, TOC, prev/next and
sidebar behavior work - navigation is data-driven - search/filter
works - responsive layouts work - direct URLs work - accessibility
basics pass - no console errors - no broken links - no placeholder lorem
ipsum remains - the UI has been visually audited against the reference
