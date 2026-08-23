# MASTER CLAUDE PROMPT --- BUILD THE DOCUMENTATION PORTAL

You are going to build a production-quality documentation portal.

## Reference

Use this as the primary visual, structural and interaction benchmark:
https://docs.paloaltonetworks.com/strata-cloud-manager/aiops/about

I want the portal to be extremely close in: - overall documentation-site
structure - header/context hierarchy - left navigation behavior -
article layout - breadcrumbs - right-side On This Page navigation -
previous/next navigation - typography hierarchy - spacing and density -
borders and subtle interaction states - responsive behavior -
documentation information architecture

Do NOT copy Palo Alto Networks logos, branding, proprietary assets, or
documentation text. Build an original portal with the same class of UX
and layout.

## Required navigation

The left navigation must use these top-level names exactly:

Folder 1 Folder 2 Folder 3 Folder 4 Folder 5 Folder 6 Folder 7 Folder 8
Folder 9 Folder 10 Release Notes

Make the navigation data-driven so I can rename these later without
rewriting components.

## Files I am giving you

Before writing application code, read these files completely:

1.  CLAUDE.md
2.  PRD.md
3.  TRD.md
4.  UI-UX-DESIGN-BRIEF.md

Also inspect the provided `claude.zip`. It contains my Claude skills.
Use the relevant skills, especially React, TypeScript, Tailwind,
accessibility, design, performance and documentation-related skills. Do
not blindly use every skill.

## Mandatory first phase --- DO NOT CODE YET

1.  Inspect the entire existing repository.
2.  Identify the current framework, routing, styling system, package
    manager and existing components.
3.  Open the reference documentation URL.
4.  Perform a visual/structural audit.
5.  Create `reference-audit.md`.
6.  Explain the current repository architecture and exactly what will be
    changed.
7.  Identify anything that must be preserved.
8.  Only after this audit, begin implementation.

## Build requirements

Create: - enterprise documentation header - documentation
context/navigation - expandable left sidebar - sidebar search/filter -
breadcrumbs - article reading layout - On This Page right rail - code
blocks - callouts - tables - previous/next navigation - responsive
mobile navigation - footer - deep-linkable documentation pages

Use a typed documentation schema and separate content from components.

## Quality bar

This must NOT look like: - a generic React dashboard - a SaaS landing
page - a random documentation template

It must look like a mature enterprise technical documentation platform.

Prioritize visual accuracy, spacing, hierarchy, navigation density and
usability over adding unnecessary features.

## Important engineering constraint

If the repository already has a working application: - do not destroy
it - do not replace working APIs - do not change backend behavior
unnecessarily - preserve existing routes unless the new documentation
portal is specifically replacing them - integrate into the existing
stack

If the project is empty, choose a clean React + TypeScript + Vite
architecture.

## Final QA

Before saying complete: - run build - run typecheck/lint if configured -
test every top-level folder - test Release Notes - test nested
navigation - test search - test breadcrumbs - test On This Page - test
previous/next - test mobile navigation - test direct deep URLs - test
browser refresh - check console for errors - perform a final visual
comparison with the reference - fix discrepancies you find

Do not stop after creating a rough first pass. Iterate until the portal
has a polished enterprise documentation feel.

## Start now

First read the four supplied specification files and inspect the
repository. Then perform the reference audit. Do not begin
implementation until those two steps are complete.
