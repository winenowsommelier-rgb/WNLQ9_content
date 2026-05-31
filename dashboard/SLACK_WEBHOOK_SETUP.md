# Slack Webhook Setup — Detailed Step-by-Step

## Problem: Can't Find Incoming Webhooks?

The issue is usually the menu path. Here's the **exact** way:

### Step 1: Open Slack (Desktop or Web)

Go to your Slack workspace. Make sure you're logged in to the right workspace (not DM, not another workspace).

### Step 2: Open Slack App Directory

**Desktop:**
- Click your **workspace name** (top left)
- Click **"Settings & Administration"** → **"Manage apps"**

**Web:**
- Click your **workspace name** (top left)
- Go to **Workspace settings** → **Apps & Integrations** → **Manage** (or just go directly to: `https://YOUR-WORKSPACE.slack.com/apps/browse/category/use_cases`)

### Step 3: Search for "Incoming Webhooks"

1. In the app directory, search for **"Incoming Webhooks"**
2. Click on **"Incoming Webhooks"** (it's an official Slack app, not a third-party one)

### Step 4: Click "Install" or "Add"

- If you see **"Add to Slack"** — click it
- If you see **"Install"** — click it
- Confirm permissions if prompted

### Step 5: Create a New Webhook

After installation, you'll see a page that says **"Webhooks"** with a list (probably empty).

Click **"Add New Webhook to Workspace"** (or **"Create New Webhook"**)

### Step 6: Select Channel

A dropdown will appear asking:
> "Which channel should this webhook post to?"

Select **`#content-workflow`** (or create it first if it doesn't exist)

Click **"Create New Webhook"** or **"Authorize"**

### Step 7: Copy the Webhook URL

A long URL will appear:
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Copy this entire URL** (use the copy button, don't manually copy)

### Step 8: Save to .env.local

Paste it into `.env.local`:
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

### Step 9: Test the Webhook (Optional)

Run this in your terminal to test:
```bash
curl -X POST \
  -H 'Content-type: application/json' \
  --data '{"text":"Test from WNLQ9 Dashboard"}' \
  https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

You should see the message appear in `#content-workflow` immediately.

---

## Still Can't Find It?

### Common Issues:

**Issue 1: "I don't see 'Settings & Administration'"**
- Make sure you're clicking your workspace NAME (top left), not the workspace icon
- You should see a dropdown menu with your workspace name and other options
- Look for "Settings & Administration" or "Manage workspace"

**Issue 2: "I see 'Apps' but not 'Incoming Webhooks'"**
- You might be in the wrong section. Try this direct link (replace YOUR-WORKSPACE):
  ```
  https://YOUR-WORKSPACE.slack.com/apps/A0F82E8B4/incoming-webhooks
  ```

**Issue 3: "Permission Denied" or "You don't have access"**
- You need workspace admin or app admin permissions
- Ask your Slack workspace owner to install Incoming Webhooks for you
- Then they can give you the webhook URL

**Issue 4: "I installed it but don't see a place to create webhooks"**
- You might have installed it but not yet accessed it
- Go to the Incoming Webhooks app page and look for **"Add New Webhook to Workspace"** button
- If you don't see a button, try: `https://YOUR-WORKSPACE.slack.com/apps/A0F82E8B4/incoming-webhooks?tab=install`

---

## What NOT To Do

❌ Don't look for "Webhooks" under "Integrations" (that's for something else)  
❌ Don't try to create a Slack bot or app (Incoming Webhooks is simpler)  
❌ Don't paste the webhook URL into Slack chat (it's secret!)  

---

## Still Stuck?

Post a screenshot showing:
1. Which Slack menu you're in
2. What you see on the screen

I'll walk you through from there.