# 17. Alert Configuration

Alert Configuration governs who gets notified, how, and under what
threshold — the layer that turns a correlated RCA finding into an actual
notification.

## Alert Types

| Table columns | Serial No., Alert Type |
|---|---|
| Types | Link/Site Alerts, System Alerts, Network Alerts |

## Actions

- **Configure email recipients** per alert type.
- **Configure escalation rules:** the Level 1/2/3 escalation matrix
  referenced during site onboarding.
- **Instant Messaging Configuration:** add a phone number or a webhook
  for chat/SMS delivery.

## Global Utilization Thresholds

Edit the Utilization Critical Threshold and Utilization Warning Threshold
that drive device-level alerting across the platform.

## Polling Intervals

| Setting | Controls |
|---|---|
| Device Up/Down Cool Period | Delay before an up/down state change is confirmed |
| Device Up/Down Alert Cooldown | Minimum gap between repeat alerts for the same device |
| Device Status Polling Interval | How often device status is checked |
| Device Interface Metrics Polling Interval | How often interface-level metrics are collected |
| Device Regular Metrics Polling Interval | How often general device metrics are collected |
