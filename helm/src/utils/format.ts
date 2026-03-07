/**
 * @file Terminal output formatting utilities.
 *
 * Covers date/time display, string padding, and the box-drawing
 * primitives used to render the CHIEF bordered panels (helm status,
 * helm sync output). All box-drawing functions accept chalk-coloured
 * strings and use visible-length calculation to ignore ANSI escape codes
 * when computing padding.
 */

import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

// ─── ANSI / Visible Length ────────────────────────────────────────────────────

/** Regex that matches all ANSI CSI escape sequences (colour, style, etc.). */
const ANSI_ESCAPE_RE = /\x1B\[[0-9;]*m/g;

/**
 * Returns the printable character count of a string, ignoring any
 * embedded ANSI escape sequences. Required for correct padding when
 * chalk-coloured content is placed inside fixed-width box rows.
 */
export function visibleLength(str: string): number {
  return str.replace(ANSI_ESCAPE_RE, "").length;
}

// ─── Box Drawing ─────────────────────────────────────────────────────────────

/**
 * Width of the horizontal rule (═ characters) between the two corner
 * glyphs. All box-drawing functions share this constant so panels
 * remain consistent across commands.
 */
export const BOX_RULE_WIDTH = 60;

/** Renders the top border of a CHIEF panel: ╔══...══╗ */
export function boxTop(): string {
  return `╔${"═".repeat(BOX_RULE_WIDTH)}╗`;
}

/** Renders an internal section divider: ╠══...══╣ */
export function boxDivider(): string {
  return `╠${"═".repeat(BOX_RULE_WIDTH)}╣`;
}

/** Renders the bottom border of a CHIEF panel: ╚══...══╝ */
export function boxBottom(): string {
  return `╚${"═".repeat(BOX_RULE_WIDTH)}╝`;
}

/**
 * Renders a single content row inside a CHIEF panel.
 *
 * The content string may contain chalk ANSI codes. Padding is calculated
 * using visibleLength so the right border aligns correctly regardless of
 * colour codes embedded in the content.
 *
 * @param content - The text to display, optionally chalk-coloured.
 * @param indent  - Leading spaces inside the left border. Defaults to 2.
 */
export function boxRow(content: string, indent = 2): string {
  const inner = `${" ".repeat(indent)}${content}`;
  const pad = BOX_RULE_WIDTH - visibleLength(inner);
  return `║${inner}${" ".repeat(Math.max(0, pad))}║`;
}

/** Renders an empty row (blank line inside the panel). */
export function boxEmpty(): string {
  return boxRow("");
}

// ─── Date / Time ─────────────────────────────────────────────────────────────

/**
 * Formats a Date into the header display string used in CHIEF panels:
 * "Saturday March 7"
 */
export function formatHeaderDate(date: Date): string {
  return format(date, "EEEE MMMM d");
}

/**
 * Formats an ISO timestamp into a concise human-readable label
 * suitable for the LAST RUNS section of helm status.
 *
 * - Same calendar day → "today H:mm a"
 * - Previous calendar day → "yesterday"
 * - Older → "N days ago"
 * - Empty/missing → "never"
 */
export function formatLastRun(isoTimestamp: string | undefined): string {
  if (!isoTimestamp) return "never";
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return "never";
  if (isToday(date)) return `today ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return "yesterday";
  return formatDistanceToNow(date, { addSuffix: true });
}

// ─── String Helpers ───────────────────────────────────────────────────────────

/**
 * Left-pads a string to a target visible width.
 * Safe for chalk-coloured strings.
 */
export function padEnd(str: string, targetWidth: number): string {
  const pad = targetWidth - visibleLength(str);
  return pad > 0 ? `${str}${" ".repeat(pad)}` : str;
}

/**
 * Truncates a string to a maximum visible width, appending "…" if
 * truncation occurred. Safe for plain strings only (no ANSI codes).
 */
export function truncate(str: string, maxWidth: number): string {
  if (str.length <= maxWidth) return str;
  return `${str.slice(0, maxWidth - 1)}…`;
}
