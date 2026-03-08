/**
 * @file Typed error handling for HELM.
 *
 * Every user-facing failure is a HelmError with two required fields:
 * a description of what went wrong and a specific actionable fix.
 * This enforces the PRD requirement that every error surfaces with
 * a clear message and a concrete next step.
 *
 * Unexpected errors (bugs, unhandled rejections) are caught at the
 * top-level handler in index.ts and formatted separately.
 */

/**
 * All intentional HELM failures. Thrown when a known failure condition
 * is encountered (missing config, bad credentials, git conflicts, etc.).
 *
 * The `fix` field is mandatory — HELM never shows an error without
 * telling the user exactly what to do next.
 */
export class HelmError extends Error {
  /** The specific remediation instruction to show the user. */
  readonly fix: string;

  constructor(what: string, fix: string) {
    super(what);
    this.name = "HelmError";
    this.fix = fix;
  }
}

/**
 * Formats a HelmError into the CHIEF visual design error format:
 * ```
 * ✗ Error: [what]
 *   → [fix]
 * ```
 *
 * Output is plain text. Callers apply chalk colouring if needed.
 */
export function formatHelmError(error: HelmError): string {
  return `✗ Error: ${error.message}\n  → ${error.fix}`;
}

/**
 * Formats an unexpected (non-HelmError) exception for display.
 * Used by the top-level error handler in index.ts.
 *
 * The error message is surfaced as-is. No fix suggestion is provided
 * because the cause is not a known application state.
 */
export function formatUnexpectedError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : String(error);
  return `✗ Unexpected error: ${message}\n  → This is a bug. Please report it at https://github.com/joselvelez/chief/issues`;
}

/**
 * Asserts that a value is not null or undefined at a known-safe
 * location, throwing HelmError with the provided context if it is.
 *
 * Use this instead of non-null assertions (!) to keep error messages
 * actionable rather than crashing silently.
 */
export function assertDefined<T>(
  value: T | null | undefined,
  what: string,
  fix: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new HelmError(what, fix);
  }
}
