# Reference Audit — docs.paloaltonetworks.com (Strata Cloud Manager / AIOps / About)

**Audited URL:** `https://docs.paloaltonetworks.com/strata-cloud-manager/aiops/about`
**Date:** 2026-08-19
**Method:** Server HTML retrieved directly (266 KB) plus the two production stylesheets
(`clientlib-webpack-site.css`, 1.11 MB; `clientlib-webpack-fonts.css`, 105 KB). All values below are
read from the shipped CSS rules, not estimated from screenshots.
**Platform identified:** Adobe AEM ("techdocs") + DITA/FrameMaker content pipeline + Coveo search.
**Body classes on this page type:** `docSetBookDetailPage` / `topicPage`, layout class `oneColumnPlain td-body`.

> Scope note: this document records structure, dimensions and behaviour for benchmarking only.
> Palo Alto Networks branding, logos, product names, accent colours (`#fa582c` etc.) and documentation
> copy are explicitly **out of scope** for reimplementation, per CLAUDE.md and the PRD.

---

## 1. Page skeleton

```
div.oneColumnPlain.td-body
├── div.td-header
│   ├── section#pan_mobile_nav.td-header__mobile-nav      (hidden-md hidden-lg — mobile only)
│   │   ├── header.nav-header  › nav-header-top (avatar/dropdown, close btn)
│   │   │                      › nav-breadcrumbs (back button + ol.breadcrumb)
│   │   ├── div.nav-inner      › nav.nav-main > ul.nav-menu  (+ ul.nav-menu.inactive = slide panes)
│   │   └── div.nav-bottom     › nav-actions + language dropup
│   └── header.nav-header.container                        (desktop)
│       ├── section.td-header__logo   (logo + hoverable language dropdown)
│       └── section.td-header__nav.nav-main
│           ├── nav#pan-nav.visible-lg.visible-md  › section.nav-list + section.pan-nav-dropdown
│           └── section.nav-right    › search box, search toggle, hamburger, assistant button
└── section#frameMaker.td-split-banner.framemaker-book-detail-page.doc-set-dita-content-well.td-body__content
    ├── div.dita-sticky-header            (fixed, appears on scroll)
    ├── aside.aside-left.consolidated-toc-container      ← 350 px
    │   └── div.doc-set-toc  › toggle-aside
    │                        › search-toc (label + filter icon + input + clear)
    │                        › consolidated-toc › toc-shell (scroll)
    │                            › expansion-div (Expand all | Collapse all)
    │                            › toc-book-title (h3)
    │                            › ul.toc-contents › li.local › div.toc-dropdown > a + ul.nested-list
    ├── main
    │   └── div.content > div.content-inner
    │       ├── div.detail-breadcrumb-download  › ol.breadcrumbs + Download-PDF button
    │       ├── div.book-detail-title-row       › product title + h1.bookdetail-page-title
    │       ├── div.mobile-toc-title-row + div.mobile-toc   (duplicate TOC, ≤768 px only)
    │       ├── div.btm-pagination.top-pagination           (prev/next, ABOVE the article)
    │       ├── div.book-pdf-content            › div.topic.concept (the DITA article)
    │       ├── feedback widget slot
    │       ├── div.btm-pagination                          (prev/next, BELOW the article)
    │       └── div.footer-hang-off
    └── aside.aside-right                                   ← 280 px
        └── div.aside-right-content
            ├── div.onthispageTOC  › h4 "On This Page" + links + div.current-active (moving marker)
            └── div.accio-book-path › book-group cards (related-documentation link groups)
```

**Critical structural observations**

- The three columns are a single flex row: `.td-split-banner { display:flex; align-items:flex-start }`.
- **Both asides are sticky, not fixed:** `.td-split-banner aside { position:sticky; top:0; z-index:1 }`.
  The main column scrolls; the rails pin. This is the single most important layout decision to copy.
- Prev/Next is rendered **twice** — once above the article body, once below it.
- The left TOC markup is duplicated into `main` as `.mobile-toc` and swapped by media query rather
  than being moved in the DOM. (We will use one component with responsive placement instead.)
- Content well: `background:#fff; border-radius:24px 24px 0 0; margin:15px 0; padding:15px`.
  The article sits on a white card floating over the page background.

---

## 2. Dimensions

| Region | Value | Source rule |
|---|---|---|
| Left sidebar | `min-width:350px; width:350px` | `.framemaker-book-detail-page .aside-left` |
| Right rail | `min-width:280px; max-width:280px; width:280px` | `.framemaker-book-detail-page .aside-right` |
| Right rail inner | `width:280px` | `.aside-right .aside-right-content` |
| Main column | `flex-grow:1` (fills remainder) | `.td-body__content` |
| Aside inner (generic) | `width:300px`, later `100%` | `.td-split-banner aside .content-inner` |
| Aside base width formula | `calc(-300px + 50%)` before the page-type override | `.td-split-banner aside` |
| Content well padding | `15px` | `.standard .td-body .td-body__content` |
| Content well radius | `24px 24px 0 0` | same |
| Header padding | `20px` top / `10px` bottom | `header.nav-header.container` |
| Header radius | `0 0 40px 40px` | same |
| Scroll anchor offset | `scroll-padding-top:85px` | `html.dynamic-scroll` |
| Sticky header height | `max-height:0` → `200px` when `.open`, padding `15px 10px` | `.dita-sticky-header` |
| Aside collapse | `.aside-close { min-width:0; max-width:0 }`, `transition:all .5s ease` | `.aside-left/.aside-right` |
| Page gutters (wide) | `margin-left/right:200px` → `15px` → `0` at successive breakpoints | `.oneColumnPlain.td-body .nav-header` |

**Ratio at 1440 px viewport:** 350 sidebar / ~780 article / 280 rail ≈ **24% / 56% / 20%**.

---

## 3. Typography

Root: `html { font-size:10px }` — so `1rem = 10px` and all `rem` values in the sheet are ×10.
Body: `font-family: Figtree, Lato, "Helvetica Neue", Helvetica, Arial, sans-serif; font-size:14px; line-height:1.42857143; color:#36424b`.
Faces shipped: **Figtree** (UI/headings), **Lato** (On-This-Page), Merriweather (unused here),
plus FontAwesome / Material Icons / Ionicons / simple-line-icons for glyphs.

| Element | Size | Weight | Colour | Notes |
|---|---|---|---|---|
| Product / parent title (`.accioproducttitle`) | **38px** | 400 | `#141414` | `margin-top:10px; margin-bottom:0` |
| Page title (`h1.bookdetail-page-title`) | **20px** | 400 | `#141414` | `margin:5px 0`; 3px × 100px accent underline (suppressed on this page type) |
| Article `h1.title` | — | — | — | **`display:none`** — the DITA h1 is hidden; the page h1 above is authoritative |
| Article `h2.title` | inherit | 400 | — | `border-bottom:1px solid #c8c2be; margin-top:50px` |
| Article `h3.title` | inherit | 400 | `#141414` | `margin:30px 0 20px`; `::after` 3px × 75px accent underline |
| Article body (`.content-inner`) | **12px** | 400 | `#36424b` | `padding-top:20px; border-left:1px solid #f4f4f2` |
| Article paragraph (`.p`) | 12px | 400 | — | `margin-bottom:10px` |
| Breadcrumb link | **11px** | 400 | `#707070` | separator `"\|\00a0"` at 10px, `#707070` |
| Sidebar top-level group | **20px** | — | `#141414` | `a.doc-set-toc-information-type` (14px on mobile) |
| Sidebar nested page link | **11px** | 400 | `#141414` | `padding-right:18px; line-height:1.1`; visited `#962d10` |
| Sidebar "Expand all / Collapse all" | **11px** | — | `#817c7b` | `margin-bottom:10px; padding-left:10px` |
| Sidebar filter helper label | 12px | — | `gray` | `.filter-toc-label` |
| On-This-Page link | inherit | **300** (Lato) | `#141414` | `line-height:15px; padding-bottom:13px; padding-left:15px` |
| Right-rail group heading | 14px | — | — | `.book-group-heading`, `margin-top:0` |
| Right-rail group link | 12px | — | `#141414` | `margin-bottom:6px` |
| Header nav item | 14px (base 16px) | 400 / **600 active** | `#000` | `letter-spacing:.02em; margin-right:25px` |
| Code block (`pre.screen`) | **12px** | — | — | `.userinput` → `font-weight:700; color:#000` |
| Aside content generic | 13px | — | — | `.td-split-banner aside .content-inner` |

**Scale summary:** 38 → 20 → (h2/h3 inherit ~14–16) → 14 body chrome → 12 article body → 11 nav/breadcrumb.
This is a genuinely **dense** documentation scale; the article body is smaller than the UI chrome.
For our build we will keep the *proportions* but lift the article body to 15–16px for WCAG-comfortable
reading, since 12px body text is the one place the reference trades legibility for density.

---

## 4. Colour system

| Token | Hex | Usage | Occurrences in sheet |
|---|---|---|---|
| Surface | `#fff` | page/card background | 515 |
| Text strong | `#141414` | headings, TOC, active fill | 169 |
| Text body | `#36424b` | body copy | 39 |
| Text secondary | `#707070` | breadcrumbs, pagination hover | 26 |
| Text tertiary | `#817c7b` | expand/collapse control | — |
| Muted | `#a5a09d` | prev/next label default | — |
| Border subtle | `#f4f4f2` | `main .content-inner` left rule | 52 |
| Border medium | `#c8c2be` | h2 underline, card shadow | — |
| Border warm | `#ded9d6` | left-margin rule | — |
| Surface alt | `#f5f5f5` | breadcrumb pill, panel footers | 30 |
| Sticky header bg | `#37424b` | fixed scroll header | — |
| **Brand accent** | `#fa582c` / `#f95633` | links, underline rules, hover fills | 88 + 40 |
| Visited | `#962d10` | visited sidebar links | — |

**No gradients** are used in the documentation chrome. Shadows are used in exactly one place:
`.book-group { box-shadow:0 3px 4px 1px #c8c2be; border-radius:24px; padding:25px 15px }`.
The palette is a warm neutral grey ramp, not a cool blue-grey.

**For our portal:** keep the near-black `#141414` / warm-grey ramp structure and the single-accent
discipline, but substitute a neutral project accent (restrained blue) for the orange, per the design brief.

---

## 5. Left sidebar — behaviour

**Composition (top → bottom):** collapse toggle · filter label + icon · filter input · Expand-all /
Collapse-all · book title (h3) · scrollable tree.

- **Rows:** `border-radius:5px; line-height:1.1; padding:4px 0; margin:2px 0`, and the row is a flex
  container `.toc-dropdown { display:flex; flex-direction:row; align-items:center; justify-content:space-between; padding:1px 2px }`.
  Note `flex-direction:row-reverse` is the generic default and is overridden to `row` inside the left aside —
  i.e. the disclosure chevron sits **before** the label in the sidebar, after it elsewhere.
- **Indentation:** `padding-left:16px` per nesting level (`.nested-list li > .nested-list`, `> .toc-dropdown`, `> a`),
  with `padding-left:15px` on the list itself.
- **Active page:** `background-color:#141414; color:#fff; border-radius:5px` — a solid dark pill, not a
  left border or tinted background. Nested anchor inside goes `#fff`, visited `#f4f4f2`.
- **Hover:** `text-decoration:none` only — no background change on hover; the design relies on the
  active pill for feedback. (We will add a subtle hover surface; hover-invisible fails usability review.)
- **Expand/collapse animation:** pure CSS max-height —
  `max-height:0` → `.open{5000px}` / `.open-medium{10000px}` / `.open-large{15000px}`,
  `transition:max-height .9s ease-in-out`. Three size buckets exist because a single max-height can't
  serve both short and very long groups. **We will use a proper height-auto/grid-rows technique instead**;
  0.9 s is also far too slow for a nav interaction.
- **Independent scroll:** `.toc-scrollarea` is a custom scrollbar shell (`scroll-wrapper scrollbar-outer`),
  capped at `500px` on mobile and at `180px` for search results.
- **Sticky:** inherited from `.td-split-banner aside { position:sticky; top:0 }`.
- **Collapsible entirely:** `.aside-close` drives `min-width:0; max-width:0` with a `.toggle-aside`
  handle that reparks itself at `right:-17px`.

**Search / filter**
- `.search-toc-label` (flex, `font-weight:500`, `margin-bottom:10px`) with a 20×20 filter icon, `margin-right:5px`.
- Input is a Coveo "magic-box" with ghost text, a clear affordance (`.magic-box-clear`) and an icon button
  (`height:40px; border:1px solid #141414; background:#fff`, square inner corners).
- Filtering toggles `.keyword` / `.no-keyword` classes on list items (`display:inline-block!important` /
  `display:none!important`) — i.e. **client-side show/hide over the existing tree, preserving hierarchy
  context**, rather than producing a flat result list. This is the behaviour the PRD's Journey B expects.

---

## 6. Breadcrumbs

`ol.breadcrumbs > li.breadcrumb-list-item > a.breadcrumb-link`, last item carries `.active`.

- `background:transparent; margin:0; padding:0; font-weight:400`
- Links `11px` / `#707070`
- Separator via `::before { content:"|\00a0"; font-size:10px; color:#707070 }`, suppressed on `:first-child`
- Items are `display:inline-block`
- Sits in `.detail-breadcrumb-download`, a flex row sharing space with the Download-PDF action;
  `margin-bottom:15px`
- Live trail on the audited page: `Home | Strata Cloud Manager | Strata Cloud Manager AIOps | AIOps`
  — 4 levels, the last being the current page and non-navigable.

---

## 7. Right rail — "On This Page"

- `h4` heading, then `.on-this-page-text-container { display:flex; flex-direction:column; position:relative }`.
- Links: Lato, `font-weight:300`, `#141414`, `line-height:15px`, `padding-bottom:13px`, `padding-left:15px`.
- **Active/hover state is weight-only:** `font-weight:bolder`. No colour change.
- **Moving indicator:** `.current-active { position:absolute; left:0; top:0; width:3px; height:30px;
  transition:all .2s ease }` — a 3px bar that slides down the rail to the active heading, and gets
  `.inactive { display:none }` when nothing is in view. Height is fixed at 30px regardless of item height.
- Heading anchors: each `h2`/`h3` in the article carries a hidden copy-link icon
  (`.on-this-page-link-id { opacity:0 }`) revealed on heading hover, with a
  "Copy link to this section" tooltip and `Copied!` / `Copy failed!` states.
- Below OTP, the rail carries **related-documentation cards** (`.book-group`):
  `border-radius:24px; box-shadow:0 3px 4px 1px #c8c2be; padding:25px 15px`, a 14px `h3` heading,
  a 3px × 75px rule under it, and a list of 12px links.

---

## 8. Previous / Next

`.book-detail-pagination { display:flex; justify-content:space-between; text-transform:uppercase }`
— but inside the article the transform is reset: `main .content-inner .book-detail-pagination { text-transform:none }`.

- Each half is `width:50%`, `border:1px solid transparent`, `padding:3px` — so the two cells are
  equal-width targets that reveal a border on interaction.
- Link colour `#a5a09d`, hover `#707070`, `text-decoration:none` on hover.
- Two-line content: label row (`Previous` / `Next`) above the target page title
  (`.pagination-prev-title` / `.pagination-next-title`).
- Icon: 18×18 `i` with `margin:0 10px; padding:0 10px`, whose `::before` draws a **circle**
  (`border-radius:50%; border-width:2px; padding:7px`, centred by `translate(-50%,-50%)`) with a
  10×10 SVG chevron centred inside it.
- Rendered twice: `.btm-pagination.top-pagination` above the body, `.btm-pagination` below
  (`padding-bottom:30px`, `hr` with zero vertical margin as a divider).
- Live example: `Previous — Delete Favorites` / `Next — Regions for Strata Cloud Manager`,
  i.e. ordering follows the flattened TOC across folder boundaries, not just within a folder.

---

## 9. Article content components

| Component | Treatment |
|---|---|
| `h1.title` | hidden (`display:none`) — page title comes from the header row |
| `h2.title` | `border-bottom:1px solid #c8c2be; margin-top:50px; font-weight:400` |
| `h3.title` | `margin:30px 0 20px`; 3px × 75px accent bar via `::after { bottom:-10px; left:0 }` |
| `.shortdesc` | **`display:none`** in the article — the intro is surfaced elsewhere, not inline |
| Paragraph `.p` | `margin-bottom:10px` |
| Note / callout | `border:1px solid #141414; border-radius:15px; display:flex; margin:10px 0;` inner `padding:10px 10px 10px 15px` |
| Note icon strip | `::before` — `background:#141414; color:#fff; padding:0 3%; border-radius:15px 0 0 15px; align-items:center` (a full-height dark gutter on the left) |
| Note variants | `.note` (default), `.tip`, `.warning`, `.caution`, `.fastpath`, `.other` — differentiated **only** by the `content` glyph (Material Icons codepoints), not by colour |
| Note inside table | `flex-direction:column`, radius flips to `border-top-right-radius:15px` |
| Code `pre.screen` | `font-size:12px`; `.userinput` `font-weight:700; color:#000` |
| Inline code `.tt` | `background:#141414; color:#fff; border-radius:14px; padding:2px 8px 3px` — a dark pill |
| Tables | `border-collapse:collapse`, `td/th` `background:#fff`, `.table-bordered` `1px solid #ddd`, `.table-responsive { overflow-x:auto }` |
| Numbered procedures | `ol.steps .step { margin-left:90px }` with `::before { content:"STEP " counter(procedure-step) " -" }` and decorative 3px left/bottom connector bars |
| Last-updated | `.date.last-updated` block with a calendar SVG + "Updated on <date>", shown both in the article and in the sticky header |

**Notable:** callouts are monochrome-outlined, **not** colour-tinted. That is a deliberate low-noise
choice and it is worth copying — it keeps the reading column calm.

---

## 10. Header & documentation context

- Desktop `header.nav-header.container`: flex, `padding:20px 0 10px`, `border-radius:0 0 40px 40px`,
  `margin-left/right:0!important`.
- `.nav-main` is `display:flex; flex-grow:1; flex-wrap:wrap; justify-content:flex-end` with a
  `.nav-sub-header { display:flex; flex-basis:100% }` row that wraps onto a second line — this is the
  **documentation context bar**.
- `.nav-list` (product context): `display:flex; font-size:14px; width:100%`; items are `span`,
  `margin-right:25px; margin-bottom:15px; padding-top:7.5px; letter-spacing:.02em`, active `font-weight:600`.
  A clever no-reflow trick: `.nav-list span::after { content:attr(data-title); font-weight:900;
  height:0; visibility:hidden }` reserves the bold width so the row doesn't shift when a tab becomes active.
  **Worth copying.**
- `.nav-right`: search box, a search toggle button, the hamburger (`nav-open-sidemenu` → `.nav-hamburger`
  with three explicit line divs), and an assistant button.
- Logo section is a hover dropdown (`td-dropdown--hoverable`) listing languages.
- **Sticky scroll header** (`.dita-sticky-header`): `position:fixed; top:0; width:100%; background:#37424b;
  z-index:9999`, animates `max-height:0 → 200px` with `padding:0 → 15px 10px`, and carries the current
  page title, last-updated, a focus-mode toggle and the PDF download.

---

## 11. Responsive behaviour

**Breakpoints in use** (by frequency): `768px` (35 max / 33 min), `767px` (28), `1200px` (19), `992px` (19),
`480px` (7), `1600px` (6), plus `767.97px` / `991.97px` fractional variants.
Effectively a Bootstrap 3 grid: **xs <768 · sm ≥768 · md ≥992 · lg ≥1200**.

| Viewport | Behaviour |
|---|---|
| ≥1200px | Full three columns. Page gutters `margin:0 200px` on the header/breadcrumb band. |
| 992–1199px | Gutters drop to `15px`. Columns keep their fixed 350 / 280 widths. |
| 768–991px | Desktop nav (`visible-md`) still shown; asides may be collapsed via the toggle handles. |
| ≤768px | `.mobile-toc-row`, `.mobile-toc-title-row` become flex; `.mobile-toc { display:block; margin:15px 0 }` — the TOC moves **inline into the article**, above the content, as an expand/collapse block (`.mobile-toc-close { max-height:0; overflow:hidden }`, `transition:all .5s ease`, open `max-height:400px`). Toggle icon swaps `.svg-expand` / `.svg-collapse`. Sidebar top-level type drops 20px → 14px, book title 18px. |
| ≤767.97px | `#frameMaker .aside-right { display:block!important; width:100%; max-width:none }` — the right rail **stops being a rail and becomes a full-width stacked block** below the content, `background:#fff`, its collapse toggle hidden. Mobile TOC scroll cap `500px`. |
| ≤767px | `.mobile-toc-container { background:#fff; margin:35px -15px -35px; padding:15px 15px 10px }` — full-bleed against the card padding. |
| Mobile nav | `#pan_mobile_nav` (`hidden-md hidden-lg`) is a separate full-screen drawer with its own header (avatar, close button), a breadcrumb bar with a **back button**, sliding menu panes (`ul.nav-menu` + `ul.nav-menu.inactive`), and a bottom action/language area. It is a *drill-down* drawer, not a mirror of the desktop tree. |

---

## 12. Interaction inventory

| Interaction | Implementation |
|---|---|
| Sidebar group expand | class `.open` on `ul.nested-list`, CSS `max-height` transition `.9s ease-in-out` |
| Expand all / Collapse all | two spans in `.expansion-div`, `cursor:pointer`, 11px |
| Sidebar collapse (whole rail) | `.aside-close` → `max-width:0`, `transition:all .5s ease`, handle repositions to `right:-17px` |
| Right rail collapse | `.aside-close .aside-right-content { transform:scale(0) }` (scale, not width) |
| Filter | class toggle `.keyword` / `.no-keyword` on tree items — hierarchy preserved |
| Active TOC page | `.active > .toc-dropdown` → solid `#141414` pill |
| OTP scroll-spy | `.on-this-page-text.active` → `font-weight:bolder`; 3px `.current-active` bar translates with `transition:all .2s ease` |
| Heading anchor copy | hover reveals `.on-this-page-link-id`, tooltip via `::after`, `.copied` / `.copy-failed` states |
| Sticky page header | `.open` class toggles `max-height` on scroll |
| Smooth anchor scroll | `scroll-behavior:smooth` on OTP links; `html.dynamic-scroll { scroll-padding-top:85px }` |
| Mobile TOC | `.mobile-toc-close` max-height toggle, `.5s ease` |

---

## 13. What to copy, what to change

**Copy (structural DNA):**
1. Three-column flex with **sticky** (not fixed) asides at `top:0`.
2. 350 px left / 280 px right / fluid centre proportions.
3. Dense type scale with a large parent title (38px) above a smaller page title (20px).
4. Solid dark **pill** for the active sidebar page; 16 px indent per level.
5. Filter that hides non-matching nodes **in place**, preserving hierarchy.
6. Breadcrumbs at 11px, `#707070`, pipe separators, current page non-navigable.
7. Prev/Next rendered above **and** below the article, 50/50 split, two-line label+title, circular chevron.
8. OTP with a sliding 3px active indicator and weight-based (not colour-based) active state.
9. Monochrome outlined callouts with a dark icon gutter — no colour-tinted alert boxes.
10. Expand-all / Collapse-all controls above the tree.
11. `content:attr(data-title)` bold-width reservation on nav tabs to prevent reflow.
12. Mobile: TOC collapses inline above the article; right rail unstacks to full width below content.

**Change (reference weaknesses / brand constraints):**
1. **12px article body → 15–16px.** The reference's article copy is smaller than its own chrome; it is
   the weakest accessibility point on the page and the design brief asks for comfortable long-form reading.
2. **Sidebar hover has no visual response.** Add a subtle surface hover — required for FR-02/FR-09.
3. **0.9 s max-height expand.** Replace with a `grid-template-rows: 0fr → 1fr` (or measured-height)
   transition at ~180 ms, and honour `prefers-reduced-motion`. The reference's three `open-medium` /
   `open-large` buckets are a workaround we don't need to inherit.
4. **Brand accent `#fa582c` and all PAN naming/logos** — replaced with a neutral project identity and a
   restrained blue link/active accent per UI-UX-DESIGN-BRIEF §4.
5. **Duplicated TOC markup** (desktop aside + `.mobile-toc`) — one component, responsive placement.
6. **`html { font-size:10px }`** — an anti-pattern that breaks user font-size preferences. We use a
   normal 16px root with a token scale.
7. **Bootstrap-3 fractional breakpoints** (`767.97px`) — use a clean `640 / 768 / 1024 / 1280` Tailwind scale.
8. `text-transform:uppercase` set then unset on pagination — set it once, correctly.
9. Visited-link colour on nav items (`#962d10`) — noisy in a tree; omit.
10. Coveo/AEM machinery (magic-box, scrollbar-outer custom scrollbars, `parbase` wrappers) — not
    reproduced; native scrolling and a plain controlled input do the same job with none of the weight.

---

## 14. Measurement reference table (for visual QA)

```
root font-size ............ 10px  (we use 16px)
body ...................... 14px / 1.4286 / #36424b
article body .............. 12px  (we use 15px)
sidebar page link ......... 11px / #141414
sidebar group ............. 20px / #141414
breadcrumb ................ 11px / #707070   sep "|" 10px
page h1 ................... 20px / 400
parent title .............. 38px / 400
left rail ................. 350px
right rail ................ 280px
right rail inner .......... 280px
content well padding ...... 15px
content well radius ....... 24px 24px 0 0
header padding ............ 20px / 10px
header radius ............. 0 0 40px 40px
sidebar row padding ....... 4px 0, radius 5px, margin 2px 0
sidebar indent ............ 16px per level
active pill ............... #141414 bg / #fff text / radius 5px
h2 rule ................... 1px solid #c8c2be, margin-top 50px
h3 accent bar ............. 3px x 75px, bottom -10px
callout ................... 1px solid #141414, radius 15px, inner pad 10/10/10/15
inline code ............... #141414 bg, #fff text, radius 14px, pad 2px 8px 3px
OTP link .................. weight 300, line-height 15px, pad-bottom 13px, pad-left 15px
OTP indicator ............. 3px x 30px, transition .2s
prev/next ................. 50% each, colour #a5a09d, hover #707070, circular 18px icon
scroll-padding-top ........ 85px
breakpoints ............... 480 / 768 / 992 / 1200 / 1600
```
