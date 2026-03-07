# Classification Rules
**Owner:** [your-username] | **Version:** 1.0.0 | **Last Updated:** YYYY-MM-DD

> **How to use this file:**
> This document defines exactly how the Task Classifier assigns Dispatch / Prep / Yours / Skip
> to every item that passes through CHIEF. It is the most operationally important document
> you'll write — bad classification rules produce a system that either does too little or
> overreaches. Spend real time on this.
>
> How to approach it: Think about the last 30 tasks or emails you handled.
> For each one, ask: "Could I have delegated this to a very capable assistant who knows me well,
> with no risk of embarrassment or damage if they got it slightly wrong?" If yes → Dispatch.
> If they'd need my input → Prep. If I wouldn't trust anyone else with it → Yours.
>
> Delete all instructional comments (lines starting with >) before your first commit.

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

> Tasks the system can complete without my judgment. Be conservative here.
> Only put something in Dispatch if you'd genuinely be fine with the output going
> out without you reading it first. (The system always files outputs for review —
> but your goal is for Dispatch items to require zero edits.)

### Email & Communication
- [e.g. Routine follow-up emails to existing clients/contacts on known topics]
- [e.g. Meeting confirmation and logistics emails (date/time/link, nothing more)]
- [e.g. Acknowledgement emails: "Got it, will review by [date]"]
- [Add your own]

### Scheduling
- [e.g. Booking or rescheduling routine meetings with existing contacts]
- [e.g. Sending calendar invites for already-agreed meetings]
- [e.g. Inserting drive time buffer events for physical meetings]

### Research & Information
- [e.g. Background research on a company or person I'm meeting (standard format output)]
- [e.g. Pulling recent news on a topic for a client brief]
- [e.g. Compiling a list of options or resources on a defined topic]

### Notes & Documentation
- [e.g. Filing Zoom meeting summaries to the relevant client knowledge base file]
- [e.g. Updating project status in a client file based on a meeting summary]
- [e.g. Extracting action items from a meeting transcript and adding to Todoist]

### Other
- [Add anything else that fits cleanly in Dispatch for your context]

---

## Prep (🟡) — AI Gets 80%, I Finish

> Tasks where AI assistance is valuable but my review, judgment, or voice is required
> before anything goes out. The system produces a draft or a set of options — I complete it.

### Email & Communication
- [e.g. First email to any new contact]
- [e.g. Any email involving pricing, rates, or financial terms]
- [e.g. Any email to a High-sensitivity client (as defined in CLIENTS.md)]
- [e.g. Proposal or capabilities emails]
- [e.g. Any reply to a complaint or expressions of dissatisfaction]
- [e.g. Any cold outreach where I'm making an ask of someone senior]

### Scheduling
- [e.g. Booking a meeting with someone I haven't met before]
- [e.g. Any scheduling decision that involves rearranging a protected block]
- [e.g. Scheduling that requires explaining or negotiating timing constraints]

### Research & Documentation
- [e.g. Meeting prep briefs (draft the brief, I review before the call)]
- [e.g. Research where I need to evaluate the conclusions, not just the facts]
- [e.g. Any document that will be shared externally — draft only, I review]

### Other
- [Add your own Prep conditions]

---

## Yours (🔴) — Flag for Me, Assemble Context Only

> Tasks that are mine, full stop. The system's job here is to surface these clearly
> and assemble all relevant context so I can act efficiently — not to take any action.

### Always Yours (No Exceptions)
- [e.g. Core deliverables: strategic documents, client briefs, proposals I author]
- [e.g. Any financial decision or commitment]
- [e.g. Any legal matter, contract review, or document signing]
- [e.g. Performance feedback or difficult conversations with collaborators]
- [e.g. Media or press inquiries of any kind]
- [e.g. Any communication in the "Do Not Touch" list in CLIENTS.md]

### Conditionally Yours
- [e.g. Any email where my read of the relationship context matters more than the content]
- [e.g. Anything from a contact not in CLIENTS.md who has a senior title (CEO, Founder, Partner, etc.)]
- [e.g. Any task involving a sensitive topic even if the contact is routine]
- [e.g. Any task I've manually overridden to Yours in a previous run — never downgrade]

### How to Present Yours Items
> When surfacing a Yours item, the system should:
- [e.g. Show a one-line summary of what it is]
- [e.g. Pull the relevant section from CLIENTS.md for that contact]
- [e.g. Show any relevant recent emails or meeting notes in the context]
- [e.g. Suggest a next step if one is obvious, but do not execute it]

---

## Skip (⚫) — Defer with Reason

> Items that are genuinely not actionable today. The system should explain why
> and suggest when to revisit.

- [e.g. Tasks blocked on someone else's response — note who and what they're waiting on]
- [e.g. Tasks missing required information to proceed — note what's missing]
- [e.g. Tasks that are time-sensitive for a future date — schedule for that date]
- [e.g. Newsletters, digests, FYI-only emails that require no action]
- [e.g. Tasks with no due date and low priority when today is already at 80%+ capacity]
- [e.g. Any task I've deferred 3+ times — escalate to Yours so I make a real decision]

---

## Source-Specific Rules

> Rules based on where a task or email came from.

### From Gmail
- [e.g. Subject contains "unsubscribe" or "newsletter" → Skip]
- [e.g. From a no-reply address → Skip unless it contains a confirmed booking or receipt]
- [e.g. Thread is CC-only (I'm not the primary recipient) → Skip unless directly relevant]
- [Add your own]

### From Todoist
- [e.g. Tasks I created myself with no label → classify based on content]
- [e.g. Tasks labeled `#waiting` → Skip, note who it's waiting on]
- [e.g. Tasks overdue by more than 7 days → surface as Yours for a real prioritization decision]

### From Zoom Transcripts
- [e.g. Identified action items for me → Dispatch (add to Todoist with client attribution)]
- [e.g. Identified action items for someone else → Prep (draft a follow-up to confirm they have it)]
- [e.g. Meeting had no AI summary → Skip and note in log]

---

## Metadata the System Should Always Attach to Tasks

> When the Task Classifier creates or updates tasks in Todoist, it should always include:

- **Source:** [e.g. which email, meeting, or flow generated this task]
- **Client attribution:** [e.g. which client or project this relates to, if determinable]
- **Priority:** [e.g. P1/P2/P3/P4 using Todoist's priority system]
- **Duration estimate:** [e.g. how many minutes this task is expected to take]
- **Due date:** [e.g. suggested based on context — flag if genuinely uncertain]
- **Classification:** [e.g. which state was assigned and a brief reason]

---

## Tuning Log

| Date | Change | Reason |
|------|--------|--------|
| | | |
