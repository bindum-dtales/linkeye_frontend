# 3.1.1 RCA Agent - Internet

The Internet view of the RCA Agent watches every WAN link and surfaces
the ones that need attention first.

## Links Summary

| Counter | Table it opens |
|---|---|
| Total Links | Total Links table — every monitored link |
| Down Links | Down Links table, with RCA Summary (RCA + Plan of Action) and an Insights panel per link |
| Poor Links | Poor Links table, with RCA Summary |
| Flapping Links | Flapping Links table |

## Total Entries and Co-Pilot Insights

Every row carries an **RCA Summary** column (root cause + plan of action)
and an **Insights** column. Opening Insights for a link expands the
Co-Pilot Insights panel:

- **Passed tests:** reachability and authentication checks that succeeded.
- **Failed tests:** the specific check that failed (for example, WAN
  interface up but internet not reachable from customer equipment).
- **Root Cause Analysis:** a plain-language statement of where the fault
  most likely sits (last mile vs. middle mile vs. provider side).
- **Plan of Action:** the recommended next step, including whether to
  escalate to the service provider.

Use the settings icon above the table to open column customization and
choose which fields the table displays.

---

**Q. How do I interpret the Insights about a specific incident?**

Insights is scoped to the incident you're already viewing. Open the
Insights column on the relevant row in RCA Agent → Internet, or the
Insights button on a **Down** or **Poor** link. It returns the
passed/failed tests, root cause, and plan of action for that specific
link.
