# CHIEF
### Personal AI Operations System

CHIEF is a modular, git-backed personal AI operations system that automates the daily operational overhead of your life and work — email triage, task classification, calendar management, research, and time-blocking — using a network of specialized AI agents that run on your schedule and only act with your approval.

---

## What It Does

Every morning before you wake up, CHIEF runs two automated processes on Railway:

- **Overnight Email Triage** — scans your inbox, identifies items requiring action, and creates properly attributed tasks in Todoist with priorities, due dates, and duration estimates
- **Overnight Transit Prep** — scans your calendar for physical location meetings and inserts drive time buffer events using real Google Maps data

When you sit down at your desk, you open your terminal and run two commands:

- **`helm run am-sweep`** — pulls your tasks, calendar, and recent meeting transcripts, classifies every item (Dispatch / Prep / Yours / Skip), fires specialized agents in parallel for approved items, and delivers a completion report
- **`helm run time-block`** — turns your remaining tasks into a time-blocked calendar that respects your locations, energy levels, errand routing, and scheduling rules

You review and approve before anything external happens. The system never sends an email. It never makes decisions you didn't authorize.

---

## The Classification Framework

Everything that passes through CHIEF gets classified into one of four states:

| State | Symbol | Meaning |
|---|---|---|
| **Dispatch** | 🟢 | AI handles fully — output filed for your review |
| **Prep** | 🟡 | AI gets 80% there — you finish |
| **Yours** | 🔴 | Requires your judgment — flagged with assembled context |
| **Skip** | ⚫ | Not actionable today — deferred with reason and suggested date |

---

## How It's Built

**Git is the operating system.** Every instruction file, config file, context package, and output is version-controlled. Every run starts with `git pull` and ends with `git commit + push`. You have a complete audit history of everything the system did and why.

**Markdown files are the interface.** Agents don't run on code you can't read. They run on plain-English instruction files that you write, own, and tune. You don't need to understand syntax to change system behavior — you need to write clearly.

**Everything is modular and toggleable.** Inputs, agents, flows, and triggers are all registered in YAML config files. Each can be enabled or disabled independently. Adding a new integration means running a guided wizard, not editing source code.

**Humans approve before anything happens externally.** All interactive flows have a hard gate where you review the proposed action list before agents fire. Nothing hits Gmail, Google Calendar, or Todoist without your explicit go-ahead.

**This repo contains the HELM source code.** HELM lives at `/helm/` and is published to npm as `chief-helm`. The framework (docs, templates, instruction files) and the CLI tool live together in one place. Your personal data lives separately in your own private instance repo.

---

## Components

| Component | Description |
|---|---|
| **HELM CLI** | The command-line interface. Rich terminal UI for running flows, managing config, and tuning agents. |
| **Agents** | Specialized AI workers: Email Drafter, Task Classifier, Calendar Manager, Research Agent, Notes Agent, Time Blocker |
| **Inputs** | Pluggable data sources: Gmail, Google Calendar, Google Maps, Todoist, Zoom, and more |
| **Flows** | Sequenced processes: Overnight Triage, AM Sweep, Time Block |
| **Key Documents** | Markdown files that encode your preferences: VOICE.md, CLIENTS.md, SCHEDULING.md, CLASSIFY.md |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Orchestration | Claude Code CLI (default) / Anthropic API |
| CLI tool | Node.js + Ink + Inquirer.js |
| Scheduled jobs | Railway (cron) |
| Task manager | Todoist API |
| Calendar & Email | Google Workspace APIs |
| Meeting notes | Zoom AI Companion API |
| Maps / routing | Google Maps Distance Matrix API |
| Knowledge base | Markdown files in Git |
| Secrets | Encrypted local storage (AES-256-GCM via node:crypto) |

---

## Multi-User

CHIEF is designed for individual use but supports multiple independent users in the same repository. Each user has their own namespace under `/users/[username]/` with their own profile, key documents, context packages, outputs, and logs. Users do not share state.

---

## Getting Started

1. Read **[SETUP.md](./SETUP.md)** — the complete architecture reference and setup guide
2. Fork or clone this repository to create your private personal instance
3. Copy `.gitignore_example` → `.gitignore` and commit it before adding anything personal
4. Install HELM: `npm install -g chief-helm` (requires Node.js 20+ and Git)
5. Run `helm setup` to initialize your user profile
6. Work through the [Getting Started Checklist](./SETUP.md#18-getting-started-checklist)

Detailed setup guides for specific steps are in **[/getting_started/](/getting_started/)**:
- [Railway Setup](./getting_started/RAILWAY_SETUP.md)
- [Google APIs Setup](./getting_started/GOOGLE_APIS_SETUP.md)

---

## Repository Structure

This repository ships with the core directory structure already in place. Fork it and you're ready to configure.

```
/chief/
├── SETUP.md                    ← Architecture reference and setup guide (start here)
├── README.md                   ← This file
├── LICENSE                     ← License terms
├── .gitignore_example          ← Copy this to .gitignore before your first commit
│
├── /helm/                      ← HELM CLI source code (published to npm as chief-helm)
│   ├── package.json
│   ├── README.md
│   └── /src/
│
├── /getting_started/           ← Detailed step-by-step setup guides
│   ├── RAILWAY_SETUP.md
│   └── GOOGLE_APIS_SETUP.md
│
├── /config/                    ← System configuration (inputs, agents, flows, triggers)
│
├── /users/                     ← Per-user profiles and key documents
│   └── /_template/             ← Copy this to /users/[yourname]/ and fill it in
│       ├── USER.md
│       ├── VOICE.md
│       ├── CLIENTS.md
│       ├── SCHEDULING.md
│       └── CLASSIFY.md
│
├── /instructions/              ← Agent and flow instruction files (plain English)
│   ├── /agents/
│   └── /flows/
│
├── /templates/                 ← Scaffolds for creating new agents, flows, documents
├── /context/                   ← Generated daily context packages (versioned)
├── /outputs/                   ← Agent outputs pending review
├── /state/                     ← Idempotency and run state files
├── /logs/                      ← Run history and audit trail
└── /knowledge/                 ← Markdown knowledge base (client files, notes)
```

---

## Releases

Releases are managed via GitHub Actions workflows in `/.github/workflows/`.

**CHIEF release** (documentation, templates, framework changes):

```bash
git tag chief-v0.1.0
git push origin main && git push origin chief-v0.1.0
```

Triggers `chief-release.yml` → creates a GitHub Release with auto-generated notes.

**Helm release** (CLI tool, published to npm as `chief-helm`):

```bash
cd helm/
./scripts/release.sh 0.2.0    # bumps version, builds, commits, tags
git push origin main && git push origin helm-v0.2.0
```

Triggers `helm-release.yml` → builds, publishes to npm, creates a GitHub Release.

See [helm/Readme.md](./helm/Readme.md#publishing) for detailed Helm publishing docs.

**Prerequisite:** Add an `NPM_TOKEN` secret in GitHub repo settings for Helm npm publishing.

---

## License

CHIEF is released under a custom Non-Commercial license. You are free to use, adapt, and share this system for personal and non-commercial purposes. Commercial use requires explicit written consent from the author. See [LICENSE](./LICENSE) for full terms.

---

## Contributing

This is a personal project made public to share the approach and help others build their own systems. Issues and discussions are welcome. Pull requests may be considered for improvements that don't compromise the core design principles.

---

*CHIEF — Version 0.1.0*