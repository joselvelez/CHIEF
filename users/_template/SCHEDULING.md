# Scheduling Rules
<!-- CHIEF: This file tells Calendar Manager and Time Blocker exactly how to structure your day.
     Think of it as giving a very capable assistant your complete scheduling philosophy.
     Be specific — vague rules produce schedules you'll override constantly.
     Fill in your real preferences, then DELETE ALL COMMENTS before committing.

     NOTE: Working Hours and Locations are defined in USER.md — not here.
     This file governs *rules and preferences*, not identity data.

     REQUIRED = agents need this to schedule without conflicts.
     RECOMMENDED = meaningfully improves schedule quality.
     OPTIONAL = fine-tuning once the system is running. -->

**Owner:** [your-username] | **Version:** 1.0.0 | **Last Updated:** YYYY-MM-DD

---

## Protected Time Blocks

<!-- CHIEF: REQUIRED. Windows that are never scheduled over — no meetings, no tasks,
     no exceptions unless you explicitly override.
     Calendar Manager treats these as hard unavailable. Time Blocker does not fill them.

     DISTINCTION FROM USER.md DEEP WORK WINDOWS:
     Deep Work Windows in USER.md tell agents *when to route* focus tasks — they're a
     scheduling preference. Protected Blocks here are *hard constraints* — agents treat
     them as completely unavailable, like a committed meeting. You can have a Deep Work
     Window that isn't a Protected Block (Time Blocker can fill it with tasks but not
     meetings). A Protected Block means nothing goes there, period.

     List in priority order. Format:
     [Days] [Time range] — [Label] — [Why it's non-negotiable] -->

- [e.g. Weekdays 9:00 AM–12:00 PM — Deep Work — Highest cognitive output. No meetings. Override requires my explicit approval.]
- [e.g. Daily 12:00–1:00 PM — Lunch — Always protected. Non-negotiable.]
- [e.g. Tue/Thu 6:30–7:45 AM — Gym — Recurring commitment, treat as immovable.]
- [e.g. Friday 4:00–5:30 PM — Weekly Review — Protected. No meetings after 3:30 PM on Fridays.]
- [Add your own protected blocks]

---

## Calendar Item Flexibility

<!-- CHIEF: REQUIRED. This section tells Calendar Manager and Time Blocker which
     existing calendar events can be moved and which are permanently fixed.
     Without this, agents cannot safely reschedule or optimize your day.

     HOW IT WORKS — three layers, applied in order:
     1. LOCKED BY DEFAULT: All recurring events (weekly, monthly, etc.) are treated
        as locked unless explicitly listed as flexible below.
     2. NAMING CONVENTION: Any event title starting with ~ is treated as flexible,
        regardless of whether it recurs. Use this for blocks you create yourself
        that are intentionally movable (e.g. "~ Deep Work Block", "~ Task: prep proposal").
     3. EXPLICIT LISTS: The Locked Events and Flexible Events lists below register
        known events by name pattern for certainty. These override the default rule.

     WHAT LOCKED MEANS: Calendar Manager will not propose moving, shortening, or
     removing a locked event under any circumstances. Time Blocker routes around it.

     WHAT FLEXIBLE MEANS: Calendar Manager may propose rescheduling a flexible event
     to accommodate higher-priority items. All proposed changes still require your
     approval at the human gate — nothing moves without your say-so. -->

### How Agents Identify Flexibility

<!-- CHIEF: REQUIRED. The event title is the agent's signal for flexibility.
     Two prefixes — one for flexible, one for locked. Both are all-caps so they're
     immediately visible in any calendar view.

     HOW TO USE IT:
     When creating an event you're willing to move, start the title with:
       FLEX: Deep Work Block
       FLEX: Task Block — draft proposal
       FLEX: Prep — client call Thursday

     When creating a single event that must never move (beyond the defaults), start with:
       LOCKED: Board Prep
       LOCKED: Performance Review — Alex

     That's it. You don't need to prefix everything — the defaults below handle most cases.
     Only use FLEX: or LOCKED: when the default would be wrong.

     Both prefixes are case-insensitive — flex: and locked: work too, but FLEX: and LOCKED:
     are recommended so they stand out in your calendar at a glance. -->

### Default Flexibility Rules

<!-- CHIEF: REQUIRED. What the system assumes when an event has no FLEX: or LOCKED: prefix.
     These defaults handle the majority of events without any tagging. -->

- **Recurring events (any cadence):** Locked by default — agents never propose moving them
- **Single events created by others / external invites:** Locked by default
- **Single events you created with no prefix:** [Locked / Flexible — choose your default]
- **Events marked Tentative in your calendar:** Flexible by default — flag for confirmation
- **Events marked Free in your calendar:** Flexible by default

### Locked Events — Never Move

<!-- CHIEF: REQUIRED. List every recurring commitment that must never be moved,
     cancelled, or shortened — even to accommodate high-priority work.
     These supplement the "recurring = locked by default" rule — add anything
     where you want absolute certainty, or single events that must never move.
     Include the event title pattern as it appears in your calendar. -->

- [e.g. "Weekly Team Sync" — every Monday 10:00 AM — external, cannot reschedule]
- [e.g. "Board Meeting" — first Tuesday of each month — locked, no exceptions]
- [e.g. "School Pickup" — weekdays 3:00 PM — hard personal commitment]
- [e.g. "Investor Update" — monthly — external commitment]
- [e.g. "Therapy / Medical" — recurring — always locked, always Yours]
- [Add every recurring commitment that is non-negotiable]

### Flexible Events — May Be Moved

<!-- CHIEF: RECOMMENDED. List self-created blocks and holds you're willing to move.
     Any event titled FLEX: ... is automatically flexible.
     Use this list as a fallback for events created before you adopted the prefix,
     or for title patterns you want to register without prefixing each one. -->

- [e.g. "FLEX: Deep Work" — self-created, can shift within the same day]
- [e.g. "FLEX: Task Block" — movable, prefer same day but can defer to next]
- [e.g. "FLEX: Prep —" events — can move up to 24 hours before the meeting they prep for]
- [e.g. "Focus Time" — created before adopting the prefix, register here as flexible]
- [Add your self-created block title patterns here]

### Flexibility Rules

<!-- CHIEF: RECOMMENDED. Guardrails on how flexibly flexible events can actually move.
     Without these, "flexible" could mean moved to an inconvenient time. -->

- **Same-day rescheduling:** [e.g. Flexible events may be moved within the same day only, not to a different day, unless I approve]
- **Minimum notice before moving:** [e.g. Never propose moving a flexible event less than 2 hours before it starts]
- **Never move to after:** [e.g. Never reschedule a flexible event to after 6:00 PM]
- **Prep event rule:** [e.g. Prep blocks must always stay within 24 hours before the meeting they relate to]
- **Cascading changes:** [e.g. If moving event A requires moving event B, flag as Yours — don't cascade automatically]

---

## Meeting Rules

<!-- CHIEF: REQUIRED. Rules Calendar Manager follows when proposing or evaluating meetings. -->

### When I Take Meetings

<!-- CHIEF: REQUIRED. Actual windows you're willing to meet — often narrower than working hours. -->

- **External meetings (clients, prospects):** [e.g. Tuesday–Thursday, 10:00 AM – 4:00 PM only]
- **Internal meetings / calls:** [e.g. Any weekday, 9:00 AM – 5:30 PM]
- **First meetings with new contacts:** [e.g. 30 minutes maximum, video preferred]
- **Minimum advance notice:** [e.g. 48 hours — never propose same-day or next-day for external contacts]

### Buffers

<!-- CHIEF: RECOMMENDED. Time Blocker enforces these between calendar events. -->

- **Between any two consecutive meetings:** [e.g. 15 minutes minimum]
- **After any external client call:** [e.g. 10 minutes — no immediate back-to-back]
- **Before any meeting requiring prep:** [e.g. 30-minute prep block the day before, if the meeting warrants it]

### Duration Defaults

<!-- CHIEF: RECOMMENDED. Used when a meeting type is identified but no length is specified. -->

- **Video call (external):** [e.g. 50 minutes — never 60, protect transition time]
- **In-person meeting:** [e.g. 45 minutes]
- **Internal sync:** [e.g. 25 minutes maximum]
- **Intro / first call:** [e.g. 30 minutes]

### Other Preferences

<!-- CHIEF: RECOMMENDED. -->

- **Meeting-light days:** [e.g. Fridays — only schedule if there's genuinely no other option]
- **Batching preference:** [e.g. Cluster calls on Tuesday and Thursday when possible]
- **Video vs. in-person default:** [e.g. Video unless client requests in-person]
- **When proposing times:** [e.g. Always offer two options in different time slots]
- **Max meetings per day:** [e.g. 4 — flag if a proposed day exceeds this]

---

## Task Scheduling Rules

<!-- CHIEF: REQUIRED. How Time Blocker assigns tasks to time windows in your day.
     Applied after protected blocks and committed meetings are accounted for. -->

### Task Type → Time Window

<!-- CHIEF: REQUIRED. Map task types to your energy windows from USER.md.
     Time Blocker routes tasks to the right part of your day based on these rules. -->

| Task Type | Preferred Window | Notes |
|---|---|---|
| Deep work / strategy | [e.g. Morning, 9:00 AM – 12:00 PM] | [e.g. First thing, no interruptions] |
| Writing / drafting | [e.g. Morning or early afternoon] | [e.g. Before 2:00 PM only] |
| Calls / meetings | [e.g. Afternoon, 1:00 PM – 5:00 PM] | [e.g. Batch on Tue/Thu if possible] |
| Admin / email | [e.g. Afternoon, 3:00 PM – 5:30 PM] | [e.g. Never schedule first thing in the morning] |
| Errands | [e.g. Midday, 12:00 PM – 1:30 PM] | [e.g. Batch geographically with Maps routing] |
| Research | [e.g. Any window with 60+ min available] | |
| Home tasks | [e.g. Evening after [time]] | |

### By Day

<!-- CHIEF: RECOMMENDED. Day-specific patterns you've noticed in yourself.
     Time Blocker will try to honor these when filling your week. -->

- [e.g. Monday: start with a planning review. Don't fill the morning with execution tasks.]
- [e.g. Wednesday: longest day — highest task load tolerance.]
- [e.g. Friday: afternoon reserved for wrap-up and next-week prep. No deep-work tasks after 2:00 PM.]
- [Add your own day-specific patterns]

### Errand Batching

<!-- CHIEF: RECOMMENDED. Controls how Time Blocker groups location-based tasks.
     Google Maps routing is used to minimize backtracking. -->

- **Batch errands by location:** [Yes / No]
- **Minimum errands to trigger a route:** [e.g. 2 — only batch if there are at least 2 nearby tasks]
- **Maximum errand window:** [e.g. 90 minutes — don't schedule more than this in one outing]
- **Preferred errand day(s):** [e.g. Wednesday midday / No preference]

### Overflow Rules

<!-- CHIEF: REQUIRED. What happens when there's more work than available time. -->

- [e.g. Never stack more than 3 deep-work tasks in a single day]
- [e.g. If today is already at 80%+ capacity, flag all non-urgent tasks as Skip]
- [e.g. When deferring, suggest the nearest future day with open capacity in the right time window]
- [e.g. Never defer a task past Friday of the same week unless it has no due date]

---

## Calendar Event Rules

<!-- CHIEF: RECOMMENDED. Governs how Calendar Manager creates and maintains events. -->

### Transit Time Buffers

<!-- CHIEF: RECOMMENDED. Rules for the automatic drive-time events inserted before
     physical location meetings (via Google Maps Distance Matrix). -->

- [e.g. Always insert a drive-time buffer before any meeting that requires travel]
- [e.g. Add 5 minutes to the Maps estimate for parking/arrival]
- [e.g. If drive time is under 5 minutes, no buffer event needed]
- [e.g. Show transit buffer events as Busy so others can't book over them]

### Recurring Blocks to Maintain

<!-- CHIEF: RECOMMENDED. Blocks the system should protect and flag if they go missing. -->

- [e.g. Weekly review: Fridays 4:00–5:00 PM]
- [e.g. Gym: Tuesday / Thursday / Saturday 6:30 AM]
- [e.g. Team sync: [day] at [time]]
- [Add your recurring commitments here]

### Event Naming Conventions

<!-- CHIEF: RECOMMENDED. Consistent naming makes your calendar readable at a glance. -->

- **Client meetings:** [e.g. "[Client Name] — [topic or project]"]
- **Drive time events:** [e.g. "🚗 Drive to [destination] (~X min)"]
- **Deep work blocks:** [e.g. "⛔ Deep Work"]
- **Task blocks:** [e.g. Use the exact task name from Todoist]
- **Prep blocks:** [e.g. "Prep — [meeting name]"]

### Decline Rules

<!-- CHIEF: OPTIONAL. Calendar Manager never auto-declines — but these rules tell it
     when to flag an invite as Yours for a deliberate decision. -->

- [e.g. If I haven't responded to an invite within 48 hours, flag it as Yours]
- [e.g. Any invite that conflicts with a protected block → always flag as Yours, never auto-move]
- [e.g. Invites from unknown senders → always Yours]

---

## Tuning Log

| Date | Change | Reason |
|------|--------|--------|
| | | |

---

<!-- CHIEF: When you're done:
     1. Replace all [bracketed placeholders] with your real rules
     2. Delete ALL comment blocks
     3. Commit: git add users/[username]/SCHEDULING.md && git commit -m "[manual] SCHEDULING.md — [username]"

     TUNING TIP: After your first few Time Block runs, use `helm tune time_blocker`
     to add rules that aren't being followed. The most common issues:
     task type routing (wrong time window) and errand batching (too aggressive or not enough). -->
