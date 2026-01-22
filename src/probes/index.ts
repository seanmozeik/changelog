import { lstat, readlink } from 'node:fs/promises';
import { $ } from 'bun';
import { probe as brewProbe } from './brew';
import { probe as cargoProbe } from './cargo';
import { probe as npmProbe } from './npm';
import { probe as pypiProbe } from './pypi';
import type { ProbeResult } from './types';

export type PackageManager = 'brew' | 'cargo' | 'npm' | 'pypi';

export type { GitHubRepo, ProbeResult } from './types';

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

  // npm/bun: node_modules/.bin/ or ~/.bun/bin/
  if (binPath.includes('/node_modules/.bin/') || binPath.includes('/.bun/bin/')) {
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
 * Resolve symlink to get the actual file path
 */
async function resolveSymlink(path: string): Promise<string> {
  try {
    const stats = await lstat(path);
    if (stats.isSymbolicLink()) {
      const target = await readlink(path);
      // Handle relative symlinks
      if (!target.startsWith('/')) {
        const dir = path.substring(0, path.lastIndexOf('/'));
        return resolveSymlink(`${dir}/${target}`);
      }
      return resolveSymlink(target);
    }
    return path;
  } catch {
    return path;
  }
}

/**
 * Find where a command is installed and resolve any symlinks
 */
export async function whichCommand(
  command: string
): Promise<{ binPath: string; resolvedPath: string } | null> {
  try {
    const binPath = (await $`which ${command}`.text()).trim();
    if (!binPath) return null;
    const resolvedPath = await resolveSymlink(binPath);
    return { binPath, resolvedPath };
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
  const which = await whichCommand(command);

  if (!which) {
    return {
      binPath: null,
      error: `Command not found: ${command}`,
      githubRepo: null,
      manager: null,
      packageName: command,
      version: null
    };
  }

  const { binPath, resolvedPath } = which;

  // Use resolved path for package manager detection (follows symlinks)
  const manager = detectPackageManager(resolvedPath);

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
      result = await npmProbe(command, resolvedPath);
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
