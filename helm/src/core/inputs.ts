/**
 * @file Input credential definitions and connectivity tests.
 *
 * Defines which secret keys each input requires and provides the test
 * function that verifies a live connection using those credentials.
 *
 * Test calls make real HTTP requests using the Node 20 built-in fetch.
 * On success, each test returns a human-readable detail string (email
 * address, calendar count, etc.) confirming the credential works.
 *
 * On failure with HTTP 401, the test reports the credential as invalid
 * and instructs the user to refresh it via helm secrets set. No silent
 * token refresh is attempted in Phase 1 — that is Phase 2 scope.
 *
 * Secret values retrieved from encrypted local storage are used directly in HTTP
 * Authorization headers and are never included in any log output or
 * error message.
 */

import type { InputTestResult } from "../types/index.js";
import { getSecret } from "./secrets.js";

// ─── Credential Key Definitions ───────────────────────────────────────────────

/**
 * Ordered list of secret key names required by each input.
 * Used during helm setup to prompt for each credential and during
 * helm inputs test to retrieve them for connectivity checks.
 *
 * Keys must match the names used in helm secrets set commands documented
 * in SETUP.md.
 */
export const INPUT_CREDENTIAL_KEYS: Record<string, string[]> = {
  gmail: [
    "GMAIL_CLIENT_ID",
    "GMAIL_CLIENT_SECRET",
    "GMAIL_OAUTH_REFRESH_TOKEN",
  ],
  google_calendar: [
    "GCAL_CLIENT_ID",
    "GCAL_CLIENT_SECRET",
    "GCAL_OAUTH_REFRESH_TOKEN",
  ],
  google_maps: ["GOOGLE_MAPS_API_KEY"],
  todoist: ["TODOIST_API_TOKEN"],
  zoom: ["ZOOM_ACCOUNT_ID", "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET"],
};

// ─── Internal HTTP Helpers ────────────────────────────────────────────────────

/**
 * Exchanges a Google OAuth refresh token for a short-lived access token
 * using the Google token endpoint. Returns the access token string.
 *
 * The refresh token and client credentials are never included in logs or
 * error output.
 *
 * @throws When the token endpoint returns a non-200 status.
 */
async function googleRefreshToAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const status = res.status;
    const reason =
      status === 401 || status === 400
        ? "credential rejected"
        : `HTTP ${status}`;
    throw new Error(reason);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

// ─── Per-Input Test Functions ────────────────────────────────────────────────

/**
 * Tests the Gmail connection by exchanging the stored refresh token for
 * an access token and fetching the user's Gmail profile.
 * Returns the verified email address on success.
 */
async function testGmail(username: string): Promise<InputTestResult> {
  const clientId = await getSecret(username, "GMAIL_CLIENT_ID");
  const clientSecret = await getSecret(username, "GMAIL_CLIENT_SECRET");
  const refreshToken = await getSecret(username, "GMAIL_OAUTH_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    return {
      inputId: "gmail",
      ok: false,
      error: "One or more Gmail credentials are missing.",
      fix: "Run: helm secrets set GMAIL_CLIENT_ID && helm secrets set GMAIL_CLIENT_SECRET && helm secrets set GMAIL_OAUTH_REFRESH_TOKEN",
    };
  }

  try {
    const accessToken = await googleRefreshToAccessToken(
      clientId,
      clientSecret,
      refreshToken
    );

    const res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/profile",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (res.status === 401) {
      return {
        inputId: "gmail",
        ok: false,
        error: "Gmail access token was rejected (401).",
        fix: "Your refresh token may have expired. Run: helm secrets set GMAIL_OAUTH_REFRESH_TOKEN with a fresh token.",
      };
    }

    if (!res.ok) {
      return {
        inputId: "gmail",
        ok: false,
        error: `Gmail API returned HTTP ${res.status}.`,
        fix: "Check your Google Cloud project quota and API enablement, then retry.",
      };
    }

    const data = (await res.json()) as { emailAddress: string };
    return { inputId: "gmail", ok: true, detail: data.emailAddress };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      inputId: "gmail",
      ok: false,
      error: `Gmail test failed: ${msg}`,
      fix: "Check your Gmail credentials and internet connection, then retry.",
    };
  }
}

/**
 * Tests the Google Calendar connection by listing the user's calendars.
 * Returns the calendar count on success.
 */
async function testGoogleCalendar(username: string): Promise<InputTestResult> {
  const clientId = await getSecret(username, "GCAL_CLIENT_ID");
  const clientSecret = await getSecret(username, "GCAL_CLIENT_SECRET");
  const refreshToken = await getSecret(username, "GCAL_OAUTH_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    return {
      inputId: "google_calendar",
      ok: false,
      error: "One or more Google Calendar credentials are missing.",
      fix: "Run: helm secrets set GCAL_CLIENT_ID && helm secrets set GCAL_CLIENT_SECRET && helm secrets set GCAL_OAUTH_REFRESH_TOKEN",
    };
  }

  try {
    const accessToken = await googleRefreshToAccessToken(
      clientId,
      clientSecret,
      refreshToken
    );

    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (res.status === 401) {
      return {
        inputId: "google_calendar",
        ok: false,
        error: "Google Calendar access token was rejected (401).",
        fix: "Your refresh token may have expired. Run: helm secrets set GCAL_OAUTH_REFRESH_TOKEN with a fresh token.",
      };
    }

    if (!res.ok) {
      return {
        inputId: "google_calendar",
        ok: false,
        error: `Google Calendar API returned HTTP ${res.status}.`,
        fix: "Check your Google Cloud project quota and Calendar API enablement, then retry.",
      };
    }

    const data = (await res.json()) as { items: unknown[] };
    const count = data.items?.length ?? 0;
    return {
      inputId: "google_calendar",
      ok: true,
      detail: `${count} calendar${count !== 1 ? "s" : ""} found`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      inputId: "google_calendar",
      ok: false,
      error: `Google Calendar test failed: ${msg}`,
      fix: "Check your Calendar credentials and internet connection, then retry.",
    };
  }
}

/**
 * Tests the Google Maps connection by geocoding a known address.
 * Returns "geocoding OK" on success.
 */
async function testGoogleMaps(username: string): Promise<InputTestResult> {
  const apiKey = await getSecret(username, "GOOGLE_MAPS_API_KEY");

  if (!apiKey) {
    return {
      inputId: "google_maps",
      ok: false,
      error: "Google Maps API key is missing.",
      fix: "Run: helm secrets set GOOGLE_MAPS_API_KEY",
    };
  }

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/geocode/json"
    );
    url.searchParams.set("address", "1600 Amphitheatre Pkwy, Mountain View, CA");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());

    if (!res.ok) {
      return {
        inputId: "google_maps",
        ok: false,
        error: `Google Maps API returned HTTP ${res.status}.`,
        fix: "Check your API key and Maps API enablement in Google Cloud Console.",
      };
    }

    const data = (await res.json()) as { status: string };

    if (data.status === "REQUEST_DENIED") {
      return {
        inputId: "google_maps",
        ok: false,
        error: "Google Maps API key was rejected.",
        fix: "Run: helm secrets set GOOGLE_MAPS_API_KEY with a valid key.",
      };
    }

    return { inputId: "google_maps", ok: true, detail: "geocoding OK" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      inputId: "google_maps",
      ok: false,
      error: `Google Maps test failed: ${msg}`,
      fix: "Check your Maps API key and internet connection, then retry.",
    };
  }
}

/**
 * Tests the Todoist connection by fetching the authenticated user's info.
 * Returns the user's display name on success.
 */
async function testTodoist(username: string): Promise<InputTestResult> {
  const apiToken = await getSecret(username, "TODOIST_API_TOKEN");

  if (!apiToken) {
    return {
      inputId: "todoist",
      ok: false,
      error: "Todoist API token is missing.",
      fix: "Run: helm secrets set TODOIST_API_TOKEN",
    };
  }

  try {
    const res = await fetch("https://api.todoist.com/rest/v2/user", {
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    if (res.status === 401) {
      return {
        inputId: "todoist",
        ok: false,
        error: "Todoist API token was rejected (401).",
        fix: "Run: helm secrets set TODOIST_API_TOKEN with a fresh token from Todoist settings.",
      };
    }

    if (!res.ok) {
      return {
        inputId: "todoist",
        ok: false,
        error: `Todoist API returned HTTP ${res.status}.`,
        fix: "Check your Todoist API token and retry.",
      };
    }

    const data = (await res.json()) as { full_name: string };
    return { inputId: "todoist", ok: true, detail: data.full_name };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      inputId: "todoist",
      ok: false,
      error: `Todoist test failed: ${msg}`,
      fix: "Check your Todoist API token and internet connection, then retry.",
    };
  }
}

/**
 * Tests the Zoom Server-to-Server OAuth connection by exchanging
 * account credentials for an access token. A successful token
 * exchange confirms the app credentials are valid.
 */
async function testZoom(username: string): Promise<InputTestResult> {
  const accountId = await getSecret(username, "ZOOM_ACCOUNT_ID");
  const clientId = await getSecret(username, "ZOOM_CLIENT_ID");
  const clientSecret = await getSecret(username, "ZOOM_CLIENT_SECRET");

  if (!accountId || !clientId || !clientSecret) {
    return {
      inputId: "zoom",
      ok: false,
      error: "One or more Zoom credentials are missing.",
      fix: "Run: helm secrets set ZOOM_ACCOUNT_ID && helm secrets set ZOOM_CLIENT_ID && helm secrets set ZOOM_CLIENT_SECRET",
    };
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const url = new URL("https://zoom.us/oauth/token");
    url.searchParams.set("grant_type", "account_credentials");
    url.searchParams.set("account_id", accountId);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
    });

    if (res.status === 401) {
      return {
        inputId: "zoom",
        ok: false,
        error: "Zoom credentials were rejected (401).",
        fix: "Verify your ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET in the Zoom Marketplace, then run helm secrets set for each.",
      };
    }

    if (!res.ok) {
      return {
        inputId: "zoom",
        ok: false,
        error: `Zoom OAuth returned HTTP ${res.status}.`,
        fix: "Check your Zoom Server-to-Server app configuration and retry.",
      };
    }

    return { inputId: "zoom", ok: true, detail: "token exchange OK" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      inputId: "zoom",
      ok: false,
      error: `Zoom test failed: ${msg}`,
      fix: "Check your Zoom credentials and internet connection, then retry.",
    };
  }
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

/**
 * Runs the connectivity test for the given input ID.
 *
 * Returns an InputTestResult regardless of outcome — errors are
 * represented in the result rather than thrown, so callers can
 * display results for multiple inputs without short-circuiting.
 *
 * @param inputId  - The input identifier to test (e.g. "gmail").
 * @param username - Active username whose credentials to use.
 */
export async function testInput(
  inputId: string,
  username: string
): Promise<InputTestResult> {
  switch (inputId) {
    case "gmail":
      return testGmail(username);
    case "google_calendar":
      return testGoogleCalendar(username);
    case "google_maps":
      return testGoogleMaps(username);
    case "todoist":
      return testTodoist(username);
    case "zoom":
      return testZoom(username);
    default:
      return {
        inputId,
        ok: false,
        error: `No test implementation for input "${inputId}".`,
        fix: `Add a test function for "${inputId}" in core/inputs.ts.`,
      };
  }
}
