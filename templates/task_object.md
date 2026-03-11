# Task Object

> *This is the standard structure for any task created by the system. The TASK_CLASSIFIER agent produces task objects in this format. All downstream agents consume tasks in this structure. See [SETUP.md §7](../SETUP.md#7-layer-4--agents) for agent specifications and [TASK_CLASSIFIER.md](../instructions/agents/TASK_CLASSIFIER.md) for classification logic.*

---

## Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique task identifier, system-generated | `task_2026-03-11_001` |
| `title` | string | Human-readable task description | `Follow up with Jane re: Q2 timeline` |
| `source` | enum | Origin system | `gmail` · `todoist` · `zoom` · `google_calendar` |
| `source_id` | string | ID from the origin system (used for idempotency and gate override matching) | Gmail thread ID, Todoist task ID, Zoom meeting ID + action index |
| `classification` | enum | Dispatch / Prep / Yours / Skip framework | `Dispatch` · `Prep` · `Yours` · `Skip` |
| `contact` | string | Primary person associated with this task | `Jane Smith` |
| `sensitivity` | enum | From CLIENTS.md or inferred | `High` · `Medium` · `Low` · `not_declared` |
| `priority` | enum | Urgency level | `P1` · `P2` · `P3` · `P4` |
| `duration_estimate` | string | Estimated time to complete | `15m` · `30m` · `1h` · `2h` |
| `due_date` | string | When this task is due (ISO 8601) | `2026-03-12` |
| `agent_assigned` | string | Which agent handles this task | `email_drafter` · `calendar_manager` · `research_agent` · `notes_agent` · `time_blocker` · `none` |
| `created_date` | string | When the task object was created (ISO 8601) | `2026-03-11T10:00:00Z` |

---

## Classification Metadata

> *These fields provide the reasoning trail for the classification decision. Used for tuning and debugging.*

| Field | Type | Description |
|-------|------|-------------|
| `classification_reason` | string | One-sentence explanation of why this classification was chosen |
| `classification_rule` | string | Which rule from CLASSIFY.md or TASK_CLASSIFIER.md was applied |
| `classification_confidence` | enum | `high` · `medium` · `low` — if low, default posture applies (uncertain → Yours) |
| `override_active` | boolean | Whether a gate override from `gate_overrides.json` is active for this `source_id` |
| `override_source` | string | `gate_overrides.json` entry reference, or `null` |
| `email_type` | enum | For email-sourced tasks only: `reply` · `follow-up` · `acknowledgement` · `outreach` · `first_contact` · `meeting_confirmation` · `decline` · `null` |
| `client_match` | string | Client name from CLIENTS.md, or `unknown` |
| `sensitivity_source` | string | How sensitivity was determined: `clients_md` · `inferred` · `default` |

---

## Tracking Fields

> *These fields manage state across runs. Used by the orchestration engine and HELM for idempotency and gate management.*

| Field | Type | Description |
|-------|------|-------------|
| `state` | enum | Current lifecycle state: `pending` · `approved` · `in_progress` · `completed` · `escalated` · `deferred` · `skipped` |
| `processed` | boolean | Whether this task has been processed by its assigned agent |
| `processed_date` | string | ISO 8601 timestamp of when processing completed, or `null` |
| `output_ref` | string | Path to agent output file, or `null` |
| `deferred_reason` | string | Why the task was deferred (Skip classification), or `null` |
| `deferred_until` | string | Suggested future date for deferred tasks (ISO 8601), or `null` |
| `escalated_reason` | string | Why the task was escalated to Yours during agent processing, or `null` |
| `flow_id` | string | Which flow created this task object: `overnight_triage` · `am_sweep` |
| `run_date` | string | Date of the flow run that created this task (ISO 8601) |
| `idempotency_key` | string | Composite key for dedup: `source` + `source_id` + `run_date` |

---

## Template

> *Copy this block when creating a new task object programmatically.*

```yaml
task:
  id: ""
  title: ""
  source: ""                    # gmail | todoist | zoom | google_calendar
  source_id: ""                 # ID from origin system
  classification: ""            # Dispatch | Prep | Yours | Skip
  contact: ""
  sensitivity: "not_declared"   # High | Medium | Low | not_declared
  priority: "P3"                # P1 | P2 | P3 | P4
  duration_estimate: "30m"
  due_date: ""                  # YYYY-MM-DD
  agent_assigned: "none"        # email_drafter | calendar_manager | research_agent | notes_agent | time_blocker | none
  created_date: ""              # ISO 8601

  classification_metadata:
    classification_reason: ""
    classification_rule: ""
    classification_confidence: "medium"  # high | medium | low
    override_active: false
    override_source: null
    email_type: null             # reply | follow-up | acknowledgement | outreach | first_contact | meeting_confirmation | decline | null
    client_match: "unknown"
    sensitivity_source: "default"  # clients_md | inferred | default

  tracking:
    state: "pending"             # pending | approved | in_progress | completed | escalated | deferred | skipped
    processed: false
    processed_date: null
    output_ref: null
    deferred_reason: null
    deferred_until: null
    escalated_reason: null
    flow_id: ""
    run_date: ""                 # YYYY-MM-DD
    idempotency_key: ""          # source + source_id + run_date
```

---

> *Idempotency note: A task's `idempotency_key` is checked against `state/[user]/processed_ids.json` before creation. If the key already exists, the task is not re-created. See [SETUP.md §9](../SETUP.md#9-process-flows) for flow-level idempotency rules.*
