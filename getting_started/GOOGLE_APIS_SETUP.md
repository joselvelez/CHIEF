# Google APIs Setup Guide
**Part of:** CHIEF Getting Started Series
**Estimated time:** 30–45 minutes

CHIEF uses three Google APIs: Gmail (email triage and drafting), Google Calendar (scheduling and transit prep), and Google Maps (drive time calculations). Gmail and Calendar share one OAuth app. Maps uses a separate API key.

---

## Overview

| API | Auth Method | Used By |
|---|---|---|
| Gmail | OAuth 2.0 | Overnight Triage, Email Drafter, AM Sweep |
| Google Calendar | OAuth 2.0 | Transit Prep, Calendar Manager, Time Blocker |
| Google Maps (Distance Matrix) | API Key | Transit Prep, Time Blocker |

---

## Part 1 — Create a Google Cloud Project

All three APIs are managed from the same Google Cloud project.

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it something clear: `CHIEF Personal Assistant` or similar
4. Click **Create** and wait for it to provision (10–15 seconds)
5. Make sure the new project is selected in the top dropdown before continuing

---

## Part 2 — Enable the APIs

1. In the left sidebar, go to **APIs & Services → Library**
2. Search for and enable each of the following:
   - **Gmail API** — click it, then click **Enable**
   - **Google Calendar API** — same
   - **Maps Distance Matrix API** — same

All three must show **Enabled** status before continuing.

---

## Part 3 — OAuth Consent Screen

Before creating OAuth credentials, you need to configure what users will see when authorizing CHIEF to access their Google account.

1. Go to **APIs & Services → OAuth consent screen**
2. Select **External** (this allows you to use it with your personal Google account)
3. Click **Create**
4. Fill in the required fields:
   - **App name:** `CHIEF`
   - **User support email:** your email
   - **Developer contact email:** your email
5. Click **Save and Continue** through the Scopes page without adding anything
6. On the **Test users** page, click **+ Add users** and add your own Google email address
7. Click **Save and Continue**, then **Back to Dashboard**

> **Important:** Leave the app in "Testing" mode. You do not need to publish it. As a test user, you have full access to all scopes.

---

## Part 4 — Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth client ID**
3. For **Application type**, select **Desktop app**
4. Name it `CHIEF CLI`
5. Click **Create**
6. A dialog will appear with your **Client ID** and **Client Secret** — copy both somewhere safe
7. Click **Download JSON** — save this file as `client_secret.json` temporarily (you'll use it once to get tokens, then delete it)

---

## Part 5 — Generate OAuth Tokens

OAuth requires a one-time browser-based authorization to generate the refresh token that CHIEF will use for all subsequent requests. Run this from your local machine.

**Install the Google auth helper (one-time):**

```bash
npm install -g @chief-tools/google-auth
# or if using the manual approach:
pip install google-auth-oauthlib --break-system-packages
```

**Run the authorization flow:**

```bash
chief-google-auth --client-secret ./client_secret.json --scopes gmail,calendar
```

This will:
1. Open a browser window
2. Ask you to log in to your Google account (use the account you added as a test user)
3. Ask you to grant CHIEF access to Gmail and Calendar
4. Return a `refresh_token`, `client_id`, and `client_secret`

**Save the tokens to HELM:**

```bash
helm secrets set GMAIL_CLIENT_ID
helm secrets set GMAIL_CLIENT_SECRET
helm secrets set GMAIL_OAUTH_REFRESH_TOKEN

helm secrets set GCAL_CLIENT_ID        # same values as Gmail — same OAuth app
helm secrets set GCAL_CLIENT_SECRET
helm secrets set GCAL_OAUTH_REFRESH_TOKEN
```

For Railway, add the same values as environment variables in the Railway dashboard (see [Railway Setup](./RAILWAY_SETUP.md) Step 4).

**Delete the client_secret.json file** — you no longer need it and it should not be stored anywhere.

```bash
rm ./client_secret.json
```

---

## Part 6 — Google Maps API Key

Maps uses a simple API key rather than OAuth — it's not user-specific.

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → API key**
3. An API key will be generated — copy it
4. Click **Edit API key** (pencil icon)
5. Under **API restrictions**, select **Restrict key**
6. Choose **Maps Distance Matrix API** from the list
7. Click **Save**

Restricting the key to only the Distance Matrix API limits exposure if the key is ever compromised.

**Save the key:**

```bash
helm secrets set GOOGLE_MAPS_API_KEY
```

And add it to Railway environment variables.

---

## Part 7 — Verify Connections

Test each connection with HELM:

```bash
helm inputs test gmail
# Expected: ✓ Gmail connected — [your email address]

helm inputs test google_calendar
# Expected: ✓ Google Calendar connected — [number] calendars found

helm inputs test google_maps
# Expected: ✓ Google Maps API key valid
```

If any test fails, the error message will indicate whether it's an authentication issue, a scope issue, or an API not being enabled.

---

## Token Refresh

OAuth access tokens expire after 1 hour. CHIEF handles this automatically using the refresh token, which is long-lived (does not expire unless revoked or unused for 6 months).

If you ever see authentication errors in Railway logs or HELM, run:

```bash
helm inputs test gmail
```

If the token is expired or revoked, HELM will guide you through re-authorization. After re-authorizing, update the refresh token in Railway's environment variables.

---

## Required OAuth Scopes Reference

When asked which scopes to grant during the OAuth flow, CHIEF requests the following:

| Scope | Why |
|---|---|
| `https://www.googleapis.com/auth/gmail.readonly` | Read emails for triage |
| `https://www.googleapis.com/auth/gmail.compose` | Create draft replies |
| `https://www.googleapis.com/auth/calendar.readonly` | Read calendar events |
| `https://www.googleapis.com/auth/calendar.events` | Create/write calendar events |

CHIEF does not request permission to delete emails, send emails, or access Drive, Docs, or any other Google services.

---

## Troubleshooting

### "Access blocked: CHIEF has not completed the Google verification process"
This appears if you try to authorize with an account that isn't on the test users list. Go back to the OAuth consent screen and add your Google email address as a test user.

### "The OAuth client was not found" or "invalid_client"
The Client ID or Client Secret is incorrect. Re-download the credentials JSON from Google Cloud Console and retry.

### "Token has been expired or revoked"
The refresh token is invalid. Re-run the `chief-google-auth` flow to generate a new one, then update HELM secrets and Railway environment variables.

### Gmail test passes but Calendar fails
Make sure you enabled the **Google Calendar API** in Step 2, and that the OAuth consent screen scopes were granted during authorization. If Calendar wasn't in the scopes during the first authorization, re-run the auth flow.

---

*Back to [Getting Started Checklist](../SETUP.md#18-getting-started-checklist)*
