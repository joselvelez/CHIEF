# USER.md
<!-- CHIEF: This is the master identity file for your CHIEF instance. All agents read it.
     It is the first key document you should fill in — everything else builds on it.
     Instructions are in comments like this one. Fill in your real information,
     then delete all comments before committing. -->

<!-- CHIEF: REQUIRED fields are the minimum needed for agents to function correctly.
     RECOMMENDED fields significantly improve output quality.
     OPTIONAL fields are for advanced tuning once the system is running. -->

---

## Identity

<!-- CHIEF: REQUIRED. This is how agents refer to you and how HELM identifies your namespace. -->

- **Name:** [Your full name]
- **Username:** [Your username — must match your folder name under /users/]
- **Timezone:** [IANA timezone, e.g. America/New_York, Europe/London, America/Sao_Paulo]
- **Language:** [Language for agent outputs, e.g. English]

<!-- CHIEF: RECOMMENDED. Agents use your role to calibrate tone, priorities, and task handling.
     Be specific — "independent consultant" or "startup founder" gives agents much more
     signal than "professional". -->

- **Role:** [Your role, e.g. "Independent strategy consultant", "Startup founder", "Executive at a mid-size tech company"]
- **Industry:** [Your industry or domain, e.g. "Financial services", "B2B SaaS", "Healthcare"]

---

## Working Hours

<!-- CHIEF: REQUIRED. Used by Calendar Manager and Time Blocker to bound all scheduling.
     Agents will never schedule tasks or propose events outside these windows
     unless you explicitly override in SCHEDULING.md. -->

- **Work days:** [e.g. Monday–Friday]
- **Work start:** [e.g. 9:00 AM]
- **Work end:** [e.g. 6:00 PM]

<!-- CHIEF: RECOMMENDED. Helps Time Blocker match task type to energy level.
     Think about when you do your best focused work vs. when you're better suited
     to calls, admin, or low-effort tasks. -->

- **Deep work window:** [e.g. 9:00 AM – 12:00 PM — focused, uninterruptible work]
- **Shallow work window:** [e.g. 1:00 PM – 3:00 PM — calls, email, admin]
- **Wind-down window:** [e.g. 5:00 PM – 6:00 PM — review, planning, low-effort tasks]

<!-- CHIEF: OPTIONAL. If you have a consistent morning routine before work starts. -->

- **Morning routine buffer:** [e.g. Do not schedule anything before 9:30 AM on Mondays]

---

## Locations

<!-- CHIEF: REQUIRED. Used by Calendar Manager (transit buffers) and Time Blocker (errand routing).
     List every location you regularly travel to or from. Include your home address —
     this is used by Google Maps to calculate real drive times.
     This file lives in a PRIVATE repo. Your address stays in your private instance only. -->

<!-- CHIEF: Format each location as shown. The "type" field helps the Time Blocker
     group errands intelligently. Types: home | office | gym | client | other -->

- **Home:**
  - Address: [Your full home address]
  - Type: home

<!-- CHIEF: Add as many locations as you regularly visit. Examples below — replace with yours. -->

- **Office / Coworking:**
  - Address: [Address or "Remote — no commute"]
  - Type: office

- **Gym:**
  - Address: [Gym address, or remove this block if not applicable]
  - Type: gym

<!-- CHIEF: Add client offices, studios, schools, or any other place you regularly go.
     Example:
- **[Location Name]:**
  - Address: [Full address]
  - Type: client
-->

---

## Hard Rules

<!-- CHIEF: REQUIRED. These are absolute constraints that all agents must follow —
     no exceptions, no overrides from instruction files.
     The system-wide defaults below are pre-filled and cannot be removed.
     Add your personal rules below the defaults. -->

### System Defaults (Do Not Remove)

- Never send an email. Draft only.
- Never delete anything. Archive, defer, or flag — never destroy.
- Never make financial decisions or handle sensitive relationship communications without explicit human dispatch.
- When uncertain about classification, default to Prep, never Dispatch.
- All agent outputs land in /outputs/ for review before any external action is taken.

### My Additional Rules

<!-- CHIEF: RECOMMENDED. Add rules specific to your work and relationships.
     Be direct and specific — vague rules produce vague compliance.
     Examples to get you thinking (replace or delete these):

- Never draft a reply to [Person/Company] without flagging it as Yours first.
- Never schedule client calls before 10:00 AM or after 4:00 PM.
- Never classify anything from [Sender/Domain] as Dispatch — always Prep or Yours.
- Always flag emails mentioning contracts, pricing, or legal matters as Yours.
- Never create calendar events that overlap with [recurring protected block].
-->

- [Add your first hard rule here]

---

## Output Style Preferences

<!-- CHIEF: RECOMMENDED. Tells agents how to format their outputs and completion reports.
     This is separate from VOICE.md (which governs email tone) — this is about
     how you want the system itself to communicate with you. -->

- **Report verbosity:** [Concise (key facts only) / Standard (facts + brief reasoning) / Detailed (full explanation)]
- **Task list format:** [Bullet list / Numbered list / Table]
- **Date format:** [e.g. March 9, 2026 / 2026-03-09 / 09/03/2026]
- **Time format:** [12-hour (9:00 AM) / 24-hour (09:00)]

---

## Key Documents

<!-- CHIEF: REQUIRED. This registry tells HELM which key documents exist for your user profile.
     Do not remove entries — disable them by setting enabled: false if you're not using one yet.
     Add new documents here after running `helm docs add`. -->

| Document | Path | Enabled | Context Key |
|---|---|---|---|
| Voice Profile | /users/[username]/VOICE.md | true | voice_profile |
| Client Profiles | /users/[username]/CLIENTS.md | true | client_profiles |
| Scheduling Rules | /users/[username]/SCHEDULING.md | true | scheduling_rules |
| Classification Rules | /users/[username]/CLASSIFY.md | true | classification_rules |

<!-- CHIEF: Replace [username] with your actual username in all four paths above. -->

---

## Notes & Context

<!-- CHIEF: OPTIONAL. Anything else that helps agents understand your situation.
     This is a free-form section. Use it for context that doesn't fit elsewhere:
     - Your current priorities or focus areas
     - Things that are in flux (e.g. "currently transitioning off [Client X]")
     - Seasonal patterns (e.g. "Q4 is always high-volume for [Client Y]")
     - Anything you'd want a new assistant to know in their first week

     Keep it concise — this gets included in every agent's context package. -->

[Optional free-form context here, or delete this section]

---

<!-- CHIEF: When you're done:
     1. Replace all [bracketed placeholders] with your real information
     2. Delete all comment blocks like this one
     3. Run: helm docs edit user (to verify HELM can read the file)
     4. Commit: git add users/[username]/USER.md && git commit -m "[manual] USER.md — [username]"
-->
