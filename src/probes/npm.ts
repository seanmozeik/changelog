import { $ } from 'bun';
import { type ProbeResult, parseGitHubUrl } from './types.js';

/**
 * Get npm package name from a global command
 * For global packages, the command name often matches the package name
 */
async function getNpmPackageName(command: string): Promise<string | null> {
  // Check if it's a valid npm package
  try {
    await $`npm view ${command} name`.quiet();
    return command;
  } catch {
    return null;
  }
}

/**
 * Probe npm registry for package info and GitHub repo
 */
export async function probe(command: string): Promise<ProbeResult> {
  const packageName = await getNpmPackageName(command);

  if (!packageName) {
    return {
      error: `Not found in npm: ${command}`,
      githubRepo: null,
      packageName: command,
      version: null
    };
  }

  try {
    // Get repository URL and version in parallel
    const [repoUrl, version] = await Promise.all([
      $`npm view ${packageName} repository.url`
        .text()
        .then((s) => s.trim())
        .catch(() => ''),
      $`npm view ${packageName} version`
        .text()
        .then((s) => s.trim())
        .catch(() => null)
    ]);

    const githubRepo = parseGitHubUrl(repoUrl);

    return {
      error: githubRepo ? undefined : 'No GitHub URL found in package',
      githubRepo,
      packageName,
      version
    };
  } catch (err) {
    return {
      error: `npm view failed: ${err instanceof Error ? err.message : String(err)}`,
      githubRepo: null,
      packageName,
      version: null
    };
  }
}
