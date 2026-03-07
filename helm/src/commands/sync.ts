/**
 * @file helm sync — pull latest changes from the instance repo remote.
 *
 * Performs `git pull` on the personal instance repo, updates the
 * last_sync timestamp in local config, and displays the current
 * repo status (clean or dirty with file count).
 *
 * This command is the mandatory first step before any flow run.
 * Running it manually confirms the local copy is up to date with
 * any changes made in other environments or by Railway automation.
 */

import chalk from "chalk";
import type { Command } from "commander";
import { requireSetup, getLocalConfig, updateLocalConfig } from "../core/repo.js";
import { pullLatest, getRepoStatus } from "../core/git.js";
import { theme, symbol } from "../ui/theme.js";
import { formatHeaderDate } from "../utils/format.js";

// ─── Command Registration ─────────────────────────────────────────────────────

/**
 * Registers the `helm sync` command on the given Commander program.
 *
 * @param program - The root Commander Command instance.
 */
export function registerSyncCommand(program: Command): void {
  program
    .command("sync")
    .description("Pull latest from origin and show repo status")
    .action(async () => {
      requireSetup();

      const { instance_repo_path: repoRoot, active_user: username } =
        getLocalConfig();

      process.stdout.write(
        chalk.hex(theme.muted)("  Pulling from origin… ")
      );

      await pullLatest(repoRoot);

      const now = new Date();
      updateLocalConfig({ last_sync: now.toISOString() });

      const status = await getRepoStatus(repoRoot);

      process.stdout.write("\n");

      const statusStr = status.clean
        ? chalk.hex(theme.success)(`${symbol.success} clean`)
        : chalk.hex(theme.warning)(
            `${symbol.warning} dirty — ${status.fileCount} file${status.fileCount !== 1 ? "s" : ""} modified`
          );

      console.log(
        `  ${chalk.hex(theme.success)(symbol.success)}  Synced  ${chalk.hex(theme.muted)(formatHeaderDate(now))}`
      );
      console.log(
        `  ${chalk.hex(theme.muted)(symbol.bullet)}  Repo status: ${statusStr}`
      );

      if (!status.clean) {
        console.log(
          chalk.hex(theme.muted)(
            `\n  Uncommitted changes are present.\n  Run: helm push  to commit and push them.`
          )
        );
      }

      console.log();
    });
}
