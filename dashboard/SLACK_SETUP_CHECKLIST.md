# Slack Webhook Setup — Visual Checklist

Follow these steps **in order**. Each step has what you'll see and what to click.

---

## ✅ STEP 1: Open Slack Workspace Settings

**What you'll do:** Open your Slack workspace settings

**On Desktop Slack:**
- Look at the **top left corner**
- You'll see your **workspace name** (e.g., "Wine-Now" or "WNLQ9")
- **Click on it**

**What you should see:**
```
A dropdown menu appears with options like:
- Edit workspace
- Invite people
- Settings & Administration  ← CLICK THIS
- Preferences
- Help & feedback
```

**👉 Click "Settings & Administration"**

---

## ✅ STEP 2: Go to Manage Apps

**After clicking "Settings & Administration":**
- You'll see a new page with workspace settings
- Look for **"Manage apps"** button (usually in the left sidebar or near the top)

**What you should see:**
```
You're on a page that says something like:
"Workspace Settings" or "Administration"

Find "Manage apps" or "Apps" in the sidebar
```

**👉 Click "Manage apps"**

---

## ✅ STEP 3: Search for Incoming Webhooks

**After clicking "Manage apps":**
- You'll see an app directory/search page
- Look for a **search box** at the top
- Type: `Incoming Webhooks`

**What you should see:**
```
Search results show:
"Incoming Webhooks" 
(made by Slack, not a third-party app)
```

**👉 Click on "Incoming Webhooks"**

---

## ✅ STEP 4: Install Incoming Webhooks

**After clicking Incoming Webhooks:**
- You'll see a page about the app
- Look for a button that says **"Install"** or **"Add to Slack"**

**What you should see:**
```
A page describing Incoming Webhooks
with a green button saying:
"Add to Slack" or "Install" ← CLICK THIS
```

**👉 Click the button**

---

## ✅ STEP 5: Authorize Permissions

**After clicking Install:**
- Slack might ask for permission
- You'll see a page asking "Incoming Webhooks would like to post to your workspace"
- There's a button saying **"Authorize"** or **"Allow"**

**What you should see:**
```
"You are installing Incoming Webhooks"
"This will allow..."
Big green button: "Authorize" ← CLICK THIS
```

**👉 Click "Authorize"**

---

## ✅ STEP 6: Add New Webhook to Workspace

**After authorization:**
- Slack will show you the Incoming Webhooks app page
- Look for a button that says **"Add New Webhook to Workspace"**
- If you don't see it, scroll down

**What you should see:**
```
Page shows: "Webhooks"
With a button or link that says:
"Add New Webhook to Workspace" ← CLICK THIS
or
"Create New Webhook"
```

**👉 Click this button**

---

## ✅ STEP 7: Choose Your Channel

**After clicking "Add New Webhook":**
- A dropdown will appear asking: **"Which channel would this webhook post to?"**
- Type or select: `#content-workflow`
- (If the channel doesn't exist, create it first: right-click channel list → "Create a channel" → name it "content-workflow")

**What you should see:**
```
A dropdown showing channels:
# general
# random
# content-workflow ← SELECT THIS (or create it)
```

**👉 Select "#content-workflow"**

---

## ✅ STEP 8: Create the Webhook

**After selecting the channel:**
- There's a button at the bottom that says **"Create New Webhook"** or **"Add Webhook"**

**What you should see:**
```
A form with the channel selected
And a green button: "Create New Webhook" ← CLICK THIS
```

**👉 Click "Create New Webhook"**

---

## ✅ STEP 9: Copy Your Webhook URL

**After creating the webhook:**
- Slack will show you a **long URL** that starts with:
  ```
  https://hooks.slack.com/services/T.../B.../XXX...
  ```
- There's usually a **"Copy"** button next to it

**What you should see:**
```
"Webhook Details"
URL: https://hooks.slack.com/services/T.../B.../XXX...
[Copy] button ← CLICK TO COPY
```

**👉 Click the "Copy" button to copy the URL**

---

## ✅ STEP 10: Save It to .env.local

**After copying the URL:**

1. Open this file: `/Users/admin/WNLQ9 CONTENT/dashboard/.env.local`
2. Find this line:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/placeholder
   ```
3. Replace `placeholder` with your actual webhook URL you just copied
4. It should look like:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
   ```
5. **Save the file**

---

## ✅ STEP 11: Restart Dev Server

1. In your terminal, go to the dashboard folder:
   ```bash
   cd /Users/admin/WNLQ9\ CONTENT/dashboard
   ```
2. Stop the dev server (press `Ctrl+C` if it's running)
3. Start it again:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

---

## ✅ STEP 12: Test the Webhook (Optional)

1. Go to http://localhost:3000/settings
2. Click **"Test Slack Webhook"**
3. Go to your Slack workspace and check `#content-workflow`
4. You should see a test message! 🎉

---

## 🚨 If You Get Stuck

### "I don't see 'Settings & Administration'"
- Make sure you clicked your **workspace NAME** (top left), not the Slack logo
- You should see a dropdown menu with your workspace name at the top

### "I can't find 'Manage apps'"
- Try this direct link (replace YOUR-WORKSPACE with your workspace name):
  ```
  https://YOUR-WORKSPACE.slack.com/apps/manage
  ```

### "Incoming Webhooks isn't showing up"
- Make sure you searched for **"Incoming Webhooks"** (exact spelling)
- It should be an official Slack app (made by Slack, not a third-party)

### "I don't see 'Add New Webhook to Workspace' button"
- Try refreshing the page (Cmd+R or Ctrl+R)
- Or try this direct link:
  ```
  https://YOUR-WORKSPACE.slack.com/apps/A0F82E8B4/incoming-webhooks?tab=webhooks
  ```

---

## ✅ Done!

Once you complete all 10 steps and save the webhook URL to `.env.local`, your Slack integration is ready.

You can now:
- Create briefs → They'll notify #content-workflow
- Generate HTML → Slack notification
- Publish to Magento → Slack notification

---

**Stuck? Let me know which step you're on and what you see on the screen!**