/**
 * @file Git operations for HELM.
 *
 * All git interactions are routed through this module. Every function
 * operates on the personal instance repo at the path provided by the
 * caller (obtained from repoPath() in core/repo.ts).
 *
 * Git discipline enforced by this module:
 *   - pullLatest() must be called before any flow run.
 *   - commitAndPush() must be called after any successful flow run.
 *   - Merge conflicts abort all operations with explicit manual steps.
 *   - git add is always called with an explicit file list — never -A.
 *
 * Push failures after a completed run are non-fatal: they surface as a
 * warning with the manual push command so the user can recover without
 * re-running the flow.
 */

import { simpleGit, type SimpleGit, type StatusResult } from "simple-git";
import chalk from "chalk";
import type { RepoStatus } from "../types/index.js";
import { HelmError } from "../utils/errors.js";

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Returns a configured SimpleGit instance scoped to the given repo root.
 * Throws HelmError if the directory does not exist or is not a git repo.
 *
 * @param repoRoot - Absolute path to the git repository root.
 */
function getGit(repoRoot: string): SimpleGit {
  return simpleGit(repoRoot);
}

/**
 * Returns true if the status result indicates a merge conflict is in
 * progress (files in BOTH_MODIFIED, BOTH_ADDED, etc. states).
 */
function hasConflicts(status: StatusResult): boolean {
  return status.conflicted.length > 0;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Pulls the latest changes from the remote origin for the current branch.
 *
 * Fails fast if:
 *   - The pull results in a merge conflict.
 *   - The git command itself fails (no remote, auth error, etc.).
 *
 * This must be called before any flow run begins to ensure the agent
 * instructions and config are up to date.
 *
 * @param repoRoot - Absolute path to the instance repo.
 * @throws {HelmError} On merge conflict or pull failure.
 */
export async function pullLatest(repoRoot: string): Promise<void> {
  const git = getGit(repoRoot);

  try {
    await git.pull();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `git pull failed: ${detail}`,
      [
        "Resolve manually:",
        "  1. cd " + repoRoot,
        "  2. git status",
        "  3. Resolve any conflicts, then: git add . && git commit",
        "  4. Re-run your helm command.",
      ].join("\n  ")
    );
  }

  const status = await getGit(repoRoot).status();

  if (hasConflicts(status)) {
    throw new HelmError(
      "git pull introduced merge conflicts — cannot continue.",
      [
        "Resolve manually:",
        "  1. cd " + repoRoot,
        "  2. git status  (lists conflicted files)",
        "  3. Edit each conflicted file, then: git add <file>",
        "  4. git commit",
        "  5. Re-run your helm command.",
      ].join("\n  ")
    );
  }
}

/**
 * Returns the current working tree status of the repo.
 *
 * @param repoRoot - Absolute path to the instance repo.
 * @throws {HelmError} If git status cannot be read.
 */
export async function getRepoStatus(repoRoot: string): Promise<RepoStatus> {
  const git = getGit(repoRoot);

  try {
    const status = await git.status();
    const fileCount =
      status.modified.length +
      status.not_added.length +
      status.created.length +
      status.deleted.length +
      status.renamed.length;

    return { clean: status.isClean(), fileCount };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `Could not read git status: ${detail}`,
      `Ensure ${repoRoot} is a valid git repository.`
    );
  }
}

/**
 * Stages an explicit list of files, commits with the given message,
 * and pushes to origin.
 *
 * If the push fails the commit is preserved locally and the function
 * prints a recoverable warning rather than throwing. This matches the
 * PRD behaviour: a completed run's outputs are never discarded due to
 * a push failure.
 *
 * @param repoRoot    - Absolute path to the instance repo.
 * @param files       - Explicit list of repo-relative paths to stage.
 * @param message     - Commit message (caller applies [tag] prefix convention).
 * @returns True if the push succeeded; false if it failed (warning printed).
 * @throws {HelmError} If the commit itself fails.
 */
export async function commitAndPush(
  repoRoot: string,
  files: string[],
  message: string
): Promise<boolean> {
  const git = getGit(repoRoot);

  try {
    await git.add(files);
    await git.commit(message);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `git commit failed: ${detail}`,
      `Check git status in ${repoRoot} and resolve any issues, then push manually.`
    );
  }

  try {
    await git.push();
    return true;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.warn(
      chalk.yellow(
        `\n  ⚠  git push failed: ${detail}\n  → Push manually: cd ${repoRoot} && git push`
      )
    );
    return false;
  }
}

/**
 * Stages all tracked modified files and pushes with a given commit message.
 * Unlike commitAndPush(), this uses `git add -u` (tracked files only) rather
 * than an explicit file list. Intended for helm push where the user is
 * explicitly choosing to push whatever is dirty.
 *
 * @param repoRoot - Absolute path to the instance repo.
 * @param message  - Commit message.
 * @returns True if push succeeded.
 * @throws {HelmError} If there is nothing to commit or commit fails.
 */
export async function addAllAndPush(
  repoRoot: string,
  message: string
): Promise<boolean> {
  const git = getGit(repoRoot);

  const status = await git.status();
  const isDirty =
    status.modified.length > 0 ||
    status.not_added.length > 0 ||
    status.created.length > 0 ||
    status.deleted.length > 0;

  if (!isDirty) {
    throw new HelmError(
      "Nothing to commit — the repo is already clean.",
      "Make changes first, or run: helm sync to pull the latest."
    );
  }

  try {
    await git.add("-A");
    await git.commit(message);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `git commit failed: ${detail}`,
      `Check git status in ${repoRoot} and resolve any issues.`
    );
  }

  try {
    await git.push();
    return true;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.warn(
      chalk.yellow(
        `\n  ⚠  git push failed: ${detail}\n  → Push manually: cd ${repoRoot} && git push`
      )
    );
    return false;
  }
}

/**
 * Returns true if the `git` executable is available in PATH.
 * Used by the startup check in index.ts.
 */
export async function isGitAvailable(): Promise<boolean> {
  try {
    await simpleGit().raw(["--version"]);
    return true;
  } catch {
    return false;
  }
}
