/**
 * @file helm secrets — OS keychain credential management.
 *
 * Subcommands:
 *   helm secrets set <key>      Masked input → stored in OS keychain
 *   helm secrets list           Key names only, never values
 *   helm secrets verify <key>   Confirm key exists in keychain
 *   helm secrets delete <key>   Remove with confirmation prompt
 *
 * Secret values are never printed, logged, or included in error messages.
 * The only moment a value appears on-screen is during `helm secrets set`
 * where inquirer masks the input with asterisks.
 */

import chalk from "chalk";
import inquirer from "inquirer";
import type { Command } from "commander";
import { requireSetup, getLocalConfig } from "../core/repo.js";
import {
  setSecret,
  listSecretKeys,
  verifySecret,
  deleteSecret,
} from "../core/secrets.js";
import { HelmError } from "../utils/errors.js";
import { theme, symbol } from "../ui/theme.js";

// ─── Command Registration ─────────────────────────────────────────────────────

/**
 * Registers the `helm secrets` subcommand group on the given Commander program.
 *
 * @param program - The root Commander Command instance.
 */
export function registerSecretsCommand(program: Command): void {
  const secrets = program
    .command("secrets")
    .description("Manage OS keychain credentials");

  // ── set ────────────────────────────────────────────────────────────────────

  secrets
    .command("set <key>")
    .description("Store a secret in the OS keychain (masked input)")
    .action(async (key: string) => {
      requireSetup();

      const { active_user: username } = getLocalConfig();

      const { value } = await inquirer.prompt<{ value: string }>([
        {
          type: "password",
          name: "value",
          message: `  ${key}:`,
          mask: "*",
          validate: (v: string) =>
            v.trim().length > 0 || "Value cannot be empty.",
        },
      ]);

      await setSecret(username, key, value);

      console.log(
        `  ${chalk.hex(theme.success)(symbol.success)}  Secret "${key}" stored in OS keychain.`
      );
    });

  // ── list ───────────────────────────────────────────────────────────────────

  secrets
    .command("list")
    .description("List stored secret key names (values are never shown)")
    .action(() => {
      requireSetup();

      const { active_user: username } = getLocalConfig();
      const keys = listSecretKeys(username);

      if (keys.length === 0) {
        console.log(
          chalk.hex(theme.muted)(
            `  No secrets stored for ${username}.\n  Run: helm secrets set <KEY_NAME>`
          )
        );
        return;
      }

      console.log(
        `\n  ${chalk.hex(theme.text).bold("Stored secret keys")}  ${chalk.hex(theme.muted)(`(${keys.length} total — values not shown)`)}`
      );
      for (const key of keys) {
        console.log(`  ${chalk.hex(theme.muted)(symbol.bullet)}  ${chalk.hex(theme.text)(key)}`);
      }
      console.log();
    });

  // ── verify ─────────────────────────────────────────────────────────────────

  secrets
    .command("verify <key>")
    .description("Confirm a secret key exists in the OS keychain")
    .action(async (key: string) => {
      requireSetup();

      const { active_user: username } = getLocalConfig();
      const exists = await verifySecret(username, key);

      if (exists) {
        console.log(
          `  ${chalk.hex(theme.success)(symbol.success)}  "${key}" exists in the OS keychain.`
        );
      } else {
        throw new HelmError(
          `Secret "${key}" was not found in the OS keychain.`,
          `Run: helm secrets set ${key}`
        );
      }
    });

  // ── delete ─────────────────────────────────────────────────────────────────

  secrets
    .command("delete <key>")
    .description("Remove a secret from the OS keychain")
    .action(async (key: string) => {
      requireSetup();

      const { active_user: username } = getLocalConfig();

      const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
        {
          type: "confirm",
          name: "confirmed",
          message: `  Delete secret "${key}" from the OS keychain?`,
          default: false,
        },
      ]);

      if (!confirmed) {
        console.log(chalk.hex(theme.muted)("  Cancelled."));
        return;
      }

      const deleted = await deleteSecret(username, key);

      if (deleted) {
        console.log(
          `  ${chalk.hex(theme.success)(symbol.success)}  Secret "${key}" deleted from OS keychain.`
        );
      } else {
        throw new HelmError(
          `Secret "${key}" was not found in the OS keychain.`,
          `Run: helm secrets list to see what keys are stored.`
        );
      }
    });
}
