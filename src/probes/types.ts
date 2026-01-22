export interface GitHubRepo {
  owner: string;
  repo: string;
}

export interface ProbeResult {
  packageName: string;
  githubRepo: GitHubRepo | null;
  version: string | null;
  error?: string;
}

/**
 * Parse a GitHub URL into owner/repo
 * Handles: https://github.com/owner/repo
 *          git+https://github.com/owner/repo.git
 *          git@github.com:owner/repo.git
 *          https://github.com/owner/repo/tree/main (strips path)
 */
export function parseGitHubUrl(url: string): GitHubRepo | null {
  if (!url) return null;

  // Clean up common prefixes/suffixes
  const cleaned = url
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '');

  // Handle git@github.com:owner/repo format
  const sshMatch = cleaned.match(/git@github\.com:([^/]+)\/([^/]+)/);
  if (sshMatch?.[1] && sshMatch[2]) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  // Handle https://github.com/owner/repo format
  const httpsMatch = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (httpsMatch?.[1] && httpsMatch[2]) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  return null;
}
