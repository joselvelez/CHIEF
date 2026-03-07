/**
 * @file helm config — open instance repo config files in the user's editor.
 *
 * Subcommands:
 *   helm config         List all config files with their index numbers
 *   helm config <n>     Open config file number n in the configured editor
 *
 * After the editor closes, the modified file is auto-committed and pushed
 * so that config changes are immediately reflected in git history.
 *
 * Config file order (by edit frequency):
 *   1  inputs.yaml     — most frequently edited
 *   2  agents.yaml
 *   3  flows.yaml
 *   4  triggers.yaml
 *   5  engine.yaml
 *   6  system.yaml     — least frequently edited
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import { execa } from "execa";
import type { Command } from "commander";
import { requireSetup, getLocalConfig } from "../core/repo.js";
import { commitAndPush } from "../core/git.js";
import { HelmError } from "../utils/errors.js";
import { theme, symbol } from "../ui/theme.js";

// ─── Config File Registry ─────────────────────────────────────────────────────

/**
 * Ordered registry of config files manageable via helm config.
 * Index n corresponds to helm config n (1-based).
 */
const CONFIG_FILES: ReadonlyArray<{
  readonly label: string;
  readonly relativePath: string;
}> = [
  { label: "inputs.yaml",   relativePath: path.join("config", "inputs.yaml") },
  { label: "agents.yaml",   relativePath: path.join("config", "agents.yaml") },
  { label: "flows.yaml",    relativePath: path.join("config", "flows.yaml") },
  { label: "triggers.yaml", relativePath: path.join("config", "triggers.yaml") },
  { label: "engine.yaml",   relativePath: path.join("config", "engine.yaml") },
  { label: "system.yaml",   relativePath: path.join("config", "system.yaml") },
];

// ─── Command Registration ─────────────────────────────────────────────────────

/**
 * Registers the `helm config` command on the given Commander program.
 *
 * @param program - The root Commander Command instance.
 */
export function registerConfigCommand(program: Command): void {
  program
    .command("config [n]")
    .description(
      "List config files or open one by number in your editor (helm config 1)"
    )
    .action(async (n: string | undefined) => {
      requireSetup();

      const {
        instance_repo_path: repoRoot,
        active_user: username,
        editor,
      } = getLocalConfig();

      // No argument — list all config files.
      if (n === undefined) {
        console.log(
          `\n  ${chalk.hex(theme.text).bold("Config files")}  ${chalk.hex(theme.muted)("(helm config <n> to open)")}\n`
        );

        for (let i = 0; i < CONFIG_FILES.length; i++) {
          const entry = CONFIG_FILES[i];
          if (!entry) continue;

          const fullPath = path.join(repoRoot, entry.relativePath);
          const exists = fs.existsSync(fullPath);

          const indexStr = chalk.hex(theme.accent)(`${i + 1}`);
          const labelStr = chalk.hex(theme.text)(entry.label.padEnd(20));
          const pathStr = chalk.hex(theme.muted)(
            exists ? fullPath : `${fullPath} (not found)`
          );

          console.log(`  ${indexStr}  ${labelStr}${pathStr}`);
        }

        console.log();
        return;
      }

      // Argument provided — open the file at that index.
      const index = parseInt(n, 10);

      if (isNaN(index) || index < 1 || index > CONFIG_FILES.length) {
        throw new HelmError(
          `Invalid config file number: "${n}".`,
          `Use a number between 1 and ${CONFIG_FILES.length}. Run: helm config to see the list.`
        );
      }

      const entry = CONFIG_FILES[index - 1];
      if (!entry) {
        throw new HelmError(
          `Config file entry at index ${index} is not defined.`,
          "Run: helm config to see the valid list."
        );
      }

      const fullPath = path.join(repoRoot, entry.relativePath);

      if (!fs.existsSync(fullPath)) {
        throw new HelmError(
          `Config file not found: ${entry.label}`,
          `Ensure your instance repo is fully initialised. Expected: ${fullPath}`
        );
      }

      console.log(
        chalk.hex(theme.muted)(`\n  Opening ${entry.label} in ${editor}…`)
      );

      const editorParts = editor.split(" ");
      const editorCmd = editorParts[0];
      const editorArgs = editorParts.slice(1);

      if (!editorCmd) {
        throw new HelmError(
          "No editor command configured.",
          "Run: helm setup to reconfigure, or set the EDITOR environment variable."
        );
      }

      try {
        await execa(editorCmd, [...editorArgs, fullPath], {
          stdio: "inherit",
        });
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        throw new HelmError(
          `Editor "${editor}" exited with an error: ${detail}`,
          `Try setting a different editor: edit ~/.chief/config.json and update the "editor" field.`
        );
      }

      // Auto-commit the changed file after editor closes.
      const commitMsg = `[manual] config edit: ${entry.label} — ${username}`;

      try {
        await commitAndPush(repoRoot, [entry.relativePath], commitMsg);
        console.log(
          `\n  ${chalk.hex(theme.success)(symbol.success)}  Saved and committed: ${entry.label}\n`
        );
      } catch {
        // The edit succeeded; a commit failure is recoverable.
        console.log(
          chalk.hex(theme.warning)(
            `\n  ${symbol.warning}  Changes saved but not committed.\n  Run: helm push to commit them.\n`
          )
        );
      }
    });
}
