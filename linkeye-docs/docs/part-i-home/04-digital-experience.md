# 4. Digital Experience

Digital Experience Monitoring (DX) analyzes the full delivery path between
a site and a business-critical application, so when performance drops,
you know immediately whether the cause sits inside your network, with
your ISP, or at the application provider.

## Site DX — Filters and Summary

Filter by Zones or Site Groups, then read the Sites Summary dashboard:
total, good, partial good, poor, and bad site counts, along with the
count of DX agents are down (with names) and the number of sites that are
not monitored.

## Site Experience Quadrant

Every site plots in to one of four states: **Good, Partial Good, Poor,**
or **Bad,** across all business units. Click a site in the quadrant to
open its Site-Level Digital Experience Dashboard.

## Site-Level Digital Experience Dashboard

Selecting an application from the Applications list (Internal or SaaS)
updates every panel below it to that application's data.

| Section | Shows | Time filters |
|---|---|---|
| Network Quality | Latency, jitter, packet loss graphs | 1h / 6h / 12h / 24h / 1w |
| Network Path | Tracepath analysis plotting exactly where experience degrades — campus network, ISP, or cloud application | — |
| TCP Session | Connection status, connection latency (RTT), packet success rate | 1h / 6h / 12h / 24h / 1w |
| DNS | Availability and response time | 1h / 6h / 12h / 24h / 1w |

---

**Q. How do I interpret a Digital Experience score breakdown?**

DX status is a direct roll-up of the four dashboard sections above:

- **Good:** Network Quality, Network Path, TCP Session, and DNS are all normal.
- **Partial Good / Poor:** One or more metrics show degradation.
- **Bad:** The application is effectively unreachable.

To troubleshoot a site, open its Site-Level Dashboard and read the
sections sequentially to identify latency/loss, locate the bottleneck in
the path, and rule out session or resolution issues.
