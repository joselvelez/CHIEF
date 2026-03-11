# [Document Name]

> *This is the scaffold template for creating new user key documents. Copy this file to `/users/[username]/[DOCUMENT_NAME].md` and fill in every section. Register the document in your `USER.md` under `## Key Documents`. See [SETUP.md §10](../SETUP.md#10-key-documents) for the key document specification. Use `helm docs add` for guided creation.*

**Owner:** [username] | **Version:** 1.0.0 | **Last Updated:** YYYY-MM-DD

---

## Document Type

> *REQUIRED. What kind of document is this? This determines which agents read it via `context_keys` in `agents.yaml`.*

| Field | Value |
|-------|-------|
| Type | [profile | style | contacts | scheduling | classification | custom] |
| Context key | [The `context_key` name agents use to reference this document — register in `agents.yaml`] |
| File path | `/users/[username]/[DOCUMENT_NAME].md` |

---

## Consumers

> *REQUIRED. Which agents read this document as part of their context package.*

| Agent | How It Uses This Document |
|-------|--------------------------|
| `[agent_id]` | [One sentence — how the agent uses this document's content] |
| `[agent_id]` | [One sentence] |

> *To add this document to an agent's context, add the context key to the agent's `context_keys` list in `config/agents.yaml`. See [SETUP.md §13](../SETUP.md#13-context-scoping) for context scoping rules.*

---

## Sections

> *Fill in the sections below. Delete instructional comments when done. Each section should contain the real information agents need to do their jobs. The more specific you are, the better agent outputs will be.*

### [Section 1 Name]

> *Describe what goes in this section and why it matters for agent behavior.*

[Your content here]

---

### [Section 2 Name]

> *Describe what goes in this section.*

[Your content here]

---

### [Section 3 Name]

> *Describe what goes in this section.*

[Your content here]

---

## How to Fill This In

> *Delete this section after filling in the document.*

1. **Read the instructional comments** in each section — they explain what agents expect
2. **Be specific** — vague guidance produces vague agent outputs
3. **Use real examples** from your actual work, not hypotheticals
4. **Reference the core five documents** for patterns:
   - [`USER.md`](../users/_template/USER.md) — profile, working hours, locations, hard rules
   - [`VOICE.md`](../users/_template/VOICE.md) — communication style, tone, phrases
   - [`CLIENTS.md`](../users/_template/CLIENTS.md) — client profiles, sensitivity levels
   - [`SCHEDULING.md`](../users/_template/SCHEDULING.md) — protected blocks, meeting rules
   - [`CLASSIFY.md`](../users/_template/CLASSIFY.md) — classification rules, metadata schema
5. **Delete all instructional comments** before committing
6. **Commit:** `git add users/[username]/[DOCUMENT_NAME].md && git commit -m "[manual] [DOCUMENT_NAME].md — [username]"`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | YYYY-MM-DD | Initial creation |

---

## Tuning Log

> *Add entries when agent outputs indicate this document needs refinement. Use `helm tune [agent_id]` to view agent logs alongside this document.*

| Date | Change | Reason |
|------|--------|--------|
| | | |
