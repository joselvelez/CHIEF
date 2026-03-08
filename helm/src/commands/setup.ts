/**
 * @file helm setup — guided first-time setup wizard.
 *
 * Walks the user through six sequential steps to configure HELM against
 * their personal CHIEF instance repo. setup_complete is only set to true
 * after Step 6 (git push) succeeds. If the wizard is interrupted or push
 * fails, re-running helm setup is safe — existing config and credentials
 * are preserved and steps that have already completed are idempotent.
 *
 * Step 1: Locate and validate the instance repo.
 * Step 2: Create user identity and initialise /users/[username]/.
 * Step 3: Connect inputs — collect credentials, test each connection.
 * Step 4: Review agents and flows, optionally disable any.
 * Step 5: Remind about key documents, offer to open in editor.
 * Step 6: Commit and push all setup changes.
 */

import fs from "fs";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import type { Command } from "commander";
import type { Input, Agent, Flow } from "../types/index.js";
import {
  isValidRepoStructure,
  expandHomePath,
  updateLocalConfig,
  localStore,
} from "../core/repo.js";
import {
  readInputsConfig,
  writeInputsConfig,
  readAgentsConfig,
  writeAgentsConfig,
  readFlowsConfig,
  writeFlowsConfig,
} from "../core/config.js";
import { setSecret } from "../core/secrets.js";
import { INPUT_CREDENTIAL_KEYS, testInput } from "../core/inputs.js";
import { commitAndPush } from "../core/git.js";
import { ensureStateDir } from "../core/state.js";
import { HelmError } from "../utils/errors.js";
import { theme, symbol } from "../ui/theme.js";
import { execa } from "execa";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * User profile documents that must exist under /users/[username]/.
 * Created as blank placeholders if /users/_template/ is absent.
 */
const USER_DOCS = [
  "USER.md",
  "VOICE.md",
  "CLIENTS.md",
  "SCHEDULING.md",
  "CLASSIFY.md",
] as const;

/** Commit message used at the end of helm setup. */
const SETUP_COMMIT_PREFIX = "[manual] setup: initialized user";

// ─── Print Helpers ────────────────────────────────────────────────────────────

/** Prints a step header to visually separate wizard phases. */
function printStep(n: number, title: string): void {
  console.log(
    `\n${chalk.hex(theme.accent).bold(`  Step ${n}`)}  ${chalk.hex(theme.text)(title)}`
  );
  console.log(chalk.hex(theme.border)(`  ${"─".repeat(50)}`));
}

/** Prints a success line. */
function ok(msg: string): void {
  console.log(`  ${chalk.hex(theme.success)(symbol.success)}  ${msg}`);
}

/** Prints a warning line. */
function warn(msg: string): void {
  console.log(`  ${chalk.hex(theme.warning)(symbol.warning)}  ${msg}`);
}

// ─── Step 1: Locate Instance Repo ────────────────────────────────────────────

/**
 * Prompts the user for their instance repo path, validates the CHIEF
 * directory structure, and persists the path to local config.
 *
 * Fails fast if the directory does not contain a valid CHIEF structure,
 * directing the user to finish setting up CHIEF before running helm setup.
 *
 * @returns The validated absolute repo path.
 */
async function step1LocateRepo(): Promise<string> {
  printStep(1, "Locate instance repo");

  const { rawPath } = await inquirer.prompt<{ rawPath: string }>([
    {
      type: "input",
      name: "rawPath",
      message: "  Path to your personal CHIEF instance repo:",
      validate: (input: string) => {
        if (!input.trim()) return "Path cannot be empty.";
        const expanded = expandHomePath(input.trim());
        if (!fs.existsSync(expanded)) return `Directory not found: ${expanded}`;
        if (!isValidRepoStructure(expanded)) {
          return (
            "This does not look like a fully initialised CHIEF instance repo.\n" +
            "  Ensure /config/inputs.yaml, agents.yaml, flows.yaml, and triggers.yaml exist before running helm setup."
          );
        }
        return true;
      },
    },
  ]);

  const repoRoot = expandHomePath(rawPath.trim());
  updateLocalConfig({ instance_repo_path: repoRoot });
  ok(`Repo found: ${repoRoot}`);
  return repoRoot;
}

// ─── Step 2: Create User Identity ────────────────────────────────────────────

/**
 * Collects username, full name, timezone, language, and preferred
 * editor. Creates /users/[username]/ by copying _template/ if present,
 * or by writing blank placeholder files. Pre-populates USER.md with
 * the collected identity fields.
 *
 * @param repoRoot - Validated absolute path to the instance repo.
 * @returns The username entered by the user.
 */
async function step2CreateUserIdentity(repoRoot: string): Promise<string> {
  printStep(2, "Create user identity");

  const { username, fullName, timezone, language, editor } =
    await inquirer.prompt<{
      username: string;
      fullName: string;
      timezone: string;
      language: string;
      editor: string;
    }>([
      {
        type: "input",
        name: "username",
        message: "  Username (letters, numbers, hyphens only):",
        validate: (v: string) =>
          /^[a-z0-9-]+$/.test(v) ||
          "Use only lowercase letters, numbers, and hyphens.",
      },
      {
        type: "input",
        name: "fullName",
        message: "  Full name:",
        validate: (v: string) =>
          v.trim().length > 0 || "Full name cannot be empty.",
      },
      {
        type: "input",
        name: "timezone",
        message: "  Timezone (e.g. America/New_York):",
        default: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      {
        type: "input",
        name: "language",
        message: "  Language code (e.g. en):",
        default: "en",
      },
      {
        type: "input",
        name: "editor",
        message: "  Editor command (e.g. code, vim, nano):",
        default: process.env["EDITOR"] ?? "code",
      },
    ]);

  const userDir = path.join(repoRoot, "users", username);
  const templateDir = path.join(repoRoot, "users", "_template");
  const templateExists = fs.existsSync(templateDir);

  if (!fs.existsSync(userDir)) {
    if (templateExists) {
      fs.cpSync(templateDir, userDir, { recursive: true });
      ok(`Copied template to users/${username}/`);
    } else {
      fs.mkdirSync(userDir, { recursive: true });

      for (const doc of USER_DOCS) {
        const docPath = path.join(userDir, doc);
        fs.writeFileSync(
          docPath,
          `# ${doc.replace(".md", "")} — ${fullName}\n\n<!-- Fill in this document. See SETUP.md for guidance. -->\n`,
          "utf-8"
        );
      }

      warn(
        `users/_template/ not found — blank placeholder files created in users/${username}/. Fill them in before running flows.`
      );
    }
  } else {
    ok(`users/${username}/ already exists — skipping creation.`);
  }

  // Pre-populate USER.md with identity fields regardless of source.
  const userMdPath = path.join(userDir, "USER.md");
  const existing = fs.existsSync(userMdPath)
    ? fs.readFileSync(userMdPath, "utf-8")
    : "";

  const identityBlock = [
    `<!-- HELM setup — do not remove this block -->`,
    `**Username:** ${username}`,
    `**Full Name:** ${fullName}`,
    `**Timezone:** ${timezone}`,
    `**Language:** ${language}`,
    `<!-- end HELM setup block -->`,
  ].join("\n");

  if (!existing.includes("<!-- HELM setup")) {
    fs.writeFileSync(userMdPath, `${identityBlock}\n\n${existing}`, "utf-8");
  }

  // Ensure runtime support directories exist.
  ensureStateDir(repoRoot, username);
  for (const dir of ["outputs", "logs", "context", "knowledge"]) {
    const userSubDir = path.join(repoRoot, dir, username);
    if (!fs.existsSync(userSubDir)) {
      fs.mkdirSync(userSubDir, { recursive: true });
    }
  }

  updateLocalConfig({ active_user: username, editor });
  ok(`User identity saved: ${fullName} (${username})`);
  return username;
}

// ─── Step 3: Connect Inputs ───────────────────────────────────────────────────

/**
 * For each input in inputs.yaml, asks whether to enable it. For enabled
 * inputs, collects all required credentials via masked prompts, stores
 * them in the encrypted local storage, and runs a connectivity test.
 *
 * Updates the `enabled` and `configured` fields in inputs.yaml after
 * each input is processed. This ensures partial progress is persisted
 * even if the wizard is interrupted.
 *
 * @param repoRoot - Absolute path to the instance repo.
 * @param username - Active username for secret scoping.
 */
async function step3ConnectInputs(
  repoRoot: string,
  username: string
): Promise<void> {
  printStep(3, "Connect inputs");

  const inputs = readInputsConfig(repoRoot);

  for (const input of inputs) {
    console.log(`\n  ${chalk.hex(theme.text).bold(input.label)}`);
    if (input.setup_guide) {
      console.log(chalk.hex(theme.muted)(`  ${input.setup_guide}`));
    }

    const { enable } = await inquirer.prompt<{ enable: boolean }>([
      {
        type: "confirm",
        name: "enable",
        message: `  Enable ${input.label}?`,
        default: input.enabled,
      },
    ]);

    input.enabled = enable;

    if (!enable) {
      input.configured = false;
      console.log(chalk.hex(theme.skip)(`  ${symbol.disabled} Skipped`));
      continue;
    }

    const credentialKeys =
      INPUT_CREDENTIAL_KEYS[input.id] ??
      (input.credentials_ref ? [input.credentials_ref] : []);

    if (credentialKeys.length === 0) {
      warn(`No credential keys defined for ${input.id} — skipping.`);
      continue;
    }

    for (const key of credentialKeys) {
      const { value } = await inquirer.prompt<{ value: string }>([
        {
          type: "password",
          name: "value",
          message: `  ${key}:`,
          mask: "*",
          validate: (v: string) =>
            v.trim().length > 0 || `${key} cannot be empty.`,
        },
      ]);

      await setSecret(username, key, value);
    }

    process.stdout.write(
      `  ${chalk.hex(theme.muted)("Testing connection…")} `
    );

    const result = await testInput(input.id, username);

    if (result.ok) {
      input.configured = true;
      ok(`Connected${result.detail ? ` — ${result.detail}` : ""}`);
    } else {
      input.configured = false;
      console.log(
        `\n  ${chalk.hex(theme.error)(symbol.error)} ${result.error ?? "Connection failed."}`
      );
      if (result.fix) {
        console.log(chalk.hex(theme.muted)(`  ${symbol.arrow} ${result.fix}`));
      }
      warn("You can fix this later with: helm inputs test " + input.id);
    }

    // Persist after each input so partial progress survives interruptions.
    writeInputsConfig(repoRoot, inputs);
  }
}

// ─── Step 4: Confirm Agents and Flows ────────────────────────────────────────

/**
 * Displays all agents and flows from config (all enabled by default).
 * Asks which, if any, should be disabled. Writes updated config files.
 *
 * @param repoRoot - Absolute path to the instance repo.
 */
async function step4ConfirmAgentsFlows(repoRoot: string): Promise<void> {
  printStep(4, "Confirm agents and flows");

  const agents = readAgentsConfig(repoRoot);
  const flows = readFlowsConfig(repoRoot);

  // Agents
  console.log(`\n  ${chalk.hex(theme.text)("Agents:")}`);
  for (const agent of agents) {
    console.log(
      `  ${agent.enabled ? chalk.hex(theme.success)(symbol.success) : chalk.hex(theme.skip)(symbol.disabled)}  ${agent.label} (${agent.id})`
    );
  }

  const agentChoices = agents.map((a) => ({
    name: `${a.label} (${a.id})`,
    value: a.id,
    checked: a.enabled,
  }));

  const { enabledAgentIds } = await inquirer.prompt<{
    enabledAgentIds: string[];
  }>([
    {
      type: "checkbox",
      name: "enabledAgentIds",
      message: "  Select agents to keep enabled:",
      choices: agentChoices,
    },
  ]);

  for (const agent of agents) {
    agent.enabled = enabledAgentIds.includes(agent.id);
  }
  writeAgentsConfig(repoRoot, agents);

  // Flows
  console.log(`\n  ${chalk.hex(theme.text)("Flows:")}`);
  for (const flow of flows) {
    console.log(
      `  ${flow.enabled ? chalk.hex(theme.success)(symbol.success) : chalk.hex(theme.skip)(symbol.disabled)}  ${flow.label} (${flow.id})`
    );
  }

  const flowChoices = flows.map((f) => ({
    name: `${f.label} (${f.id})`,
    value: f.id,
    checked: f.enabled,
  }));

  const { enabledFlowIds } = await inquirer.prompt<{
    enabledFlowIds: string[];
  }>([
    {
      type: "checkbox",
      name: "enabledFlowIds",
      message: "  Select flows to keep enabled:",
      choices: flowChoices,
    },
  ]);

  for (const flow of flows) {
    flow.enabled = enabledFlowIds.includes(flow.id);
  }
  writeFlowsConfig(repoRoot, flows);

  ok("Agent and flow configuration saved.");
}

// ─── Step 5: Key Documents ────────────────────────────────────────────────────

/**
 * Lists the five key profile documents the user must fill in before
 * running flows. Offers to open each in the configured editor.
 *
 * @param repoRoot - Absolute path to the instance repo.
 * @param username - Active username.
 * @param editor   - Editor command (e.g. "code").
 */
async function step5KeyDocuments(
  repoRoot: string,
  username: string,
  editor: string
): Promise<void> {
  printStep(5, "Key documents");

  console.log(
    chalk.hex(theme.muted)(
      "\n  These documents define how agents understand you and your work.\n" +
        "  Fill them in thoroughly — document quality directly affects output quality.\n"
    )
  );

  for (const doc of USER_DOCS) {
    const docPath = path.join(repoRoot, "users", username, doc);
    console.log(`  ${chalk.hex(theme.text)(doc)}  ${chalk.hex(theme.muted)(docPath)}`);
  }

  const { openDocs } = await inquirer.prompt<{ openDocs: boolean }>([
    {
      type: "confirm",
      name: "openDocs",
      message: "\n  Open all key documents in your editor now?",
      default: false,
    },
  ]);

  if (openDocs) {
    const editorParts = editor.split(" ");
    const editorCmd = editorParts[0];
    const editorArgs = editorParts.slice(1);

    for (const doc of USER_DOCS) {
      const docPath = path.join(repoRoot, "users", username, doc);
      try {
        await execa(editorCmd!, [...editorArgs, docPath], {
          stdio: "inherit",
        });
      } catch {
        warn(
          `Could not open ${doc} with "${editor}". Open it manually: ${docPath}`
        );
      }
    }
  } else {
    console.log(
      chalk.hex(theme.muted)(
        `\n  Open them later with: helm docs edit <name>, or directly in your editor.`
      )
    );
  }
}

// ─── Step 6: Commit and Push ──────────────────────────────────────────────────

/**
 * Commits all setup-generated files and pushes to origin.
 *
 * setup_complete is only set to true after a successful push. If push
 * fails, setup_complete remains false and the user is shown a clear
 * recovery message. Re-running helm setup will skip already-completed
 * steps (idempotent) and retry the push.
 *
 * @param repoRoot - Absolute path to the instance repo.
 * @param username - Active username for the commit message.
 */
async function step6CommitAndPush(
  repoRoot: string,
  username: string
): Promise<void> {
  printStep(6, "Commit and push");

  const filesToCommit = [
    path.join("config", "inputs.yaml"),
    path.join("config", "agents.yaml"),
    path.join("config", "flows.yaml"),
    path.join("users", username),
    path.join("state", username),
    path.join("outputs", username),
    path.join("logs", username),
    path.join("context", username),
    path.join("knowledge", username),
  ];

  const pushed = await commitAndPush(
    repoRoot,
    filesToCommit,
    `${SETUP_COMMIT_PREFIX} ${username}`
  );

  if (pushed) {
    updateLocalConfig({ setup_complete: true });
    ok("Committed and pushed to origin.");
    ok("Setup complete. Run: helm status");
  } else {
    updateLocalConfig({ setup_complete: false });
    console.log(
      `\n  ${chalk.hex(theme.error)(symbol.error)} Setup could not complete: git push failed.`
    );
    console.log(
      chalk.hex(theme.muted)(
        `  ${symbol.arrow} Fix your git remote auth, then push manually:\n` +
          `       cd ${repoRoot} && git push\n` +
          `  ${symbol.arrow} Then run: helm setup  (it will resume safely from where it left off)`
      )
    );
  }
}

// ─── Command Registration ─────────────────────────────────────────────────────

/**
 * Registers the `helm setup` command on the given Commander program.
 *
 * @param program - The root Commander Command instance.
 */
export function registerSetupCommand(program: Command): void {
  program
    .command("setup")
    .description("Guided first-time setup wizard")
    .action(async () => {
      console.log(
        `\n${chalk.hex(theme.accent).bold("  ╔══════════════════════════════════════╗")}`
      );
      console.log(
        chalk.hex(theme.accent).bold("  ║  CHIEF  ·  HELM SETUP                ║")
      );
      console.log(
        chalk.hex(theme.accent).bold("  ╚══════════════════════════════════════╝\n")
      );

      const repoRoot = await step1LocateRepo();

      const username = await step2CreateUserIdentity(repoRoot);

      await step3ConnectInputs(repoRoot, username);

      await step4ConfirmAgentsFlows(repoRoot);

      const editor =
        (localStore.get("editor") as string | undefined) ?? "code";
      await step5KeyDocuments(repoRoot, username, editor);

      await step6CommitAndPush(repoRoot, username);
    });
}
