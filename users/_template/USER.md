# User Profile
<!-- CHIEF: This is the master identity file for your CHIEF instance.
     All agents read it on every run. It is the first document you fill in.
     Instructions are in comments like this one.
     Fill in your real information, then DELETE ALL COMMENTS before committing.
     REQUIRED = agents need this to function.
     RECOMMENDED = meaningfully improves output quality.
     OPTIONAL = fine-tuning once the system is running. -->

**Owner:** [your-username] | **Version:** 1.0.0 | **Last Updated:** YYYY-MM-DD

---

## Identity

<!-- CHIEF: REQUIRED. Username must match your folder name under /users/. -->

- **Name:** [Your Full Name]
- **Username:** [your-username]
- **Timezone:** [IANA format — e.g. America/New_York / Europe/London / America/Sao_Paulo]
- **Language:** [e.g. English / Portuguese]
- **Setup Date:** YYYY-MM-DD

---

## Role Context

<!-- CHIEF: REQUIRED. Write 3–5 sentences describing what you do, who you work with,
     and how your operation runs. This seeds the default behavior of all agents.
     Be specific — "independent consultant" gives agents far more signal than "professional."

     Example:
     Solo FP&A software founder. Build and ship product, manage a small remote team, handle
     customer relationships directly. No sales team — I close deals personally. Most of my
     day is split between deep technical work and customer-facing communication. -->

[Your role context here]

---

## Working Hours

<!-- CHIEF: REQUIRED. Agents use these to bound all scheduling and task proposals.
     Nothing will be scheduled outside these windows unless you explicitly override it.
     Calendar Manager and Time Blocker read this directly. -->

- **Start time:** [e.g. 9:00 AM]
- **End time:** [e.g. 6:30 PM]
- **Hard stop:** [e.g. 7:00 PM — no tasks or events after this, no exceptions]
- **Timezone:** [repeat timezone here for clarity]
- **Active days:** [e.g. Monday–Friday]

### Deep Work Windows
<!-- CHIEF: RECOMMENDED. Times protected from meetings and interruptions.
     Time Blocker routes high-focus tasks here first. -->

- [e.g. 9:00 AM – 12:00 PM — deep work, no meetings, no exceptions]
- [Add more blocks if needed]

### Low-Energy Windows
<!-- CHIEF: RECOMMENDED. Times better suited for admin, email, and light tasks. -->

- [e.g. 3:00 PM – 5:30 PM — low energy, good for email triage and short tasks]

---

## Locations

<!-- CHIEF: REQUIRED. Used by Calendar Manager for transit time buffers (Google Maps)
     and by Time Blocker for errand batching and routing.
     Include your home address — this is used for real drive-time calculations.
     This file lives in a PRIVATE repo. Your address stays in your private instance only.

     The more complete this list, the more accurate your transit buffers will be. -->

- **Home:** [Full street address] — remote work, home tasks, personal errands
- **Office / Coworking:** [Address, or "Remote — no commute"] — client meetings, focused work
- **Gym:** [Address — or remove this line if not applicable]
- **[Other location name]:** [Address] — [what you do there]

<!-- CHIEF: Add as many locations as you regularly visit. Format:
     - **[Name]:** [Full address] — [brief description] -->

---

## Hard Rules

<!-- CHIEF: REQUIRED. Absolute constraints that every agent must follow —
     no exceptions, no overrides from instruction files or agent tuning.

     The SYSTEM DEFAULTS below ship pre-filled. Do not remove them.
     Add your personal rules in the MY RULES section. -->

### System Defaults — Do Not Remove

- Never send an email. Agents draft only — I send manually.
- Never delete anything. Archive, defer, or flag — never destroy.
- Never make financial decisions or handle sensitive relationship communications without explicit human dispatch.
- When uncertain between Prep and Dispatch, always choose Prep.
- All agent outputs land in /outputs/ for my review before any external action is taken.

### My Rules

<!-- CHIEF: RECOMMENDED. Rules specific to your work and relationships.
     Write them as clear prohibitions or requirements. Be direct and specific.
     Vague rules produce vague compliance.

     Examples — replace or delete these:
     - Never schedule anything before 9:30 AM without my explicit approval.
     - Never book back-to-back calls — minimum 15-minute gap between any two meetings.
     - All communication with [Person / Company] is always Yours — never Prep or Dispatch.
     - No calendar events on Sundays under any circumstances.
     - Strategic documents are always Yours — never automated.
     - Never classify anything from [email domain] as Dispatch.
     - Always flag emails mentioning contracts, legal matters, or board-level topics as Yours. -->

- [Add your first hard rule here]

---

## Classification Defaults

<!-- CHIEF: RECOMMENDED. Blanket overrides applied before the detailed rules in CLASSIFY.md.
     Use these for high-confidence conditions that should always fire regardless of content.
     Format: [condition] → [classification] — [brief reason]

     These complement CLASSIFY.md — they don't replace it. Put broad rules here,
     nuanced rules in CLASSIFY.md. -->

- [e.g. Emails from anyone not in CLIENTS.md → always Prep, never Dispatch]
- [e.g. Anything mentioning pricing, invoices, or contracts → always Yours]
- [e.g. Calendar invites from [specific domain] → always Yours for my approval]
- [e.g. Recurring weekly team sync scheduling → Dispatch is fine]
- [e.g. Any email marked high importance → always Yours regardless of sender]

---

## Preferred Output Style

<!-- CHIEF: RECOMMENDED. How you want the system to present information to you.
     This governs agent completion reports and outputs — not email tone (that's VOICE.md). -->

- **Completion reports:** [e.g. Concise bullet list. No preamble. Failures first, then successes.]
- **Research outputs:** [e.g. Executive summary in first 3 sentences, then supporting detail. Include source links.]
- **Email drafts:** [e.g. Show subject line, to field, and body. Flag any assumptions in a note at the top.]
- **Time block proposals:** [e.g. Clean schedule with start times. Flag items that didn't fit with reasons.]
- **Date format:** [e.g. March 9, 2026 / 2026-03-09]
- **Time format:** [e.g. 12-hour (9:00 AM) / 24-hour (09:00)]

---

## Key Documents

<!-- CHIEF: REQUIRED. Maps your key documents to the context keys used in agents.yaml.
     Replace ALL instances of [username] with your actual username.
     Set enabled: false for any document you haven't filled in yet — agents will skip it. -->

| Document | Path | Enabled | Context Key | Used By |
|---|---|---|---|---|
| Voice & Tone | /users/[username]/VOICE.md | true | voice_profile | email_drafter, notes_agent |
| Client Profiles | /users/[username]/CLIENTS.md | true | client_profiles | all agents |
| Scheduling Rules | /users/[username]/SCHEDULING.md | true | scheduling_rules | calendar_manager, time_blocker |
| Classification Rules | /users/[username]/CLASSIFY.md | true | classification_rules | task_classifier |

---

## Tuning Log

| Date | Change | Reason |
|------|--------|--------|
| | | |

---

<!-- CHIEF: When you're done:
     1. Replace all [bracketed placeholders] with your real information
     2. Delete ALL comment blocks (everything between the comment tags)
     3. Verify HELM can read the file: helm docs edit user
     4. Commit: git add users/[username]/USER.md && git commit -m "[manual] USER.md — [username]"

     COMMON MISTAKES:
     - Forgetting to replace [username] in the Key Documents paths (there are 4 instances)
     - Leaving the system defaults in place but not adding any personal rules
     - Writing vague rules like "be careful with X" — write specific prohibitions instead
-->
