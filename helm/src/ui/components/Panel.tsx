/**
 * @file Panel Ink component.
 *
 * A bordered container that wraps content in the CHIEF single-border
 * style. All interactive HELM views (HumanGate, AgentProgress,
 * CompletionReport) are composed inside a Panel.
 *
 * Used in Phase 2 interactive views.
 */

import React from "react";
import { Box } from "ink";
import { theme } from "../theme.js";

/** Props for the Panel component. */
export interface PanelProps {
  /** Content to render inside the bordered container. */
  children: React.ReactNode;
  /**
   * Total column width of the panel including borders.
   * Defaults to 62 columns to match the Phase 1 static panel width.
   */
  width?: number;
}

/**
 * Bordered panel container using the CHIEF border colour.
 *
 * Uses Ink's built-in borderStyle so that the single-line box
 * characters are rendered correctly across all supported terminals.
 * Horizontal padding of 1 column is applied inside the border on
 * each side.
 */
export function Panel({ children, width = 62 }: PanelProps): React.ReactElement {
  return (
    <Box
      borderStyle="single"
      borderColor={theme.border}
      width={width}
      flexDirection="column"
      paddingX={1}
    >
      {children}
    </Box>
  );
}
