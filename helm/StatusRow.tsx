/**
 * @file StatusRow Ink component.
 *
 * A single horizontal row displaying a status symbol, a label, and an
 * optional detail string. Used inside Panel to build list-style sections
 * in interactive views (agent progress, completion reports).
 *
 * The four status variants map directly to the CHIEF design system
 * symbol and colour conventions defined in theme.ts.
 */

import React from "react";
import { Box, Text } from "ink";
import { theme, symbol } from "../theme.js";

/** The four supported visual states for a status row. */
export type StatusVariant = "success" | "error" | "warning" | "disabled";

/** Props for the StatusRow component. */
export interface StatusRowProps {
  /** Text label identifying the item (agent name, input name, etc.). */
  label: string;
  /** Visual variant that determines the symbol and colour. */
  status: StatusVariant;
  /**
   * Optional secondary text shown after the label.
   * Rendered in the muted colour (e.g. "connected", "12s", "drafting…").
   */
  detail?: string;
  /**
   * Fixed width for the label column in characters.
   * Defaults to 22 to align detail text across rows in a list.
   */
  labelWidth?: number;
}

const SYMBOLS: Record<StatusVariant, string> = {
  success: symbol.success,
  error: symbol.error,
  warning: symbol.warning,
  disabled: symbol.disabled,
};

const COLORS: Record<StatusVariant, string> = {
  success: theme.success,
  error: theme.error,
  warning: theme.warning,
  disabled: theme.skip,
};

/**
 * Renders a single status row with a leading symbol, a fixed-width
 * label column, and an optional trailing detail string.
 *
 * Label padding is applied in the Text content rather than via Ink
 * layout so the row renders correctly even in narrow terminals.
 */
export function StatusRow({
  label,
  status,
  detail,
  labelWidth = 22,
}: StatusRowProps): React.ReactElement {
  const paddedLabel = label.padEnd(labelWidth);

  return (
    <Box>
      <Text color={COLORS[status]}>{SYMBOLS[status]}</Text>
      <Text> </Text>
      <Text color={theme.text}>{paddedLabel}</Text>
      {detail !== undefined && (
        <Text color={theme.muted}>{detail}</Text>
      )}
    </Box>
  );
}
