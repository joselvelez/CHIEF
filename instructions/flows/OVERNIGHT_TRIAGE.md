# Flow: Overnight Email Triage

**ID:** `overnight_triage`
**Version:** 1.0.0
**Last Updated:** 2026-03-11

---

## Purpose

Automatically triages overnight emails, Zoom meeting summaries, and Todoist tasks into classified task objects while updating the knowledge base — all before the user wakes up.

---

## Trigger

| Property | Value |
|---|---|
| Type | Scheduled (cron) |
| Platform | Railway |
| Schedule (UTC) | `0 10 * * 1-5` |
| Schedule (Human) | 5:00 AM ET, weekdays |
| Invocation | Automatic via Railway cron job |
| Manual Override | `helm run overnight-triage` |

The trigger is registered in [`config/triggers.yaml`](../../config/triggers.yaml) under `id: overnight_triage`. It ships disabled — enable only after successful manual test runs.

---

## Human Gate

**`human_gate_before_agents: false`**

This flow runs fully automated with no human review step. All outputs land in `/outputs/{user}/{date}/overnight_report.md` for asynchronous morning review. The user reviews the overnight report as the first step of their AM Sweep.

**Rationale:** Overnight triage is a low-risk preparatory flow. It creates Todoist tasks and knowledge base entries — it never sends emails, modifies calendar events, or takes any external action that cannot be undone.

---

## Flow Sequence

```
START
  └─ [1] git pull
  │       Pull latest repo to ensure current instructions, config, and state.
  │       Abort if git pull fails (network error, merge conflict).
  │
  └─ [2] Load state/{user}/processed_ids.json
  │       Read the idempotency ledger containing all previously processed
  │       email thread IDs, Zoom meeting IDs, and Todoist task IDs.
  │       If file does not exist, initialize empty: { "emails": [], "zoom": [], "todoist": [] }
  │
  └─ [3] Fetch emails since last run (Gmail API)
  │       Query Gmail with: after:{last_run_timestamp} label:inbox
  │       Retrieve full thread data for each email: subject, sender, date,
  │       body (first 2000 chars), thread ID, labels.
  │       Rate limit: respect Gmail API quota (250 requests/second).
  │
  └─ [4] Filter out already-processed email IDs
  │       Compare fetched thread IDs against processed_ids.json → emails[].
  │       Remove any thread ID that already appears in the ledger.
  │       Log count: "{n} new emails, {m} already processed (skipped)."
  │
  └─ [5] Fetch Zoom meeting summaries from last 24h
  │       Call Zoom API: GET /users/{userId}/recordings?from={yesterday}
  │       For each meeting with AI summary available:
  │         GET /meetings/{meetingId}/meeting_summary
  │       Filter out meeting IDs already in processed_ids.json → zoom[].
  │       Extract: meeting title, participants, summary text, action items.
  │
  └─ [6] Fetch open Todoist tasks
  │       Call Todoist API: GET /tasks?filter=today | overdue
  │       Retrieve: task ID, content, description, priority, labels, due date.
  │       These provide context for classification (existing workload awareness).
  │
  └─ [7] Build context package
  │       Assemble the following for the Task Classifier:
  │       - New emails (from step 4)
  │       - Zoom summaries (from step 5)
  │       - Open Todoist tasks (from step 6)
  │       - User profile: users/{user}/USER.md
  │       - Classification rules: users/{user}/CLASSIFY.md
  │       - Client profiles: users/{user}/CLIENTS.md
  │       - Scheduling rules: users/{user}/SCHEDULING.md
  │       Write package to: context/{user}/{date}-task_classifier.md
  │       Enforce context size cap: 20,000 tokens (per engine.yaml).
  │
  └─ [8] Run TASK_CLASSIFIER agent
  │       Invoke the Task Classifier with the assembled context package.
  │       Agent instruction file: /instructions/agents/TASK_CLASSIFIER.md
  │       Agent behavior:
  │         - Classify each email into Dispatch / Prep / Yours / Skip
  │         - Extract action items from each Zoom summary
  │         - Apply classification rules from CLASSIFY.md
  │         - Apply hard limits from agents.yaml:
  │             never_send_email: true
  │             never_delete: true
  │             never_dispatch_financial: true
  │             no_downgrade_higher_rule: true
  │             idempotency_required: true
  │             no_calendar_rules_overnight: true
  │             default_posture: "uncertain → escalate toward Yours"
  │         - Output: array of classified task objects
  │       Timeout: 120 seconds (per engine.yaml default_timeout_seconds).
  │
  └─ [9] Run NOTES_AGENT agent
  │       Invoke the Notes Agent with Zoom meeting summaries.
  │       Agent instruction file: /instructions/agents/NOTES_AGENT.md
  │       Agent behavior:
  │         - Match each meeting to a client/project via CLIENTS.md
  │         - Extract key decisions, action items, discussion topics
  │         - Format as structured knowledge base entries
  │         - Hard limit: never_overwrite_strategic_content: true
  │         - Output: knowledge base update files
  │       Timeout: 120 seconds.
  │       Runs sequentially AFTER task_classifier (depends on classification output).
  │
  └─ [10] Dedup against existing Todoist tasks
  │        Compare classified task objects against current Todoist tasks (step 6).
  │        Match on: source_id (Gmail thread ID / Zoom meeting ID + action index).
  │        If a task object matches an existing Todoist task, skip it.
  │        Log: "{n} new tasks, {m} duplicates skipped."
  │
  └─ [11] Write new tasks to Todoist
  │        For each non-duplicate classified task object:
  │          POST /tasks to Todoist API with:
  │            - content: task title
  │            - description: classification metadata, source reference
  │            - priority: mapped from classification (Dispatch=p3, Prep=p2, Yours=p1)
  │            - labels: [classification_state, source_type]
  │            - due_date: today (for Dispatch/Prep/Yours), future date (for Skip)
  │        Hard limit: max tasks created per run capped by system safety (no explicit cap
  │        in agents.yaml, but log a warning if > 50 tasks in a single run).
  │
  └─ [12] Write knowledge base updates
  │        For each Notes Agent output:
  │          Append to: knowledge/{user}/clients/{client_slug}.md
  │          Use append-only strategy — never overwrite existing content.
  │          Add date header and meeting reference for each entry.
  │
  └─ [13] Update processed_ids.json
  │        Append all processed email thread IDs to processed_ids.json → emails[].
  │        Append all processed Zoom meeting IDs to processed_ids.json → zoom[].
  │        Write atomically (write to temp file, then rename).
  │
  └─ [14] Write completion report
  │        Generate: outputs/{user}/{date}/overnight_report.md
  │        Report contents:
  │          - Run timestamp
  │          - Emails processed: {count} ({new} new, {skipped} skipped)
  │          - Zoom meetings processed: {count}
  │          - Tasks created: {count} by classification
  │            - 🟢 Dispatch: {n}
  │            - 🟡 Prep: {n}
  │            - 🔴 Yours: {n}
  │            - ⚫ Skip: {n}
  │          - Knowledge base files updated: {list}
  │          - Errors: {any errors encountered}
  │
  └─ [15] Update last_run.json
  │        Write to state/{user}/last_run.json:
  │          { "overnight_triage": { "last_success": "{ISO_timestamp}", "status": "ok" } }
  │        Only written on successful completion.
  │
  └─ [16] git commit + push
  │        Stage: outputs/, state/, knowledge/, context/, logs/
  │        Commit message: "[auto] overnight-triage {date} — {user}"
  │        Push to remote.
  │        If push fails (network), log error but do not retry push
  │        (state is committed locally, will push on next run's git pull).
  │
END
```

---

## Inputs Required

| Input | Config ID | Purpose | Required Scopes |
|---|---|---|---|
| Gmail | `gmail` | Fetch overnight emails | `email_read` |
| Todoist | `todoist` | Read existing tasks, write new tasks | `tasks_read`, `tasks_write` |
| Zoom | `zoom` | Fetch AI meeting summaries | `meeting_summaries_read`, `recordings_read` |

All inputs must show `enabled: true` and `configured: true` in [`config/inputs.yaml`](../../config/inputs.yaml). If any required input is disabled or unconfigured, the flow aborts at step 3/5/6 with a clear error message identifying the missing input.

---

## Agents Involved

| Order | Agent | ID | Mode | Execution |
|---|---|---|---|---|
| 1 | Task Classifier | `task_classifier` | Default (overnight) | Sequential |
| 2 | Notes Agent | `notes_agent` | Default | Sequential (after task_classifier) |

**Execution model:** Sequential. The Notes Agent runs after the Task Classifier completes because it may reference classification output when determining which meetings are relevant.

**Agent instruction files:**
- [`/instructions/agents/TASK_CLASSIFIER.md`](../agents/TASK_CLASSIFIER.md)
- [`/instructions/agents/NOTES_AGENT.md`](../agents/NOTES_AGENT.md)

**Hard limits enforced during this flow:**
- Task Classifier: `no_calendar_rules_overnight: true` — calendar-based classification rules are suppressed during overnight runs because the user's day has not begun.
- Notes Agent: `never_overwrite_strategic_content: true` — appends only.

---

## Context Package

The context package for this flow is assembled at step 7 and written to `context/{user}/{date}-task_classifier.md`.

| Context Key | Source | Description |
|---|---|---|
| `new_emails` | Gmail API (step 3–4) | Unprocessed emails since last run |
| `zoom_summaries` | Zoom API (step 5) | Meeting summaries from last 24h |
| `open_todoist_tasks` | Todoist API (step 6) | Current open tasks for dedup awareness |
| `classification_rules` | `users/{user}/CLASSIFY.md` | Dispatch/Prep/Yours/Skip rule definitions |
| `client_profiles` | `users/{user}/CLIENTS.md` | Client context for classification |
| `user_profile` | `users/{user}/USER.md` | Identity, hard rules, preferences |
| `scheduling_rules` | `users/{user}/SCHEDULING.md` | Scheduling context (limited use overnight) |

**Notes Agent receives a separate, smaller context package:**

| Context Key | Source | Description |
|---|---|---|
| `zoom_summaries` | Zoom API (step 5) | Meeting summaries to process |
| `client_profiles` | `users/{user}/CLIENTS.md` | Client matching for knowledge base routing |
| `existing_notes` | `knowledge/{user}/clients/` | Current knowledge base content per client |

---

## Gate Behavior

**Not applicable.** This flow has `human_gate_before_agents: false`. There is no interactive review step.

The overnight report (`outputs/{user}/{date}/overnight_report.md`) serves as the asynchronous review artifact. The user reviews this report each morning before running AM Sweep.

---

## Output

| Output | Path | Description |
|---|---|---|
| Overnight Report | `outputs/{user}/{date}/overnight_report.md` | Summary of all triage actions taken |
| Todoist Tasks | Todoist API (external) | New tasks created from email/Zoom classification |
| Knowledge Base Updates | `knowledge/{user}/clients/{client}.md` | Appended meeting notes and summaries |
| Context Package | `context/{user}/{date}-task_classifier.md` | Assembled context (versioned for audit) |
| Updated State | `state/{user}/processed_ids.json` | Idempotency ledger with new IDs |
| Updated State | `state/{user}/last_run.json` | Timestamp of successful completion |
| Run Log | `logs/{user}/{date}.log` | Execution log with timing and counts |

---

## Idempotency

**Idempotency key:** `state/{user}/processed_ids.json`

This flow is designed to be safely re-runnable. The idempotency mechanism works as follows:

1. **Email deduplication:** Every processed Gmail thread ID is recorded in `processed_ids.json → emails[]`. On subsequent runs, any email whose thread ID already appears in the ledger is skipped entirely.

2. **Zoom deduplication:** Every processed Zoom meeting ID is recorded in `processed_ids.json → zoom[]`. Meetings already in the ledger are skipped.

3. **Todoist deduplication:** Before writing tasks to Todoist, the flow checks for existing tasks with matching `source_id` metadata. Duplicates are not created.

4. **Knowledge base deduplication:** The Notes Agent checks for existing entries with the same meeting ID and date before appending. If an entry already exists, it is skipped.

5. **State atomicity:** `processed_ids.json` is updated only after successful task creation and knowledge base writes. If the flow crashes mid-run, IDs for unprocessed items remain absent from the ledger, ensuring they are picked up on retry.

**`processed_ids.json` schema:**
```json
{
  "schema_version": "1.0",
  "user": "{username}",
  "emails": [
    { "thread_id": "string", "processed_date": "YYYY-MM-DD", "flow": "overnight_triage" }
  ],
  "zoom": [
    { "meeting_id": "string", "processed_date": "YYYY-MM-DD", "flow": "overnight_triage" }
  ],
  "todoist": [
    { "task_id": "string", "processed_date": "YYYY-MM-DD", "flow": "overnight_triage" }
  ]
}
```

**Retry behavior:** Railway is configured with max 2 retries on crash. Because of the idempotency ledger, retries skip already-processed items and pick up where the previous run left off. No duplicate tasks or knowledge base entries are created.

---

## Error Handling

| Error | Detection | Response |
|---|---|---|
| **git pull fails** | Non-zero exit code | Abort flow. Log error. Do not proceed — instructions may be stale. |
| **Gmail API unreachable** | HTTP timeout or 5xx | Abort email processing. Continue with Zoom/Todoist if available. Log partial run. |
| **Gmail OAuth expired** | HTTP 401 | Abort flow. Log "Gmail OAuth token expired — run `helm inputs test gmail` to refresh." |
| **Zoom API unreachable** | HTTP timeout or 5xx | Skip Zoom processing. Continue with email/Todoist. Log partial run. |
| **Todoist API unreachable** | HTTP timeout or 5xx | Abort flow. Cannot write tasks without Todoist. |
| **Task Classifier timeout** | Exceeds 120s | Abort flow. Log timeout with context package size for debugging. |
| **Task Classifier error** | Non-zero exit or malformed output | Abort flow. Log raw output for debugging. |
| **Notes Agent timeout** | Exceeds 120s | Log warning. Continue with remaining steps (task writing is independent). |
| **Notes Agent error** | Non-zero exit | Log warning. Continue — knowledge base updates are non-critical. |
| **Todoist write failure** | HTTP 4xx/5xx on POST | Retry once. If second failure, skip that task, log it, continue with remaining. |
| **processed_ids.json corrupt** | JSON parse error | Abort flow. Log "State file corrupt — manual intervention required." |
| **git push fails** | Non-zero exit code | Log warning. State is committed locally. Next run's git pull will resolve. |

**Partial run handling:** If some inputs fail but others succeed, the flow processes what it can and logs a partial run warning in the overnight report. The `last_run.json` is updated with `"status": "partial"` instead of `"ok"`.

**Error log format:** All errors are written to `logs/{user}/{date}.log` with:
- ISO timestamp
- Flow ID: `overnight_triage`
- Step number where failure occurred
- Error type and message
- Recovery action taken

---

## Tuning Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-11 | Initial flow instruction created | System bootstrap |
