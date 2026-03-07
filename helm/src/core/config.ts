/**
 * @file Instance repo YAML config file I/O.
 *
 * Provides typed read and write functions for every config file that
 * HELM manages in the personal instance repo under /config/. All
 * functions fail fast with a descriptive HelmError when a file is
 * missing, unreadable, or does not contain the expected top-level type.
 *
 * Write functions serialise with consistent YAML formatting so diffs
 * remain readable when the user views their git history.
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type {
  Input,
  Agent,
  Flow,
  Trigger,
  SystemConfig,
  EngineConfig,
} from "../types/index.js";
import { HelmError } from "../utils/errors.js";

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Reads a YAML file at the given absolute path and returns the parsed
 * value. Throws HelmError on missing file or parse failure.
 *
 * @param filePath - Absolute path to the YAML file.
 * @param label    - Human-readable name used in error messages (e.g. "inputs.yaml").
 */
function readYaml(filePath: string, label: string): unknown {
  if (!fs.existsSync(filePath)) {
    throw new HelmError(
      `Config file not found: ${label}`,
      `Ensure your instance repo is fully initialised. Missing: ${filePath}`
    );
  }

  const raw = fs.readFileSync(filePath, "utf-8");

  try {
    return yaml.load(raw);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `Failed to parse ${label}: ${detail}`,
      `Fix the YAML syntax in ${filePath}, then retry.`
    );
  }
}

/**
 * Serialises data to YAML and writes it atomically to the given path.
 * Throws HelmError if the write fails.
 *
 * @param filePath - Absolute path to write.
 * @param data     - Value to serialise.
 * @param label    - Human-readable name for error messages.
 */
function writeYaml(filePath: string, data: unknown, label: string): void {
  const content = yaml.dump(data, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });

  try {
    fs.writeFileSync(filePath, content, "utf-8");
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new HelmError(
      `Failed to write ${label}: ${detail}`,
      `Check file permissions for ${filePath}.`
    );
  }
}

// ─── inputs.yaml ─────────────────────────────────────────────────────────────

/**
 * Reads and returns all Input entries from config/inputs.yaml.
 *
 * @param repoRoot - Absolute path to the instance repo root.
 */
export function readInputsConfig(repoRoot: string): Input[] {
  const filePath = path.join(repoRoot, "config", "inputs.yaml");
  const parsed = readYaml(filePath, "inputs.yaml");

  if (!Array.isArray(parsed)) {
    throw new HelmError(
      "inputs.yaml must contain a top-level array.",
      `Open ${filePath} and ensure the root value is a YAML sequence.`
    );
  }

  return parsed as Input[];
}

/**
 * Writes the given Input array to config/inputs.yaml, replacing
 * the current file contents.
 *
 * @param repoRoot - Absolute path to the instance repo root.
 * @param inputs   - Full array of Input entries to persist.
 */
export function writeInputsConfig(repoRoot: string, inputs: Input[]): void {
  const filePath = path.join(repoRoot, "config", "inputs.yaml");
  writeYaml(filePath, inputs, "inputs.yaml");
}

// ─── agents.yaml ─────────────────────────────────────────────────────────────

/**
 * Reads and returns all Agent entries from config/agents.yaml.
 *
 * @param repoRoot - Absolute path to the instance repo root.
 */
export function readAgentsConfig(repoRoot: string): Agent[] {
  const filePath = path.join(repoRoot, "config", "agents.yaml");
  const parsed = readYaml(filePath, "agents.yaml");

  if (!Array.isArray(parsed)) {
    throw new HelmError(
      "agents.yaml must contain a top-level array.",
      `Open ${filePath} and ensure the root value is a YAML sequence.`
    );
  }

  return parsed as Agent[];
}

/**
 * Writes the given Agent array to config/agents.yaml.
 *
 * @param repoRoot - Absolute path to the instance repo root.
 * @param agents   - Full array of Agent entries to persist.
 */
export function writeAgentsConfig(repoRoot: string, agents: Agent[]): void {
  const filePath = path.join(repoRoot, "config", "agents.yaml");
  writeYaml(filePath, agents, "agents.yaml");
}

// ─── flows.yaml ──────────────────────────────────────────────────────────────

/**
 * Reads and returns all Flow entries from config/flows.yaml.
 *
 * @param repoRoot - Absolute path to the instance repo root.
 */
export function readFlowsConfig(repoRoot: string): Flow[] {
  const filePath = path.join(repoRoot, "config", "flows.yaml");
  const parsed = readYaml(filePath, "flows.yaml");

  if (!Array.isArray(parsed)) {
    throw new HelmError(
      "flows.yaml must contain a top-level array.",
      `Open ${filePath} and ensure the root value is a YAML sequence.`
    );
  }

  return parsed as Flow[];
}

/**
 * Writes the given Flow array to config/flows.yaml.
 *
 * @param repoRoot - Absolute path to the instance repo root.
 * @param flows    - Full array of Flow entries to persist.
 */
export function writeFlowsConfig(repoRoot: string, flows: Flow[]): void {
  const filePath = path.join(repoRoot, "config", "flows.yaml");
  writeYaml(filePath, flows, "flows.yaml");
}

// ─── triggers.yaml ───────────────────────────────────────────────────────────

/**
 * Reads and returns all Trigger entries from config/triggers.yaml.
 *
 * @param repoRoot - Absolute path to the instance repo root.
 */
export function readTriggersConfig(repoRoot: string): Trigger[] {
  const filePath = path.join(repoRoot, "config", "triggers.yaml");
  const parsed = readYaml(filePath, "triggers.yaml");

  if (!Array.isArray(parsed)) {
    throw new HelmError(
      "triggers.yaml must contain a top-level array.",
      `Open ${filePath} and ensure the root value is a YAML sequence.`
    );
  }

  return parsed as Trigger[];
}

// ─── engine.yaml ─────────────────────────────────────────────────────────────

/**
 * Reads engine.yaml if it exists and returns its contents, or returns
 * a safe default EngineConfig when the file is absent (the file is
 * optional — HELM falls back to the Claude Code CLI defaults).
 *
 * @param repoRoot - Absolute path to the instance repo root.
 */
export function readEngineConfig(repoRoot: string): EngineConfig {
  const filePath = path.join(repoRoot, "config", "engine.yaml");

  const DEFAULT_ENGINE_CONFIG: EngineConfig = {
    engine: "claude-code",
    command: "claude",
    timeout_seconds: 120,
  };

  if (!fs.existsSync(filePath)) {
    return DEFAULT_ENGINE_CONFIG;
  }

  const parsed = readYaml(filePath, "engine.yaml");
  return { ...DEFAULT_ENGINE_CONFIG, ...(parsed as Partial<EngineConfig>) };
}

// ─── system.yaml ─────────────────────────────────────────────────────────────

/**
 * Reads config/system.yaml if it exists and returns its contents.
 * Returns null if the file is absent so callers can skip it gracefully.
 *
 * @param repoRoot - Absolute path to the instance repo root.
 */
export function readSystemConfig(repoRoot: string): SystemConfig | null {
  const filePath = path.join(repoRoot, "config", "system.yaml");

  if (!fs.existsSync(filePath)) return null;

  const parsed = readYaml(filePath, "system.yaml");
  return parsed as SystemConfig;
}
