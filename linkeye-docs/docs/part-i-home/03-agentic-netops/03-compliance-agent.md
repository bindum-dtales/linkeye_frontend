# 3.2 Compliance Agent

Compliance tracks two risk surfaces across your device fleet: hardware
lifecycle and software vulnerability. Both share a common filter bar —
**Zone, Site Group, Sites, Vendor, Asset Type,** and **Model Number.**

## Hardware — EOS / EOL

A visual dashboard (pie or bar, depending on the active filter) summarizes
End-of-Support and End-of-Life exposure by vendor, asset type, or model.
Below it, the Inventory Table lists every affected device with its EoS
and EoL dates.

- Use Column Settings to show, hide, or pin columns.
- Download the table as CSV or PDF.
- Clicking a segment of the chart automatically applies the same filter
  to the table.

## Software — Vulnerabilities

The default view groups vulnerabilities by **Severity** — Low, Medium,
High, Critical — with secondary filters for Vendor, Firmware Version, and
Asset Type. Clicking a severity segment filters the table below it.

| Column | Contains |
|---|---|
| Device Name / Location | Which asset, and where |
| Vendor Model / Firmware Version | What's installed |
| Vulnerabilities Count | How many CVEs apply to this device |
| Vulnerability Details | Click to open CVE ID, vulnerability type, severity, and description |

Table Settings and Download work identically to the Hardware view.

---

**Q. How do I set correlation rules between WAN and Campus alerts?**

The RCA Agent correlates telemetry automatically; it doesn't require you
to hand-build a rule set. It cross-references link-level tests (WAN
interface state, provider reachability) with device- and site-level
signals from the Network layer, so a single incident on the WAN side
surfaces one RCA summary rather than separate, disconnected alerts from
the campus device and the link.

What you configure directly is the alerting and escalation logic around
that correlated result: thresholds, recipients, and escalation tiers
under Settings → Alert Configuration and per-site escalation contacts
under Settings → Onboarding → Site Management.
