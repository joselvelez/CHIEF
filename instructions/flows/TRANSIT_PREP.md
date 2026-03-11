# Flow: Overnight Transit Prep

**ID:** `transit_prep`
**Version:** 1.0.0
**Last Updated:** 2026-03-11

---

## Purpose

Scans tomorrow's calendar for physical-location meetings and inserts drive-time buffer events using real Google Maps travel data, ensuring the user is never late due to underestimated transit.

---

## Trigger

| Property | Value |
|---|---|
| Type | Scheduled (cron) |
| Platform | Railway |
| Schedule (UTC) | `10 10 * * 1-5` |
| Schedule (Human) | 5:10 AM ET, weekdays |
| Invocation | Automatic via Railway cron job |
| Manual Override | `helm run transit-prep` |

The trigger is registered in [`config/triggers.yaml`](../../config/triggers.yaml) under `id: transit_prep`. It ships disabled — enable only after successful manual test runs. Runs 10 minutes after Overnight Triage to avoid Railway resource contention.

---

## Human Gate

**`human_gate_before_agents: false`**

This flow runs fully automated with no human review step. It only creates buffer events on the calendar — it never modifies, moves, or deletes existing events. Buffer events are clearly labeled with a `[Transit]` prefix so the user can identify and remove them if needed.

**Rationale:** Transit buffer events are low-risk, additive-only calendar entries. The worst case is an unnecessary buffer event, which the user can delete in seconds. The benefit of automated insertion outweighs the cost of a daily manual review step.

---

## Flow Sequence

```
START
  └─ [1] git pull
  │       Pull latest repo to ensure current instructions, config, and state.
  │       Abort if git pull fails (network error, merge conflict).
  │
  └─ [2] Load user configuration
  │       Read from users/{user}/USER.md:
  │         - Default locations (home address, office address)
  │         - Working hours
  │       Read from users/{user}/SCHEDULING.md:
  │         - Location list with full addresses
  │         - Transit buffer preferences (minimum buffer time)
  │         - Protected blocks (do not insert buffers into protected time)
  │       These are required for Maps API routing and buffer calculation.
  │
  └─ [3] Fetch today's + tomorrow's calendar (Google Calendar API)
  │       Query Google Calendar API:
  │         GET /calendars/primary/events
  │         ?timeMin={today_start_UTC}
  │         &timeMax={tomorrow_end_UTC}
  │         &singleEvents=true
  │         &orderBy=startTime
  │       Retrieve: event ID, title, start time, end time, location field,
  │       attendees, status (confirmed/tentative/cancelled).
  │       Filter out: cancelled events, all-day events without locations.
  │
  └─ [4] Identify physical-location meetings
  │       For each calendar event, determine if it requires physical travel:
  │         - Has a non-empty `location` field AND
  │         - Location is not "Virtual", "Zoom", "Teams", "Google Meet",
  │           or any URL pattern (http://, https://)
  │         - Location is not the user's current default location for that
  │           time block (e.g., office during work hours, home outside)
  │       Build a list of events requiring transit with:
  │         - Event ID, title, start time, end time
  │         - Destination address (from location field)
  │         - Origin address (previous event's location, or default location)
  │
  └─ [5] Calculate drive times with Google Maps API
  │       For each physical-location meeting identified in step 4:
  │         Call Google Maps Distance Matrix API:
  │           GET /maps/api/distancematrix/json
  │           ?origins={origin_address}
  │           &destinations={destination_address}
  │           &departure_time={calculated_departure_UTC}
  │           &traffic_model=pessimistic
  │           &key={GOOGLE_MAPS_API_KEY}
  │         Extract: duration_in_traffic (pessimistic estimate).
  │         Add configurable buffer: +15 minutes (default, adjustable in SCHEDULING.md).
  │         Calculate required departure time:
  │           departure = event_start - drive_time - buffer
  │       If Maps API returns an error for a specific route:
  │         Fall back to a default 30-minute buffer.
  │         Log the fallback for review.
  │
  └─ [6] Check for existing buffer events
  │       Before creating new buffers, scan calendar events for existing
  │       transit buffers (identified by `[Transit]` prefix in title).
  │       If a buffer already exists for a given meeting:
  │         - If drive time has changed significantly (>10 min difference):
  │           Delete old buffer, create new one.
  │         - If drive time is similar: skip (no update needed).
  │       This prevents duplicate buffers on re-runs.
  │
  └─ [7] Run CALENDAR_MANAGER agent (transit_prep mode)
  │       Invoke the Calendar Manager agent in transit_prep mode.
  │       Agent instruction file: /instructions/agents/CALENDAR_MANAGER.md
  │       Agent behavior in transit_prep mode:
  │         - Receives: list of meetings with calculated drive times
  │         - Creates buffer event objects with:
  │             title: "[Transit] Drive to {event_title}"
  │             start: departure_time
  │             end: event_start_time
  │             description: "Auto-generated transit buffer.\n
  │                          Origin: {origin}\n
  │                          Destination: {destination}\n
  │                          Estimated drive: {duration}\n
  │                          Buffer added: {buffer_minutes} min\n
  │                          Traffic model: pessimistic"
  │             color: designated transit color (e.g., graphite/gray)
  │             reminders: 10 minutes before departure
  │         - Hard limits from agents.yaml:
  │             never_accept_decline: true
  │             never_modify_existing_events: true
  │         - Output: array of proposed buffer events
  │       Timeout: 120 seconds.
  │
  └─ [8] Create buffer events on Google Calendar
  │       For each proposed buffer event from step 7:
  │         POST /calendars/primary/events to Google Calendar API
  │         with the buffer event data.
  │       Log each created event: "{title} at {time} ({duration} drive)."
  │
  └─ [9] Write completion report
  │       Generate: outputs/{user}/{date}/transit_prep_report.md
  │       Report contents:
  │         - Run timestamp
  │         - Meetings scanned: {count}
  │         - Physical-location meetings found: {count}
  │         - Buffer events created: {count}
  │         - Buffer events updated: {count}
  │         - Buffer events skipped (already existed): {count}
  │         - Details per buffer:
  │             Meeting: {title} at {time}
  │             Route: {origin} → {destination}
  │             Drive time: {duration} (pessimistic)
  │             Buffer event: {start} – {end}
  │         - Errors/fallbacks: {any}
  │
  └─ [10] Update last_run.json
  │        Write to state/{user}/last_run.json:
  │          { "transit_prep": { "last_success": "{ISO_timestamp}", "status": "ok" } }
  │
  └─ [11] git commit + push
  │        Stage: outputs/, state/, context/, logs/
  │        Commit message: "[auto] transit-prep {date} — {user}"
  │        Push to remote.
  │
END
```

---

## Inputs Required

| Input | Config ID | Purpose | Required Scopes |
|---|---|---|---|
| Google Calendar | `google_calendar` | Read tomorrow's events, write buffer events | `calendar_read`, `calendar_write` |
| Google Maps | `google_maps` | Calculate drive times with traffic data | Distance Matrix API access |

All inputs must show `enabled: true` and `configured: true` in [`config/inputs.yaml`](../../config/inputs.yaml). If any required input is disabled or unconfigured, the flow aborts with a clear error identifying the missing input.

---

## Agents Involved

| Order | Agent | ID | Mode | Execution |
|---|---|---|---|---|
| 1 | Calendar Manager | `calendar_manager` | `transit_prep` | Sequential (single agent) |

**Execution model:** Single agent, sequential. The Calendar Manager runs in a specialized `transit_prep` mode that restricts its behavior to buffer event creation only.

**Agent instruction file:** [`/instructions/agents/CALENDAR_MANAGER.md`](../agents/CALENDAR_MANAGER.md)

**Hard limits enforced during this flow:**
- `never_accept_decline: true` — never responds to meeting invitations
- `never_modify_existing_events: true` — only creates new buffer events, never touches existing calendar entries

---

## Context Package

The context package for this flow is assembled at step 2 and supplemented with live data from steps 3–5.

| Context Key | Source | Description |
|---|---|---|
| `calendar_events` | Google Calendar API (step 3) | Today's and tomorrow's events with locations |
| `user_locations` | `users/{user}/USER.md` | Default locations (home, office) |
| `working_hours` | `users/{user}/USER.md` | Working hours for default location inference |
| `scheduling_rules` | `users/{user}/SCHEDULING.md` | Location list, buffer preferences, protected blocks |
| `drive_times` | Google Maps API (step 5) | Calculated travel durations per route |

Context package written to: `context/{user}/{date}-calendar_manager-transit.md`

---

## Gate Behavior

**Not applicable.** This flow has `human_gate_before_agents: false`. There is no interactive review step.

Buffer events are identifiable by their `[Transit]` prefix and can be manually deleted from Google Calendar if unwanted.

---

## Output

| Output | Path | Description |
|---|---|---|
| Transit Prep Report | `outputs/{user}/{date}/transit_prep_report.md` | Summary of buffers created |
| Buffer Events | Google Calendar (external) | Transit buffer events on user's calendar |
| Context Package | `context/{user}/{date}-calendar_manager-transit.md` | Assembled context (versioned) |
| Updated State | `state/{user}/last_run.json` | Timestamp of successful completion |
| Run Log | `logs/{user}/{date}.log` | Execution log with timing and details |

---

## Idempotency

This flow does not use `processed_ids.json` because it operates on calendar events (which have stable event IDs) rather than a stream of incoming items.

**Idempotency is achieved through buffer event detection (step 6):**

1. **Existing buffer detection:** Before creating a buffer, the flow scans for existing events with the `[Transit]` prefix targeting the same meeting (matched by time proximity and destination).

2. **Update threshold:** If an existing buffer's duration differs from the new calculation by more than 10 minutes, the old buffer is deleted and a new one is created. Otherwise, the existing buffer is left in place.

3. **Re-run safety:** Running this flow multiple times for the same day produces the same result — one buffer event per physical-location meeting, with the most current drive time estimate.

4. **Date scoping:** The flow only processes today's and tomorrow's events. It does not retroactively modify past buffers.

---

## Error Handling

| Error | Detection | Response |
|---|---|---|
| **git pull fails** | Non-zero exit code | Abort flow. Log error. |
| **Google Calendar API unreachable** | HTTP timeout or 5xx | Abort flow. Cannot proceed without calendar data. |
| **Google Calendar OAuth expired** | HTTP 401 | Abort flow. Log "Calendar OAuth token expired — run `helm inputs test google_calendar`." |
| **Google Maps API unreachable** | HTTP timeout or 5xx | Fall back to default 30-minute buffer for all meetings. Log warning. Continue. |
| **Google Maps API key invalid** | HTTP 403 | Abort flow. Log "Maps API key invalid or quota exceeded." |
| **Maps returns no route** | API response with no results | Use default 30-minute buffer for that meeting. Log fallback. Continue with remaining. |
| **Calendar Manager timeout** | Exceeds 120s | Abort flow. Log timeout. |
| **Calendar write failure** | HTTP 4xx/5xx on POST | Retry once. If second failure, skip that buffer, log, continue with remaining. |
| **No physical meetings found** | Empty list at step 4 | Normal completion. Report "No physical-location meetings found." |
| **User location config missing** | SCHEDULING.md lacks addresses | Abort flow. Log "Location configuration incomplete — update SCHEDULING.md." |
| **git push fails** | Non-zero exit code | Log warning. State committed locally. |

---

## Tuning Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-11 | Initial flow instruction created | System bootstrap |
