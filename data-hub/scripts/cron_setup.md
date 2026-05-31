# Scheduling the daily ingestion run (cron)

The Content Trend Data Hub ingestion pipeline is designed to run once a day.
This guide explains how to schedule it with `cron` so it runs automatically
(e.g. at 2 AM every day).

## 1. Prerequisites

- The project virtualenv exists at `data-hub/venv` (the wrapper activates it).
- Google Sheets credentials are in place — see `docs/GOOGLE_SHEETS_SETUP.md`.
- You know the target Google Sheet id (the long id from the sheet URL:
  `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`).

## 2. Make the wrapper executable

```bash
chmod +x /absolute/path/to/data-hub/scripts/run_ingest.sh
```

(The repo ships it executable, but re-applying after a fresh checkout is safe.)

## 3. Set the sheet id

The pipeline reads the target sheet from the `DATA_HUB_SHEET_ID` environment
variable. There are two common ways to provide it:

**Option A — inline in the crontab entry (simplest):**

```cron
0 2 * * * DATA_HUB_SHEET_ID=YOUR_SHEET_ID_HERE /absolute/path/to/data-hub/scripts/run_ingest.sh >> /absolute/path/to/data-hub/logs/cron.log 2>&1
```

**Option B — edit the default in the wrapper** (`scripts/run_ingest.sh`),
replacing `YOUR_SHEET_ID_HERE` with your real sheet id. Then the crontab
entry does not need the variable:

```cron
0 2 * * * /absolute/path/to/data-hub/scripts/run_ingest.sh >> /absolute/path/to/data-hub/logs/cron.log 2>&1
```

## 4. Add the cron job

Open your crontab for editing:

```bash
crontab -e
```

Add one of the lines above. Cron field reference for `0 2 * * *`:

```
┌───────────── minute (0)
│ ┌─────────── hour (2  -> 2 AM)
│ │ ┌───────── day of month (* -> every day)
│ │ │ ┌─────── month (* -> every month)
│ │ │ │ ┌───── day of week (* -> every day)
│ │ │ │ │
0 2 * * *  <command>
```

Save and exit. Confirm the entry was installed:

```bash
crontab -l
```

## 5. Logging

- `>> .../logs/cron.log 2>&1` captures stdout/stderr (the printed run summary
  and any cron-level errors) to `logs/cron.log`.
- The pipeline itself also writes structured, timestamped logs to
  `logs/ingest.log` via Python's `logging` module (file + console handlers).

Tail them to watch a run:

```bash
tail -f /absolute/path/to/data-hub/logs/ingest.log
```

## 6. Test the wrapper manually first

Before relying on cron, run it by hand to confirm everything is wired up:

```bash
cd /absolute/path/to/data-hub
DATA_HUB_SHEET_ID=YOUR_SHEET_ID_HERE ./scripts/run_ingest.sh
```

You should see a `Content Hub ingestion summary:` block with stage counts and
exit code 0.

## 7. Notes

- cron runs with a minimal environment. The wrapper `cd`s to the project root
  and activates the virtualenv, so absolute paths in the crontab line are the
  only thing that matters.
- On macOS, the `cron` daemon may require Full Disk Access for your terminal /
  `cron` under System Settings → Privacy & Security if it cannot read the repo.
- To change the schedule (e.g. twice daily at 2 AM and 2 PM), use
  `0 2,14 * * *`.
```
