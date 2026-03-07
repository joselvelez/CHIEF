/**
 * @file helm inputs — manage external data source integrations.
 *
 * Subcommands:
 *   helm inputs list              Show all inputs with status
 *   helm inputs toggle <id>       Enable/disable an input; auto-commits
 *   helm inputs test <id>         Run a live connectivity check
 *   helm inputs test --all        Test all enabled inputs
 *
 * "configured" state in inputs.yaml reflects whether the last
 * connectivity test passed. It does not guarantee the credential
 * is still valid between tests.
 */

import chalk from "chalk";
import type { Command } from "commander";
import { requireSetup, getLocalConfig, repoPath } from "../core/repo.js";
import { readInputsConfig, writeInputsConfig } from "../core/config.js";
import { testInput } from "../core/inputs.js";
import { commitAndPush } from "../core/git.js";
import type { InputTestResult } from "../types/index.js";
import { theme, symbol } from "../ui/theme.js";
import { padEnd } from "../utils/format.js";
import { HelmError } from "../utils/errors.js";
import path from "path";

// ─── Display Helpers ──────────────────────────────────────────────────────────

/**
 * Prints a single input list row with consistent column alignment.
 *
 * Column layout: [symbol]  [label]  [status]
 */
function printInputRow(
  label: string,
  enabled: boolean,
  configured: boolean
): void {
  const sym = !enabled
    ? chalk.hex(theme.skip)(symbol.disabled)
    : configured
    ? chalk.hex(theme.success)(symbol.success)
    : chalk.hex(theme.warning)(symbol.warning);

  const labelStr = padEnd(label, 22);

  const statusStr = !enabled
    ? chalk.hex(theme.skip)("disabled")
    : configured
    ? chalk.hex(theme.success)("connected")
    : chalk.hex(theme.warning)("not configured");

  console.log(`  ${sym}  ${chalk.hex(theme.text)(labelStr)}${statusStr}`);
}

/**
 * Prints the result of an input connectivity test.
 */
function printTestResult(result: InputTestResult): void {
  if (result.ok) {
    console.log(
      `  ${chalk.hex(theme.success)(symbol.success)}  ${result.inputId}${result.detail ? chalk.hex(theme.muted)(` — ${result.detail}`) : ""}`
    );
  } else {
    console.log(
      `  ${chalk.hex(theme.error)(symbol.error)}  ${result.inputId}: ${result.error ?? "test failed"}`
    );
    if (result.fix) {
      console.log(
        chalk.hex(theme.muted)(`       ${symbol.arrow} ${result.fix}`)
      );
    }
  }
}

// ─── Command Registration ─────────────────────────────────────────────────────

/**
 * Registers the `helm inputs` subcommand group on the given Commander program.
 *
 * @param program - The root Commander Command instance.
 */
export function registerInputsCommand(program: Command): void {
  const inputs = program
    .command("inputs")
    .description("Manage external data source integrations");

  // ── list ───────────────────────────────────────────────────────────────────

  inputs
    .command("list")
    .description("Show all inputs with connection status")
    .action(() => {
      requireSetup();

      const { instance_repo_path: repoRoot } = getLocalConfig();
      const all = readInputsConfig(repoRoot);

      console.log(
        `\n  ${chalk.hex(theme.text).bold("INPUTS")}  ${chalk.hex(theme.muted)(`(${all.length} total)`)}\n`
      );

      for (const inp of all) {
        printInputRow(inp.label, inp.enabled, inp.configured);
      }

      console.log();
    });

  // ── toggle ─────────────────────────────────────────────────────────────────

  inputs
    .command("toggle <id>")
    .description("Enable or disable an input and auto-commit the change")
    .action(async (id: string) => {
      requireSetup();

      const { instance_repo_path: repoRoot, active_user: username } =
        getLocalConfig();

      const all = readInputsConfig(repoRoot);
      const target = all.find((inp) => inp.id === id);

      if (!target) {
        throw new HelmError(
          `Input "${id}" not found in inputs.yaml.`,
          `Run: helm inputs list to see valid input IDs.`
        );
      }

      const wasEnabled = target.enabled;
      target.enabled = !wasEnabled;

      // Disabling also clears configured so status reflects the change.
      if (!target.enabled) {
        target.configured = false;
      }

      writeInputsConfig(repoRoot, all);

      const action = target.enabled ? "enabled" : "disabled";
      console.log(
        `  ${chalk.hex(theme.success)(symbol.success)}  Input "${target.label}" ${action}.`
      );

      const commitFiles = [path.join("config", "inputs.yaml")];
      const commitMsg = `[manual] toggle: input ${id} ${action} — ${username}`;

      await commitAndPush(repoRoot, commitFiles, commitMsg);

      console.log(chalk.hex(theme.muted)(`  ${symbol.bullet}  Changes committed and pushed.`));
      console.log();
    });

  // ── test ───────────────────────────────────────────────────────────────────

  inputs
    .command("test [id]")
    .description("Test input connectivity. Use --all to test every enabled input.")
    .option("--all", "Test all enabled inputs")
    .action(async (id: string | undefined, options: { all?: boolean }) => {
      requireSetup();

      const { instance_repo_path: repoRoot, active_user: username } =
        getLocalConfig();

      const all = readInputsConfig(repoRoot);

      let toTest: typeof all;

      if (options.all) {
        toTest = all.filter((inp) => inp.enabled);
        if (toTest.length === 0) {
          console.log(
            chalk.hex(theme.muted)("  No enabled inputs to test.")
          );
          return;
        }
      } else {
        if (!id) {
          throw new HelmError(
            "No input ID provided.",
            "Run: helm inputs test <id>  or  helm inputs test --all"
          );
        }

        const target = all.find((inp) => inp.id === id);
        if (!target) {
          throw new HelmError(
            `Input "${id}" not found in inputs.yaml.`,
            `Run: helm inputs list to see valid input IDs.`
          );
        }

        if (!target.enabled) {
          throw new HelmError(
            `Input "${target.label}" is disabled.`,
            `Enable it first: helm inputs toggle ${id}`
          );
        }

        toTest = [target];
      }

      console.log(
        `\n  ${chalk.hex(theme.text).bold("Testing input connections…")}\n`
      );

      let anyChanged = false;

      for (const inp of toTest) {
        process.stdout.write(
          `  ${chalk.hex(theme.muted)(`Testing ${inp.label}…`)} `
        );

        const result = await testInput(inp.id, username);

        process.stdout.write("\n");
        printTestResult(result);

        const configuredBefore = inp.configured;
        inp.configured = result.ok;

        if (inp.configured !== configuredBefore) {
          anyChanged = true;
        }
      }

      if (anyChanged) {
        writeInputsConfig(repoRoot, all);
        console.log(
          chalk.hex(theme.muted)(
            `\n  ${symbol.bullet}  inputs.yaml updated to reflect test results.`
          )
        );
      }

      console.log();
    });
}
