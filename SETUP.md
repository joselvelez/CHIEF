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

The core directory structure ships with the repository. You do not need to create it manually — fork or clone the repo and it's already in place.

```
/chief/
│
├── SETUP.md                    ← This file. Master design reference.
├── README.md                   ← Project overview
├── LICENSE                     ← Non-commercial license
├── .gitignore_example          ← Copy this to .gitignore before your first commit
│
├── /helm/                      ← HELM CLI source code
│   ├── package.json            ← Published to npm as 'chief-helm'
│   ├── tsconfig.json
│   ├── README.md               ← HELM developer and user docs
│   └── /src/                   ← TypeScript source (see HELM_PRD.md for full structure)
│
├── /getting_started/           ← Detailed setup guides (linked from checklist below)
│   ├── RAILWAY_SETUP.md        ← Full Railway configuration walkthrough
│   └── GOOGLE_APIS_SETUP.md    ← Gmail, Calendar, and Maps API setup
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
│   ├── /_template/             ← Copy this to /users/[yourname]/ to start
│   │   ├── USER.md             ← Profile, preferences, hard rules (fill in)
│   │   ├── VOICE.md            ← Communication style + tone (fill in)
│   │   ├── CLIENTS.md          ← Client/contact context (fill in)
│   │   ├── SCHEDULING.md       ← Scheduling preferences (fill in)
│   │   └── CLASSIFY.md         ← Classification rules (fill in)
│   └── /[username]/            ← Your personal namespace (created during setup)
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

The output of setup is a copy of `/users/_template/` populated with your answers under `/users/[username]/`, plus updated `config/*.yaml` files, all committed to git.

### USER.md — Example

See the filled example in `/users/_template/USER.md`. Copy the entire `_template/` folder to `/users/[yourname]/` and fill in every section. The template includes instructional comments to guide you.

---

## 4. Layer 1 — Source of Truth (Git)

The private git repository is the operating system of the system. Every component reads from and writes back to it.

### First Thing: Set Up Your .gitignore

The repo ships with `.gitignore_example`. Before adding any personal files or credentials, copy it to `.gitignore`:

```bash
cp .gitignore_example .gitignore
git add .gitignore
git commit -m "add gitignore"
```

Never commit the `.gitignore_example` with secrets in it — it is a template that stays in the repo. Your `.gitignore` is what protects you.

### Git Discipline Rules

- **All runs start with `git pull`** to ensure latest instructions
- **All runs end with `git commit + push`** of changed files (outputs, logs, state, context)
- **Instruction files and config files are human-edited** — never overwritten by agents
- **Outputs directory is agent-written** — treated as staging, not permanent record
- **Secrets are never committed** — `.gitignore` enforces this strictly

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
    schedule: "0 5 * * 1-5"      # 5 AM weekdays (cron syntax, adjust for your timezone)
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

### The Five Core Documents

All five are pre-populated as templates in `/users/_template/`. Each template includes instructional comments that guide you through filling them in. **Read the comments, fill in your real information, then delete the comments before committing.**

| Document | Purpose | Primary Consumers |
|---|---|---|
| `USER.md` | Identity, working hours, locations, hard rules | All agents |
| `VOICE.md` | Communication style, tone, phrases to use and avoid | Email Drafter, Notes Agent |
| `CLIENTS.md` | Client profiles, sensitivity levels, contact rules | All agents |
| `SCHEDULING.md` | Protected blocks, meeting rules, task routing | Calendar Manager, Time Blocker |
| `CLASSIFY.md` | Classification rules, source-specific logic, metadata schema | Task Classifier |

### Adding a New Key Document

```bash
helm docs add
# → Prompts: document name, purpose, which agents should read it,
#   uses /templates/key_document.md as scaffold, registers in USER.md
```

---

## 11. HELM CLI Tool

**HELM** (Human-AI Executive Layer Manager) is the command-line interface for the entire system. It runs on Mac and Windows, provides a rich terminal UI, and is the primary way users interact with CHIEF.

### Source Code & Installation

HELM source code lives at `/helm/` in this repository. It is a self-contained Node.js package published to npm as `chief-helm`. Users install it once and it is available as the `helm` command globally. They never interact with the source code directly.

```bash
npm install -g chief-helm
```

Requires Node.js v20+ and Git. See the [Getting Started Checklist](#18-getting-started-checklist) for full prerequisites. The full HELM product specification is in `HELM_PRD.md`.

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

- **Runtime:** Node.js v20+ (Mac and Windows)
- **CLI framework:** [Ink](https://github.com/vadimdemedes/ink) — React for CLIs. Enables rich interactive UIs in terminal.
- **Styling:** [Chalk](https://github.com/chalk/chalk) for colors, [Ora](https://github.com/sindresorhus/ora) for spinners
- **Prompts:** [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) for guided wizards
- **Distribution:** Published to npm as `chief-helm`. Install with `npm install -g chief-helm`.

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

For the complete Railway setup walkthrough, see **[/getting_started/RAILWAY_SETUP.md](./getting_started/RAILWAY_SETUP.md)**.

### Summary

1. **Service:** A single Railway service running a Node.js job runner
2. **Cron jobs:** Two scheduled tasks defined in Railway dashboard
3. **Environment variables:** All secrets live in Railway's env var store (not in the repo)
4. **Git integration:** Railway pulls the latest repo on each run
5. **Logs:** Mirrored to `/logs/[user]/` and committed to git

### Railway Environment Variables

```
CHIEF_USERNAME
ANTHROPIC_API_KEY
GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_OAUTH_REFRESH_TOKEN
GCAL_CLIENT_ID / GCAL_CLIENT_SECRET / GCAL_OAUTH_REFRESH_TOKEN
GOOGLE_MAPS_API_KEY
TODOIST_API_TOKEN
ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET / ZOOM_OAUTH_TOKEN
CHIEF_REPO_DEPLOY_KEY
```

### Failure Handling

- Each flow writes to `state/[user]/last_run.json` only on success
- Idempotency is enforced by `state/[user]/processed_ids.json`
- Railway auto-retries on crash (max 2 retries)
- Error logs committed to git for post-mortem

---

## 17. Zoom AI Notes Integration

Zoom's native AI Companion feature generates meeting summaries automatically. These are accessible via the Zoom API.

### How It Works

After a Zoom meeting ends, Zoom AI generates a summary including meeting overview, key topics, action items, and next steps. Summaries are available via the Zoom REST API within ~30 minutes of the meeting ending.

### API Endpoints Used

- `GET /meetings/{meetingId}/meeting_summary` — fetch AI-generated summary
- `GET /users/{userId}/recordings` — list recent meetings (used to discover meeting IDs)

### Setup Requirements

1. **Zoom OAuth App:** Server-to-Server OAuth app in the Zoom App Marketplace
2. **Required Scopes:** `meeting:read:admin`, `meeting_summary:read:admin`, `recording:read:admin`
3. **Zoom Account:** AI Companion must be enabled (paid plans)

### What the Notes Agent Does

1. Fetches summaries for meetings in the last 24h (overnight) or last 3 days (AM Sweep)
2. Matches each meeting to a client or project via CLIENTS.md
3. Extracts action items → formats as task objects → adds to Todoist
4. Appends meeting summary to client knowledge base file
5. Never overwrites strategic content — appends only

---

## 18. Getting Started Checklist

Work through these phases in order. Do not skip the document-writing phase — it is the most important work you'll do.

---

### Phase 1 — Repository Setup

**Estimated time: 15 minutes**

- [ ] Fork or clone this repository
- [ ] Make your fork **private** (your config and knowledge base should not be public)
- [ ] Copy `.gitignore_example` → `.gitignore`:
  ```bash
  cp .gitignore_example .gitignore
  git add .gitignore
  git commit -m "add gitignore"
  ```
- [ ] Verify the core directory structure is in place (`/config`, `/users`, `/instructions`, etc.)

---

### Phase 2 — Accounts & Credentials

**Estimated time: 2–4 hours**
**Detailed guides:** [Google APIs Setup](./getting_started/GOOGLE_APIS_SETUP.md) · [Railway Setup](./getting_started/RAILWAY_SETUP.md)

- [ ] **Google Cloud Console** — Create project, enable Gmail API + Google Calendar API + Maps Distance Matrix API, create OAuth 2.0 credentials, generate tokens
  → Full steps: [Google APIs Setup](./getting_started/GOOGLE_APIS_SETUP.md)

- [ ] **Todoist** — Generate API token
  → Go to [app.todoist.com](https://app.todoist.com) → Settings → Integrations → Developer → copy API token

- [ ] **Zoom** — Create Server-to-Server OAuth app, enable AI Companion
  → Go to [marketplace.zoom.us](https://marketplace.zoom.us) → Develop → Build App → Server-to-Server OAuth
  → Required scopes: `meeting:read:admin`, `meeting_summary:read:admin`, `recording:read:admin`
  → Enable Zoom AI Companion in your account settings (requires paid plan)

- [ ] **Anthropic** — Generate API key
  → Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key

- [ ] **Railway** — Create account, project, and service
  → Full steps: [Railway Setup](./getting_started/RAILWAY_SETUP.md)

---

### Phase 3 — Write Your Key Documents

**Estimated time: 4–8 hours — do not rush this**

This is the highest-leverage work in the entire setup. The quality of your key documents directly determines the quality of every agent output.

The templates in `/users/_template/` contain instructional comments to guide you. For each document: read the comments, fill in your real information, delete the comments, then commit.

- [ ] **Copy the template folder to your namespace:**
  ```bash
  cp -r users/_template users/[yourname]
  ```

- [ ] **Fill in `USER.md`** — your profile, working hours, locations, hard rules, output style preferences
  → Template: [/users/_template/USER.md](./users/_template/USER.md)
  → This file seeds the identity context for all agents

- [ ] **Fill in `VOICE.md`** — your communication style, tone, phrases you use and never use, formality by audience
  → Template: [/users/_template/VOICE.md](./users/_template/VOICE.md)
  → Tip: pull up 5–10 emails you've written that you're proud of and use them as source material

- [ ] **Fill in `CLIENTS.md`** — every active client, warm prospect, and key contact with sensitivity levels and rules
  → Template: [/users/_template/CLIENTS.md](./users/_template/CLIENTS.md)
  → The Do Not Touch section is especially important — fill it in first

- [ ] **Fill in `SCHEDULING.md`** — protected blocks, meeting rules, location list, task routing rules
  → Template: [/users/_template/SCHEDULING.md](./users/_template/SCHEDULING.md)
  → Include your real addresses for Maps API routing to work correctly

- [ ] **Fill in `CLASSIFY.md`** — Dispatch/Prep/Yours/Skip rules, source-specific logic, metadata requirements
  → Template: [/users/_template/CLASSIFY.md](./users/_template/CLASSIFY.md)
  → The most operationally critical document. Be conservative with Dispatch.

- [ ] **Commit your filled documents:**
  ```bash
  git add users/[yourname]/
  git commit -m "[manual] initial key documents — [yourname]"
  git push
  ```

---

### Phase 4 — Install & Configure HELM

**Estimated time: 1–2 hours**

- [ ] Install HELM CLI:
  ```bash
  # Prerequisites: Node.js v20+ and Git must be installed first
  # Node.js: https://nodejs.org → download LTS version
  # Git (macOS): pre-installed, or: brew install git
  # Git (Windows): https://git-scm.com

  npm install -g chief-helm
  helm --version    # verify install worked
  ```

- [ ] Run initial setup:
  ```bash
  helm setup
  # → Guided wizard: confirms your username, links to your user folder,
  #   walks through each credential
  ```

- [ ] Store all credentials in the OS keychain:
  ```bash
  helm secrets set GMAIL_CLIENT_ID
  helm secrets set GMAIL_CLIENT_SECRET
  helm secrets set GMAIL_OAUTH_REFRESH_TOKEN
  helm secrets set GCAL_CLIENT_ID
  helm secrets set GCAL_CLIENT_SECRET
  helm secrets set GCAL_OAUTH_REFRESH_TOKEN
  helm secrets set GOOGLE_MAPS_API_KEY
  helm secrets set TODOIST_API_TOKEN
  helm secrets set ZOOM_ACCOUNT_ID
  helm secrets set ZOOM_CLIENT_ID
  helm secrets set ZOOM_CLIENT_SECRET
  ```

- [ ] Test every connection:
  ```bash
  helm inputs test gmail
  helm inputs test google_calendar
  helm inputs test google_maps
  helm inputs test todoist
  helm inputs test zoom
  ```
  All should return ✓. Fix any failures before proceeding.

- [ ] Verify system status:
  ```bash
  helm status
  # → Should show all inputs connected, all agents configured
  ```

---

### Phase 5 — First Runs (Manual)

**Estimated time: 1–2 hours**

Run everything manually first to verify behavior before enabling automation.

- [ ] **Test Overnight Triage manually:**
  ```bash
  helm run overnight-triage
  ```
  Then check:
  - `/outputs/[yourname]/[today]/overnight_report.md` — does the triage report look right?
  - Todoist — were tasks created correctly?
  - `/logs/[yourname]/[today].log` — any errors?
  - GitHub — did the auto-commit land?

- [ ] **Test AM Sweep:**
  ```bash
  helm run am-sweep
  ```
  Review the classified task list carefully. Check:
  - Are Dispatch items things you'd genuinely be comfortable delegating?
  - Are Yours items correctly identified?
  - Does the list feel right for your context?
  Approve a small batch and review the outputs.

- [ ] **Test Time Block:**
  ```bash
  helm run time-block
  ```
  Review the proposed schedule. Check:
  - Are protected blocks being respected?
  - Are locations being used for routing?
  - Does the day structure feel right?
  Do NOT approve and push to calendar yet — just review.

- [ ] **Tune anything that looks wrong:**
  ```bash
  helm tune task_classifier   # if classifications are off
  helm tune time_blocker      # if schedule structure is wrong
  helm tune email_drafter     # if draft tone is off
  ```
  Commit all instruction file changes.

---

### Phase 6 — Enable Railway Automation

**Estimated time: 30 minutes**
**Detailed guide:** [Railway Setup](./getting_started/RAILWAY_SETUP.md)

- [ ] Complete Railway setup (Steps 1–6 in [Railway Setup guide](./getting_started/RAILWAY_SETUP.md))
- [ ] Trigger a manual Railway run and verify it succeeds
- [ ] Check GitHub for the auto-commit from Railway
- [ ] Enable the cron schedules for Overnight Triage and Transit Prep
- [ ] Wait for the first automated overnight run and verify the output

---

### Phase 7 — Ongoing

- [ ] Run `helm logs --week` weekly to review system performance
- [ ] Use `helm tune <agent>` when something is misclassified or a draft is off
- [ ] Commit all instruction file changes with descriptive messages
- [ ] Update key documents as your clients, schedule, or working style changes

---

*CHIEF SETUP.md — Version 0.1.0 — First commit. This document evolves as the system does.*