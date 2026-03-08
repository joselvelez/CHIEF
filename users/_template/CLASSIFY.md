# Classification Rules
<!-- CHIEF: This is the most operationally critical document in your CHIEF instance.
     It defines exactly how the Task Classifier assigns Dispatch / Prep / Yours / Skip
     to every item that passes through the system. Bad rules produce a system that either
     does too little or overreaches. Spend real time on this.

     HOW TO APPROACH IT:
     Think about the last 30 tasks or emails you handled. For each one, ask:
     "Could I have delegated this to a very capable assistant who knows me well,
     with no risk of embarrassment or damage if they got it slightly wrong?"
     If yes → Dispatch. If they'd need my input → Prep. If I wouldn't trust
     anyone else with it → Yours.

     IMPORTANT DEFAULT: When in doubt between Prep and Dispatch → Prep.
     When in doubt between Prep and Yours → Yours.
     The system ships conservative. You loosen it over time as you build trust.

     Fill in your real rules, then DELETE ALL COMMENTS before committing.

     REQUIRED = minimum needed for safe classification.
     RECOMMENDED = meaningfully improves accuracy and coverage. -->

**Owner:** [your-username] | **Version:** 1.0.0 | **Last Updated:** YYYY-MM-DD

---

## Framework Reminder

| State | Symbol | Condition |
|---|---|---|
| **Dispatch** | 🟢 | AI can complete this fully. Output reviewed before anything external happens. |
| **Prep** | 🟡 | AI gets 80% there. I finish and send/execute. |
| **Yours** | 🔴 | Requires my judgment, relationships, or presence. AI assembles context only. |
| **Skip** | ⚫ | Not actionable today. Deferred with reason and suggested future date. |

**When in doubt between Prep and Dispatch → Prep.**
**When in doubt between Prep and Yours → Yours.**

---

## Dispatch (🟢) — AI Handles Fully

<!-- CHIEF: REQUIRED. Tasks the system can complete without your judgment.
     Be conservative here. Only put something in Dispatch if you'd genuinely be fine
     with the output going out without reading it first.
     The system always files outputs for review — but your goal is zero edits on Dispatch items. -->

### Email & Communication
- [e.g. Routine follow-up emails to existing clients on known, ongoing topics]
- [e.g. Meeting confirmation and logistics emails — date, time, link, nothing more]
- [e.g. Acknowledgement emails: "Got it, will review by [date]"]
- [Add your own]

### Scheduling
- [e.g. Booking or rescheduling routine meetings with existing contacts I've met before]
- [e.g. Sending calendar invites for already-agreed meetings]
- [e.g. Inserting drive time buffer events for physical location meetings]

### Research & Information
- [e.g. Background research on a company or person I'm meeting — standard output format]
- [e.g. Pulling recent news on a topic for a client brief]
- [e.g. Compiling a list of options or resources on a clearly defined question]

### Notes & Documentation
- [e.g. Filing Zoom meeting summaries to the relevant client knowledge base file]
- [e.g. Extracting action items from a meeting transcript and adding to Todoist]
- [e.g. Updating project status in a client file based on a meeting summary]

---

## Prep (🟡) — AI Gets 80%, I Finish

<!-- CHIEF: REQUIRED. Tasks where AI assistance is valuable but my review, judgment,
     or voice is required before anything goes out.
     System produces a draft or set of options — I complete and send/execute. -->

### Email & Communication
- [e.g. First email to any new contact — I always review before sending]
- [e.g. Any email involving pricing, rates, or financial terms]
- [e.g. Any email to a High-sensitivity contact as defined in CLIENTS.md]
- [e.g. Proposal or capabilities emails]
- [e.g. Any reply to a complaint or expression of dissatisfaction]
- [e.g. Any cold outreach where I'm making an ask of someone senior]

### Scheduling
- [e.g. Booking a meeting with someone I haven't met before]
- [e.g. Any scheduling decision that requires rearranging a protected block]
- [e.g. Scheduling that requires explaining or negotiating my availability]

### Research & Documentation
- [e.g. Meeting prep briefs — draft the brief, I review before the call]
- [e.g. Research where I need to evaluate conclusions, not just collect facts]
- [e.g. Any document that will be shared externally — draft only, I review and send]

---

## Yours (🔴) — Flag for Me, Assemble Context Only

<!-- CHIEF: REQUIRED. Tasks that are mine, full stop.
     The system's job here is to surface these clearly and assemble all relevant context
     so I can act efficiently — not to take any action whatsoever. -->

### Always Yours — No Exceptions
- [e.g. Core deliverables: strategic documents, client briefs, proposals I author]
- [e.g. Any financial decision or commitment of any kind]
- [e.g. Any legal matter, contract review, or document signing]
- [e.g. Performance feedback or difficult conversations with collaborators]
- [e.g. Media, press, or public-facing inquiries of any kind]
- [e.g. Any communication in the Do Not Touch list in CLIENTS.md]

### Conditionally Yours
- [e.g. Any email where my read of the relationship matters more than the content]
- [e.g. Anything from a contact not in CLIENTS.md with a senior title: CEO, Founder, Partner, Board]
- [e.g. Any task involving a sensitive topic even if the contact is otherwise routine]
- [e.g. Any task I've manually overridden to Yours in a previous run — never downgrade without my approval]

### How to Present Yours Items

<!-- CHIEF: The rules below are pre-filled agent instructions — do not delete them.
     Edit them if you want different context assembled for Yours items. -->

- Show a one-line summary of what it is and why it's Yours
- Pull the relevant section from CLIENTS.md for that contact if applicable
- Include any relevant recent emails or meeting notes as assembled context
- Suggest an obvious next step if one exists — but never execute it

---

## Skip (⚫) — Defer with Reason

<!-- CHIEF: REQUIRED. Items genuinely not actionable today.
     Always explain why and suggest when to revisit. -->

- [e.g. Tasks blocked on someone else's response — note who and what they're waiting for]
- [e.g. Tasks missing required information to proceed — note what's missing]
- [e.g. Tasks that are time-sensitive for a specific future date — surface on that date]
- [e.g. Newsletters, digests, FYI-only emails with no required action]
- [e.g. Tasks with no due date and low priority when today is already at 80%+ capacity]
- [e.g. Any task I've deferred 3+ times — escalate to Yours so I make a real decision on it]

---

## Source-Specific Rules

<!-- CHIEF: RECOMMENDED. Rules based on which input the item came from.
     Agents apply these on top of the general rules above.

     RULE PRIORITY ORDER (highest to lowest):
     1. Hard Rules in USER.md — absolute, override everything
     2. Do Not Touch list in CLIENTS.md — always Yours, no exceptions
     3. Client-specific rules in CLIENTS.md — per-contact overrides
     4. Classification Defaults in USER.md — broad blanket overrides
     5. Dispatch / Prep / Yours / Skip rules above — general content-based rules
     6. Source-specific rules below — fallbacks for items not caught above

     When rules conflict, higher-priority rules win. Never downgrade a
     classification set by a higher-priority rule. -->

### From Calendar

<!-- CHIEF: RECOMMENDED. Rules for how calendar events are classified when the
     system reads your calendar to build a context package or propose a schedule.
     These work in conjunction with the flexibility rules in SCHEDULING.md.

     Flexibility is signaled via the event title prefix:
       FLEX: ...   = agent may propose rescheduling
       LOCKED: ... = agent never moves, regardless of other rules -->

- [e.g. Event title starts with FLEX: → flexible, may be proposed for rescheduling within guardrails]
- [e.g. Event title starts with LOCKED: → never move, treat as immovable regardless of type]
- [e.g. Recurring event with no prefix → locked by default, never propose moving]
- [e.g. External invite not yet accepted → always Yours for a response decision]
- [e.g. Event marked Tentative → treat as flexible, flag for confirmation before the day]
- [e.g. Event marked Free → treat as flexible by default]
- [e.g. Event with no title, or titled "Busy" → treat as locked, do not attempt to identify or move]
- [e.g. Any event conflicting with a protected block → always Yours — never auto-resolve conflicts]

### From Gmail
- [e.g. Subject contains "unsubscribe" or "newsletter" → Skip]
- [e.g. From a no-reply address → Skip unless it contains a confirmed booking or receipt]
- [e.g. Thread where I'm CC'd but not the primary recipient → Skip unless directly relevant to active work]
- [e.g. From a domain in Do Not Touch → always Yours, no exceptions]
- [Add your own Gmail-specific rules]

### From Todoist
- [e.g. Tasks I created myself with no label → classify based on content using rules above]
- [e.g. Tasks labeled #waiting → Skip, note who it's waiting on and since when]
- [e.g. Tasks overdue by more than 7 days → surface as Yours for a real prioritization decision]
- [e.g. Tasks with P1 priority → never Skip, always surface as Yours at minimum]

### From Zoom Transcripts
- [e.g. Identified action items assigned to me → Dispatch: add to Todoist with client attribution]
- [e.g. Identified action items assigned to someone else → Prep: draft a follow-up to confirm they have it]
- [e.g. Meeting with a High-sensitivity client → Notes Agent appends summary, does not create tasks without my review]
- [e.g. Meeting had no AI summary → Skip and log the gap]

---

## Task Metadata

<!-- CHIEF: REQUIRED. When the Task Classifier creates or updates tasks in Todoist,
     it must always include this metadata. Missing fields should be flagged, not guessed. -->

| Field | Rule |
|---|---|
| **Source** | Which email, meeting, or flow generated this task |
| **Client attribution** | Which client or project this relates to — flag if uncertain |
| **Priority** | P1 / P2 / P3 / P4 using Todoist's priority system |
| **Duration estimate** | Expected minutes — flag if genuinely unclear |
| **Due date** | Suggested based on context — flag if no signal in source material |
| **Classification** | Which state was assigned and a one-line reason |

---

## Tuning Log

| Date | Change | Reason |
|------|--------|--------|
| | | |

---

<!-- CHIEF: When you're done:
     1. Start with the Always Yours section — locking down what's non-negotiable
     2. Then define Dispatch conservatively — you can always loosen it later
     3. Fill Source-Specific Rules after your first few AM Sweeps — patterns will be obvious
     4. Delete ALL comment blocks
     5. Commit: git add users/[username]/CLASSIFY.md && git commit -m "[manual] CLASSIFY.md — [username]"

     TUNING TIP: Classification is where most tuning happens. After each run, if something
     was misclassified, use `helm tune task_classifier` to add a specific rule.
     Always add to the Tuning Log so you can track what changed and why.
     The goal over time: Dispatch items require zero edits. Yours items have all the
     context you need assembled and waiting. -->
