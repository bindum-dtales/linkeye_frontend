# 9.2 Config Changes

A table view with customizable columns tracks every detected
configuration change. Selecting **View** on an entry opens the
Configuration Summary — a difference view for that event date, with
changes highlighted.

---

**Q. What does each field in the config-history view mean?**

- **Device / Site:** The asset the configuration change was detected on, and where it's located.
- **Change Detected On:** The timestamp of the backup scan that first captured the difference.
- **Previous / Current Configuration:** The two backup snapshots being compared — the Difference View shows both side by side.
- **Change Summary:** A condensed description of what changed between the two snapshots (added, removed, or modified lines).
- **Highlighted Differences:** Within the Difference View itself, added and removed configuration lines are visually distinguished so you can scan a large config file for just the delta.

Column Settings on the Config Changes table let you show, hide, or reorder
any of these fields to match how your team reviews changes.
