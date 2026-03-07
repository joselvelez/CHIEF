/**
 * @file Header Ink component.
 *
 * Renders the top chrome bar used in all interactive HELM panels.
 * Format: CHIEF  ·  [SCREEN]  ·  [username]  ·  [context]
 *
 * Context is optional. When omitted, the trailing separator and segment
 * are not rendered so the header does not end with a dangling "·".
 *
 * Used in Phase 2 interactive views (HumanGate, AgentProgress).
 * Phase 1 static commands (helm status) render equivalent chrome
 * inline using chalk + box-drawing helpers.
 */

import React from "react";
import { Box, Text } from "ink";
import { theme, symbol } from "../theme.js";

/** Props for the Header component. */
export interface HeaderProps {
  /** Screen name displayed in the second segment, e.g. "STATUS". */
  screen: string;
  /** Active username displayed in the third segment. */
  username: string;
  /** Optional contextual label for the fourth segment (flow id, date, etc.). */
  context?: string;
}

/**
 * Top-level header bar following the CHIEF visual design system.
 *
 * All text segments are separated by the design system bullet character.
 * The "CHIEF" prefix is always bold. The screen name uses the accent
 * colour to draw the eye. Username and context use the muted colour.
 */
export function Header({ screen, username, context }: HeaderProps): React.ReactElement {
  const sep = (
    <Text color={theme.border}>{"  " + symbol.bullet + "  "}</Text>
  );

  return (
    <Box>
      <Text bold color={theme.text}>
        CHIEF
      </Text>
      {sep}
      <Text bold color={theme.accent}>
        {screen}
      </Text>
      {sep}
      <Text color={theme.muted}>{username}</Text>
      {context !== undefined && (
        <>
          {sep}
          <Text color={theme.muted}>{context}</Text>
        </>
      )}
    </Box>
  );
}
