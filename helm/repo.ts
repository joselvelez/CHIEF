/**
 * @file Local machine config and instance repo management.
 *
 * Owns the single conf store instance that backs ~/.chief/config.json,
 * provides typed accessors for LocalConfig, and validates that the
 * personal instance repo contains the expected CHIEF directory structure
 * before any command reads from or writes to it.
 *
 * Every command that operates against the instance repo calls
 * requireSetup() first so that missing or incomplete configuration
 * produces a clear, actionable error rather than a crash.
 */

import os from "os";
import path from "path";
import fs from "fs";
import Conf from "conf";
import type { LocalConfig } from "../types/index.js";
import { HelmError } from "../utils/errors.js";

// ─── Directory / File Constants ───────────────────────────────────────────────

/**
 * Top-level directories that must exist in a valid CHIEF instance repo.
 * Validated during helm setup Step 1 and requireSetup().
 */
const REQUIRED_REPO_DIRS = [
  "config",
  "users",
  "instructions",
  "templates",
  "context",
  "outputs",
  "state",
  "logs",
  "knowledge",
] as const;

/**
 * Config files that must exist under /config/ in the instance repo.
 * If these are absent the repo is not a properly initialised CHIEF instance.
 */
const REQUIRED_CONFIG_FILES = [
  "inputs.yaml",
  "agents.yaml",
  "flows.yaml",
  "triggers.yaml",
] as const;

// ─── Conf Store ───────────────────────────────────────────────────────────────

/**
 * Default values written to ~/.chief/config.json on first access.
 * All fields must be present so TypeScript can infer the full LocalConfig
 * shape without optional markers on the conf store generic.
 */
const LOCAL_CONFIG_DEFAULTS: LocalConfig = {
  instance_repo_path: "",
  active_user: "",
  editor: process.env["EDITOR"] ?? "code",
  setup_complete: false,
  last_sync: "",
  secrets_manifest: [],
};

/**
 * Singleton conf store backed by ~/.chief/config.json.
 *
 * The cwd override places the file at ~/.chief/ rather than the
 * platform default config directory, matching the path specified
 * in the HELM PRD.
 *
 * Access this store through the typed helpers below rather than
 * calling store.get/set directly in command files.
 */
export const localStore = new Conf<LocalConfig>({
  projectName: "chief",
  cwd: path.join(os.homedir(), ".chief"),
  defaults: LOCAL_CONFIG_DEFAULTS,
});

// ─── Typed Accessors ──────────────────────────────────────────────────────────

/**
 * Returns the full local config object.
 * The conf store guarantees all fields are present due to the defaults
 * provided at initialisation.
 */
export function getLocalConfig(): LocalConfig {
  return localStore.store as LocalConfig;
}

/**
 * Applies a partial update to the local config.
 * Only the provided keys are modified; all others are left unchanged.
 */
export function updateLocalConfig(updates: Partial<LocalConfig>): void {
  for (const [key, value] of Object.entries(updates) as [keyof LocalConfig, LocalConfig[keyof LocalConfig]][]) {
    localStore.set(key, value);
  }
}

// ─── Setup Guard ──────────────────────────────────────────────────────────────

/**
 * Asserts that helm setup has been completed successfully.
 *
 * Must be called at the top of every command action except `setup`
 * itself and the root `--version` flag. Throws HelmError if setup
 * is incomplete, directing the user to run helm setup.
 *
 * @throws {HelmError} When setup_complete is false or the repo path is empty.
 */
export function requireSetup(): void {
  const config = getLocalConfig();

  if (!config.setup_complete || config.instance_repo_path === "") {
    throw new HelmError(
      "HELM has not been set up on this machine.",
      "Run: helm setup"
    );
  }
}

// ─── Repo Validation ──────────────────────────────────────────────────────────

/**
 * Validates that the directory at repoPath is a properly initialised
 * CHIEF instance repo by checking for required subdirectories and
 * config files. Does not validate YAML content — only structure.
 *
 * @param repoPath - Absolute path to the candidate repo directory.
 * @returns True if all required structure is present.
 */
export function isValidRepoStructure(repoPath: string): boolean {
  if (!fs.existsSync(repoPath)) return false;

  for (const dir of REQUIRED_REPO_DIRS) {
    if (!fs.existsSync(path.join(repoPath, dir))) return false;
  }

  for (const file of REQUIRED_CONFIG_FILES) {
    if (!fs.existsSync(path.join(repoPath, "config", file))) return false;
  }

  return true;
}

/**
 * Returns the absolute path to a file or directory inside the instance
 * repo, joining the stored repo root with the given relative segments.
 *
 * Requires setup to be complete. Use requireSetup() before calling this
 * in command handlers.
 *
 * @param segments - Path segments relative to the repo root.
 */
export function repoPath(...segments: string[]): string {
  const root = localStore.get("instance_repo_path") as string;
  return path.join(root, ...segments);
}

/**
 * Expands a ~ prefix in a path string to the current user's home directory.
 * Used when accepting repo paths from inquirer prompts.
 */
export function expandHomePath(inputPath: string): string {
  if (inputPath.startsWith("~/")) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  return inputPath;
}
