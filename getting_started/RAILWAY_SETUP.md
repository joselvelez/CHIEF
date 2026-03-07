# Railway Setup Guide
**Part of:** CHIEF Getting Started Series
**Estimated time:** 45–60 minutes

Railway hosts the scheduled overnight jobs that run CHIEF automatically before you wake up. This guide walks through the complete setup from account creation to your first verified cron run.

---

## What Railway Does in CHIEF

Railway runs two automated jobs on a cron schedule:

| Job | Schedule | What it does |
|---|---|---|
| Overnight Triage | 5:00 AM weekdays | Scans email, creates tasks in Todoist |
| Transit Prep | 5:10 AM weekdays | Inserts drive time buffers in Google Calendar |

Railway pulls the latest version of your repo on each run, so any changes you make to instruction files or config are automatically picked up the next time the job runs.

---

## Step 1 — Create a Railway Account

1. Go to [railway.app](https://railway.app) and sign up
2. Connect your GitHub account when prompted — Railway needs this to deploy from your repo
3. Complete email verification

Railway's free tier (Hobby plan) is sufficient to start. The overnight jobs are lightweight and run for only a few minutes per day.

---

## Step 2 — Create a New Project

1. From the Railway dashboard, click **New Project**
2. Select **Deploy from GitHub repo**
3. Find and select your CHIEF repository
4. Railway will attempt an automatic deploy — this will fail at first because the runner isn't configured yet. That's expected.

---

## Step 3 — Configure the Service

Railway creates a "service" from your repo. You need to configure it to run the CHIEF job runner rather than trying to auto-detect a web server.

1. Click into the service Railway created
2. Go to **Settings → Build**
3. Set the **Build Command** to:
   ```
   npm install
   ```
4. Go to **Settings → Deploy**
5. Set the **Start Command** to:
   ```
   node runner/index.js
   ```
   *(This is the CHIEF job runner entry point — it listens for scheduled triggers and executes flows)*
6. Under **Settings → Deploy**, set **Restart Policy** to `On Failure` with max retries: `2`

---

## Step 4 — Set Environment Variables

This is where all secrets live for Railway. They are set through the Railway dashboard and are never stored in the repository.

1. In your service, go to **Variables**
2. Add each of the following variables. Click **+ New Variable** for each one.

### Required Variables

```
CHIEF_USERNAME
```
Your CHIEF username — the folder name under `/users/` that this Railway instance runs for.
Example: `jane`

---

```
ANTHROPIC_API_KEY
```
Your Anthropic API key. Get it from [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key.

---

```
GMAIL_OAUTH_REFRESH_TOKEN
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
```
From your Google Cloud Console OAuth app. See [Google APIs Setup](./GOOGLE_APIS_SETUP.md) for how to generate these.

---

```
GCAL_OAUTH_REFRESH_TOKEN
GCAL_CLIENT_ID
GCAL_CLIENT_SECRET
```
Same Google Cloud Console OAuth app as Gmail — the scopes cover both.

---

```
GOOGLE_MAPS_API_KEY
```
From Google Cloud Console → APIs & Services → Credentials. See [Google APIs Setup](./GOOGLE_APIS_SETUP.md).

---

```
TODOIST_API_TOKEN
```
From [app.todoist.com](https://app.todoist.com) → Settings → Integrations → Developer → API token.

---

```
ZOOM_OAUTH_TOKEN
ZOOM_ACCOUNT_ID
ZOOM_CLIENT_ID
ZOOM_CLIENT_SECRET
```
From Zoom App Marketplace → your Server-to-Server OAuth app. See SETUP.md Section 17 for Zoom setup details.

---

```
CHIEF_REPO_DEPLOY_KEY
```
An SSH deploy key that allows Railway to pull your (private) repo. See Step 5 below for how to generate this.

---

### Optional Variables

```
CHIEF_LOG_LEVEL=info
```
Set to `debug` when troubleshooting, `info` for normal operation.

```
CHIEF_DRY_RUN=false
```
Set to `true` to run flows without writing anything to external services. Useful for testing.

---

## Step 5 — Set Up a Deploy Key (Private Repos Only)

If your CHIEF repo is private, Railway needs an SSH key to pull it on each run.

**On your local machine:**

```bash
# Generate a new SSH key pair specifically for this purpose
ssh-keygen -t ed25519 -C "chief-railway-deploy" -f ~/.ssh/chief_railway_deploy
# When prompted for a passphrase, press Enter (no passphrase — Railway can't enter one)
```

This creates two files:
- `~/.ssh/chief_railway_deploy` — private key (goes to Railway)
- `~/.ssh/chief_railway_deploy.pub` — public key (goes to GitHub)

**Add the public key to GitHub:**

1. Go to your CHIEF repo on GitHub
2. **Settings → Deploy keys → Add deploy key**
3. Title: `Railway CHIEF Runner`
4. Key: paste the contents of `~/.ssh/chief_railway_deploy.pub`
5. Check **Allow write access** (Railway needs to commit logs and outputs back)
6. Click **Add key**

**Add the private key to Railway:**

1. Copy the contents of `~/.ssh/chief_railway_deploy` (the private key, no `.pub`)
2. In Railway → Variables → New Variable
3. Name: `CHIEF_REPO_DEPLOY_KEY`
4. Value: paste the entire private key including the `-----BEGIN...` and `-----END...` lines
5. Save

---

## Step 6 — Set Up Cron Jobs

Railway supports cron schedules directly in the dashboard.

1. In your service, go to **Settings → Cron**
2. Add the first job:
   - **Schedule:** `0 5 * * 1-5` (5:00 AM, Monday–Friday)
   - **Command:** `node runner/index.js --flow overnight_triage --user $CHIEF_USERNAME`
3. Add the second job:
   - **Schedule:** `10 5 * * 1-5` (5:10 AM, Monday–Friday)
   - **Command:** `node runner/index.js --flow transit_prep --user $CHIEF_USERNAME`

**Time zone note:** Railway cron schedules run in UTC by default. Adjust the hour to match your local time. For example, if you're in UTC-5 (EST), use `0 10 * * 1-5` to run at 5 AM local time. For UTC-3 (Brasília/BRT), use `0 8 * * 1-5`.

**To find your UTC offset:**
```bash
# On Mac/Linux
date +%z
# Example output: -0300 means UTC-3, so add 3 hours to your target local time
```

---

## Step 7 — Test the Setup

Before enabling the cron schedule, run a manual test to confirm everything is working.

**Trigger a manual run from Railway:**

1. In your service, go to the **Deployments** tab
2. Click **Deploy** to trigger an immediate run
3. Watch the build and deploy logs in real time
4. Look for:
   - `[CHIEF] git pull — OK`
   - `[CHIEF] Loading flow: overnight_triage`
   - `[CHIEF] Connecting to Gmail — OK`
   - `[CHIEF] Connecting to Todoist — OK`
   - `[CHIEF] Run complete. Committing outputs.`

**Verify the git commit landed:**

After the run completes, check your GitHub repo. You should see a new commit with a message like:
```
[auto] overnight-triage 2026-03-08 — jane
```

And new files in:
- `/logs/jane/2026-03-08.log`
- `/outputs/jane/2026-03-08/overnight_report.md`
- `/state/jane/last_run.json` (updated timestamp)

If you see this, Railway is working correctly.

---

## Step 8 — Enable the Cron Schedule

1. Go to **Settings → Cron**
2. Toggle both jobs to **Enabled**
3. The next run will happen at the scheduled time

---

## Troubleshooting

### Build fails immediately
Check that `package.json` exists in your repo root and that the build command is correct. The runner depends on Node.js packages being installed.

### Authentication errors (Gmail, Google Calendar)
OAuth tokens may have expired. Run `helm inputs test gmail` locally to re-authenticate and update the token in Railway's environment variables.

### `git push` fails at end of run
The deploy key may not have write access. Go to GitHub → repo Settings → Deploy keys and confirm **Allow write access** is checked.

### Cron job runs but no output appears
Check the Railway logs for the specific error. Common causes: wrong `CHIEF_USERNAME` value, missing environment variable, or a flow that has no items to process (which is valid — check `/logs/` for the run report).

### Railway keeps retrying / crashing loop
Set `CHIEF_DRY_RUN=true` temporarily to isolate whether the issue is in the runner itself or in an external API call.

---

## Updating the Schedule

To change when jobs run, go to **Settings → Cron** and update the cron expression. Some useful references:

| Schedule | Cron Expression (UTC) |
|---|---|
| 5 AM weekdays, UTC-5 (EST) | `0 10 * * 1-5` |
| 5 AM weekdays, UTC-3 (BRT) | `0 8 * * 1-5` |
| 5 AM weekdays, UTC-8 (PST) | `0 13 * * 1-5` |
| 5 AM every day | `0 [hour] * * *` |
| 5 AM weekdays + Saturday | `0 [hour] * * 1-6` |

Use [crontab.guru](https://crontab.guru) to build and verify any cron expression.

---

*Back to [Getting Started Checklist](../SETUP.md#18-getting-started-checklist)*
