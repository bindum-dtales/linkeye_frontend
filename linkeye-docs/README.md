# LinkEye User Guide — Documentation Portal

This repository holds the LinkEye "Agentic AI NetOps Platform" User Guide,
converted from PDF into a nested Markdown tree suitable for any
GitBook-style documentation portal (GitBook, Docsify, plain GitHub
rendering, etc.).

## Structure

All content lives under [`docs/`](docs/). Start at
[`docs/README.md`](docs/README.md) or the full table of contents at
[`docs/SUMMARY.md`](docs/SUMMARY.md).

Sections with sub-pages are their own folders (deep nesting), each with
its own `README.md` as the section landing page, e.g.:

```
docs/
├── README.md                  ← guide landing page
├── SUMMARY.md                 ← full table of contents / nav
├── 01-introduction/
├── part-i-home/
│   └── 03-agentic-netops/
├── part-ii-infrastructure/
│   ├── 07-assets-health/
│   ├── 09-cmdb/
│   ├── 10-inventory/
│   └── 11-logs/
├── part-iii-settings/
│   └── 18-onboarding/
└── appendices/
```

## Using with a doc portal

- **GitBook**: point GitBook at this repo/`docs` folder — it reads
  `SUMMARY.md` natively for navigation.
- **Docsify / plain GitHub Pages**: `docs/README.md` and folder
  `README.md` files render as index pages automatically on GitHub.
- **MkDocs / Docusaurus**: the same tree works with light config changes
  (a `mkdocs.yml` nav or Docusaurus `sidebars.js` built from
  `SUMMARY.md`) if you switch frameworks later.
