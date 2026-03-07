/**
 * @file helm status — system health overview panel.
 *
 * Renders a static bordered status panel in the CHIEF visual design
 * showing: repo path and git cleanliness, all configured inputs with
 * connection state, last run timestamps per flow, and engine availability.
 *
 * This command is read-only — it makes no writes and issues no git
 * operations. Input "connection state" is derived from the `configured`
 * flag in inputs.yaml (set by helm setup and helm inputs test) rather
 * than making live API calls on every status invocation.
 */

import chalk from "chalk";
import { execa } from "execa";
import type { Command } from "commander";
import { requireSetup, getLocalConfig, repoPath } from "../core/repo.js";
import { readInputsConfig, readFlowsConfig, readEngineConfig } from "../core/config.js";
import { getRepoStatus } from "../core/git.js";
import { readLastRunState } from "../core/state.js";
import { theme, symbol } from "../ui/theme.js";
import {
  boxTop,
  boxDivider,
  boxBottom,
  boxRow,
  boxEmpty,
  formatHeaderDate,
  formatLastRun,
  padEnd,
} from "../utils/format.js";

// ─── Engine Check ─────────────────────────────────────────────────────────────

/**
 * Returns true if the engine CLI command is available in PATH.
 * Uses the command from engine.yaml, defaulting to "claude".
 *
 * @param command - The CLI command to check (e.g. "claude").
 */
async function isEngineAvailable(command: string): Promise<boolean> {
  try {
    await execa(command, ["--version"], { reject: true });
    return true;
  } catch {
    return false;
  }
}

// ─── Row Builders ─────────────────────────────────────────────────────────────

/**
 * Builds the header row content string for the top section.
 * Format: CHIEF  ·  STATUS  ·  [username]  ·  [date]
 */
function buildHeaderContent(username: string): string {
  const dateStr = formatHeaderDate(new Date());
  const sep = chalk.hex(theme.border)("  ·  ");
  return [
    chalk.hex(theme.text).bold("CHIEF"),
    sep,
    chalk.hex(theme.accent).bold("STATUS"),
    sep,
    chalk.hex(theme.muted)(username),
    sep,
    chalk.hex(theme.muted)(dateStr),
  ].join("");
}

/**
 * Builds the repo section row content.
 * Shows the repo path and clean/dirty state.
 */
function buildRepoContent(
  repoRoot: string,
  status: { clean: boolean; fileCount: number }
): string {
  const label = padEnd(chalk.hex(theme.text)("REPO"), 12);
  const pathStr = chalk.hex(theme.muted)(repoRoot);
  const statusStr = status.clean
    ? chalk.hex(theme.success)(`${symbol.success} clean`)
    : chalk.hex(theme.warning)(`${symbol.warning} dirty (${status.fileCount} file${status.fileCount !== 1 ? "s" : ""})`);

  return `${label}${pathStr}   ${statusStr}`;
}

/**
 * Builds one input row for the INPUTS section.
 * Connected: ✓ green. Disabled: ○ gray. Configured-but-untested: ⚠ yellow.
 */
function buildInputRow(input: {
  label: string;
  enabled: boolean;
  configured: boolean;
}): string {
  const labelStr = padEnd(input.label, 22);

  if (!input.enabled) {
    return (
      chalk.hex(theme.skip)(symbol.disabled) +
      "  " +
      chalk.hex(theme.skip)(labelStr) +
      chalk.hex(theme.skip)("disabled")
    );
  }

  if (input.configured) {
    return (
      chalk.hex(theme.success)(symbol.success) +
      "  " +
      chalk.hex(theme.text)(labelStr) +
      chalk.hex(theme.success)("connected")
    );
  }

  return (
    chalk.hex(theme.warning)(symbol.warning) +
    "  " +
    chalk.hex(theme.text)(labelStr) +
    chalk.hex(theme.warning)("not configured")
  );
}

/**
 * Builds one last-run row for the LAST RUNS section.
 */
function buildLastRunRow(
  flowId: string,
  flowLabel: string,
  record: { timestamp: string; status: "success" | "failed" } | undefined
): string {
  const labelStr = padEnd(flowLabel, 22);
  const timeStr = formatLastRun(record?.timestamp);
  const statusStr = record
    ? record.status === "success"
      ? chalk.hex(theme.success)(`${symbol.success} success`)
      : chalk.hex(theme.error)(`${symbol.error} failed`)
    : chalk.hex(theme.muted)("—");

  return (
    chalk.hex(theme.text)(labelStr) +
    chalk.hex(theme.muted)(padEnd(timeStr, 18)) +
    "  " +
    statusStr
  );
}

/**
 * Builds the engine status row.
 */
function buildEngineRow(
  engineLabel: string,
  available: boolean
): string {
  const label = padEnd(chalk.hex(theme.text)("ENGINE"), 12);
  const nameStr = chalk.hex(theme.muted)(padEnd(engineLabel, 20));
  const statusStr = available
    ? chalk.hex(theme.success)(`${symbol.success} available`)
    : chalk.hex(theme.error)(`${symbol.error} not found`);

  return `${label}${nameStr}${statusStr}`;
}

// ─── Panel Renderer ───────────────────────────────────────────────────────────

/**
 * Assembles and prints the full CHIEF status panel to stdout.
 * All data is fetched before this function is called so rendering
 * is synchronous and non-interactive.
 */
function renderStatusPanel(data: {
  username: string;
  repoRoot: string;
  repoStatus: { clean: boolean; fileCount: number };
  inputs: Array<{ id: string; label: string; enabled: boolean; configured: boolean }>;
  flows: Array<{ id: string; label: string }>;
  lastRunState: Record<string, { timestamp: string; status: "success" | "failed" } | undefined>;
  engineLabel: string;
  engineAvailable: boolean;
}): void {
  const lines: string[] = [
    boxTop(),
    boxRow(buildHeaderContent(data.username)),
    boxDivider(),
    boxRow(buildRepoContent(data.repoRoot, data.repoStatus)),
    boxDivider(),
    boxRow(chalk.hex(theme.text).bold("INPUTS")),
    ...data.inputs.map((inp) => boxRow(buildInputRow(inp))),
    boxDivider(),
    boxRow(chalk.hex(theme.text).bold("LAST RUNS")),
    ...data.flows.map((flow) =>
      boxRow(
        buildLastRunRow(
          flow.id,
          flow.label,
          data.lastRunState[flow.id] as { timestamp: string; status: "success" | "failed" } | undefined
        )
      )
    ),
    boxDivider(),
    boxRow(buildEngineRow(data.engineLabel, data.engineAvailable)),
    boxBottom(),
  ];

  console.log("\n" + lines.join("\n") + "\n");
}

// ─── Command Registration ─────────────────────────────────────────────────────

/**
 * Registers the `helm status` command on the given Commander program.
 *
 * @param program - The root Commander Command instance.
 */
export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Show system health overview")
    .action(async () => {
      requireSetup();

      const config = getLocalConfig();
      const repoRoot = config.instance_repo_path;
      const username = config.active_user;

      const [repoStatus, inputs, flows, lastRunState, engineConfig] =
        await Promise.all([
          getRepoStatus(repoRoot),
          Promise.resolve(readInputsConfig(repoRoot)),
          Promise.resolve(readFlowsConfig(repoRoot)),
          Promise.resolve(readLastRunState(repoRoot, username)),
          Promise.resolve(readEngineConfig(repoRoot)),
        ]);

      const engineLabel =
        engineConfig.engine === "claude-code"
          ? "Claude Code CLI"
          : "Anthropic API";

      const engineAvailable = await isEngineAvailable(engineConfig.command);

      const lastRunMap: Record<
        string,
        { timestamp: string; status: "success" | "failed" } | undefined
      > = {};
      for (const flow of flows) {
        const record = lastRunState[flow.id];
        lastRunMap[flow.id] = record;
      }

      renderStatusPanel({
        username,
        repoRoot,
        repoStatus,
        inputs,
        flows,
        lastRunState: lastRunMap,
        engineLabel,
        engineAvailable,
      });
    });
}
