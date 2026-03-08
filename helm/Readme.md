# HELM

**Human-AI Executive Layer Manager** — the command-line interface for [CHIEF](../SETUP.md).

HELM is how a human operates the CHIEF personal AI operations system. Every flow trigger, configuration change, credential, and git operation goes through it. There is no web UI. There is no backend service. The terminal is the product.

---

## Requirements

| Dependency | Minimum | Check |
|---|---|---|
| Node.js | v20.0.0 | `node --version` |
| npm | v9.0.0 | `npm --version` |
| Git | v2.30.0 | `git --version` |

**Platform:** macOS 12+ or Windows 10+. OS keychain support (macOS Keychain / Windows Credential Manager) is required for credential storage.

**Node.js installation:** [nodejs.org](https://nodejs.org) → download the LTS version. This installs both `node` and `npm`.

**Git installation:**
- macOS: pre-installed, or `brew install git`
- Windows: [git-scm.com](https://git-scm.com)

---

## Installation

```bash
npm install -g chief-helm
helm --version
```

---

## First-Time Setup

Before running `helm setup`, your personal CHIEF instance repo must be fully initialised — meaning `/config/inputs.yaml`, `agents.yaml`, `flows.yaml`, and `triggers.yaml` must all exist. See [SETUP.md](../SETUP.md) for full instructions.

```bash
helm setup
```

The wizard walks through six steps:

1. Locate your instance repo and validate its structure
2. Create your user identity (`/users/[username]/`)
3. Connect inputs — collect and test credentials for each
4. Review and toggle agents and flows
5. Open key profile documents in your editor
6. Commit and push all setup changes to git

Setup is only marked complete after a successful git push. If interrupted, re-running `helm setup` is safe.

---

## Commands

### System

```bash
helm status                   # Health overview: repo, inputs, last runs, engine
helm setup                    # First-time guided setup wizard
helm sync                     # git pull + show repo status
helm push                     # git add → commit → push
helm push -m "message"        # Custom commit message
helm config                   # List all config files with index numbers
helm config <n>               # Open config file n in your editor (auto-commits on close)
```

### Secrets

Credentials are stored in the OS keychain. Values are never printed, logged, or included in error messages.

```bash
helm secrets set <KEY>        # Masked input → OS keychain
helm secrets list             # Key names only — values never shown
helm secrets verify <KEY>     # Confirm a key exists
helm secrets delete <KEY>     # Remove with confirmation prompt
```

### Inputs

```bash
helm inputs list              # Show all inputs with connection status
helm inputs toggle <id>       # Enable/disable; auto-commits to git
helm inputs test <id>         # Live connectivity check
helm inputs test --all        # Test all enabled inputs
```

### Config File Index

`helm config <n>` opens the file at that index:

| n | File |
|---|---|
| 1 | inputs.yaml |
| 2 | agents.yaml |
| 3 | flows.yaml |
| 4 | triggers.yaml |
| 5 | engine.yaml |
| 6 | system.yaml |

---

## Secret Key Names

The following keys are expected by the standard input set:

| Input | Keys |
|---|---|
| Gmail | `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_OAUTH_REFRESH_TOKEN` |
| Google Calendar | `GCAL_CLIENT_ID`, `GCAL_CLIENT_SECRET`, `GCAL_OAUTH_REFRESH_TOKEN` |
| Google Maps | `GOOGLE_MAPS_API_KEY` |
| Todoist | `TODOIST_API_TOKEN` |
| Zoom | `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` |

---

## Local Config

HELM stores one file on the local machine outside any repo: `~/.chief/config.json`. It holds the instance repo path, active username, editor preference, setup status, last sync time, and the secret key name manifest. This file is never committed to git.

---

## Log Level

Set `HELM_LOG` to control output verbosity:

| Value | Output |
|---|---|
| `debug` | All output including internal messages |
| `info` | Default — info, warnings, errors |
| `error` | Errors only |
| `silent` | No output |

---

## Two-Repo Model

HELM source code lives in the **main CHIEF repo** at `/helm/`. It is published to npm from there.

HELM operates against the user's **personal instance repo** — a private fork where their config, profiles, outputs, logs, and state live. The path to this repo is set during `helm setup`.

The main CHIEF repo is never written to by HELM at runtime.

---

## Developer Reference

### Project Structure

```
/helm/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts               Entry point, startup checks, command wiring
    ├── types/
    │   └── index.ts           All shared TypeScript interfaces
    ├── utils/
    │   ├── errors.ts          HelmError class and formatters
    │   ├── format.ts          Box-drawing, date, string utilities
    │   └── logger.ts          Level-gated stderr logger
    ├── ui/
    │   ├── theme.ts           Colour palette and status symbols
    │   └── components/        Ink React components (Phase 2 interactive views)
    │       ├── Header.tsx
    │       ├── Panel.tsx
    │       └── StatusRow.tsx
    ├── core/
    │   ├── repo.ts            conf store, local config, repo validation, setup guard
    │   ├── config.ts          YAML read/write for all instance repo config files
    │   ├── secrets.ts         keytar wrapper, manifest management
    │   ├── git.ts             pull, commit, push, status via simple-git
    │   ├── state.ts           last_run.json and other state file I/O
    │   └── inputs.ts          Credential key map and per-input connectivity tests
    └── commands/
        ├── setup.ts           helm setup — 6-step wizard
        ├── status.ts          helm status — health overview panel
        ├── secrets.ts         helm secrets set/list/verify/delete
        ├── sync.ts            helm sync
        ├── push.ts            helm push
        ├── inputs.ts          helm inputs list/toggle/test
        └── config.ts          helm config [n]
```

### Error Handling Pattern

All intentional failures throw `HelmError(what, fix)`. Both fields are required. The top-level handler in `index.ts` formats them as:

```
✗ Error: [what]
  → [fix]
```

Never swallow errors. Never put secret values in error messages.

### Adding a Command

1. Create `src/commands/[name].ts`
2. Export `register[Name]Command(program: Command): void`
3. Import and call it in `src/index.ts`
4. Call `requireSetup()` at the top of the action handler (unless the command is `setup` itself)

### Publishing
### Publishing

Releases are automated via GitHub Actions. The workflow at `/.github/workflows/helm-release.yml` triggers on tags matching `helm-v*`.

**Using the release script:**

```bash
cd helm/
./scripts/release.sh 0.2.0    # bumps version, builds, commits, tags
git push origin main && git push origin helm-v0.2.0   # triggers CI → npm publish + GitHub Release
```

**Manual process:**

```bash
cd helm/
npm version 0.2.0 --no-git-tag-version
npm run build
cd ..
git add helm/package.json helm/package-lock.json
git commit -m "[helm-release] v0.2.0"
git tag helm-v0.2.0
git push origin main && git push origin helm-v0.2.0
```

`prepublishOnly` compiles TypeScript to `dist/` before every publish. Only `dist/` and `README.md` are included in the published package.
---

*HELM is part of the CHIEF personal AI operations system. See [SETUP.md](../SETUP.md) for full system documentation.*