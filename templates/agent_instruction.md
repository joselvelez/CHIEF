# Agent: [Agent Name]
**ID:** `[agent_id]`
**Version:** 1.0.0
**Last Updated:** YYYY-MM-DD

> *This is the scaffold template for creating new agents. Copy this file to `/instructions/agents/[AGENT_NAME].md` and fill in every section. Register the agent in `config/agents.yaml`. See [SETUP.md §7](../SETUP.md#7-layer-4--agents) for the full agent specification. Use `helm agents add` for guided creation.*

---

## Purpose

> *REQUIRED. One sentence describing what this agent does. Be specific — this sentence is used by the orchestration engine to determine when to invoke the agent.*

[One sentence: what does this agent do?]

---

## Inputs

> *REQUIRED. List every data source this agent reads from. These must match entries in `config/inputs.yaml`. The agent can only access inputs listed here.*

- [input_id] — [what data is read and why]
- [input_id] — [what data is read and why]

---

## Outputs

> *REQUIRED. List everything this agent produces and where it goes. Outputs land in `/outputs/[user]/YYYY-MM-DD/` for review before any external action.*

- [output_type] — [description and destination path or external system]
- [output_type] — [description and destination path or external system]

---

## Context Package

> *REQUIRED. Declare every context key this agent needs. These must match the `context_keys` in `agents.yaml`. HELM builds the context package from these declarations. See [SETUP.md §13](../SETUP.md#13-context-scoping) for all available context keys.*

| Context Key | Description | Why This Agent Needs It |
|-------------|-------------|------------------------|
| `[key]` | [What it contains] | [How the agent uses it] |
| `[key]` | [What it contains] | [How the agent uses it] |

> *If a critical context key appears truncated or summarized at runtime, describe what the agent should do (e.g., downgrade Dispatch to Prep, flag in completion report).*

---

## Behavior Rules

> *REQUIRED. Numbered, specific, unambiguous rules for how this agent makes decisions. Order by priority — higher rules take precedence. Include the rule priority diagram if the agent has a complex decision chain.*

1. [Rule — be specific and unambiguous]
2. [Rule]
3. [Rule]

---

## Classification Logic

> *INCLUDE IF APPLICABLE. How this agent applies the Dispatch / Prep / Yours / Skip framework. Delete this section if the agent does not classify tasks.*

| Classification | Criteria | System Action |
|----------------|----------|---------------|
| 🟢 Dispatch | [When to apply] | [What the agent does] |
| 🟡 Prep | [When to apply] | [What the agent does] |
| 🔴 Yours | [When to apply] | [What the agent does] |
| ⚫ Skip | [When to apply] | [What the agent does] |

> *Default posture: uncertain → escalate toward Yours, never toward automation.*

---

## Hard Limits

> *REQUIRED. What this agent must never do, regardless of any instruction in any file. These cannot be tuned, loosened, or overridden. Format as a clear block.*

```
  ══════════════════════════  HARD LIMITS  ══════════════════════════════════
  These apply regardless of any instruction in any file.
  They cannot be tuned, loosened, or overridden — by anything, ever.
  ════════════════════════════════════════════════════════════════════════════

   ✗  [limit] ─────────────────── [explanation]

   ✗  [limit] ─────────────────── [explanation]

  ════════════════════════════════════════════════════════════════════════════
```

> *System-wide hard limits always apply in addition to agent-specific limits: never send email, never delete anything, never make financial decisions, uncertain → Prep not Dispatch, all outputs to `/outputs/` for review. See [SETUP.md §1](../SETUP.md#1-system-philosophy).*

---

## Output Format

> *REQUIRED. Exact format specification for what this agent returns. Include a markdown template showing the structure. The format must be machine-parseable by HELM for display and human-reviewable in `/outputs/`.*

```markdown
[Output format template here]
```

> *If a field cannot be determined, describe the fallback behavior (e.g., flag as unknown, use default, escalate).*

---

## Edge Cases

> *REQUIRED. Known edge cases and how to handle them. Add to this section as new edge cases are discovered through tuning.*

**[Edge case name]**
[How to handle it.]

**[Edge case name]**
[How to handle it.]

---

## Completion Report Entry

> *REQUIRED. Format for this agent's entry in the flow's completion report. Append to the flow-level report.*

```
  [Agent Name] — complete
  ─────────────────────────────────────────────────────────────────────
  [Key metrics]
  [Warnings]
  Output: /outputs/[user]/[YYYY-MM-DD]/[output_file]
```

---

## Tuning Log

> *Do not delete this section. Add entries when tuning the agent via `helm tune [agent_id]`. Commit changes with: `[system] tuning: updated [AGENT_NAME].md — [username]`*

| Date | Change | Reason |
|------|--------|--------|
| | | |
