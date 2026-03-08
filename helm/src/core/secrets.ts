/**
 * @file Encrypted local secret storage for HELM.
 *
 * All secret storage and retrieval is routed through this module.
 * Secret values are handled as transiently as possible:
 *
 *   - Values are never written to any file, log, or error message in plaintext.
 *   - The only moment a value appears in memory outside this module is
 *     during the masked inquirer prompt in the setup wizard and
 *     helm secrets set — immediately passed to setSecret() and discarded.
 *   - listSecretKeys() returns key names only. Values are never returned
 *     to callers that don't explicitly call getSecret().
 *
 * Secrets are encrypted with AES-256-GCM using a key derived via PBKDF2
 * from machine-specific entropy (hostname + OS username). Encrypted values
 * are stored in the local conf store at ~/.chief/config.json under the
 * `encrypted_secrets` key. A manifest of key names (not values) is stored
 * separately under `secrets_manifest` for enumeration.
 *
 * Encrypted value format: "iv:authTag:ciphertext" (all hex-encoded).
 *
 * Account format in manifest: "[username]/[KEY_NAME]"
 */

import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from "node:crypto";
import os from "node:os";
import { localStore } from "./repo.js";
import { HelmError } from "../utils/errors.js";

// ─── Encryption Constants ─────────────────────────────────────────────────────

/** AES-256-GCM cipher algorithm identifier. */
const CIPHER_ALGORITHM = "aes-256-gcm" as const;

/** Length in bytes of the initialisation vector for AES-GCM. */
const IV_LENGTH = 16;

/** Length in bytes of the GCM authentication tag. */
const AUTH_TAG_LENGTH = 16;

/** Length in bytes of the derived encryption key (256 bits for AES-256). */
const KEY_LENGTH = 32;

/** PBKDF2 iteration count. OWASP recommends >= 600,000 for SHA-256. */
const PBKDF2_ITERATIONS = 600_000;

/** PBKDF2 digest algorithm. */
const PBKDF2_DIGEST = "sha256" as const;

/**
 * Static salt prefix combined with machine-specific entropy.
 * Changing this value invalidates all previously encrypted secrets.
 */
const SALT_PREFIX = "chief-helm-secrets" as const;

// ─── Key Derivation ───────────────────────────────────────────────────────────

/**
 * Derives a 256-bit encryption key from machine-specific entropy using PBKDF2.
 *
 * The derivation input combines a static salt prefix with the machine's
 * hostname and OS-level username. This ties encrypted secrets to the
 * specific machine and OS user account, preventing portability of the
 * encrypted config file to a different machine without re-entering secrets.
 *
 * @returns A 32-byte Buffer suitable for use as an AES-256 key.
 */
function deriveEncryptionKey(): Buffer {
  const machineEntropy = `${SALT_PREFIX}:${os.hostname()}:${os.userInfo().username}`;
  return pbkdf2Sync(machineEntropy, SALT_PREFIX, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST);
}

// ─── Encrypt / Decrypt ────────────────────────────────────────────────────────

/**
 * Encrypts a plaintext string using AES-256-GCM.
 *
 * @param plaintext - The secret value to encrypt.
 * @returns A colon-delimited string: "iv:authTag:ciphertext" (all hex-encoded).
 */
function encrypt(plaintext: string): string {
  const key = deriveEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(CIPHER_ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a value previously encrypted by {@link encrypt}.
 *
 * @param encryptedValue - Colon-delimited string: "iv:authTag:ciphertext" (hex-encoded).
 * @returns The original plaintext string.
 * @throws {HelmError} If the encrypted value format is invalid or decryption fails.
 */
function decrypt(encryptedValue: string): string {
  const parts = encryptedValue.split(":");
  if (parts.length !== 3) {
    throw new HelmError(
      "Encrypted secret has an invalid format.",
      "Re-store the secret with: helm secrets set <KEY>"
    );
  }

  const [ivHex, authTagHex, ciphertextHex] = parts as [string, string, string];
  const key = deriveEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv(CIPHER_ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    throw new HelmError(
      "Failed to decrypt secret. The encryption key may have changed (hostname or OS user changed).",
      "Re-store the secret with: helm secrets set <KEY>"
    );
  }
}

// ─── Manifest Helpers ─────────────────────────────────────────────────────────

/**
 * Adds a fully-qualified key name ("[username]/[KEY_NAME]") to the
 * manifest in local config if it is not already present.
 *
 * @param username - Active username.
 * @param key - Secret key name, e.g. "GMAIL_CLIENT_ID".
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
 *
 * @param username - Active username.
 * @param key - Secret key name to remove.
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
 * Encrypts and stores a secret value in the local conf store, and records
 * the key name in the manifest.
 *
 * The value is encrypted immediately upon receipt and discarded from
 * this function's scope. Callers must not retain the value after this
 * call returns.
 *
 * @param username - Active username (used as the account prefix).
 * @param key - Secret key name, e.g. "GMAIL_CLIENT_ID".
 * @param value - The secret value. Never logged or stored in plaintext.
 * @throws {HelmError} If encryption fails.
 */
export async function setSecret(
  username: string,
  key: string,
  value: string
): Promise<void> {
  const fullKey = `${username}/${key}`;

  try {
    const encryptedValue = encrypt(value);
    const secrets = (localStore.get("encrypted_secrets") as Record<string, string>) ?? {};
    secrets[fullKey] = encryptedValue;
    localStore.set("encrypted_secrets", secrets);
  } catch (err) {
    if (err instanceof HelmError) throw err;
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `Failed to encrypt and store secret "${key}": ${detail}`,
      "Ensure your system supports AES-256-GCM and try again."
    );
  }

  addToManifest(username, key);
}

/**
 * Retrieves and decrypts a secret value from the local conf store.
 *
 * Returns null if the key does not exist. Callers must handle the null
 * case by throwing an appropriate HelmError naming the missing key and
 * directing the user to run helm secrets set.
 *
 * The returned value must not be logged, printed, or included in any
 * user-facing string.
 *
 * @param username - Active username.
 * @param key - Secret key name to retrieve.
 * @returns The decrypted secret value, or null if not found.
 * @throws {HelmError} If decryption fails.
 */
export async function getSecret(
  username: string,
  key: string
): Promise<string | null> {
  const fullKey = `${username}/${key}`;
  const secrets = (localStore.get("encrypted_secrets") as Record<string, string>) ?? {};
  const encryptedValue = secrets[fullKey];

  if (encryptedValue === undefined) {
    return null;
  }

  try {
    return decrypt(encryptedValue);
  } catch (err) {
    if (err instanceof HelmError) throw err;
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `Failed to decrypt secret "${key}": ${detail}`,
      "Re-store the secret with: helm secrets set " + key
    );
  }
}

/**
 * Returns the list of secret key names stored for the given username.
 * Values are never returned — only names.
 *
 * Reads from the local manifest rather than iterating encrypted entries.
 *
 * @param username - Active username to filter by.
 * @returns Sorted array of key names (without the username prefix).
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
 * local conf store for the given username.
 *
 * @param username - Active username.
 * @param key - Secret key name to check.
 * @returns True if the secret exists and can be decrypted.
 * @throws {HelmError} If decryption fails.
 */
export async function verifySecret(
  username: string,
  key: string
): Promise<boolean> {
  const value = await getSecret(username, key);
  return value !== null;
}

/**
 * Removes an encrypted secret from the local conf store and removes its
 * name from the manifest.
 *
 * @param username - Active username.
 * @param key - Secret key name to delete.
 * @returns True if the key existed and was deleted; false if it did not exist.
 */
export async function deleteSecret(
  username: string,
  key: string
): Promise<boolean> {
  const fullKey = `${username}/${key}`;
  const secrets = (localStore.get("encrypted_secrets") as Record<string, string>) ?? {};

  if (secrets[fullKey] === undefined) {
    return false;
  }

  delete secrets[fullKey];
  localStore.set("encrypted_secrets", secrets);
  removeFromManifest(username, key);

  return true;
}
