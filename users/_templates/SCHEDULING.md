# Scheduling Rules
**Owner:** [your-username] | **Version:** 1.0.0 | **Last Updated:** YYYY-MM-DD

> **How to use this file:**
> This document tells the Calendar Manager and Time Blocker exactly how you want your day structured.
> Think of it as giving a very capable assistant your complete scheduling philosophy.
> Be specific. Vague rules produce schedules you'll override constantly.
>
> If you're unsure what to write, spend a week paying attention to when you feel most productive,
> when you resent meetings, and what scheduling decisions you make on autopilot. Write those down here.
> Delete all instructional comments (lines starting with >) before your first commit.

---

## Working Hours

- **Start:** [e.g. 8:00 AM]
- **End:** [e.g. 6:30 PM]
- **Hard stop:** [e.g. 7:00 PM — no tasks or events after this regardless of circumstances]
- **Timezone:** [e.g. America/Sao_Paulo]
- **Active days:** [e.g. Monday–Friday / Monday–Saturday]

---

## Protected Time Blocks

> These windows should never be scheduled over. List them in priority order.
> Format: Time range — label — what makes it non-negotiable

- [e.g. 8:00–11:00 AM — Deep Work — Highest cognitive output. No meetings, no interruptions. Override requires my explicit approval.]
- [e.g. 12:00–1:00 PM — Lunch — Always protected. Non-negotiable.]
- [e.g. 6:00–8:00 AM — Morning routine — Before work starts. Never schedule anything here.]
- [e.g. Tue/Thu 6:30–7:45 AM — Gym — Recurring commitment, treat as immovable.]
- [Add your own]

---

## Meeting Rules

> Rules that govern when and how meetings can be scheduled.

### Timing
- [e.g. No meetings before 9:00 AM]
- [e.g. No meetings after 5:30 PM unless I explicitly approve them]
- [e.g. No meetings on Friday afternoons — protect for weekly wrap-up]

### Buffers
- [e.g. Minimum 15-minute gap between any two consecutive meetings]
- [e.g. After any external client call: 10-minute buffer minimum — no back-to-back]
- [e.g. Before any meeting requiring significant prep: 30-minute prep block the day before]

### Duration
- [e.g. Default video call length: 50 minutes (never 60 — protect transition time)]
- [e.g. Default in-person meeting: 45 minutes]
- [e.g. Internal syncs: 25 minutes maximum]

### Preferences
- [e.g. External calls: afternoon preferred (1:00–5:00 PM)]
- [e.g. Internal calls: 11:00 AM–12:00 PM window]
- [e.g. When scheduling with someone new, always propose two options in different time slots]

---

## Locations

> List every physical location in your life that the system should know about.
> These are used for transit time calculations and task routing.

- **Home:** [street address or descriptive label]
  - Work type: remote work, personal errands, home tasks
- **[Office / Studio / Coworking]:** [address]
  - Work type: client meetings, collaborative work
- **[Gym / Trainer]:** [address]
  - Schedule: [e.g. Tuesday, Thursday, Saturday — 6:30–7:45 AM]
- **[Regular client location]:** [address] *(if applicable)*
- **[Other frequent location]:** [address]

---

## Task Scheduling Rules

> How the Time Blocker should assign tasks to time windows.

### By Task Type
- [e.g. Tasks tagged `deep-work` → morning block only (before 11 AM), never afternoon]
- [e.g. Tasks tagged `errand` → batch into a single outing, afternoon window preferred]
- [e.g. Tasks tagged `home` → evening window after [time], only if kids/family situation allows]
- [e.g. Tasks tagged `calls` → 1:00–5:00 PM window only]
- [e.g. Tasks tagged `admin` → 11:00 AM–12:00 PM admin window first]
- [Add your own task type rules]

### By Location
- [e.g. Any task that requires being at [location] → batch with other tasks at that location on the same trip]
- [e.g. Errands: always batch geographically to minimize backtracking. Use Maps routing.]
- [e.g. Gym-related tasks → only schedule on gym days in the block immediately after]

### By Day
- [e.g. Monday: start with a planning review. Don't fill the morning with execution tasks.]
- [e.g. Friday: afternoon reserved for weekly wrap-up and next-week prep. No deep work tasks after 2 PM.]
- [e.g. Wednesday: longest day — highest task load tolerance]
- [Add any day-specific patterns you've noticed in yourself]

### Overflow Rules
- [e.g. If a task doesn't fit today, recommend the nearest future day with open capacity]
- [e.g. Never stack more than 3 deep-work tasks in a single day]
- [e.g. If I'm already at 80% calendar capacity, flag all non-urgent tasks as Skip for today]

---

## Calendar Event Rules

### Transit Time Events
- [e.g. Insert drive time buffer before any physical location event using real Maps data]
- [e.g. Add 5 minutes to Maps estimate as a buffer for parking/arrival]
- [e.g. If drive time is under 5 minutes, no buffer event needed]

### Recurring Blocks to Maintain
> Blocks the system should protect and re-create if missing.
- [e.g. Weekly review: Fridays 4:00–5:00 PM]
- [e.g. Team sync: [day] at [time]]
- [e.g. Gym: Tue/Thu/Sat 6:30 AM]
- [Add any recurring commitments that should always be on the calendar]

### Event Naming Conventions
- [e.g. Client meetings: "[Client Name] — [topic/project]"]
- [e.g. Drive time events: "🚗 Drive to [destination] (~X min)"]
- [e.g. Deep work blocks: "⛔ Deep Work"]
- [e.g. Task blocks: use the exact task name from Todoist]

---

## Tuning Log

| Date | Change | Reason |
|------|--------|--------|
| | | |
