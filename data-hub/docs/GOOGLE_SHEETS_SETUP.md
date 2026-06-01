# Google Sheets Setup Guide

This guide walks you through giving the Content Trend Data Hub permission to
write articles into a Google Sheet. The pipeline uses a **service account**
(a robot Google identity) so it can append rows unattended — no browser
login or OAuth consent screen required at run time.

You only need to do this once.

---

## What you'll end up with

1. A Google Cloud project with the Google Sheets API enabled.
2. A service-account JSON key saved at `config/google-credentials.json`.
3. A Google Sheet shared with that service account, whose ID you put in config.

Estimated time: ~10 minutes.

---

## Step 1 — Create a Google Cloud project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top bar, then **New Project**.
3. Name it something like `content-trend-data-hub` and click **Create**.
4. Make sure the new project is selected (top bar) before continuing.

---

## Step 2 — Enable the Google Sheets API

1. In the Cloud Console, open **APIs & Services → Library**
   (or visit https://console.cloud.google.com/apis/library).
2. Search for **Google Sheets API**.
3. Click it, then click **Enable**.

---

## Step 3 — Create a service account and download its key

1. Go to **APIs & Services → Credentials**
   (https://console.cloud.google.com/apis/credentials).
2. Click **Create Credentials → Service account**.
3. Give it a name (e.g. `data-hub-exporter`) and click **Create and Continue**.
4. You can skip the optional "grant access" steps — click **Done**.
5. In the service-account list, click the account you just created.
6. Open the **Keys** tab → **Add Key → Create new key**.
7. Choose **JSON** and click **Create**. A `.json` file downloads automatically.
8. Move/rename that file to:

   ```
   config/google-credentials.json
   ```

   (relative to the `data-hub/` directory).

> **Important:** This JSON file is a secret. It is already listed in
> `.gitignore` (`config/google-credentials.json`) so it will never be
> committed. Do not share it or paste it anywhere public.

---

## Step 4 — Create the Google Sheet and copy its ID

1. Create a new sheet at https://sheets.new (or use an existing one).
2. Look at the URL. The **sheet ID** is the long string between `/d/` and
   `/edit`:

   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_THE_SHEET_ID/edit#gid=0
   ```

3. Copy that ID — you'll need it in Step 6.
4. (Optional) Rename the first tab to `Articles` so it matches the default
   `sheet_name` the exporter writes to. If you use a different tab name,
   pass it via `sheet_name=` when calling `export_articles`.

---

## Step 5 — Share the Sheet with the service account

The service account is a separate Google identity and cannot see your sheet
until you share it, just like sharing with a person.

1. Open `config/google-credentials.json` and find the `client_email` field.
   It looks like:

   ```
   data-hub-exporter@content-trend-data-hub.iam.gserviceaccount.com
   ```

2. In your Google Sheet, click **Share**.
3. Paste that `client_email` address.
4. Set its access to **Editor**.
5. Untick "Notify people" (the robot account has no inbox) and click **Share**.

---

## Step 6 — Set the sheet ID in config

Provide the sheet ID to the exporter in whichever way fits your workflow.

**Option A — environment variable (recommended):**

```bash
export DATA_HUB_SHEET_ID="THIS_IS_THE_SHEET_ID"
```

Then in code:

```python
import os
from exporters import SheetsExporter

exporter = SheetsExporter(sheet_id=os.environ["DATA_HUB_SHEET_ID"])
result = exporter.export_articles(articles, include_header=True)
print(result)  # {"exported": 42, "sheet": "Articles"}
```

**Option B — pass directly:**

```python
exporter = SheetsExporter(sheet_id="THIS_IS_THE_SHEET_ID")
```

The exporter defaults to reading credentials from
`config/google-credentials.json`. Override with
`SheetsExporter(sheet_id=..., credentials_path="some/other/path.json")` if needed.

---

## Step 7 — Install dependencies and verify

```bash
cd data-hub
source venv/bin/activate
pip install -r requirements.txt
```

The Google client libraries are already pinned in `requirements.txt`:

- `google-api-python-client`
- `google-auth`
- `google-auth-oauthlib`
- `google-auth-httplib2`

### Verify with one command (recommended)

Instead of guessing whether each step worked, run the preflight verifier:

```bash
export DATA_HUB_SHEET_ID="your-sheet-id"
./scripts/verify_sheets_setup.sh            # read-only checks
./scripts/verify_sheets_setup.sh --write    # also append one test row
```

It runs five checks and prints a clear PASS/FAIL report with the exact fix
for each failure mode:

1. Google client libraries installed
2. `config/google-credentials.json` exists and is a valid service-account key
   (it prints the `client_email` you must share the sheet with — Step 5)
3. Sheet ID present
4. Live connection + access (distinguishes **403 = not shared** from
   **404 = wrong sheet ID**)
5. Optional test write to a throwaway `Setup_Test` tab (safe to delete after)

When every check shows `PASS`, you're done — run `./scripts/run_ingest.sh`
for the first real collection. If you ran with `--write`, delete the
`Setup_Test` tab afterwards.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `FileNotFoundError: config/google-credentials.json` | Key not saved in the right place | Re-check Step 3; confirm the path. |
| Result is `{"exported": 0, "error": "...403..."}` | Sheet not shared with the service account | Repeat Step 5 with the exact `client_email` and Editor access. |
| Result is `{"exported": 0, "error": "...404..."}` | Wrong sheet ID | Re-copy the ID from the URL (Step 4). |
| Rows land in the wrong tab | Tab name mismatch | Rename the tab to `Articles` or pass `sheet_name=`. |

The exporter is **fail-soft**: any API error is logged and returned as
`{"exported": 0, "error": "..."}` rather than crashing the pipeline.
