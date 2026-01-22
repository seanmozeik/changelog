import { $ } from 'bun';
import { probe as brewProbe } from './brew.js';
import { probe as cargoProbe } from './cargo.js';
import { probe as npmProbe } from './npm.js';
import { probe as pypiProbe } from './pypi.js';
import type { ProbeResult } from './types.js';

export type PackageManager = 'brew' | 'cargo' | 'npm' | 'pypi';

export type { GitHubRepo, ProbeResult } from './types.js';

/**
 * Detect package manager from a binary's install path
 */
export function detectPackageManager(binPath: string): PackageManager | null {
  // Cargo: ~/.cargo/bin/
  if (binPath.includes('/.cargo/bin/')) {
    return 'cargo';
  }

  // Python (uv/pip): ~/.local/bin/ or venv paths
  if (
    binPath.includes('/.local/bin/') ||
    binPath.includes('/site-packages/') ||
    binPath.includes('/.venv/') ||
    binPath.includes('/venv/')
  ) {
    return 'pypi';
  }

  // npm: node_modules/.bin/
  if (binPath.includes('/node_modules/.bin/')) {
    return 'npm';
  }

  // Homebrew: /opt/homebrew/ or /usr/local/Cellar/
  if (
    binPath.includes('/opt/homebrew/') ||
    binPath.includes('/usr/local/Cellar/') ||
    binPath.includes('/Homebrew/')
  ) {
    return 'brew';
  }

  // Ambiguous: /usr/local/bin/ - could be brew or pip
  // Default to brew since it's more common for CLI tools on macOS
  if (binPath.includes('/usr/local/bin/')) {
    return 'brew';
  }

  return null;
}

/**
 * Find where a command is installed
 */
export async function whichCommand(command: string): Promise<string | null> {
  try {
    const path = await $`which ${command}`.text();
    return path.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Main probe function - finds command, detects package manager, and probes for GitHub repo
 */
export async function probe(
  command: string
): Promise<ProbeResult & { manager: PackageManager | null; binPath: string | null }> {
  const binPath = await whichCommand(command);

  if (!binPath) {
    return {
      binPath: null,
      error: `Command not found: ${command}`,
      githubRepo: null,
      manager: null,
      packageName: command,
      version: null
    };
  }

  const manager = detectPackageManager(binPath);

  if (!manager) {
    return {
      binPath,
      error: `Could not determine package manager for: ${binPath}`,
      githubRepo: null,
      manager: null,
      packageName: command,
      version: null
    };
  }

  // Route to the appropriate probe
  let result: ProbeResult;
  switch (manager) {
    case 'brew':
      result = await brewProbe(command);
      break;
    case 'npm':
      result = await npmProbe(command);
      break;
    case 'cargo':
      result = await cargoProbe(command);
      break;
    case 'pypi':
      result = await pypiProbe(command);
      break;
  }

  return {
    ...result,
    binPath,
    manager
  };
}
