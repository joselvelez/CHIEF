#!/usr/bin/env node
/**
 * @file HELM CLI entry point.
 *
 * Responsibilities:
 *   1. Startup checks — Node version ≥ 20, git in PATH — before any
 *      command executes. Failures here produce clear errors and exit 1.
 *   2. Commander program setup — version, description, global error handling.
 *   3. Command registration — one call per command module.
 *   4. Global error handler — catches HelmError and unexpected errors from
 *      all command actions, formats them consistently, and exits 1.
 *
 * All command modules export a register[Name]Command(program) function
 * and are responsible for their own subcommands, options, and actions.
 *
 * This file contains no business logic. It wires together the application.
 */

import { Command } from "commander";
import chalk from "chalk";
import { isGitAvailable } from "./core/git.js";
import { HelmError, formatHelmError, formatUnexpectedError } from "./utils/errors.js";
import { theme } from "./ui/theme.js";
import { registerSetupCommand } from "./commands/setup.js";
import { registerStatusCommand } from "./commands/status.js";
import { registerSecretsCommand } from "./commands/secrets.js";
import { registerSyncCommand } from "./commands/sync.js";
import { registerPushCommand } from "./commands/push.js";
import { registerInputsCommand } from "./commands/inputs.js";
import { registerConfigCommand } from "./commands/config.js";

// ─── Startup Checks ───────────────────────────────────────────────────────────

/**
 * Validates that the current Node.js runtime meets the minimum version
 * requirement of v20. Exits with a clear error if it does not.
 *
 * Must be called before Commander parses any arguments so the check
 * fires even on `helm --version` invocations on incompatible runtimes.
 */
function checkNodeVersion(): void {
  const versionStr = process.versions.node;
  const major = parseInt(versionStr.split(".")[0] ?? "0", 10);

  if (major < 20) {
    console.error(
      chalk.hex(theme.error)(
        `✗ Error: Node.js v${versionStr} is not supported.\n` +
          `  → Install Node.js v20 or later from https://nodejs.org`
      )
    );
    process.exit(1);
  }
}

/**
 * Validates that `git` is available in PATH. Exits with a clear error
 * if it is not found. Must complete before any command runs.
 */
async function checkGitAvailable(): Promise<void> {
  const available = await isGitAvailable();

  if (!available) {
    console.error(
      chalk.hex(theme.error)(
        "✗ Error: git is not available in PATH.\n" +
          "  → macOS: git is pre-installed, or install via Homebrew: brew install git\n" +
          "  → Windows: download from https://git-scm.com"
      )
    );
    process.exit(1);
  }
}

// ─── Error Handler ────────────────────────────────────────────────────────────

/**
 * Wraps an async command action so that HelmErrors and unexpected errors
 * are both caught, formatted consistently, and cause a clean exit(1)
 * rather than an unhandled promise rejection.
 *
 * All command actions must be wrapped with this function.
 *
 * @param fn - The async command action to wrap.
 */
function action(
  fn: (...args: unknown[]) => Promise<void>
): (...args: unknown[]) => Promise<void> {
  return async (...args: unknown[]) => {
    try {
      await fn(...args);
    } catch (err) {
      if (err instanceof HelmError) {
        console.error(chalk.hex(theme.error)(formatHelmError(err)));
      } else {
        console.error(chalk.hex(theme.error)(formatUnexpectedError(err)));
      }
      process.exit(1);
    }
  };
}

// ─── Program ──────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name("helm")
  .description("CHIEF — Personal AI Operations System CLI")
  .version("0.1.0", "-v, --version", "Print version number")
  .helpOption("-h, --help", "Show help");

// Commander does not propagate async action errors by default.
// exitOverride turns Commander exceptions into thrown errors so our
// try/catch in action() can handle them uniformly.
program.exitOverride();

// ─── Command Registration ─────────────────────────────────────────────────────

registerSetupCommand(program);
registerStatusCommand(program);
registerSecretsCommand(program);
registerSyncCommand(program);
registerPushCommand(program);
registerInputsCommand(program);
registerConfigCommand(program);

// ─── Placeholder Stubs for Phase 2 / 3 Commands ─────────────────────────────
// These prevent "unknown command" errors if a user tries a Phase 2 command
// and surface a clear "not yet available" message instead.

for (const name of [
  "run",
  "sweep",
  "block",
  "agents",
  "flows",
  "triggers",
  "docs",
  "logs",
  "outputs",
  "tune",
]) {
  program
    .command(name, { hidden: true })
    .allowUnknownOption(true)
    .action(() => {
      console.log(
        chalk.hex(theme.muted)(
          `  helm ${name} is not available in this version (Phase 1).\n` +
            `  It will be added in a future release.`
        )
      );
      process.exit(1);
    });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

/**
 * Main entry point. Runs startup checks then delegates to Commander.
 */
async function main(): Promise<void> {
  checkNodeVersion();
  await checkGitAvailable();

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    // Commander throws CommanderError on --help, --version, and exitOverride.
    // These are normal control-flow exits — do not treat as failures.
    if (
      err instanceof Error &&
      "code" in err &&
      typeof (err as { code: unknown }).code === "string" &&
      (err as { code: string }).code.startsWith("commander.")
    ) {
      const code = (err as { code: string; exitCode?: number }).code;
      // commander.helpDisplayed and commander.version are clean exits.
      if (code === "commander.helpDisplayed" || code === "commander.version") {
        process.exit(0);
      }
      // commander.unknownCommand and others are user errors.
      process.exit(1);
    }

    // Unhandled error outside a command action.
    console.error(chalk.hex(theme.error)(formatUnexpectedError(err)));
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(chalk.hex(theme.error)(formatUnexpectedError(err)));
  process.exit(1);
});
