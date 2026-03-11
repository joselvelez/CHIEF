# Flow: [Flow Name]
**ID:** `[flow_id]`
**Version:** 1.0.0
**Last Updated:** YYYY-MM-DD

> *This is the scaffold template for creating new process flows. Copy this file to `/instructions/flows/[FLOW_NAME].md` and fill in every section. Register the flow in `config/flows.yaml` and its trigger in `config/triggers.yaml`. See [SETUP.md §9](../SETUP.md#9-process-flows) for flow specifications and [SETUP.md §8](../SETUP.md#8-layer-5--triggers--human-gates) for trigger configuration. Use `helm flows add` for guided creation.*

---

## Purpose

> *REQUIRED. One paragraph describing what this flow accomplishes and when it runs.*

[What does this flow do and why does it exist?]

---

## Trigger

> *REQUIRED. How this flow is invoked. Must match an entry in `config/triggers.yaml`.*

| Field | Value |
|-------|-------|
| Type | [manual | scheduled] |
| Command / Cron | [`helm run [flow-id]` | cron expression in UTC] |
| Schedule (human-readable) | [e.g., "5:00 AM weekdays" or "on demand"] |
| Platform | [local | railway] |

---

## Human Gate

> *REQUIRED. Whether this flow pauses for human review before agents fire.*

| Field | Value |
|-------|-------|
| `human_gate` | [true | false] |
| Gate position | [before agents fire | after specific step — specify] |
| Gate actions | `[a]` approve · `[e]` edit · `[r]` reject · `[x]` abort |

> *If `human_gate: false`, the flow runs fully automated. Outputs still land in `/outputs/` for async review. See [SETUP.md §14](../SETUP.md#14-human-approval-protocol) for the full Human Approval Protocol.*

---

## Flow Sequence

> *REQUIRED. The step-by-step execution sequence. Use the START → END format. Mark the human gate position clearly if applicable.*

```
START
  └─ git pull
  └─ [Step 1 — describe what happens]
  └─ [Step 2]
  └─ [Step 3]
  └─ ── HUMAN GATE ── [describe what the user sees and can do]
  └─ [Step 4 — post-gate]
  └─ [Step 5]
  └─ Write completion report to /outputs/[user]/YYYY-MM-DD/[flow_id]_report.md
  └─ git commit + push
END
```

---

## Inputs Required

> *REQUIRED. Data sources this flow needs. All must be enabled in `config/inputs.yaml`. If any required input is not configured or disabled, the flow aborts with a clear error.*

| Input | What It Provides | Required |
|-------|-----------------|----------|
| [input_id] | [description] | [yes / no — if no, flow degrades gracefully] |
| [input_id] | [description] | [yes / no] |

---

## Agents Involved

> *REQUIRED. Which agents this flow invokes, in what order, and whether they run in parallel or sequentially.*

| Order | Agent | Parallel | Condition |
|-------|-------|----------|-----------|
| 1 | `[agent_id]` | [yes / no] | [Always | Only if tasks of type X exist] |
| 2 | `[agent_id]` | [yes / no] | [condition] |

> *Agents are registered in `config/agents.yaml`. Only enabled agents with all required inputs configured will fire. If an agent's required input is missing, that agent is skipped with a warning in the completion report.*

---

## Context Package

> *REQUIRED. Describe the context package built for this flow's agents. See [context_package.md](./context_package.md) for the template and [SETUP.md §13](../SETUP.md#13-context-scoping) for context scoping rules.*

| Agent | Context Keys |
|-------|-------------|
| `[agent_id]` | `[key1]`, `[key2]`, `[key3]` |
| `[agent_id]` | `[key1]`, `[key2]` |

> *Context packages are written to `/context/[user]/YYYY-MM-DD-[agent_id].md` before each agent fires. Capped at 20,000 tokens by default.*

---

## Gate Behavior

> *INCLUDE IF `human_gate: true`. Delete this section if `human_gate: false`.*

### What the User Sees

> *Describe the HELM display at the gate — what information is shown, how it's organized.*

```
[Mock of the HELM gate display for this flow]
```

### User Actions at the Gate

| Action | Key | Effect |
|--------|-----|--------|
| Approve | `[a]` | Agents fire with approved list |
| Edit | `[e]` | Enter edit mode to reclassify individual items |
| Reject | `[r]` | Move specific items to Yours |
| Abort | `[x]` | No agents fire, nothing changes |

### Gate Override Persistence

> *If this flow writes gate overrides, specify the state file. See [SETUP.md §14](../SETUP.md#14-human-approval-protocol) for the gate override schema.*

- Overrides written to: `state/[user]/gate_overrides.json`
- Override matching: on `source_id`, never on title strings

---

## Output

> *REQUIRED. What this flow produces and where it goes.*

| Output | Path | Description |
|--------|------|-------------|
| Completion report | `/outputs/[user]/YYYY-MM-DD/[flow_id]_report.md` | Summary of the run |
| [Agent output] | `/outputs/[user]/YYYY-MM-DD/[filename]` | [description] |

---

## Idempotency

> *REQUIRED. How this flow prevents duplicate processing across runs.*

| Field | Value |
|-------|-------|
| Idempotency key file | `state/[user]/processed_ids.json` |
| Scope | [all sources | specific sources — list them] |
| Matching | [source + source_id | custom key] |

> *Before creating any task or output, check the idempotency key file. If the key exists, skip. After successful processing, write the key. See [SETUP.md §9](../SETUP.md#9-process-flows) for details.*

---

## Error Handling

> *REQUIRED. How the flow handles failures at each stage.*

| Failure Point | Behavior |
|---------------|----------|
| Git pull fails | Abort — stale instructions risk |
| Input API unreachable | [Abort | Degrade — skip that input] |
| Agent fails mid-run | [Log error, continue with remaining agents | Abort entire run] |
| Git push fails | Retry once, then log error — outputs are safe locally |

> *All errors are logged to `/logs/[user]/YYYY-MM-DD.log` and committed to git. Railway retries on crash (max 2 retries) for scheduled flows.*

---

## Tuning Log

> *Do not delete this section. Add entries when tuning the flow via `helm tune [flow_id]`. Commit changes with: `[system] tuning: updated [FLOW_NAME].md — [username]`*

| Date | Change | Reason |
|------|--------|--------|
| | | |
