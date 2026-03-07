/**
 * @file helm push — stage, commit, and push to the instance repo remote.
 *
 * Stages all tracked modified files (`git add -A`), commits with an
 * auto-generated or user-supplied message, and pushes to origin.
 *
 * Auto commit message format: [manual] push — [username]
 * Custom message format:      [manual] [message] — [username]
 *
 * If the push fails the commit is preserved locally and a recoverable
 * warning is shown with the manual push command, matching the PRD
 * behaviour: a completed run's outputs are never lost to a push failure.
 */

import chalk from "chalk";
import type { Command } from "commander";
import { requireSetup, getLocalConfig } from "../core/repo.js";
import { addAllAndPush } from "../core/git.js";
import { theme, symbol } from "../ui/theme.js";

// ─── Command Registration ─────────────────────────────────────────────────────

/**
 * Registers the `helm push` command on the given Commander program.
 *
 * @param program - The root Commander Command instance.
 */
export function registerPushCommand(program: Command): void {
  program
    .command("push")
    .description("Commit all changes and push to origin")
    .option("-m, --message <msg>", "Custom commit message")
    .action(async (options: { message?: string }) => {
      requireSetup();

      const { instance_repo_path: repoRoot, active_user: username } =
        getLocalConfig();

      const messageBody = options.message
        ? options.message.trim()
        : "push";

      const commitMessage = `[manual] ${messageBody} — ${username}`;

      process.stdout.write(
        chalk.hex(theme.muted)("  Committing and pushing… ")
      );

      const pushed = await addAllAndPush(repoRoot, commitMessage);

      process.stdout.write("\n");

      if (pushed) {
        console.log(
          `  ${chalk.hex(theme.success)(symbol.success)}  Committed and pushed.`
        );
        console.log(
          chalk.hex(theme.muted)(`  ${symbol.bullet}  Message: ${commitMessage}`)
        );
      } else {
        // addAllAndPush prints its own warning on push failure.
        // The commit succeeded, so we confirm that.
        console.log(
          `  ${chalk.hex(theme.success)(symbol.success)}  Committed locally.`
        );
      }

      console.log();
    });
}
