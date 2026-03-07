/**
 * @file State file I/O for the instance repo.
 *
 * Manages the JSON state files under state/[username]/ in the personal
 * instance repo. These files track run history, deferred tasks, and
 * idempotency identifiers across flow executions.
 *
 * State files are written by HELM after flow runs and read by helm status
 * and helm logs. They are committed to git as part of the post-run commit.
 */

import fs from "fs";
import path from "path";
import type { LastRunState } from "../types/index.js";
import { HelmError } from "../utils/errors.js";

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Returns the absolute path to the state directory for the given user.
 *
 * @param repoRoot - Absolute path to the instance repo root.
 * @param username - Active username.
 */
function stateDir(repoRoot: string, username: string): string {
  return path.join(repoRoot, "state", username);
}

/**
 * Reads and parses a JSON state file. Returns null if the file does not
 * exist (treated as initial state rather than an error). Throws HelmError
 * if the file exists but cannot be parsed.
 *
 * @param filePath - Absolute path to the JSON file.
 * @param label    - Human-readable name for error messages.
 */
function readStateFile(filePath: string, label: string): unknown | null {
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");

  try {
    return JSON.parse(raw);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `State file ${label} is corrupted: ${detail}`,
      `Delete or reset ${filePath} to clear the corrupt state.`
    );
  }
}

/**
 * Writes a value to a JSON state file, creating the parent directory
 * if needed. Throws HelmError on write failure.
 *
 * @param filePath - Absolute path to write.
 * @param data     - Value to serialise.
 * @param label    - Human-readable name for error messages.
 */
function writeStateFile(filePath: string, data: unknown, label: string): void {
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `Failed to write state file ${label}: ${detail}`,
      `Check file permissions for ${filePath}.`
    );
  }
}

// ─── Last Run State ───────────────────────────────────────────────────────────

/**
 * Reads state/[username]/last_run.json and returns the parsed object.
 * Returns an empty object when the file does not yet exist (first run).
 *
 * @param repoRoot - Absolute path to the instance repo root.
 * @param username - Active username.
 */
export function readLastRunState(
  repoRoot: string,
  username: string
): LastRunState {
  const filePath = path.join(stateDir(repoRoot, username), "last_run.json");
  const parsed = readStateFile(filePath, "last_run.json");
  return (parsed as LastRunState) ?? {};
}

/**
 * Writes a complete LastRunState to state/[username]/last_run.json.
 *
 * @param repoRoot - Absolute path to the instance repo root.
 * @param username - Active username.
 * @param state    - Full state object to persist.
 */
export function writeLastRunState(
  repoRoot: string,
  username: string,
  state: LastRunState
): void {
  const filePath = path.join(stateDir(repoRoot, username), "last_run.json");
  writeStateFile(filePath, state, "last_run.json");
}

/**
 * Records the result of a single flow run into last_run.json.
 * Reads the current state first and merges the new record.
 *
 * @param repoRoot - Absolute path to the instance repo root.
 * @param username - Active username.
 * @param flowId   - Flow identifier to update.
 * @param status   - Terminal status of the completed run.
 */
export function recordFlowRun(
  repoRoot: string,
  username: string,
  flowId: string,
  status: "success" | "failed"
): void {
  const current = readLastRunState(repoRoot, username);
  writeLastRunState(repoRoot, username, {
    ...current,
    [flowId]: { timestamp: new Date().toISOString(), status },
  });
}

// ─── User State Directory Bootstrap ──────────────────────────────────────────

/**
 * Ensures the state/[username]/ directory exists in the repo,
 * creating it if absent. Called during helm setup.
 *
 * @param repoRoot - Absolute path to the instance repo root.
 * @param username - Active username.
 */
export function ensureStateDir(repoRoot: string, username: string): void {
  const dir = stateDir(repoRoot, username);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
