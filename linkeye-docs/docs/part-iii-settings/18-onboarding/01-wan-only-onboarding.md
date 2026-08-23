# 18.1 WAN-Only Onboarding

Onboards WAN Edge devices and external transport circuits — ILL,
Broadband, MPLS.

## Step 1: Add Locations and WAN Edge Devices

**Bulk method**

1. Go to Settings → Onboarding → Assets Manager.
2. Select **Upload Multiple Edge Devices with Locations**.
3. Click **Download Sample XLSX**, fill in device and location details,
   and upload the saved file. Sites and devices are created
   automatically.

**Manual method**

1. Create the site:
    - Go to Settings → Onboarding → Site Management.
    - Click **Add Location**, select **WAN**, and fill in the details —
      including Level 1, 2, and 3 escalation matrix emails and alert
      thresholds.
    - Click Save.
2. Add the device:
    - Go to Settings → WAN Management → WAN Edge Device.
    - Click **Add Device**, select the site you just created, enter
      device details (Vendor, Device Type), and add SNMP/SSH
      credentials.
    - Click Save.

## Step 2: Add WAN Links

**Bulk method**

1. Go to Settings → Onboarding → Assets Manager.
2. Click **Upload Multiple Links**.
3. Download the Sample XLSX, fill in link details, and upload — links
   map automatically to their sites.

**Manual method**

1. Go to Settings → WAN Management → WAN Links.
2. Click **Add Link**.
3. Select Link Type (ILL, Broadband, MPLS, etc.) and Site.
4. Fill in link details and Vendor, then Save.
