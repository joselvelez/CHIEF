/**
 * @file Shared TypeScript types and interfaces for HELM.
 *
 * This is the single source of truth for all data shapes used across
 * the CLI. Types map directly to the YAML schemas in the user's
 * personal instance repo under /config/ and to local machine state
 * at ~/.chief/config.json.
 */

// ─── Instance Repo Config Schemas ────────────────────────────────────────────

/**
 * A single external data source integration (Gmail, Todoist, etc.).
 * Persisted in config/inputs.yaml in the instance repo.
 */
export interface Input {
  /** Unique machine identifier, e.g. "gmail". */
  id: string;
  /** Human-readable display label. */
  label: string;
  /** Whether this input participates in flow runs. */
  enabled: boolean;
  /**
   * Whether credentials have been stored and the last connectivity
   * test passed. Set to true by HELM after a successful test.
   */
  configured: boolean;
  /** OAuth scopes or permission strings required by this input. */
  scope?: string[];
  /** Short text shown during helm setup to guide credential collection. */
  setup_guide: string;
  /**
   * Primary secret key name for this input (used as a human-readable
   * reference only). All required key names are defined in
   * INPUT_CREDENTIAL_KEYS in core/inputs.ts.
   */
  credentials_ref: string;
}

/**
 * An AI agent definition.
 * Persisted in config/agents.yaml in the instance repo.
 */
export interface Agent {
  /** Unique machine identifier, e.g. "email_drafter". */
  id: string;
  /** Human-readable display label. */
  label: string;
  /** Whether this agent is active and will be invoked during flow runs. */
  enabled: boolean;
  /** Repo-relative path to the agent's instruction markdown file. */
  instruction_file: string;
  /** IDs of Input entries this agent depends on. */
  inputs: string[];
  /** Semantic keys describing what this agent produces. */
  outputs: string[];
  /** Context document keys to include in this agent's context package. */
  context_keys: string[];
  /**
   * Non-overridable behavioural constraints for this agent.
   * Values may be boolean flags or numeric limits.
   */
  hard_limits?: Record<string, boolean | number>;
}

/**
 * A named process flow that orchestrates one or more agents.
 * Persisted in config/flows.yaml in the instance repo.
 */
export interface Flow {
  /** Unique machine identifier, e.g. "am-sweep". */
  id: string;
  /** Human-readable display label. */
  label: string;
  /** Whether this flow can be triggered. */
  enabled: boolean;
  /** Repo-relative path to the flow's instruction markdown file. */
  instruction_file: string;
  /** Ordered list of Agent IDs to run in this flow. */
  agents: string[];
  /** Input IDs that must be configured before this flow can run. */
  inputs_required: string[];
  /** Whether to pause for human review before dispatching agents. */
  human_gate_before_agents: boolean;
  /** Whether agents run concurrently rather than sequentially. */
  parallel?: boolean;
  /**
   * Key used to prevent duplicate runs within a single calendar day.
   * When set, HELM checks processed_ids.json before executing.
   */
  idempotency_key?: string;
}

/**
 * A scheduled or manual invocation entry point for a flow.
 * Persisted in config/triggers.yaml in the instance repo.
 */
export interface Trigger {
  /** Unique machine identifier. */
  id: string;
  /** Human-readable display label. */
  label: string;
  /** Whether this trigger is active. */
  enabled: boolean;
  /** How this trigger fires. */
  type: "scheduled" | "manual";
  /** Cron expression (required when type is "scheduled"). */
  schedule?: string;
  /** Where the scheduled job runs. Railway schedules are managed externally. */
  platform?: "railway" | "local";
  /** CLI command or URL used to invoke this trigger externally. */
  invocation?: string;
  /** ID of the Flow this trigger activates. */
  flow: string;
  /** Whether a human approval gate is required before agents run. */
  human_gate: boolean;
}

/**
 * Top-level system settings.
 * Persisted in config/system.yaml in the instance repo.
 */
export interface SystemConfig {
  /** Schema version for this config file. */
  version: string;
  /** Username of the active user on this instance. */
  active_user: string;
}

/**
 * Orchestration engine configuration.
 * Persisted in config/engine.yaml in the instance repo.
 */
export interface EngineConfig {
  /**
   * Engine implementation identifier.
   * Only "claude-code" is supported in Phase 1.
   */
  engine: "claude-code" | "anthropic-api";
  /** Shell command used to invoke the engine (e.g. "claude"). */
  command: string;
  /** Hard timeout in seconds before an agent run is killed. */
  timeout_seconds: number;
  /**
   * Model identifier passed to the engine.
   * Required when engine is "anthropic-api".
   */
  model?: string;
}

// ─── Local Machine Config ─────────────────────────────────────────────────────

/**
 * Machine-local configuration stored at ~/.chief/config.json.
 * Never committed to git. Managed by the conf package.
 */
export interface LocalConfig {
  /** Absolute path to the user's personal CHIEF instance repo. */
  instance_repo_path: string;
  /** Username active on this machine (matches /users/[username]/ in the repo). */
  active_user: string;
  /** Shell command used to open files in the user's preferred editor. */
  editor: string;
  /** True only after helm setup completes including a successful git push. */
  setup_complete: boolean;
  /** ISO 8601 timestamp of the last successful helm sync. */
  last_sync: string;
  /**
   * List of secret key names stored on this machine.
   * Format: "[username]/[KEY_NAME]". Values are never stored here — only names.
   */
  secrets_manifest: string[];
  /**
   * AES-256-GCM encrypted secret values keyed by "[username]/[KEY_NAME]".
   * Each value is a colon-delimited string: "iv:authTag:ciphertext" (all hex-encoded).
   * Decrypted at runtime using a PBKDF2-derived key from machine-specific entropy.
   */
  encrypted_secrets: Record<string, string>;
}

// ─── State Files ──────────────────────────────────────────────────────────────

/**
 * A single flow's last execution record.
 */
export interface LastRunRecord {
  /** ISO 8601 timestamp of the last execution. */
  timestamp: string;
  /** Terminal status of the last run. */
  status: "success" | "failed";
}

/**
 * Contents of state/[username]/last_run.json.
 * Keys are flow IDs.
 */
export type LastRunState = Record<string, LastRunRecord>;

// ─── Internal Command Types ───────────────────────────────────────────────────

/**
 * Result of an input connectivity test.
 */
export interface InputTestResult {
  /** Input ID that was tested. */
  inputId: string;
  /** Whether the test call succeeded. */
  ok: boolean;
  /**
   * Human-readable detail returned by the test (e.g. email address, count).
   * Only populated on success.
   */
  detail?: string;
  /**
   * Error description on failure.
   * Never contains secret values.
   */
  error?: string;
  /**
   * Specific remediation instruction shown to the user on failure.
   */
  fix?: string;
}

/**
 * Git repository status summary used by helm status and helm sync.
 */
export interface RepoStatus {
  /** Whether the working tree has no uncommitted changes. */
  clean: boolean;
  /** Number of modified, added, or deleted files when not clean. */
  fileCount: number;
}
