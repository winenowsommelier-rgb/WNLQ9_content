# Git Workflow Guide — WNLQ9 Content

A plain-language guide to working locally and keeping GitHub in sync.

**Your repo:** https://github.com/winenowsommelier-rgb/WNLQ9_content (private)

---

## 1. How This Works (The Mental Model)

Think of it as **two copies** of your project:

| Copy | Where | What it's for |
|------|-------|---------------|
| **Local** | Your Mac (`/Users/admin/WNLQ9 CONTENT`) | Where you + Claude do all the work |
| **GitHub** | The cloud (private repo) | The backup + the "official" version + where new chats pull from |

You **always work locally.** GitHub only updates when you **push.** Nothing goes to GitHub automatically — you're always in control.

```
   YOUR MAC (local)                      GITHUB (cloud)
   ┌──────────────┐    git push  →      ┌──────────────┐
   │  work here   │                     │   backup +   │
   │  every day   │   ← git pull        │   official   │
   └──────────────┘                     └──────────────┘
```

---

## 2. The Daily Cycle (3 Commands)

Every work session follows the same simple rhythm:

### ① START — pull latest (get any updates)
```bash
git pull
```
Do this when you sit down to work. It grabs anything new from GitHub. (If you only ever work on this one Mac, there's usually nothing to pull — but it's a safe habit.)

### ② SAVE — commit your work (snapshot it locally)
```bash
git add -A
git commit -m "Short description of what changed"
```
`add -A` = stage all changes. `commit` = save a snapshot with a label. This is **local only** — GitHub doesn't know yet.

### ③ UPLOAD — push to GitHub (sync the cloud)
```bash
git push
```
Sends your committed snapshots to GitHub. Now it's backed up and any new chat can see it.

**That's the whole loop:** `pull → work → add → commit → push`

---

## 3. "Can I work locally and always keep GitHub updated?"

**Yes — but it's not automatic, and that's a good thing.** You decide *when* to upload by running `git push`. Best practice:

- **Commit often** (every meaningful change) — these are cheap local snapshots
- **Push at the end of a work session** (or whenever you want a cloud backup)

If you want, I (Claude) can run these for you anytime — just say **"commit and push"** and I'll handle it.

---

## 4. Letting Claude Do It For You

You don't have to memorize commands. In any chat, just say:

| You say... | I do... |
|------------|---------|
| "commit this" | Stage + commit your changes locally |
| "commit and push" | Stage + commit + upload to GitHub |
| "what changed?" | Show you the current status / diff |
| "pull latest" | Grab updates from GitHub |
| "undo my last commit" | Safely roll back |

---

## 5. Starting a New Chat (The Big Win)

This is **why** we set up GitHub. When you start a fresh Claude Code chat:

1. Claude opens this folder
2. Everything is here — the dashboard, specs, schema, this guide
3. Say: **"Read the repo and continue where we left off"**
4. Claude has full context instantly. No re-explaining.

The files that give Claude context:
- `api-data-connections-guide.html` — all APIs, data sources, connections
- `workflow-dashboard.html` — the process overview
- `dashboard/IMPLEMENTATION_ROADMAP.md` — the build plan
- `dashboard/README.md` — how the app works
- This file — how to use git

---

## 6. The Golden Rule: Secrets Never Go to Git

🔒 **API keys, tokens, and webhooks must NEVER be committed** — not even to a private repo. (Private repos can be shared, leaked, or made public by accident.)

**How we protect them:** real secrets live ONLY in `.env.local` files, which are listed in `.gitignore` so git ignores them completely.

| File | Contains | In Git? |
|------|----------|---------|
| `dashboard/.env.local` | Real Notion token, Slack webhook | ❌ NO (gitignored) |
| `dashboard/.env.example` | Fake placeholder values | ✅ Yes (safe template) |
| `.claude/settings.json` | BI API key | ❌ NO (gitignored) |

**When you set up a new machine or share with a teammate:** copy `.env.example` → `.env.local` and fill in the real values (which you keep in a password manager, not in git).

✅ Before any push, you can ask me: **"check for secrets before pushing"** and I'll scan everything first.

---

## 7. Quick Reference Card

```bash
# Where am I? What's changed?
git status

# Save work locally
git add -A
git commit -m "describe the change"

# Upload to GitHub
git push

# Get updates from GitHub
git pull

# See history
git log --oneline

# See the GitHub link
git remote -v
```

---

## 8. If Something Goes Wrong

Don't panic — git almost never loses work. Just ask me:
- "I think I broke something in git"
- "undo my last change"
- "show me what happened"

I'll diagnose and fix it safely. Git keeps a history of almost everything, so recovery is usually easy.

---

**Last updated:** May 2026
**Maintained by:** WNLQ9 Content team + Claude
