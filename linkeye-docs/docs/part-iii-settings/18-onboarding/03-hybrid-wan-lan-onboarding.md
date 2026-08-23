# 18.3 Hybrid (WAN & LAN) Onboarding

A complete end-to-end setup covering both external WAN links and internal
LAN infrastructure.

## Step 1: Create Locations for Both Networks

**Bulk method**

1. Go to Settings → Onboarding → Assets Manager.
2. Upload Multiple Edge Devices with Locations — this handles both site
   creation and edge device mapping.

**Manual method**

1. Go to Settings → Onboarding → Site Management.
2. Click **Add Location**.
3. Select **Both LAN & WAN** and fill in the details.
4. Add your LAN subnet.
5. Configure alert thresholds and Level 1, 2, and 3 escalation matrix
   emails.
6. Click Save.

## Step 2: Add WAN Edge Devices

> **Skip if already done**
>
> If you completed the bulk upload in Step 1, this step is already
> covered.

1. Go to Settings → WAN Management → WAN Edge Device.
2. Select your hybrid site, enter device/vendor details (Fortinet,
   Cisco, Firewall, Router, etc.), and input SNMP/SSH credentials.
3. Click Save.

## Step 3: Add WAN Links

**Bulk method**

Go to Settings → Onboarding → Assets Manager and use **Upload Multiple
Links**.

**Manual method**

1. Go to Settings → WAN Management → WAN Links.
2. Click **Add Link**, select site and link type (ILL, MPLS, etc.).
3. Enter vendor details and click Save.

## Step 4: Map LAN Network Credentials

**Bulk method**

Go to Settings → Onboarding → Assets Manager and use the **Upload
Multiple Credentials** tool (4th tab).

**Manual method**

1. Go to Settings → Onboarding → Network Credentials.
2. Navigate through the SNMP, SSH, and API tabs to add the credentials
   needed to monitor your local subnets.
3. Click Save for each.

## Other Onboarding Tools

| Tool | Purpose |
|---|---|
| Data Collector | Reconfigure, scan for subnets, disable, or delete a collector — handled separately for Internal Probes and Digital Experience collectors |
| Site Management | Add/manage locations, add subnets, edit or delete sites and business units |
| Assets Manager | Bulk upload for links, edge devices, locations, and credentials; download sample CSVs |
| Network Credentials | SNMP, SSH, and API credential management — add, edit, delete |

> **Support**
>
> If you encounter any issues or need assistance at any stage, contact
> the CS team at **csteam@linkeye.team**. They will validate your setup
> and provide guidance to ensure a successful onboarding.
