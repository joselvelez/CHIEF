/**
 * @file Structured logger for HELM.
 *
 * Wraps console output with log levels and prefixes. The logger is
 * intentionally simple — HELM is a CLI tool, not a long-running service.
 * Its primary purpose is to provide a single interception point so that:
 *
 *   1. Debug output can be suppressed in normal use.
 *   2. Secret values are never accidentally surfaced (secret-aware code
 *      must never pass secret values to any logger method).
 *   3. Log output format is consistent across all commands.
 *
 * Log level is controlled by the HELM_LOG environment variable:
 *   - "debug" → all output
 *   - "info"  → info, warn, error (default)
 *   - "error" → errors only
 *   - "silent" → no output (useful in tests)
 */

/** Ordered log levels — higher index means less verbose. */
const LEVELS = ["debug", "info", "warn", "error", "silent"] as const;
type LogLevel = (typeof LEVELS)[number];

function resolveLevel(): LogLevel {
  const raw = process.env["HELM_LOG"]?.toLowerCase();
  if (raw && (LEVELS as readonly string[]).includes(raw)) {
    return raw as LogLevel;
  }
  return "info";
}

function levelIndex(level: LogLevel): number {
  return LEVELS.indexOf(level);
}

const activeLevel: LogLevel = resolveLevel();

/**
 * Returns true if the given level should produce output given the
 * currently configured log level.
 */
function isEnabled(level: LogLevel): boolean {
  return levelIndex(level) >= levelIndex(activeLevel);
}

/** Emits a debug-level message. Suppressed unless HELM_LOG=debug. */
export function debug(message: string): void {
  if (isEnabled("debug")) {
    process.stderr.write(`[debug] ${message}\n`);
  }
}

/**
 * Emits an informational message to stderr.
 * Do not use for user-facing panel output — use console.log directly
 * with chalk formatting for those.
 */
export function info(message: string): void {
  if (isEnabled("info")) {
    process.stderr.write(`[info]  ${message}\n`);
  }
}

/** Emits a warning to stderr. */
export function warn(message: string): void {
  if (isEnabled("warn")) {
    process.stderr.write(`[warn]  ${message}\n`);
  }
}

/**
 * Emits an error message to stderr.
 * For HelmErrors, use formatHelmError() and print via console.error
 * in the top-level handler — not this function.
 */
export function error(message: string): void {
  if (isEnabled("error")) {
    process.stderr.write(`[error] ${message}\n`);
  }
}
