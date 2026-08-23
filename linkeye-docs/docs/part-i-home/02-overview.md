# 2. Overview

Overview is the landing page after sign-in and the fastest way to answer
"is my network healthy right now?" across every site, region, and
business unit.

## Site Health Summary

A row of live counters gives the top-line status of every site under the
selected customer:

| Counter | What it tells you |
|---|---|
| Total Sites | All sites onboarded under the current customer. |
| Up Sites | Sites currently reporting healthy connectivity. |
| Single-homed Sites | Sites with one active WAN path. Click to see the list. |
| Multi-homed Sites | Sites with redundant WAN paths. Click to see the list. |
| Down Sites | Sites with no reachable path. Click to see the list. |
| Not Monitored | Onboarded sites without active monitoring. Click to see the list. |
| Paused | Sites intentionally taken out of monitoring. Click to see the list. |

## Site Health Overview Toggle

A view toggle switches the health summary between **Sites** and
**Asset-level views** (Links, Access Points, SSIDs, Clients, and
Applications), so you can pivot from "how many sites are down" to "how
many links / APs / clients are affected" without leaving the page.

## Overall Uptime and Site Performance Summary

Overall Uptime shows a single blended percentage across all monitored
sites. Beside it, Site Performance Summary buckets underperforming sites
into three severity tiers, each downloadable as its own list:

| Tier | Threshold | Drill-down shows |
|---|---|---|
| Critical | 0% uptime | List of sites, uptime %, downtime duration, recommended action, and asset health (Internet / Edge Devices / Network) for the selected site |
| Bad | 1–59% uptime | Same breakdown as Critical |
| Poor | 60–95% uptime | Same breakdown as Critical |

## Data Collectors

A live count of active data collectors deployed across your infrastructure.

## Zone and Site Group Filter

Filter by Zone or Site Group (Stores, Warehouses, HQ, Data Centers, etc.)
to instantly re-scope the counters and the world map to that segment of
your business.

## Interactive World Map

The map plots every site geographically, clustered by region.

- **Zoom in/out** to move between global, regional, and site-level views.
- **Hover a cluster** to see the site count and site status for that region.
- **Click a cluster** to open the list of sites in that region, each with
  status (good/bad/critical/poor), asset count, and an Asset Health tab
  showing device and link up/down counts.
- **Hover or click** an individual site for the same detailed pop-up,
  scoped to one site.
- **Full-screen toggle** expands the map for war-room or NOC-wall use.

## Bad & Poor Sites Panel

Aside panel keeps the current Bad and Poor sites visible without needing
to open the map. Select **View More** to open the complete filtered list.
