# CHIEF — Personal AI Operations System
### Architecture, Design & Setup Reference
**Version:** 0.1.0 | **Status:** Initial Design | **Last Updated:** 2026-03-07

---

## What This Document Is

This is the canonical design and setup reference for CHIEF — a modular, git-backed personal AI operations system that automates the daily operational overhead of your life and work. It is the first file committed to your private git repository and the source of truth for how the system is designed, configured, and extended.

Every major component — inputs, agents, triggers, process flows, key documents — is designed to be **configurable**, **toggleable**, and **extensible**. The system is multi-user by design: each person runs their own instance with their own configuration.

---

## Table of Contents

1. [System Philosophy](#1-system-philosophy)
2. [Repository Structure](#2-repository-structure)
3. [User Configuration & Profiles](#3-user-configuration--profiles)
4. [Layer 1 — Source of Truth (Git)](#4-layer-1--source-of-truth-git)
5. [Layer 2 — Data Sources (Inputs)](#5-layer-2--data-sources-inputs)
6. [Layer 3 — Orchestration Engine](#6-layer-3--orchestration-engine)
7. [Layer 4 — Agents](#7-layer-4--agents)
8. [Layer 5 — Triggers & Human Gates](#8-layer-5--triggers--human-gates)
9. [Process Flows](#9-process-flows)
10. [Key Documents](#10-key-documents)
11. [HELM CLI Tool](#11-helm-cli-tool)
12. [Secrets Management](#12-secrets-management)
13. [Context Scoping](#13-context-scoping)
14. [Human Approval Protocol](#14-human-approval-protocol)
15. [Feedback & Tuning Loop](#15-feedback--tuning-loop)
16. [Infrastructure — Railway](#16-infrastructure--railway)
17. [Zoom AI Notes Integration](#17-zoom-ai-notes-integration)
18. [Getting Started Checklist](#18-getting-started-checklist)

---

## 1. System Philosophy

### The Core Framework: Dispatch / Prep / Yours / Skip

Every task, email, and item that passes through the system is classified into one of four states:

| State | Symbol | Meaning | System Action |
|---|---|---|---|
| **Dispatch** | 🟢 | AI can handle this fully | Agent completes task, files output for your review |
| **Prep** | 🟡 | AI can get 80% there | Agent prepares options/drafts, you finish |
| **Yours** | 🔴 | Requires your judgment or presence | Flagged with all available context assembled |
| **Skip** | ⚫ | Not actionable today | Deferred with a reason and suggested future date |

### Hard Rules (Non-Negotiable Defaults)

The following constraints are system-wide and require deliberate override to change:

- **The system never sends an email.** It drafts only.
- **The system never deletes anything.** Archive, defer, or flag — never destroy.
- **The system never makes financial decisions or handles sensitive relationship communications** without explicit human dispatch.
- **When uncertain about classification, default to Prep, never Dispatch.**
- **All agent outputs land in `/outputs/` for review before any external action is taken.**

Each user can add to this list in their `USER.md` profile. Hard rules cannot be removed — only extended.

---

## 2. Repository Structure

```
/chief/
│
├── SETUP.md                    ← This file. Master design reference.
│
├── /config/
│   ├── system.yaml             ← Global system settings
│   ├── inputs.yaml             ← All configured data source integrations
│   ├── agents.yaml             ← All configured agents + toggle states
│   ├── flows.yaml              ← All configured process flows
│   ├── triggers.yaml           ← All configured triggers
│   └── engine.yaml             ← Orchestration engine config
│
├── /users/
│   └── /[username]/
│       ├── USER.md             ← Profile, preferences, hard rules
│       ├── VOICE.md            ← Communication style + tone
│       ├── CLIENTS.md          ← Client/contact context (or CONTACTS.md)
│       └── /docs/              ← User's custom key documents
│
├── /instructions/
│   ├── /agents/
│   │   ├── EMAIL_DRAFTER.md
│   │   ├── TASK_CLASSIFIER.md
│   │   ├── CALENDAR_MANAGER.md
│   │   ├── RESEARCH_AGENT.md
│   │   ├── NOTES_AGENT.md
│   │   └── TIME_BLOCKER.md
│   └── /flows/
│       ├── OVERNIGHT_TRIAGE.md
│       ├── AM_SWEEP.md
│       └── TIME_BLOCK.md
│
├── /templates/
│   ├── email_draft.md
│   ├── task_object.md
│   ├── context_package.md
│   ├── agent_instruction.md    ← Template for creating new agents
│   ├── flow_instruction.md     ← Template for creating new flows
│   └── key_document.md        ← Template for creating new key documents
│
├── /context/
│   └── /[username]/
│       └── YYYY-MM-DD.md       ← Daily context packages (generated, versioned)
│
├── /outputs/
│   └── /[username]/
│       └── /YYYY-MM-DD/        ← Agent outputs pending review
│
├── /state/
│   └── /[username]/
│       ├── last_run.json       ← Timestamps of last successful runs per flow
│       ├── deferred.json       ← Tasks deferred with reasons + target dates
│       └── processed_ids.json  ← IDs of already-processed emails/tasks (idempotency)
│
├── /logs/
│   └── /[username]/
│       └── YYYY-MM-DD.log      ← Run logs, errors, agent completion reports
│
└── /knowledge/
    └── /[username]/
        └── /clients/           ← Markdown knowledge base files
```

---

## 3. User Configuration & Profiles

CHIEF is multi-user. Each user has their own namespace in the repo and their own configuration. There is no shared state between users.

### Setting Up a New User

When a new user runs `helm setup`, they are guided through:

1. **Identity** — name, username (used as folder namespace), timezone, language
2. **Role / Context** — are they a professional, student, parent, executive? This seeds default agent behavior.
3. **Inputs** — which data sources to connect (guided setup per source)
4. **Agents** — which agents to enable
5. **Flows** — which process flows to activate
6. **Triggers** — how they want to invoke the system
7. **Key Documents** — which profile documents to create (guided prompts for each)
8. **Hard Rules** — any additions to the system defaults
9. **Secrets** — guided setup for each required credential

The output of setup is a populated `/users/[username]/` directory and updated `config/*.yaml` files, committed to git.

### USER.md — Example

```markdown
# User Profile: [username]

## Identity
- **Name:** Jane Doe
- **Username:** jane
- **Timezone:** America/Los_Angeles
- **Language:** English
- **Setup Date:** 2026-03-07

## Role Context
Solo professional services consultant. Five clients maximum. No junior staff.
Primary work: strategic writing, client calls, advisory work.

## Working Hours
- Core hours: 8:00 AM – 5:30 PM
- Deep work blocks: 8:00 AM – 11:00 AM (protect these)
- No meetings before 9:00 AM unless explicitly approved
- Hard stop: 6:30 PM

## Locations
- Home office: [address or descriptor]
- Client office A: [address]
- Gym: [address] — Tuesday, Thursday, Saturday mornings

## Hard Rules (User Additions)
- Never draft a reply to [specific person] — always flag as Yours
- Never schedule back-to-back calls. Minimum 15 min buffer.
- Strategic Briefs are always Yours. Never Prep or Dispatch.
- Do not create calendar events on Sundays.

## Classification Defaults
- Emails from new contacts not in CLIENTS.md → always Prep, never Dispatch
- Invoice or payment topics → always Yours
- Press inquiries → always Yours

## Preferred Output Style
- Completion reports: concise bullet list, no preamble
- Research outputs: executive summary first, detail below
- Email drafts: show subject line, to/from, and body. Flag any assumptions made.

## Key Documents
| Document | Path | Used By | Last Updated |
|---|---|---|---|
| Voice & Tone | /users/jane/VOICE.md | email_drafter, notes_agent | 2026-03-07 |
| Client Profiles | /users/jane/CLIENTS.md | all agents | 2026-03-07 |
| Scheduling Rules | /users/jane/SCHEDULING.md | calendar_manager, time_blocker | 2026-03-07 |
| Classification Rules | /users/jane/CLASSIFY.md | task_classifier | 2026-03-07 |
```

---

## 4. Layer 1 — Source of Truth (Git)

The private git repository is the operating system of the system. Every component reads from and writes back to it.

### Git Discipline Rules

- **All runs start with `git pull`** to ensure latest instructions
- **All runs end with `git commit + push`** of changed files (outputs, logs, state, context)
- **Instruction files and config files are human-edited** — never overwritten by agents
- **Outputs directory is agent-written** — treated as staging, not permanent record
- **Secrets are never committed** — `.gitignore` enforces this strictly

### .gitignore Defaults

```
.env
*.env
/secrets/
*.key
*.pem
*.token
node_modules/
__pycache__/
.DS_Store
```

### Commit Message Convention

```
[auto] overnight-triage 2026-03-07 — jane
[auto] am-sweep outputs 2026-03-07 — jane
[manual] updated VOICE.md — jane
[system] tuning: updated TASK_CLASSIFIER.md — jane
```

---

## 5. Layer 2 — Data Sources (Inputs)

Inputs are modular and registry-based. Each input is defined in `config/inputs.yaml`, has a guided setup wizard accessible via `helm inputs add`, and can be toggled on/off without removing its configuration.

### inputs.yaml Structure

```yaml
inputs:
  - id: gmail
    label: Gmail
    enabled: true
    configured: true
    scope: [email_read, draft_write]
    setup_guide: /instructions/setup/gmail.md
    credentials_ref: GMAIL_OAUTH_TOKEN   # points to secrets manager key

  - id: google_calendar
    label: Google Calendar
    enabled: true
    configured: true
    scope: [calendar_read, calendar_write]
    setup_guide: /instructions/setup/google_calendar.md
    credentials_ref: GCAL_OAUTH_TOKEN

  - id: google_maps
    label: Google Maps API
    enabled: true
    configured: true
    setup_guide: /instructions/setup/google_maps.md
    credentials_ref: GOOGLE_MAPS_API_KEY

  - id: todoist
    label: Todoist
    enabled: true
    configured: true
    scope: [tasks_read, tasks_write]
    setup_guide: /instructions/setup/todoist.md
    credentials_ref: TODOIST_API_TOKEN

  - id: zoom
    label: Zoom (AI Meeting Notes)
    enabled: true
    configured: true
    scope: [meeting_summaries_read, recordings_read]
    setup_guide: /instructions/setup/zoom.md
    credentials_ref: ZOOM_OAUTH_TOKEN

  - id: notion
    label: Notion
    enabled: false
    configured: false
    setup_guide: /instructions/setup/notion.md
    credentials_ref: NOTION_API_KEY

  - id: slack
    label: Slack
    enabled: false
    configured: false
    setup_guide: /instructions/setup/slack.md
    credentials_ref: SLACK_BOT_TOKEN
```

### Adding a New Input

```bash
helm inputs add
# → Interactive wizard: name it, provide API docs URL or describe the API,
#   HELM generates a setup guide and adds the entry to inputs.yaml
```

### Toggling an Input

```bash
helm inputs toggle zoom          # flip enabled state
helm inputs list                 # show all inputs with status
```

### Guided Setup Per Input

Each input has a corresponding `/instructions/setup/[input_id].md` that walks through:
1. Where to get credentials (link to developer console)
2. Required OAuth scopes or API key permissions
3. How to add the credential to the secrets manager
4. How to verify the connection works

---

## 6. Layer 3 — Orchestration Engine

The engine is what reads instruction files and runs agents. Claude Code CLI is the default. The engine config makes it possible to swap this out.

### engine.yaml

```yaml
engine:
  default: claude_code_cli
  available:
    - id: claude_code_cli
      label: Claude Code CLI
      command: claude
      enabled: true
      notes: "Default. Uses Claude Code subagent system. Requires Claude Code installed."

    - id: anthropic_api
      label: Anthropic API (direct)
      enabled: false
      notes: "Custom orchestrator calling Anthropic API directly. Requires custom runner."

    - id: openai_api
      label: OpenAI API
      enabled: false
      notes: "Alternative LLM engine. Requires instruction file format adjustments."

  settings:
    max_parallel_agents: 6
    default_timeout_seconds: 120
    retry_on_failure: true
    max_retries: 2
```

### Switching the Engine

```bash
helm engine set anthropic_api
helm engine status
```

The instruction markdown files are the interface between the engine and the agents. They are designed to be human-readable and mostly engine-agnostic. Engine-specific formatting requirements (if any) are noted at the top of each instruction file.

---

## 7. Layer 4 — Agents

Agents are modular, registry-based, and follow the same toggle/configure/add pattern as inputs.

### agents.yaml Structure

```yaml
agents:
  - id: email_drafter
    label: Email Drafter
    enabled: true
    instruction_file: /instructions/agents/EMAIL_DRAFTER.md
    inputs: [gmail]
    outputs: [gmail_drafts]
    context_keys: [tasks_today, voice_profile, client_profiles]
    hard_limits:
      - never_send: true
      - max_drafts_per_run: 20

  - id: task_classifier
    label: Task Classifier
    enabled: true
    instruction_file: /instructions/agents/TASK_CLASSIFIER.md
    inputs: [todoist, gmail, zoom]
    outputs: [classified_task_list]
    context_keys: [calendar_today, recent_transcripts, client_profiles]

  - id: calendar_manager
    label: Calendar Manager
    enabled: true
    instruction_file: /instructions/agents/CALENDAR_MANAGER.md
    inputs: [google_calendar, google_maps, todoist]
    outputs: [calendar_events, transit_buffers]
    context_keys: [user_locations, working_hours]
    hard_limits:
      - never_accept_decline: true
      - never_modify_existing_events: true

  - id: research_agent
    label: Research Agent
    enabled: true
    instruction_file: /instructions/agents/RESEARCH_AGENT.md
    inputs: [web_search]
    outputs: [research_files]
    context_keys: [research_request, client_profiles]

  - id: notes_agent
    label: Notes Agent
    enabled: true
    instruction_file: /instructions/agents/NOTES_AGENT.md
    inputs: [zoom, todoist]
    outputs: [knowledge_base_updates]
    context_keys: [client_profiles, existing_notes]
    hard_limits:
      - never_overwrite_strategic_content: true

  - id: time_blocker
    label: Time Blocker
    enabled: true
    instruction_file: /instructions/agents/TIME_BLOCKER.md
    inputs: [todoist, google_calendar, google_maps]
    outputs: [proposed_schedule]
    context_keys: [user_locations, working_hours, scheduling_rules]
    hard_limits:
      - never_modify_committed_events: true
      - propose_only: true
```

### Adding a New Agent

```bash
helm agents add
# → Prompts: agent name, what it does, what inputs it needs, what it outputs,
#   any hard limits. Generates an instruction file scaffold and adds to agents.yaml.
```

### Instruction File Scaffold (from `/templates/agent_instruction.md`)

```markdown
# Agent: [Agent Name]
**ID:** [agent_id]
**Version:** 1.0.0
**Last Updated:** YYYY-MM-DD

## Purpose
One sentence: what does this agent do?

## Inputs
- List of data sources this agent reads from

## Outputs
- List of what this agent produces and where it goes

## Context Package
The following keys will be provided in this agent's context window:
- `[key]` — description

## Behavior Rules
Numbered, specific, unambiguous rules for how this agent makes decisions.

## Classification Logic (if applicable)
How this agent applies Dispatch / Prep / Yours / Skip.

## Hard Limits
What this agent must never do, regardless of instructions.

## Output Format
Exact format specification for what this agent returns.

## Edge Cases
Known edge cases and how to handle them.

## Tuning Log
| Date | Change | Reason |
|------|--------|--------|
```

---

## 8. Layer 5 — Triggers & Human Gates

### triggers.yaml

```yaml
triggers:
  - id: overnight_triage
    label: Overnight Triage
    enabled: true
    type: scheduled
    schedule: "0 5 * * 1-5"      # 5 AM weekdays (cron syntax)
    platform: railway
    flow: overnight_triage
    human_gate: false             # Runs fully automated, report delivered async

  - id: transit_prep
    label: Overnight Transit Prep
    enabled: true
    type: scheduled
    schedule: "10 5 * * 1-5"     # 5:10 AM weekdays
    platform: railway
    flow: transit_prep
    human_gate: false

  - id: am_sweep
    label: AM Sweep
    enabled: true
    type: manual
    invocation: "helm run am-sweep"
    flow: am_sweep
    human_gate: true              # Pauses for review before agents fire

  - id: time_block
    label: Time Block
    enabled: true
    type: manual
    invocation: "helm run time-block"
    flow: time_block
    human_gate: true
```

### Adding / Configuring a Trigger

```bash
helm triggers add
helm triggers list
helm triggers toggle overnight_triage
helm triggers edit am_sweep
```

---

## 9. Process Flows

Flows are defined in instruction markdown files and registered in `config/flows.yaml`. Each flow specifies its sequence of steps, which agents it invokes, and where human gates occur.

### flows.yaml

```yaml
flows:
  - id: overnight_triage
    label: Overnight Email Triage
    enabled: true
    instruction_file: /instructions/flows/OVERNIGHT_TRIAGE.md
    agents: [task_classifier, notes_agent]
    inputs_required: [gmail, todoist, zoom]
    human_gate_before_agents: false
    idempotency_key: state/[user]/processed_ids.json

  - id: transit_prep
    label: Overnight Transit Prep
    enabled: true
    instruction_file: /instructions/flows/TRANSIT_PREP.md
    agents: [calendar_manager]
    inputs_required: [google_calendar, google_maps]
    human_gate_before_agents: false

  - id: am_sweep
    label: AM Sweep
    enabled: true
    instruction_file: /instructions/flows/AM_SWEEP.md
    agents: [task_classifier, email_drafter, calendar_manager, research_agent, notes_agent]
    inputs_required: [todoist, gmail, google_calendar, zoom]
    human_gate_before_agents: true
    parallel: true

  - id: time_block
    label: Time Block
    enabled: true
    instruction_file: /instructions/flows/TIME_BLOCK.md
    agents: [time_blocker]
    inputs_required: [todoist, google_calendar, google_maps]
    human_gate_before_agents: true
    parallel: false
```

### Flow Sequence: Overnight Triage

```
START
  └─ git pull
  └─ Load state/[user]/processed_ids.json
  └─ Fetch emails since last run (Gmail API)
  └─ Filter out already-processed IDs
  └─ Fetch Zoom meeting summaries from last 24h
  └─ Fetch open Todoist tasks
  └─ Run TASK_CLASSIFIER: email → task objects with metadata
  └─ Run NOTES_AGENT: meeting summaries → knowledge base updates
  └─ Dedup against existing Todoist tasks
  └─ Write new tasks to Todoist
  └─ Write knowledge base updates to /knowledge/[user]/
  └─ Update processed_ids.json
  └─ Write completion report to /outputs/[user]/YYYY-MM-DD/overnight_report.md
  └─ git commit + push
END
```

### Flow Sequence: AM Sweep

```
START
  └─ git pull
  └─ Build today's context package (context/[user]/YYYY-MM-DD.md)
      └─ Open tasks from Todoist
      └─ Today's calendar
      └─ Recent Zoom transcripts (last 3 days)
      └─ Client profiles for tasks referencing clients
  └─ Run TASK_CLASSIFIER across all open tasks
  └─ Display classified list to user in HELM
  └─ ── HUMAN GATE ── Review, adjust classifications, approve or abort
  └─ Fire parallel agents (only for Dispatch and Prep tasks):
      ├─ EMAIL_DRAFTER: handle email-related tasks
      ├─ CALENDAR_MANAGER: handle scheduling tasks
      ├─ RESEARCH_AGENT: handle research tasks
      └─ NOTES_AGENT: handle documentation tasks
  └─ Collect all outputs to /outputs/[user]/YYYY-MM-DD/
  └─ Generate completion report
  └─ Display completion report in HELM
  └─ git commit + push
END
```

### Flow Sequence: Time Block

```
START
  └─ git pull
  └─ Fetch remaining unscheduled tasks from Todoist (with duration estimates)
  └─ Fetch today's committed calendar events
  └─ Load user working hours, locations, scheduling rules from USER.md
  └─ Run TIME_BLOCKER:
      └─ Calculate available time windows
      └─ Apply location-aware batching (group errands geographically)
      └─ Route errands with Google Maps
      └─ Schedule gym on configured days
      └─ Fill evening window with home tasks
      └─ Defer overflow with suggested future dates
  └─ Generate proposed schedule
  └─ ── HUMAN GATE ── Review proposed schedule, adjust, approve or abort
  └─ Push approved events to Google Calendar
  └─ Update deferred tasks in state/[user]/deferred.json
  └─ git commit + push
END
```

### Adding a New Flow

```bash
helm flows add
# → Prompts for flow name, sequence description, which agents,
#   whether human gate is needed. Generates instruction file scaffold.
```

---

## 10. Key Documents

Key documents are the system's understanding of who you are and how you operate. They are markdown files stored in `/users/[username]/` and read by agents as part of their context packages.

### How the System Knows What Key Documents Exist

Each key document is registered in the user's `USER.md` under a `## Key Documents` section. When HELM builds a context package for an agent, it reads this registry and includes the relevant documents based on the `context_keys` declared in `agents.yaml`.

### Adding a New Key Document

```bash
helm docs add
# → Prompts: document name, purpose, which agents should read it,
#   uses /templates/key_document.md as scaffold, registers in USER.md
```

---

### Example: VOICE.md

```markdown
# Voice & Communication Style
**Owner:** [username] | **Version:** 1.0.0

## Overall Tone
Direct and warm. Confident without being aggressive. Professional but human.
No filler phrases. No corporate speak.

## Email Style
- Short paragraphs. Two to four sentences maximum per paragraph.
- Lead with the main point. Context comes after.
- Clear ask or next step in every email that requires a response.
- Signature: First name only for ongoing relationships. Full name for new contacts.

## Phrases I Use
- "Happy to jump on a quick call if easier"
- "Let me know if you need anything else from my end"
- "Following up on the below"

## Phrases I Never Use
- "Per my last email" — too passive aggressive
- "Hope this finds you well" — remove from all drafts
- "As per our conversation" — use "Following our call" instead
- "Please don't hesitate to" — just say "feel free to"
- Exclamation points — use sparingly, maximum one per email

## Formality by Audience
| Audience | Tone |
|---|---|
| Long-term clients | Casual, first names, light humor acceptable |
| New prospects | Professional, slightly formal |
| Media/press | Measured, precise, no speculation |
| Vendors | Friendly but brief |

## Things I Never Write About in Email
- Pricing specifics (always move to call)
- Anything I wouldn't want forwarded
- Apologies for response time (just respond, don't apologize)
```

---

### Example: CLIENTS.md

```markdown
# Client & Contact Profiles
**Owner:** [username] | **Version:** 1.0.0

## Active Clients

### [Client Name A]
- **Type:** Active client
- **Since:** 2024-06
- **Primary Contact:** [Name], [Title]
- **Email domain:** @company.com
- **Engagement:** Strategic advisory, monthly retainer
- **Sensitivity:** High. Cc the primary contact on all communications.
- **Communication preference:** Email for non-urgent, text for urgent
- **Current focus:** [Brief description of active engagement]
- **Do not:** Discuss competitor names in writing. Always flag pricing discussions as Yours.

### [Client Name B]
- **Type:** Active client
- **Primary Contact:** [Name]
- **Sensitivity:** Medium
- **Notes:** Prefers early morning calls. Always send recap after calls.

## Warm Prospects

### [Prospect Name]
- **Status:** Intro call completed, follow-up pending
- **Context:** Referred by [name]. Interested in [topic].
- **Next step:** Send capabilities overview
- **Classification rule:** All communications → Prep (never Dispatch)

## Key Contacts (Non-Client)

### [Name]
- **Role:** [relationship/role]
- **Notes:** [any relevant context the system should know]
```

---

### Example: SCHEDULING.md

```markdown
# Scheduling Rules
**Owner:** [username] | **Version:** 1.0.0

## Working Hours
- Start: 8:00 AM
- End: 6:00 PM
- Timezone: America/Los_Angeles

## Protected Blocks
- **Deep Work:** 8:00–11:00 AM daily. No meetings. No exceptions without explicit override.
- **Admin:** 11:00 AM–12:00 PM. Light tasks, emails, scheduling.
- **Lunch:** 12:00–1:00 PM. Do not schedule over this.
- **Evening:** After 8:30 PM, home tasks only.

## Meeting Rules
- Minimum 15-minute buffer between back-to-back meetings
- No meetings before 9:00 AM
- No meetings after 5:30 PM (unless flagged as Yours and I approve)
- Video calls: 30 or 50 minutes only (never 60 — preserve transition time)
- External client calls: afternoons preferred

## Locations
- **Home:** [address or "home"] — remote work, home tasks
- **Office:** [address] — client meetings, focused work
- **Gym:** [address] — Tue/Thu/Sat mornings, 6:30–7:45 AM

## Task Scheduling Rules
- Tasks with a location tag of "gym" → Tue/Thu/Sat 6:30 AM only
- Tasks tagged "errand" → batch together, single outing, afternoon window
- Tasks tagged "home" → evening window after 8:30 PM
- Tasks tagged "deep-work" → morning block only, never afternoon
- If a task doesn't fit today → suggest nearest low-load future date, don't force it

## Calendar Buffer Rules
- Before physical location meeting: insert drive time event (via Maps API)
- After external client call: 10-minute unscheduled buffer minimum
- End of day: 15-minute wrap-up block if schedule permits
```

---

### Example: CLASSIFY.md

```markdown
# Classification Rules
**Owner:** [username] | **Version:** 1.0.0

## Default Classification Logic

### Dispatch (🟢) — AI handles fully
- Scheduling or rescheduling routine meetings (no new contacts)
- Filing meeting notes to existing client files
- Research on known topics with defined output format
- Drafting routine follow-up emails (existing contacts, non-sensitive)

### Prep (🟡) — AI gets 80%, I finish
- First email to any new contact
- Any email involving pricing, proposals, or contract terms
- Meeting prep briefs
- Any communication involving a sensitive client (flagged in CLIENTS.md)
- Any task where the context is ambiguous

### Yours (🔴) — Flag for me with assembled context
- Strategic Briefs and core client deliverables
- Any financial or legal decision
- Relationship-sensitive communications
- Press or media inquiries
- Anything involving a contact not in CLIENTS.md with high email authority (founder, exec, journalist)
- Any task that requires physical presence

### Skip (⚫) — Defer with reason
- Tasks with missing information needed to proceed
- Tasks that are blocked on someone else's action
- Tasks that don't fit today's capacity (suggest future date)
- Newsletters, marketing, FYI emails requiring no action

## Override Rules
- If uncertain between Prep and Dispatch → Prep
- If uncertain between Prep and Yours → Yours
- Never upgrade a task that has been manually set to Yours
```

---

## 11. HELM CLI Tool

**HELM** (Human-AI Executive Layer Manager) is the command-line interface for the entire system. It runs on Mac and Windows, provides a rich terminal UI, and is the primary way users interact with CHIEF.

### Design Principles

- **Feels like a cockpit, not a terminal.** Rich color, clear structure, satisfying interaction.
- **Never ambiguous.** Every state, every output, every option is clearly labeled.
- **Fast.** The most common operations (run am-sweep, run time-block) should be reachable in two keystrokes.
- **Safe.** Human gates are hard stops — the tool makes it visually obvious when you're about to trigger agent execution.

### Core Commands

```bash
# System management
helm setup                    # First-time guided setup wizard
helm status                   # System health: all inputs, agents, flows, last run times
helm config                   # Open config files in editor

# Running flows
helm run am-sweep             # Trigger AM Sweep with human gate
helm run time-block           # Trigger Time Block with human gate
helm run <flow_id>            # Trigger any configured flow

# Inputs
helm inputs list              # Show all inputs + enabled/disabled status
helm inputs add               # Guided wizard to add a new input
helm inputs toggle <id>       # Enable or disable an input
helm inputs test <id>         # Verify a connection is working

# Agents
helm agents list              # Show all agents + status
helm agents add               # Guided wizard to add a new agent
helm agents toggle <id>       # Enable or disable an agent
helm agents edit <id>         # Open instruction file in editor

# Flows
helm flows list               # Show all flows
helm flows add                # Guided wizard to add a new flow
helm flows edit <id>          # Open flow instruction file

# Triggers
helm triggers list            # Show all triggers + schedules
helm triggers toggle <id>     # Enable or disable a trigger

# Documents
helm docs list                # Show all key documents for current user
helm docs add                 # Guided wizard to add a new key document
helm docs edit <id>           # Open a key document in editor

# Secrets
helm secrets set <key>        # Set a secret value (never logged or printed)
helm secrets list             # Show secret keys (names only, never values)
helm secrets verify <key>     # Test that a secret is accessible

# Logs & outputs
helm logs                     # Show recent run logs
helm logs <flow_id>           # Show logs for a specific flow
helm outputs                  # Show pending outputs awaiting review
helm outputs open             # Open today's outputs folder

# Git
helm sync                     # git pull + status report
helm push                     # git commit + push with auto-message

# Tuning
helm tune <agent_id>          # Open agent instruction file + recent logs side by side
```

### AM Sweep Interactive Flow (in HELM)

```
╔══════════════════════════════════════════════════════════╗
║  CHIEF  ·  AM SWEEP  ·  Monday, March 9  ·  8:02 AM      ║
╠══════════════════════════════════════════════════════════╣
║  Classified 14 tasks                                      ║
╠══════════════════════════════════════════════════════════╣
║  🟢 DISPATCH (4)                                          ║
║     · File Zoom notes from Friday call with [Client A]    ║
║     · Schedule intro call with [Prospect B]               ║
║     · Research: background on [Company X]                 ║
║     · Draft follow-up to [Name] re: project timeline      ║
╠══════════════════════════════════════════════════════════╣
║  🟡 PREP (5)                                              ║
║     · Draft proposal email to [New Contact]               ║
║     · Prep brief for Thursday board call                  ║
║     · Research: [Topic] for [Client A] strategy session   ║
║     · Draft response to [press inquiry]     ← ⚠ check    ║
║     · Update [Client B] engagement notes                  ║
╠══════════════════════════════════════════════════════════╣
║  🔴 YOURS (3)                                             ║
║     · Strategic Brief: [Client A] Q2 plan                 ║
║     · Review and sign [Contract]                          ║
║     · [Sensitive] Respond to [Name] re: pricing           ║
╠══════════════════════════════════════════════════════════╣
║  ⚫ SKIP (2)                                              ║
║     · [Task] blocked on response from [Name]              ║
║     · [Newsletter] FYI only                               ║
╠══════════════════════════════════════════════════════════╣
║  Adjust any classification? [e] edit  [a] approve  [x] abort
╚══════════════════════════════════════════════════════════╝
```

After approval: agents fire in parallel, terminal shows live progress per agent, completion report displayed when done.

### Tech Stack for HELM

- **Runtime:** Node.js (works cross-platform on Mac and Windows without extra install if bundled)
- **CLI framework:** [Ink](https://github.com/vadimdemedes/ink) — React for CLIs. Enables rich interactive UIs in terminal.
- **Styling:** [Chalk](https://github.com/chalk/chalk) for colors, [Ora](https://github.com/sindresorhus/ora) for spinners
- **Prompts:** [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) for guided wizards
- **Distribution:** `pkg` or [caxa](https://github.com/nicolo-ribaudo/caxa) to bundle as a standalone executable — users don't need Node.js installed
- **Install:** Single binary download or `npm install -g chief-helm`

---

## 12. Secrets Management

Secrets (API keys, OAuth tokens) are **never stored in the git repository**. They live locally on the machine running the system.

### Strategy: OS Keychain + .env Fallback

**Primary (recommended):** Use the operating system's native secrets store.
- **macOS:** Keychain Access — accessed programmatically via `keytar` npm package
- **Windows:** Windows Credential Manager — also accessible via `keytar`

**Fallback:** A local `.env` file in the user's home directory (`~/.chief/.env`), outside the repo, in `.gitignore`. Simpler but less secure.

HELM abstracts this entirely:

```bash
helm secrets set GMAIL_OAUTH_TOKEN
# → Prompts for value (masked input)
# → Stores in OS keychain under key "chief/[username]/GMAIL_OAUTH_TOKEN"
# → Never written to disk in plaintext, never logged, never committed
```

### OAuth Tokens (Google APIs, Zoom)

OAuth tokens have expiry and need refresh handling. HELM manages this:

```bash
helm inputs test gmail
# → Checks if token is valid
# → If expired, launches browser-based re-auth flow automatically
# → Stores new token to keychain
```

### What Lives Where

| Secret Type | Storage Location |
|---|---|
| API keys (Maps, etc.) | OS Keychain |
| OAuth access tokens | OS Keychain |
| OAuth refresh tokens | OS Keychain |
| Railway env vars | Railway dashboard (not local) |
| Config key references | `config/inputs.yaml` (key names only, never values) |

---

## 13. Context Scoping

Each agent receives only the context it needs — not everything. Giving every agent everything wastes context window, degrades output quality, and increases surface area for bad decisions.

### How Context Packages Are Built

When a flow runs, HELM builds a context package before firing each agent. The package is assembled from:
1. The agent's declared `context_keys` in `agents.yaml`
2. The user's key documents registered in `USER.md`
3. Live data fetched from configured inputs

Context packages are written to `/context/[user]/YYYY-MM-DD-[agent_id].md` and passed to the agent at invocation. They are versioned in git.

### Context Key Definitions

| Key | Contents | Used By |
|---|---|---|
| `tasks_today` | Full list of today's classified tasks with metadata | email_drafter, time_blocker |
| `calendar_today` | Today's events + next 24h | calendar_manager, task_classifier |
| `recent_transcripts` | Last 3 Zoom meeting summaries | task_classifier, notes_agent |
| `voice_profile` | Contents of VOICE.md | email_drafter |
| `client_profiles` | Contents of CLIENTS.md | all agents |
| `scheduling_rules` | Contents of SCHEDULING.md | calendar_manager, time_blocker |
| `classification_rules` | Contents of CLASSIFY.md | task_classifier |
| `user_locations` | Location list from USER.md | calendar_manager, time_blocker |
| `working_hours` | Working hours from USER.md | time_blocker, calendar_manager |
| `research_request` | Specific task being researched | research_agent |
| `existing_notes` | Current content of client's knowledge base file | notes_agent |

### Context Size Guardrails

- Each context package is capped at a configurable token limit (default: 20,000 tokens)
- If a context key would exceed the limit, it is summarized automatically
- Full content always available in the repo for reference

---

## 14. Human Approval Protocol

Every flow with `human_gate: true` in `flows.yaml` follows this protocol.

### The Gate

1. **HELM displays the full proposed action list** — what agents will do, what tasks are classified how
2. **User can:**
   - `[a]` — approve as shown, fire agents
   - `[e]` — enter edit mode to reclassify individual tasks
   - `[r]` — reject a specific task from the current run (moves to Yours)
   - `[x]` — abort the entire run (no agents fire, nothing changes)
3. **Nothing external happens until the user presses `[a]`**
4. **After agents complete**, HELM displays the completion report and all outputs land in `/outputs/` for review before any external systems are updated

### What "Review Before Action" Means Per Agent

| Agent | Review Point |
|---|---|
| Email Drafter | Drafts appear in Gmail Drafts — you send manually |
| Calendar Manager | Proposed events shown in HELM — you confirm before push |
| Notes Agent | File diffs shown in HELM — you approve before write |
| Research Agent | Output file created in /outputs/ — reviewed async |
| Time Blocker | Proposed schedule shown in HELM — you confirm before push |

### Override Protocol

If you want to permanently change how something is classified (e.g., a recurring task keeps getting misclassified), use:

```bash
helm tune task_classifier
```

This opens the TASK_CLASSIFIER.md instruction file alongside the recent run log so you can add a specific rule. The change is committed to git.

---

## 15. Feedback & Tuning Loop

The system improves over time through a lightweight, deliberate tuning process.

### When Something Goes Wrong

1. Identify which agent or flow produced the bad output
2. Run `helm tune <agent_id>` — opens instruction file + last run log side by side
3. Add a specific rule to the instruction file (with a brief comment explaining why)
4. Run the flow again on the same input to verify the fix
5. Commit the change with message: `[system] tuning: [agent_id] — [brief reason]`

### Tuning Log in Every Instruction File

Each instruction file maintains a `## Tuning Log` table at the bottom:

```markdown
## Tuning Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-09 | Added rule: never Dispatch emails to new contacts | Sent a draft to wrong person |
| 2026-03-14 | Updated transit time buffer from 10 to 15 min | Was arriving late |
```

### Weekly Tuning Habit (Recommended)

Once a week, run:

```bash
helm logs --week
```

This shows a summary of the past week's runs: how many tasks classified per state, which agents ran, any errors. Spend 10 minutes reviewing and tuning anything that looks off.

### Version Control as Your Safety Net

Because every instruction file change is committed to git, you can always revert a bad tuning change:

```bash
git log instructions/agents/TASK_CLASSIFIER.md
git revert <commit>
```

---

## 16. Infrastructure — Railway

Scheduled flows (overnight jobs) run on Railway. The setup keeps a clear separation: Railway handles scheduled execution; the local machine handles interactive flows via HELM.

### Railway Setup

1. **Service:** A single Railway service running a Node.js (or Python) job runner
2. **Cron jobs:** Defined in Railway dashboard as scheduled tasks, pointing to flow IDs
3. **Environment variables:** All secrets live in Railway's environment variable store (not in the repo)
4. **Git integration:** Railway pulls the latest repo on each run, ensuring it always uses current instruction files
5. **Logs:** Railway logs are mirrored to `/logs/[user]/` and committed to git for auditability

### Railway Environment Variables to Configure

```
CHIEF_USERNAME=[your username]
CHIEF_REPO_SSH_KEY=[deploy key for pulling the repo]
ANTHROPIC_API_KEY=[for LLM calls]
GMAIL_OAUTH_TOKEN=[from Google OAuth]
GCAL_OAUTH_TOKEN=[from Google OAuth]
GOOGLE_MAPS_API_KEY=
TODOIST_API_TOKEN=
ZOOM_OAUTH_TOKEN=
```

### Failure Handling on Railway

- Each flow writes to `state/[user]/last_run.json` only on success
- If a run fails, the state file is not updated, so the next run re-processes
- Idempotency is enforced by `state/[user]/processed_ids.json` to prevent duplicate task creation
- Railway auto-retries on crash (configure max 2 retries)
- Error logs committed to git so you can inspect what happened

---

## 17. Zoom AI Notes Integration

Zoom's native AI Companion feature generates meeting summaries automatically. These are accessible via the Zoom API.

### How It Works

After a Zoom meeting ends, Zoom AI generates a summary that includes:
- Meeting overview
- Key topics discussed
- Action items identified
- Next steps

These summaries are available via the Zoom REST API within approximately 30 minutes of the meeting ending.

### API Endpoints Used

- `GET /meetings/{meetingId}/meeting_summary` — fetch AI-generated summary for a specific meeting
- `GET /users/{userId}/recordings` — list recent meetings with recordings (used to discover recent meeting IDs)

### Setup Requirements

1. **Zoom OAuth App:** Create an OAuth app in the Zoom App Marketplace (Server-to-Server OAuth recommended for automated access)
2. **Required Scopes:** `meeting:read:admin`, `meeting_summary:read:admin`, `recording:read:admin`
3. **Zoom Account:** AI Companion must be enabled on the account (available on paid plans)
4. **Meeting requirement:** AI summary is generated only when Zoom AI Companion is active during the call

### What the Notes Agent Does With Summaries

1. Fetches summaries for all meetings in the last 24 hours (overnight run) or last 3 days (AM Sweep)
2. Identifies which client or project each meeting belongs to (matching against CLIENTS.md)
3. Extracts action items → formats as task objects → adds to Todoist (with source attribution)
4. Appends summary to the relevant client knowledge base file in `/knowledge/[user]/clients/`
5. Never overwrites existing strategic content — only appends with timestamp and meeting date

### Fallback

If Zoom AI Companion is not active for a meeting (guest calls, etc.), the agent skips that meeting and logs it as "no summary available."

---

## 18. Getting Started Checklist

Work through this in order. Don't skip the document-writing steps.

### Phase 1: Repository Setup (30 min)
- [ ] Create private GitHub repository
- [ ] Clone to local machine and to Railway service
- [ ] Commit this SETUP.md as the first file
- [ ] Create initial directory structure (all folders listed in Section 2)
- [ ] Create `.gitignore` with secrets entries

### Phase 2: Accounts & Credentials (2–4 hours)
- [ ] Google Cloud Console — create project, enable Gmail API, Google Calendar API, Google Maps API, generate OAuth credentials
- [ ] Todoist — generate API token from integrations settings
- [ ] Zoom — create Server-to-Server OAuth app in Zoom App Marketplace, enable AI Companion on account
- [ ] Anthropic — generate API key for LLM calls
- [ ] Railway — create account, create service, configure environment variables

### Phase 3: Write Your Documents (4–8 hours — don't rush this)
- [ ] `USER.md` — your profile, working hours, locations, hard rules
- [ ] `VOICE.md` — your communication style (use example in Section 10 as scaffold)
- [ ] `CLIENTS.md` — every active client and key contact
- [ ] `SCHEDULING.md` — your exact scheduling preferences
- [ ] `CLASSIFY.md` — your classification rules with examples

### Phase 4: Install & Configure HELM (1–2 hours)
- [ ] Install HELM CLI
- [ ] Run `helm setup` — guided wizard for your user profile
- [ ] Run `helm secrets set` for each credential
- [ ] Run `helm inputs test` for each input to verify connections
- [ ] Run `helm agents list` to confirm all agents are configured

### Phase 5: First Runs (1–2 hours)
- [ ] Run `helm run overnight-triage` manually to test (not via cron)
- [ ] Review outputs in `/outputs/[user]/`
- [ ] Run `helm run am-sweep` — review the classification before approving
- [ ] Run `helm run time-block` — review the proposed schedule before approving
- [ ] Adjust instruction files based on anything that looks wrong
- [ ] Commit all instruction file changes

### Phase 6: Enable Automation (30 min)
- [ ] Enable Railway cron triggers for overnight flows
- [ ] Verify first automated overnight run succeeds
- [ ] Check git log to confirm state and outputs were committed

### Phase 7: Ongoing (Weekly)
- [ ] Run `helm logs --week` to review system performance
- [ ] Tune any instruction files where agent behavior was off
- [ ] Commit all tuning changes with descriptive messages

---

*CHIEF SETUP.md — Version 0.1.0 — First commit. This document evolves as the system does.*
