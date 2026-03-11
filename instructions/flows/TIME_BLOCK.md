# Flow: Time Block

**ID:** `time_block`
**Version:** 1.0.0
**Last Updated:** 2026-03-11

---

## Purpose

Generates a proposed time-blocked daily schedule from unscheduled tasks, respecting locations, energy levels, working hours, and scheduling rules — then pushes approved events to Google Calendar after human review.

---

## Trigger

| Property | Value |
|---|---|
| Type | Manual |
| Platform | Local (HELM CLI) |
| Invocation | `helm run time-block` |
| Schedule | None — user-initiated, typically after AM Sweep |

The trigger is registered in [`config/triggers.yaml`](../../config/triggers.yaml) under `id: time_block`. It ships enabled because it is a manual trigger with a human gate.

---

## Human Gate

**`human_gate_before_agents: true`**

This flow always pauses for human review before pushing any events to Google Calendar. The gate displays the full proposed schedule, allowing the user to review, adjust, or abort. **Do not set `human_gate_before_agents` to `false` for this flow.**

**Rationale:** Time blocking directly affects the user's calendar — the most visible and time-sensitive external system. Every proposed schedule must be reviewed before it becomes real.

---

## Flow Sequence

```
START
  └─ [1] git pull
  │       Pull latest repo to ensure current instructions, config, and state.
  │       Abort if git pull fails (network error, merge conflict).
  │
  └─ [2] Fetch unscheduled tasks from Todoist
  │       Call Todoist API: GET /tasks
  │       Filter for tasks that:
  │         - Have due date = today or overdue
  │         - Do NOT already have a corresponding calendar event
  │           (cross-reference with calendar in step 3)
  │         - Are not in a "completed" state
  │       For each task, extract:
  │         - Task ID, title, description, priority, labels
  │         - Duration estimate (from description metadata or label)
  │         - Location requirement (from description or label: home/office/errand/gym)
  │         - Energy level (from label: high/medium/low)
  │       If a task lacks a duration estimate, apply defaults:
  │         - Email-related: 15 min
  │         - Meeting prep: 30 min
  │         - Research: 45 min
  │         - Deep work: 60 min
  │         - Errand: 30 min
  │         - Default fallback: 30 min
  │
  └─ [3] Fetch today's committed calendar events
  │       Call Google Calendar API:
  │         GET /calendars/primary/events
  │         ?timeMin={today_start_UTC}
  │         &timeMax={today_end_UTC}
  │         &singleEvents=true
  │         &orderBy=startTime
  │       Retrieve: event ID, title, start, end, location, status.
  │       Filter out cancelled events.
  │       These represent the immovable blocks the schedule must work around.
  │
  └─ [4] Load user configuration
  │       Read from users/{user}/USER.md:
  │         - Working hours (start/end per day)
  │         - Default locations (home, office)
  │         - Energy patterns (when high-energy work should be scheduled)
  │       Read from users/{user}/SCHEDULING.md:
  │         - Protected blocks (lunch, family time, etc.)
  │         - Location list with full addresses
  │         - Task routing rules
  │         - Gym days and preferred times
  │         - Errand batching preferences
  │         - Evening window rules
  │       Read from state/{user}/deferred.json:
  │         - Previously deferred tasks with suggested dates
  │         - Check if any deferred tasks have reached their target date
  │
  └─ [5] Build context package for Time Blocker
  │       Assemble: context/{user}/{date}-time_blocker.md
  │       Contents:
  │         - Unscheduled tasks with metadata (from step 2)
  │         - Today's committed events (from step 3)
  │         - User working hours, locations, energy patterns (from step 4)
  │         - Scheduling rules (from step 4)
  │         - Deferred tasks due today (from step 4)
  │       Enforce context size cap: 20,000 tokens.
  │
  └─ [6] Run TIME_BLOCKER agent
  │       Invoke the Time Blocker with the assembled context package.
  │       Agent instruction file: /instructions/agents/TIME_BLOCKER.md
  │       Agent behavior:
  │         - Calculate available time windows from working hours minus
  │           committed events and protected blocks
  │         - Apply location-aware batching:
  │             Group errands geographically
  │             Minimize location transitions
  │             Schedule office tasks during office hours
  │             Schedule home tasks during home hours
  │         - Route errands with Google Maps API:
  │             Calculate optimal errand sequence
  │             Include transit time between stops
  │             Use pessimistic traffic estimates
  │         - Schedule gym on configured days at preferred time
  │         - Apply energy-level matching:
  │             High-energy tasks in user's peak hours
  │             Low-energy tasks in afternoon/evening
  │         - Fill evening window with home tasks (per SCHEDULING.md rules)
  │         - Defer overflow tasks:
  │             Tasks that cannot fit today
  │             Suggest future dates based on calendar availability
  │             Respect priority ordering (higher priority keeps today's slot)
  │         - Hard limits from agents.yaml:
  │             never_modify_committed_events: true
  │             propose_only: true
  │         - Output: proposed schedule (array of time block objects)
  │       Timeout: 120 seconds.
  │
  └─ [7] Generate proposed schedule
  │       Format the Time Blocker output as a human-readable schedule:
  │
  │       ┌─────────────────────────────────────────────────┐
  │       │  PROPOSED SCHEDULE — {day}, {date}              │
  │       ├─────────────────────────────────────────────────┤
  │       │  8:00 – 8:30   ☕ Morning review (protected)    │
  │       │  8:30 – 9:15   📧 Draft proposal to [Client]   │
  │       │  9:15 – 10:00  📋 Prep board call brief         │
  │       │  10:00 – 11:00 📞 Call with [Client A] (fixed)  │
  │       │  11:00 – 11:45 🔍 Research [Topic]              │
  │       │  11:45 – 12:00 ── buffer ──                     │
  │       │  12:00 – 13:00 🍽️ Lunch (protected)             │
  │       │  13:00 – 13:30 🚗 Drive to [Location]           │
  │       │  13:30 – 14:00 🏃 Errand: [Task]                │
  │       │  14:00 – 14:15 🚗 Drive to [Next Location]      │
  │       │  14:15 – 14:45 🏃 Errand: [Task]                │
  │       │  14:45 – 15:15 🚗 Drive home                    │
  │       │  15:15 – 16:00 📝 Update client notes            │
  │       │  16:00 – 17:00 💪 Gym (configured)               │
  │       │  17:00 – 17:30 📧 Follow-up emails               │
  │       │  ─── Evening ───                                 │
  │       │  19:00 – 19:30 🏠 [Home task]                    │
  │       ├─────────────────────────────────────────────────┤
  │       │  DEFERRED (overflow)                             │
  │       │  · [Task] → suggested: Wednesday                 │
  │       │  · [Task] → suggested: Friday                    │
  │       ├─────────────────────────────────────────────────┤
  │       │  Utilization: 6.5h / 8h available (81%)          │
  │       │  Errands routed: 2 stops, 45 min total transit   │
  │       └─────────────────────────────────────────────────┘
  │
  │       Write proposed schedule to:
  │         outputs/{user}/{date}/proposed_schedule.md
  │
  └─ [8] Display proposed schedule at HELM gate
  │       HELM renders the proposed schedule in the terminal.
  │       The display includes:
  │         - Full time-blocked schedule with icons and labels
  │         - Fixed (committed) events marked distinctly
  │         - Protected blocks shown but not editable
  │         - Deferred tasks with suggested future dates
  │         - Utilization metrics
  │         - Errand routing summary
  │
  └─ [9] ── HUMAN GATE ──
  │       The flow pauses here indefinitely until user input.
  │       Nothing is pushed to Google Calendar. No external changes.
  │
  │       User options:
  │
  │       [a] APPROVE
  │           Accept the proposed schedule as shown.
  │           Proceed to push events to Google Calendar (step 10).
  │           Deferred tasks are written to deferred.json.
  │
  │       [e] ADJUST
  │           Enter adjustment mode. User can:
  │             - Move a task to a different time slot
  │             - Change a task's duration
  │             - Remove a task from today (defer it)
  │             - Add a manual time block
  │           Schedule re-displays after each adjustment.
  │           Adjustments do NOT re-run the Time Blocker agent —
  │           they are direct edits to the proposed schedule.
  │           User can make multiple adjustments before approving.
  │
  │       [x] ABORT
  │           Cancel the entire run.
  │           No events pushed to calendar.
  │           No deferred tasks written.
  │           State/{user}/last_run.json is NOT updated.
  │           Exit HELM cleanly.
  │
  └─ [10] Push approved events to Google Calendar
  │        For each time block in the approved schedule that is NOT
  │        a committed (existing) event or protected block:
  │          POST /calendars/primary/events to Google Calendar API
  │          Event data:
  │            - title: task title with category emoji prefix
  │            - start/end: from the approved schedule
  │            - location: if task has a location requirement
  │            - description: "Auto-scheduled by CHIEF Time Block.\n
  │                           Source: Todoist task #{task_id}\n
  │                           Priority: {priority}\n
  │                           Duration: {duration}"
  │            - colorId: mapped from task category
  │            - reminders: 5 minutes before
  │        Log each created event.
  │        Transit blocks (drive time) are also pushed with [Transit] prefix.
  │
  └─ [11] Update deferred tasks
  │        Write deferred tasks to state/{user}/deferred.json:
  │          {
  │            "schema_version": "1.0",
  │            "user": "{username}",
  │            "deferred": [
  │              {
  │                "task_id": "string",
  │                "title": "string",
  │                "deferred_date": "YYYY-MM-DD",
  │                "suggested_date": "YYYY-MM-DD",
  │                "reason": "overflow | dependency | low_priority",
  │                "priority": 1-4
  │              }
  │            ]
  │          }
  │        Remove any deferred entries whose suggested_date has passed
  │        (they will reappear as overdue Todoist tasks).
  │
  └─ [12] Write completion report
  │        Generate: outputs/{user}/{date}/time_block_report.md
  │        Report contents:
  │          - Run timestamp
  │          - Events pushed to calendar: {count}
  │          - Tasks scheduled: {count} ({total_hours}h)
  │          - Tasks deferred: {count}
  │          - Errand routing: {stops} stops, {transit_time} transit
  │          - Utilization: {scheduled}h / {available}h ({percent}%)
  │          - Adjustments made at gate: {count}
  │
  └─ [13] Update last_run.json
  │        Write to state/{user}/last_run.json:
  │          { "time_block": { "last_success": "{ISO_timestamp}", "status": "ok" } }
  │
  └─ [14] git commit + push
  │        Stage: outputs/, state/, context/, logs/
  │        Commit message: "[auto] time-block {date} — {user}"
  │        Push to remote.
  │
END
```

---

## Inputs Required

| Input | Config ID | Purpose | Required Scopes |
|---|---|---|---|
| Todoist | `todoist` | Read unscheduled tasks with metadata | `tasks_read` |
| Google Calendar | `google_calendar` | Read committed events, write approved blocks | `calendar_read`, `calendar_write` |
| Google Maps | `google_maps` | Calculate errand routing and transit times | Distance Matrix API access |

All inputs must show `enabled: true` and `configured: true` in [`config/inputs.yaml`](../../config/inputs.yaml). If any required input is disabled or unconfigured, the flow aborts with a clear error identifying the missing input.

**Note on Google Maps:** If Maps is unavailable, the flow can still produce a schedule without location-aware routing. Errand batching falls back to task-list order, and transit times use a default 30-minute estimate. The gate display will show a warning that routing data is estimated.

---

## Agents Involved

| Order | Agent | ID | Execution | Condition |
|---|---|---|---|---|
| 1 | Time Blocker | `time_blocker` | Sequential (pre-gate) | Always runs |

**Execution model:** Single agent, sequential. The Time Blocker is the only agent in this flow. It runs before the human gate, producing a proposed schedule for review.

**Agent instruction file:** [`/instructions/agents/TIME_BLOCKER.md`](../agents/TIME_BLOCKER.md)

**Hard limits enforced during this flow:**
- `never_modify_committed_events: true` — existing calendar events are immovable constraints, never modified
- `propose_only: true` — the agent outputs a proposal; the flow handles calendar writes after gate approval

---

## Context Package

The context package is assembled at step 5 and written to `context/{user}/{date}-time_blocker.md`.

| Context Key | Source | Description |
|---|---|---|
| `unscheduled_tasks` | Todoist API (step 2) | Tasks needing time slots with duration/location/energy metadata |
| `calendar_today` | Google Calendar API (step 3) | Today's committed events (immovable constraints) |
| `user_locations` | `users/{user}/USER.md` | Default locations and addresses |
| `working_hours` | `users/{user}/USER.md` | Start/end of workday per day |
| `scheduling_rules` | `users/{user}/SCHEDULING.md` | Protected blocks, gym days, errand prefs, evening rules |
| `deferred_tasks` | `state/{user}/deferred.json` | Previously deferred tasks due today |

---

## Gate Behavior

### What the User Sees

HELM displays the full proposed time-blocked schedule in the terminal, formatted as a visual timeline with:

- **Time slots** with start/end times
- **Category icons** (📧 email, 📋 prep, 🔍 research, 🏃 errand, 💪 gym, 🏠 home, 🚗 transit)
- **Fixed events** marked with a lock indicator (🔒) — these cannot be moved
- **Protected blocks** shown in gray — reserved time
- **Deferred tasks** listed below with suggested future dates
- **Utilization metrics** — hours scheduled vs. available
- **Errand routing summary** — number of stops, total transit time

### User Options

| Key | Action | Effect |
|---|---|---|
| `[a]` | **Approve** | Accept schedule as shown. Push all new events to Google Calendar. Write deferred tasks. Proceed to step 10. |
| `[e]` | **Adjust** | Enter adjustment mode. Move tasks, change durations, defer tasks, add manual blocks. Schedule re-displays after each change. No agent re-invocation. Multiple adjustments allowed before approving. |
| `[x]` | **Abort** | Cancel entire run. No events pushed. No state changes. Clean exit. |

### Adjustment Mode Details

When the user presses `[e]`, HELM enters an interactive adjustment mode:

1. Tasks are numbered for selection
2. User selects a task number
3. Options per task:
   - **Move:** specify new start time (end auto-calculated from duration)
   - **Resize:** specify new duration
   - **Defer:** remove from today, specify suggested date or let system suggest
   - **Remove:** remove from schedule entirely (stays in Todoist, unscheduled)
4. After each adjustment, the schedule is re-validated:
   - Check for time conflicts
   - Recalculate utilization
   - Update deferred list
5. User returns to gate with `[a]` approve, `[e]` adjust again, or `[x]` abort

---

## Output

| Output | Path | Description |
|---|---|---|
| Proposed Schedule | `outputs/{user}/{date}/proposed_schedule.md` | Human-readable schedule |
| Time Block Report | `outputs/{user}/{date}/time_block_report.md` | Completion summary |
| Calendar Events | Google Calendar (external) | Approved time blocks pushed to calendar |
| Context Package | `context/{user}/{date}-time_blocker.md` | Assembled context (versioned) |
| Deferred Tasks | `state/{user}/deferred.json` | Updated deferral list |
| Updated State | `state/{user}/last_run.json` | Timestamp of successful completion |
| Run Log | `logs/{user}/{date}.log` | Execution log |

---

## Idempotency

This flow does not use `processed_ids.json`. Idempotency is handled through calendar event detection:

1. **Re-run detection:** If Time Block runs twice on the same day, the second run's step 3 will fetch events created by the first run. The Time Blocker agent treats these as committed events and schedules around them (or skips tasks that are already scheduled).

2. **Clean re-run:** If the user wants a fresh schedule, they should delete the time-block events from Google Calendar before re-running. Events created by this flow are identifiable by their description containing "Auto-scheduled by CHIEF Time Block."

3. **Deferred state:** `deferred.json` is overwritten each run (not appended). The latest run's deferral list is the canonical state.

4. **Gate adjustments:** Adjustments made at the gate are applied to the proposed schedule in memory. They are not persisted separately — only the final approved schedule is pushed to calendar.

---

## Error Handling

| Error | Detection | Response |
|---|---|---|
| **git pull fails** | Non-zero exit code | Abort flow. Log error. |
| **Todoist API unreachable** | HTTP timeout or 5xx | Abort flow. Cannot schedule without task data. |
| **Google Calendar API unreachable** | HTTP timeout or 5xx | Abort flow. Cannot read committed events or write blocks. |
| **Google Calendar OAuth expired** | HTTP 401 | Abort flow. Log "Calendar OAuth expired — run `helm inputs test google_calendar`." |
| **Google Maps API unreachable** | HTTP timeout or 5xx | Warn user. Continue with default transit estimates. Schedule generated without routing optimization. |
| **Google Maps API key invalid** | HTTP 403 | Warn user. Continue with default estimates. |
| **No unscheduled tasks** | Empty task list at step 2 | Normal completion. Display "No unscheduled tasks to time-block." Exit cleanly. |
| **Time Blocker timeout** | Exceeds 120s | Abort flow. Log timeout with context size. |
| **Time Blocker error** | Malformed output | Abort flow. Display error to user. |
| **User aborts at gate** | [x] pressed | Clean exit. No calendar changes. No state updates. |
| **Calendar write failure** | HTTP 4xx/5xx on POST | Retry once. If second failure, stop pushing remaining events. Report partial completion with list of events that failed. |
| **Partial calendar push** | Some events succeed, some fail | Report which events were pushed and which failed. User can retry or push manually. State reflects partial completion. |
| **SCHEDULING.md missing** | File not found | Abort flow. Log "SCHEDULING.md not found — run `helm docs edit scheduling`." |
| **git push fails** | Non-zero exit code | Log warning. State committed locally. |

---

## Tuning Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-11 | Initial flow instruction created | System bootstrap |
