import { type ProbeResult, parseGitHubUrl } from './types';

interface CratesIoResponse {
  crate: {
    name: string;
    repository: string | null;
    max_stable_version: string;
  };
}

/**
 * Probe crates.io for package info and GitHub repo
 * Uses the crates.io API directly (doesn't require cargo installed)
 */
export async function probe(command: string): Promise<ProbeResult> {
  try {
    const response = await fetch(`https://crates.io/api/v1/crates/${command}`, {
      headers: {
        'User-Agent': 'changelog-cli (github.com/your/repo)'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          error: `Not found on crates.io: ${command}`,
          githubRepo: null,
          packageName: command,
          version: null
        };
      }
      throw new Error(`crates.io returned ${response.status}`);
    }

    const data = (await response.json()) as CratesIoResponse;
    const { crate } = data;

    const githubRepo = parseGitHubUrl(crate.repository || '');

    return {
      error: githubRepo ? undefined : 'No GitHub URL found in crate',
      githubRepo,
      packageName: crate.name,
      version: crate.max_stable_version
    };
  } catch (err) {
    return {
      error: `crates.io lookup failed: ${err instanceof Error ? err.message : String(err)}`,
      githubRepo: null,
      packageName: command,
      version: null
    };
  }
}
