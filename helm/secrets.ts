/**
 * @file OS keychain integration for HELM.
 *
 * All secret storage and retrieval is routed through this module.
 * Secret values are handled as transiently as possible:
 *
 *   - Values are never written to any file, log, or error message.
 *   - The only moment a value appears in memory outside this module is
 *     during the masked inquirer prompt in the setup wizard and
 *     helm secrets set — immediately passed to setSecret() and discarded.
 *   - listSecretKeys() returns key names only. Values are never returned
 *     to callers that don't explicitly call getSecret().
 *
 * A manifest of key names (not values) is stored in the local conf store
 * at ~/.chief/config.json because the OS keychain API does not provide
 * an enumeration method. The manifest is always kept in sync with the
 * keychain by setSecret() and deleteSecret().
 *
 * Keychain service name: "chief"
 * Account format: "[username]/[KEY_NAME]"
 */

import keytar from "keytar";
import chalk from "chalk";
import { localStore } from "./repo.js";
import { HelmError } from "../utils/errors.js";

/** Service name used for all entries in the OS keychain. */
const KEYCHAIN_SERVICE = "chief";

// ─── Keychain Heads-Up ────────────────────────────────────────────────────────

/**
 * Module-level flag ensuring the macOS keychain access prompt
 * explanation is printed only once per process invocation.
 */
let keychainHeadsUpShown = false;

/**
 * Prints a one-line notice before the first keychain operation in a
 * process. macOS will show a native permission dialog the first time
 * an app accesses the keychain; without this notice users may be
 * confused or alarmed by the unexpected OS popup.
 */
function ensureKeychainHeadsUp(): void {
  if (!keychainHeadsUpShown) {
    process.stdout.write(
      chalk.dim(
        "  ℹ  Your OS may prompt you to allow keychain access — this is expected.\n"
      )
    );
    keychainHeadsUpShown = true;
  }
}

// ─── Manifest Helpers ─────────────────────────────────────────────────────────

/**
 * Adds a fully-qualified key name ("[username]/[KEY_NAME]") to the
 * manifest in local config if it is not already present.
 */
function addToManifest(username: string, key: string): void {
  const fullKey = `${username}/${key}`;
  const manifest = (localStore.get("secrets_manifest") as string[]) ?? [];

  if (!manifest.includes(fullKey)) {
    localStore.set("secrets_manifest", [...manifest, fullKey]);
  }
}

/**
 * Removes a fully-qualified key name from the manifest in local config.
 * No-op if the key is not present.
 */
function removeFromManifest(username: string, key: string): void {
  const fullKey = `${username}/${key}`;
  const manifest = (localStore.get("secrets_manifest") as string[]) ?? [];
  localStore.set(
    "secrets_manifest",
    manifest.filter((k) => k !== fullKey)
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Stores a secret value in the OS keychain and records the key name
 * in the local manifest.
 *
 * The value is accepted as a parameter and immediately forwarded to
 * keytar. Callers must not retain the value after this call returns.
 *
 * @param username - Active username (used as the account prefix).
 * @param key      - Secret key name, e.g. "GMAIL_CLIENT_ID".
 * @param value    - The secret value. Never logged.
 * @throws {HelmError} If the keychain write fails.
 */
export async function setSecret(
  username: string,
  key: string,
  value: string
): Promise<void> {
  ensureKeychainHeadsUp();

  try {
    await keytar.setPassword(KEYCHAIN_SERVICE, `${username}/${key}`, value);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `Failed to store secret "${key}" in the OS keychain: ${detail}`,
      "Ensure your OS keychain is accessible and try again."
    );
  }

  addToManifest(username, key);
}

/**
 * Retrieves a secret value from the OS keychain.
 *
 * Returns null if the key does not exist. Callers must handle the null
 * case by throwing an appropriate HelmError naming the missing key and
 * directing the user to run helm secrets set.
 *
 * The returned value must not be logged, printed, or included in any
 * user-facing string.
 *
 * @param username - Active username.
 * @param key      - Secret key name to retrieve.
 * @throws {HelmError} If the keychain read fails unexpectedly.
 */
export async function getSecret(
  username: string,
  key: string
): Promise<string | null> {
  ensureKeychainHeadsUp();

  try {
    return await keytar.getPassword(KEYCHAIN_SERVICE, `${username}/${key}`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `Failed to read secret "${key}" from the OS keychain: ${detail}`,
      "Ensure your OS keychain is accessible and try again."
    );
  }
}

/**
 * Returns the list of secret key names stored for the given username.
 * Values are never returned — only names.
 *
 * Reads from the local manifest rather than querying the keychain
 * directly, because the keychain API does not support enumeration.
 *
 * @param username - Active username to filter by.
 */
export function listSecretKeys(username: string): string[] {
  const manifest = (localStore.get("secrets_manifest") as string[]) ?? [];
  const prefix = `${username}/`;

  return manifest
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length))
    .sort();
}

/**
 * Returns true if a secret with the given key name exists in the
 * OS keychain for the given username.
 *
 * @param username - Active username.
 * @param key      - Secret key name to check.
 * @throws {HelmError} If the keychain read fails.
 */
export async function verifySecret(
  username: string,
  key: string
): Promise<boolean> {
  const value = await getSecret(username, key);
  return value !== null;
}

/**
 * Removes a secret from the OS keychain and removes its name from the
 * local manifest.
 *
 * @param username - Active username.
 * @param key      - Secret key name to delete.
 * @returns True if the key existed and was deleted; false if it did not exist.
 * @throws {HelmError} If the keychain deletion fails.
 */
export async function deleteSecret(
  username: string,
  key: string
): Promise<boolean> {
  ensureKeychainHeadsUp();

  let deleted: boolean;

  try {
    deleted = await keytar.deletePassword(
      KEYCHAIN_SERVICE,
      `${username}/${key}`
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `Failed to delete secret "${key}" from the OS keychain: ${detail}`,
      "Ensure your OS keychain is accessible and try again."
    );
  }

  if (deleted) {
    removeFromManifest(username, key);
  }

  return deleted;
}
