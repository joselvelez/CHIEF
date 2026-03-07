/**
 * @file CHIEF visual design system.
 *
 * Single source of truth for all colours and status symbols used
 * across HELM terminal output and Ink components. All values are
 * hex strings compatible with chalk's hex() API and Ink's color prop.
 *
 * Defined in PRD Section 12.
 */

/**
 * Colour palette for the CHIEF design system.
 *
 * Semantic names (dispatch, prep, yours, skip) correspond to the four
 * classification states. Utility names (border, text, muted, success,
 * warning, error, accent) are used for structural chrome.
 */
export const theme = {
  /** Classification: AI can handle fully. */
  dispatch: "#22c55e",
  /** Classification: AI gets 80% there, human finishes. */
  prep: "#eab308",
  /** Classification: Requires human judgment. */
  yours: "#ef4444",
  /** Classification: Not actionable today. */
  skip: "#6b7280",

  /** Panel and row border lines. */
  border: "#334155",
  /** Primary text on dark background. */
  text: "#f1f5f9",
  /** Secondary/subdued text. */
  muted: "#94a3b8",

  /** Positive outcome indicator. */
  success: "#22c55e",
  /** Non-blocking issue indicator. */
  warning: "#f59e0b",
  /** Blocking failure indicator. */
  error: "#ef4444",
  /** Highlight / interactive accent. */
  accent: "#6366f1",
} as const;

/**
 * Unicode status symbols used in all HELM output.
 * Consistent placement: symbol always precedes the label it qualifies.
 */
export const symbol = {
  success: "✓",
  error: "✗",
  warning: "⚠",
  disabled: "○",
  bullet: "·",
  arrow: "→",
  info: "ℹ",
} as const;

/**
 * Header format string template.
 * Usage: replace [SCREEN], [USERNAME], [CONTEXT] at render time.
 * Context segment is optional — omit trailing " · [CONTEXT]" when absent.
 */
export const HEADER_FORMAT = "CHIEF  ·  [SCREEN]  ·  [USERNAME]  ·  [CONTEXT]";
