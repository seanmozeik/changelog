import { $ } from 'bun';
import { type ProbeResult, parseGitHubUrl } from './types';

interface BrewFormula {
  name: string;
  homepage: string;
  versions: {
    stable: string;
  };
  urls?: {
    stable?: {
      url: string;
    };
  };
}

interface BrewInfoJson {
  formulae: BrewFormula[];
  casks: Array<{
    token: string;
    homepage: string;
    version: string;
    url: string;
  }>;
}

/**
 * Get the Homebrew formula/cask name for a command
 * Uses `brew which-formula` for commands, falls back to direct lookup
 */
async function getBrewPackageName(command: string): Promise<string | null> {
  // Try which-formula first (finds formula that provides the command)
  try {
    const result = await $`brew which-formula ${command}`.text();
    const name = result.trim();
    if (name) return name;
  } catch {
    // Command might be the formula name itself
  }

  // Check if it's a direct formula name
  try {
    await $`brew info ${command}`.quiet();
    return command;
  } catch {
    return null;
  }
}

/**
 * Probe Homebrew for package info and GitHub repo
 */
export async function probe(command: string): Promise<ProbeResult> {
  const packageName = await getBrewPackageName(command);

  if (!packageName) {
    return {
      error: `Not found in Homebrew: ${command}`,
      githubRepo: null,
      packageName: command,
      version: null
    };
  }

  try {
    const json = (await $`brew info --json=v2 ${packageName}`.json()) as BrewInfoJson;

    // Check formulae first, then casks
    const formula = json.formulae?.[0];
    const cask = json.casks?.[0];

    if (formula) {
      // Try homepage first, then source URL
      const githubRepo =
        parseGitHubUrl(formula.homepage) || parseGitHubUrl(formula.urls?.stable?.url || '');

      return {
        error: githubRepo ? undefined : 'No GitHub URL found in formula',
        githubRepo,
        packageName: formula.name,
        version: formula.versions.stable
      };
    }

    if (cask) {
      const githubRepo = parseGitHubUrl(cask.homepage) || parseGitHubUrl(cask.url);

      return {
        error: githubRepo ? undefined : 'No GitHub URL found in cask',
        githubRepo,
        packageName: cask.token,
        version: cask.version
      };
    }

    return {
      error: 'No formula or cask data returned',
      githubRepo: null,
      packageName,
      version: null
    };
  } catch (err) {
    return {
      error: `brew info failed: ${err instanceof Error ? err.message : String(err)}`,
      githubRepo: null,
      packageName,
      version: null
    };
  }
}
