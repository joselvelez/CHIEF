# Flow: AM Sweep

**ID:** `am_sweep`
**Version:** 1.0.0
**Last Updated:** 2026-03-11

---

## Purpose

The primary interactive morning flow that classifies all open tasks, presents them for human review at a gate, then fires parallel agents to handle Dispatch and Prep items — producing email drafts, calendar proposals, research files, and knowledge base updates.

---

## Trigger

| Property | Value |
|---|---|
| Type | Manual |
| Platform | Local (HELM CLI) |
| Invocation | `helm run am-sweep` |
| Schedule | None — user-initiated each morning |

The trigger is registered in [`config/triggers.yaml`](../../config/triggers.yaml) under `id: am_sweep`. It ships enabled because it is a manual trigger with a human gate — no risk of unreviewed automation.

---

## Human Gate

**`human_gate_before_agents: true`**

This flow always pauses for human review before any agents fire. The gate is a hard stop — nothing external happens until the user explicitly approves. **Do not set `human_gate_before_agents` to `false` for this flow.**

The gate displays the full classified task list in HELM's interactive UI, allowing the user to review, reclassify, reject, or abort before any agent execution begins.

---

## Flow Sequence

```
START
  └─ [1] git pull
  │       Pull latest repo to ensure current instructions, config, and state.
  │       Abort if git pull fails (network error, merge conflict).
  │
  └─ [2] Load state files
  │       Read state/{user}/processed_ids.json (idempotency ledger).
  │       Read state/{user}/gate_overrides.json (persistent reclassifications).
  │       Read state/{user}/last_run.json (timestamps of previous runs).
  │       Read state/{user}/deferred.json (deferred tasks with future dates).
  │       If any file does not exist, initialize with empty defaults.
  │
  └─ [3] Build today's context package
  │       Assemble: context/{user}/{date}.md
  │       Contents:
  │         - Open tasks from Todoist (GET /tasks?filter=today | overdue)
  │         - Today's calendar events (Google Calendar API)
  │         - Recent Zoom transcripts (last 3 days, filtered by processed_ids)
  │         - Client profiles for any tasks referencing known clients
  │           (matched via users/{user}/CLIENTS.md)
  │         - User profile: users/{user}/USER.md
  │         - Classification rules: users/{user}/CLASSIFY.md
  │         - Voice profile: users/{user}/VOICE.md
  │         - Scheduling rules: users/{user}/SCHEDULING.md
  │       Enforce context size cap: 20,000 tokens (per engine.yaml).
  │       Write context package to: context/{user}/{date}.md
  │
  └─ [4] Apply gate overrides
  │       Read state/{user}/gate_overrides.json.
  │       For each active (cleared: false) override:
  │         Match on source_id against current task list.
  │         Any matching task is pre-classified as the override's
  │         forced_classification (typically "Yours"), bypassing the
  │         classifier rule chain entirely.
  │       Log: "{n} gate overrides applied."
  │
  └─ [5] Run TASK_CLASSIFIER agent
  │       Invoke the Task Classifier with the assembled context package.
  │       Agent instruction file: /instructions/agents/TASK_CLASSIFIER.md
  │       Agent behavior:
  │         - Classify each open task into Dispatch / Prep / Yours / Skip
  │         - Apply classification rules from CLASSIFY.md
  │         - Respect gate overrides from step 4 (pre-classified items are locked)
  │         - Apply hard limits from agents.yaml:
  │             never_send_email: true
  │             never_delete: true
  │             never_dispatch_financial: true
  │             no_downgrade_higher_rule: true
  │             idempotency_required: true
  │             default_posture: "uncertain → escalate toward Yours"
  │         - Note: no_calendar_rules_overnight does NOT apply here
  │           (AM Sweep has full calendar context)
  │         - Output: array of classified task objects with metadata
  │       Timeout: 120 seconds (per engine.yaml).
  │       Idempotency scope: zoom_transcripts_only
  │         (Todoist tasks are re-classified fresh each run by design;
  │          only Zoom transcript IDs are checked against processed_ids).
  │
  └─ [6] Display classified list at HELM gate
  │       HELM renders the classified task list in its interactive UI:
  │
  │       ╔══════════════════════════════════════════════════════╗
  │       ║  CHIEF · AM SWEEP · {day}, {date} · {time}           ║
  │       ╠══════════════════════════════════════════════════════╣
  │       ║  Classified {n} tasks                                 ║
  │       ╠══════════════════════════════════════════════════════╣
  │       ║  🟢 DISPATCH ({n})                                    ║
  │       ║     · {task_title}                                    ║
  │       ║     · {task_title}                                    ║
  │       ╠══════════════════════════════════════════════════════╣
  │       ║  🟡 PREP ({n})                                        ║
  │       ║     · {task_title}              ← ⚠ {flag}           ║
  │       ║     · {task_title}                                    ║
  │       ╠══════════════════════════════════════════════════════╣
  │       ║  🔴 YOURS ({n})                                       ║
  │       ║     · {task_title}                                    ║
  │       ╠══════════════════════════════════════════════════════╣
  │       ║  ⚫ SKIP ({n})                                        ║
  │       ║     · {task_title}                                    ║
  │       ╠══════════════════════════════════════════════════════╣
  │       ║  [a] approve  [e] edit  [r] reject  [x] abort        ║
  │       ╚══════════════════════════════════════════════════════╝
  │
  │       The display groups tasks by classification state with counts.
  │       Tasks with ⚠ flags indicate classifier uncertainty or sensitivity.
  │       Gate overrides from previous runs are marked with a 🔒 indicator.
  │
  └─ [7] ── HUMAN GATE ──
  │       The flow pauses here indefinitely until user input.
  │       Nothing external happens. No agents fire. No API calls.
  │
  │       User options:
  │
  │       [a] APPROVE
  │           Accept all classifications as shown.
  │           Proceed to agent execution (step 8).
  │           All Dispatch and Prep tasks are dispatched to agents.
  │           Yours tasks are flagged with assembled context.
  │           Skip tasks are deferred with reasons.
  │
  │       [e] EDIT (reclassify)
  │           Enter edit mode. User selects a task by number.
  │           User assigns a new classification: Dispatch / Prep / Yours / Skip.
  │           The reclassification is written to state/{user}/gate_overrides.json
  │           immediately (persists across future runs).
  │           Gate re-displays with updated classifications.
  │           User can edit multiple tasks before approving.
  │
  │       [r] REJECT
  │           Select a specific task to reject from this run.
  │           Task is moved to Yours classification.
  │           Override written to gate_overrides.json.
  │           Gate re-displays with updated list.
  │
  │       [x] ABORT
  │           Cancel the entire run.
  │           No agents fire. No external changes.
  │           Gate overrides from [e]/[r] actions during this session
  │           ARE still persisted (they represent deliberate user decisions).
  │           State/{user}/last_run.json is NOT updated.
  │           Exit HELM cleanly.
  │
  └─ [8] Write gate overrides to state
  │       After gate closes (user pressed [a]):
  │         Write any [e]/[r] actions to state/{user}/gate_overrides.json.
  │         Schema per SETUP.md §14:
  │           { source_id, source_type, title_hint, forced_classification,
  │             original_classification, override_action, override_date,
  │             cleared: false }
  │         Entries are never deleted — history retained for audit.
  │
  └─ [9] Fire parallel agents
  │       Launch agents simultaneously for all Dispatch and Prep tasks.
  │       Parallel execution: true (per flows.yaml configuration).
  │       Max parallel agents: 6 (per engine.yaml max_parallel_agents).
  │
  │       Agent dispatch routing:
  │
  │       ├─ EMAIL_DRAFTER
  │       │    Receives: tasks classified as email-related
  │       │    (source_type: gmail_thread, or task requires email response)
  │       │    Instruction file: /instructions/agents/EMAIL_DRAFTER.md
  │       │    Hard limits: never_send: true, max_drafts_per_run: 20
  │       │    Output: Gmail draft objects in outputs/{user}/{date}/drafts/
  │       │
  │       ├─ CALENDAR_MANAGER
  │       │    Receives: tasks classified as scheduling-related
  │       │    (task requires meeting scheduling, rescheduling, or calendar action)
  │       │    Instruction file: /instructions/agents/CALENDAR_MANAGER.md
  │       │    Hard limits: never_accept_decline: true,
  │       │                 never_modify_existing_events: true
  │       │    Output: proposed events in outputs/{user}/{date}/calendar/
  │       │
  │       ├─ RESEARCH_AGENT
  │       │    Receives: tasks classified as requiring research
  │       │    (background research, competitive analysis, topic briefing)
  │       │    Instruction file: /instructions/agents/RESEARCH_AGENT.md
  │       │    Output: research files in outputs/{user}/{date}/research/
  │       │
  │       └─ NOTES_AGENT
  │            Receives: tasks classified as documentation-related
  │            (meeting notes filing, knowledge base updates, summaries)
  │            Instruction file: /instructions/agents/NOTES_AGENT.md
  │            Hard limits: never_overwrite_strategic_content: true
  │            Output: knowledge base updates in knowledge/{user}/clients/
  │
  │       Each agent runs with its own scoped context package:
  │         context/{user}/{date}-{agent_id}.md
  │       Agents that have no matching tasks are not invoked.
  │       Timeout per agent: 120 seconds (per engine.yaml).
  │       HELM displays live progress per agent (spinner + status).
  │
  └─ [10] Collect outputs
  │        Wait for all parallel agents to complete (or timeout).
  │        Gather all output files to outputs/{user}/{date}/:
  │          - drafts/       ← Email Drafter output
  │          - calendar/     ← Calendar Manager output
  │          - research/     ← Research Agent output
  │        Knowledge base updates go directly to knowledge/{user}/clients/.
  │        Log completion status per agent: success / timeout / error.
  │
  └─ [11] Update processed_ids.json
  │        Append newly processed Zoom transcript IDs to the ledger.
  │        Note: Todoist task IDs are NOT added to processed_ids
  │        (re-classified fresh each run per idempotency_scope: zoom_transcripts_only).
  │
  └─ [12] Generate completion report
  │        Create: outputs/{user}/{date}/am_sweep_report.md
  │        Report contents:
  │          - Run timestamp and duration
  │          - Tasks classified: {total}
  │            - 🟢 Dispatch: {n} → agents dispatched
  │            - 🟡 Prep: {n} → agents dispatched
  │            - 🔴 Yours: {n} → flagged for user
  │            - ⚫ Skip: {n} → deferred
  │          - Gate overrides applied: {n}
  │          - Per agent:
  │            - Email Drafter: {n} drafts created
  │            - Calendar Manager: {n} events proposed
  │            - Research Agent: {n} research files created
  │            - Notes Agent: {n} knowledge base updates
  │          - Errors: {any}
  │          - Output files location: outputs/{user}/{date}/
  │
  └─ [13] Display completion report in HELM
  │        HELM renders the completion report in the terminal:
  │          - Summary counts per classification
  │          - Per-agent results with file links
  │          - Any errors or warnings
  │          - "Review outputs at: outputs/{user}/{date}/"
  │
  └─ [14] Update last_run.json
  │        Write to state/{user}/last_run.json:
  │          { "am_sweep": { "last_success": "{ISO_timestamp}", "status": "ok" } }
  │
  └─ [15] git commit + push
  │        Stage: outputs/, state/, knowledge/, context/, logs/
  │        Commit message: "[auto] am-sweep outputs {date} — {user}"
  │        Push to remote.
  │
END
```

---

## Inputs Required

| Input | Config ID | Purpose | Required Scopes |
|---|---|---|---|
| Todoist | `todoist` | Read open tasks | `tasks_read`, `tasks_write` |
| Gmail | `gmail` | Read emails for context, write drafts | `email_read`, `draft_write` |
| Google Calendar | `google_calendar` | Read today's events, propose new events | `calendar_read`, `calendar_write` |
| Zoom | `zoom` | Read recent meeting summaries | `meeting_summaries_read`, `recordings_read` |

All inputs must show `enabled: true` and `configured: true` in [`config/inputs.yaml`](../../config/inputs.yaml). If any required input is disabled or unconfigured, the flow aborts at startup with a clear error identifying the missing input.

---

## Agents Involved

| Order | Agent | ID | Execution | Condition |
|---|---|---|---|---|
| 1 | Task Classifier | `task_classifier` | Sequential (pre-gate) | Always runs |
| 2 | Email Drafter | `email_drafter` | Parallel (post-gate) | If email tasks exist |
| 2 | Calendar Manager | `calendar_manager` | Parallel (post-gate) | If scheduling tasks exist |
| 2 | Research Agent | `research_agent` | Parallel (post-gate) | If research tasks exist |
| 2 | Notes Agent | `notes_agent` | Parallel (post-gate) | If documentation tasks exist |

**Execution model:** The Task Classifier runs first (sequential, pre-gate). After the human gate approves, all remaining agents fire in parallel. Agents with no matching tasks are not invoked. Maximum parallel agents: 6 (per [`config/engine.yaml`](../../config/engine.yaml) `max_parallel_agents`).

**Agent instruction files:**
- [`/instructions/agents/TASK_CLASSIFIER.md`](../agents/TASK_CLASSIFIER.md)
- [`/instructions/agents/EMAIL_DRAFTER.md`](../agents/EMAIL_DRAFTER.md)
- [`/instructions/agents/CALENDAR_MANAGER.md`](../agents/CALENDAR_MANAGER.md)
- [`/instructions/agents/RESEARCH_AGENT.md`](../agents/RESEARCH_AGENT.md)
- [`/instructions/agents/NOTES_AGENT.md`](../agents/NOTES_AGENT.md)

---

## Context Package

The master context package is assembled at step 3. Each agent receives a scoped subset.

### Master Context (for Task Classifier)

| Context Key | Source | Description |
|---|---|---|
| `open_todoist_tasks` | Todoist API | All open and overdue tasks |
| `calendar_today` | Google Calendar API | Today's events + next 24h |
| `recent_transcripts` | Zoom API | Last 3 days of meeting summaries |
| `client_profiles` | `users/{user}/CLIENTS.md` | Client context for classification |
| `classification_rules` | `users/{user}/CLASSIFY.md` | Dispatch/Prep/Yours/Skip rules |
| `user_profile` | `users/{user}/USER.md` | Identity, hard rules, preferences |
| `scheduling_rules` | `users/{user}/SCHEDULING.md` | Scheduling context for calendar awareness |

### Per-Agent Context (post-gate)

| Agent | Context Keys |
|---|---|
| Email Drafter | `tasks_today` (email subset), `voice_profile`, `client_profiles` |
| Calendar Manager | `calendar_today`, `user_locations`, `working_hours`, `scheduling_rules` |
| Research Agent | `research_request` (per task), `client_profiles` |
| Notes Agent | `recent_transcripts`, `client_profiles`, `existing_notes` |

---

## Gate Behavior

### What the User Sees

The HELM interactive UI displays a structured view of all classified tasks, grouped by classification state (Dispatch, Prep, Yours, Skip) with counts per group. Each task shows:

- Task title
- Source indicator (📧 email, ✅ Todoist, 🎥 Zoom)
- Classification confidence flag (⚠ if uncertain)
- Gate override indicator (🔒 if pre-classified by a persistent override)
- Assigned agent (for Dispatch/Prep items)

### User Options

| Key | Action | Effect |
|---|---|---|
| `[a]` | **Approve** | Accept all classifications. Fire parallel agents. Proceed to step 8. |
| `[e]` | **Edit / Reclassify** | Enter edit mode. Select task by number. Assign new classification. Override written to `gate_overrides.json`. Gate re-displays. Can edit multiple tasks before approving. |
| `[r]` | **Reject** | Select a task to reject from this run. Moved to Yours. Override written to `gate_overrides.json`. Gate re-displays. |
| `[x]` | **Abort** | Cancel entire run. No agents fire. Any [e]/[r] overrides from this session are still persisted. Clean exit. |

### Override Persistence

Reclassifications made via `[e]` or `[r]` are written to `state/{user}/gate_overrides.json` per the schema defined in SETUP.md §14. Overrides are matched on `source_id` (Gmail thread ID, Todoist task ID, or Zoom meeting ID + action index) — never on title strings. Overrides persist across runs until explicitly cleared via `helm tune task_classifier --clear-override [source_id]`.

---

## Output

| Output | Path | Description |
|---|---|---|
| AM Sweep Report | `outputs/{user}/{date}/am_sweep_report.md` | Completion summary |
| Email Drafts | `outputs/{user}/{date}/drafts/` | Draft files from Email Drafter |
| Calendar Proposals | `outputs/{user}/{date}/calendar/` | Proposed events from Calendar Manager |
| Research Files | `outputs/{user}/{date}/research/` | Research output files |
| Knowledge Base | `knowledge/{user}/clients/{client}.md` | Appended meeting notes |
| Context Package | `context/{user}/{date}.md` | Master context (versioned) |
| Agent Contexts | `context/{user}/{date}-{agent_id}.md` | Per-agent scoped contexts |
| Updated State | `state/{user}/processed_ids.json` | Updated Zoom transcript IDs |
| Updated State | `state/{user}/gate_overrides.json` | Any new reclassifications |
| Updated State | `state/{user}/last_run.json` | Timestamp of successful completion |
| Run Log | `logs/{user}/{date}.log` | Execution log |

---

## Idempotency

**Idempotency key:** `state/{user}/processed_ids.json`
**Idempotency scope:** `zoom_transcripts_only`

The AM Sweep idempotency model is intentionally different from Overnight Triage:

1. **Todoist tasks are re-classified fresh each run.** The user's context changes throughout the morning — a task that was Prep yesterday might be Yours today. There is no idempotency on Todoist task classification.

2. **Zoom transcripts are deduplicated.** Once a Zoom transcript's action items have been processed and written to Todoist/knowledge base, the meeting ID is added to `processed_ids.json → zoom[]`. Subsequent AM Sweep runs will not re-process the same transcript.

3. **Gate overrides are cumulative.** Each [e]/[r] action adds to `gate_overrides.json`. Overrides are never automatically removed — they persist until the user explicitly clears them.

4. **Agent outputs overwrite per date.** If AM Sweep runs twice on the same day, outputs in `outputs/{user}/{date}/` are overwritten with the latest results. This is by design — the most recent approved run is the canonical output.

---

## Error Handling

| Error | Detection | Response |
|---|---|---|
| **git pull fails** | Non-zero exit code | Abort flow. Log error. |
| **Todoist API unreachable** | HTTP timeout or 5xx | Abort flow. Cannot classify without task data. |
| **Gmail API unreachable** | HTTP timeout or 5xx | Warn user at gate. Continue with Todoist/Zoom/Calendar data. Mark email tasks as incomplete. |
| **Google Calendar unreachable** | HTTP timeout or 5xx | Warn user at gate. Continue without calendar context. Calendar Manager will not fire. |
| **Zoom API unreachable** | HTTP timeout or 5xx | Warn user at gate. Continue without Zoom data. |
| **Task Classifier timeout** | Exceeds 120s | Abort flow. Log timeout with context size. |
| **Task Classifier error** | Malformed output | Abort flow. Display error to user. |
| **User aborts at gate** | [x] pressed | Clean exit. No agents fire. Overrides persisted. |
| **Agent timeout (post-gate)** | Any agent exceeds 120s | Mark that agent as failed. Continue collecting other agents' outputs. Report partial completion. |
| **Agent error (post-gate)** | Non-zero exit | Mark that agent as failed. Continue with remaining. Log error. |
| **All agents fail** | All agents return error/timeout | Report failure. Note which agents failed and why. State still updated. |
| **gate_overrides.json corrupt** | JSON parse error | Warn user. Continue without overrides. Do not abort — overrides are supplementary. |
| **git push fails** | Non-zero exit code | Log warning. State committed locally. |

**Partial input handling:** If some inputs are unavailable (e.g., Gmail is down but Todoist works), the flow continues with available data. The gate display shows a warning banner indicating which inputs were unavailable and which task categories may be incomplete.

---

## Tuning Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-11 | Initial flow instruction created | System bootstrap |
