import { $ } from 'bun';
import { type ProbeResult, parseGitHubUrl } from './types';

/**
 * Extract package name from resolved path
 * /path/to/node_modules/@biomejs/biome/bin/biome -> @biomejs/biome
 */
function extractPackageFromPath(resolvedPath: string): string | null {
  const match = resolvedPath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
  return match?.[1] ?? null;
}

/**
 * Get npm package name from command and resolved path
 */
async function getNpmPackageName(command: string, resolvedPath?: string): Promise<string | null> {
  // Try to extract package name from resolved path (works for bun, npm globals, etc.)
  if (resolvedPath) {
    const pkgName = extractPackageFromPath(resolvedPath);
    if (pkgName) {
      try {
        await $`npm view ${pkgName} name`.quiet();
        return pkgName;
      } catch {
        // Package might not be on npm, continue
      }
    }
  }

  // Check if command name is a valid npm package
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
export async function probe(command: string, resolvedPath?: string): Promise<ProbeResult> {
  const packageName = await getNpmPackageName(command, resolvedPath);

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
