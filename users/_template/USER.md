# User Profile
**Owner:** [your-username] | **Version:** 1.0.0 | **Last Updated:** YYYY-MM-DD

> **How to use this file:**
> Fill in every section below. Be specific — vague instructions produce vague agent behavior.
> The more precisely you describe how you work, the better the system performs.
> Delete all instructional comments (lines starting with >) before your first commit.

---

## Identity

- **Name:** [Your Full Name]
- **Username:** [your-username]
- **Timezone:** [e.g. America/Sao_Paulo / America/New_York / America/Los_Angeles]
- **Language:** [English / Portuguese / etc.]
- **Setup Date:** YYYY-MM-DD

---

## Role Context

> Describe what you do in 3–5 sentences. Include: type of work, who you work with,
> size of your operation, and anything the system should understand about your context.
> This seeds the default behavior of all agents.

Example:
*Solo FP&A software founder. Build and ship product, manage a small remote team, handle
customer relationships directly. No sales team — I close deals personally. Most of my
day is split between deep technical work and customer-facing communication.*

---

## Working Hours

- **Start time:** [e.g. 8:00 AM]
- **End time:** [e.g. 6:30 PM]
- **Hard stop:** [e.g. 7:00 PM — nothing after this]
- **Timezone:** [repeat timezone here for clarity]
- **Days active:** [e.g. Monday–Friday / Monday–Saturday]

### Deep Work Windows
> Times that should be protected from meetings and interruptions.
- [e.g. 8:00–11:00 AM — deep work, no meetings, no exceptions]
- [e.g. add more blocks if needed]

### Low-Energy Windows
> Times better suited for admin, email, light tasks.
- [e.g. 2:00–3:30 PM — low energy, good for email triage and short tasks]

---

## Locations

> List every location type relevant to your schedule. The system uses these for
> task routing, errand batching, and transit time calculations.

- **Home:** [address or "home"] — [what happens here: remote work, home tasks, etc.]
- **Office / Studio:** [address] — [what happens here: client meetings, focused work, etc.]
- **[Add others]:** [address] — [gym, coworking, regular client site, etc.]

---

## Hard Rules (Your Personal Additions)

> These extend the system defaults. Write them as clear prohibitions or requirements.
> System defaults already include: never send email, never delete, never make financial decisions.

- [e.g. Never schedule anything before 9:00 AM without explicit approval]
- [e.g. Never book back-to-back calls — minimum 15-minute gap between any two meetings]
- [e.g. All communication with [specific person/company] is always Yours — never Prep or Dispatch]
- [e.g. No calendar events on Sundays]
- [e.g. Strategic documents are always Yours — never automated]
- [Add your own rules here]

---

## Classification Defaults

> Override the default classification rules for specific people, topics, or situations.
> Format: [condition] → [classification] — [brief reason]

- [e.g. Emails from anyone not in CLIENTS.md → always Prep, never Dispatch]
- [e.g. Anything mentioning pricing, invoices, or contracts → always Yours]
- [e.g. Calendar invites from [specific domain] → always Yours for approval]
- [e.g. Recurring weekly team sync scheduling → Dispatch is fine]

---

## Preferred Output Style

> Tell the system how you want information presented to you.

- **Completion reports:** [e.g. Concise bullet list. No preamble. Failures first, then successes.]
- **Research outputs:** [e.g. Executive summary in first 3 sentences, then detail. Include source links.]
- **Email drafts:** [e.g. Show subject line, to, and body. Flag any assumptions made in a note at the top.]
- **Time block proposals:** [e.g. Show as a clean schedule with start times. Flag any items that didn't fit.]

---

## Key Documents

> This table is maintained automatically by `helm docs add`.
> Do not edit manually — use HELM to add or remove entries.

| Document | Path | Used By | Last Updated |
|---|---|---|---|
| Voice & Tone | /users/[username]/VOICE.md | email_drafter, notes_agent | YYYY-MM-DD |
| Client Profiles | /users/[username]/CLIENTS.md | all agents | YYYY-MM-DD |
| Scheduling Rules | /users/[username]/SCHEDULING.md | calendar_manager, time_blocker | YYYY-MM-DD |
| Classification Rules | /users/[username]/CLASSIFY.md | task_classifier | YYYY-MM-DD |
