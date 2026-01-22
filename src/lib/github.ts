import { $ } from 'bun';
import type { GitHubRepo } from '../probes/types';

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
  draft: boolean;
}

export interface ChangelogResult {
  type: 'release' | 'changelog';
  content: string;
  url: string;
  version?: string;
}

/**
 * Get GitHub auth token from gh CLI if available
 */
export async function getGitHubToken(): Promise<string | null> {
  try {
    const token = await $`gh auth token`.text();
    return token.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Make an authenticated GitHub API request
 */
async function githubFetch(
  path: string,
  token: string | null,
  extraHeaders: Record<string, string> = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'changelog-cli',
    ...extraHeaders
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`https://api.github.com${path}`, { headers });
}

/**
 * Get the latest release for a repo
 */
export async function getLatestRelease(
  repo: GitHubRepo,
  token: string | null
): Promise<GitHubRelease | null> {
  const response = await githubFetch(`/repos/${repo.owner}/${repo.repo}/releases/latest`, token);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${error}`);
  }

  return response.json() as Promise<GitHubRelease>;
}

/**
 * Get the last N releases for a repo
 */
export async function getRecentReleases(
  repo: GitHubRepo,
  count: number,
  token: string | null
): Promise<GitHubRelease[]> {
  const response = await githubFetch(
    `/repos/${repo.owner}/${repo.repo}/releases?per_page=${count}`,
    token
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${error}`);
  }

  const releases = (await response.json()) as GitHubRelease[];
  return releases.filter((r) => !r.draft);
}

/**
 * Get a release by tag name
 */
export async function getReleaseByTag(
  repo: GitHubRepo,
  tag: string,
  token: string | null
): Promise<GitHubRelease | null> {
  // Try with 'v' prefix first, then without
  const tagsToTry = tag.startsWith('v') ? [tag, tag.slice(1)] : [`v${tag}`, tag];

  for (const t of tagsToTry) {
    const response = await githubFetch(
      `/repos/${repo.owner}/${repo.repo}/releases/tags/${t}`,
      token
    );

    if (response.ok) {
      return response.json() as Promise<GitHubRelease>;
    }

    if (response.status !== 404) {
      const error = await response.text();
      throw new Error(`GitHub API error ${response.status}: ${error}`);
    }
  }

  return null;
}

/**
 * Get raw CHANGELOG.md content from a repo
 */
export async function getChangelog(
  repo: GitHubRepo,
  token: string | null
): Promise<{ content: string; url: string } | null> {
  // Try common changelog file names
  const filenames = ['CHANGELOG.md', 'Changelog.md', 'changelog.md', 'CHANGES.md', 'HISTORY.md'];

  for (const filename of filenames) {
    const response = await githubFetch(
      `/repos/${repo.owner}/${repo.repo}/contents/${filename}`,
      token,
      { Accept: 'application/vnd.github.v3.raw' }
    );

    if (response.ok) {
      const content = await response.text();
      const url = `https://github.com/${repo.owner}/${repo.repo}/blob/HEAD/${filename}`;
      return { content, url };
    }

    if (response.status !== 404) {
      const error = await response.text();
      throw new Error(`GitHub API error ${response.status}: ${error}`);
    }
  }

  return null;
}

/**
 * Get changelog content - tries releases first, then CHANGELOG.md
 */
export async function getChangelogContent(
  repo: GitHubRepo,
  options: { tag?: string } = {}
): Promise<ChangelogResult> {
  const token = await getGitHubToken();

  // Try to get release
  const release = options.tag
    ? await getReleaseByTag(repo, options.tag, token)
    : await getLatestRelease(repo, token);

  if (release?.body?.trim()) {
    return {
      content: release.body,
      type: 'release',
      url: release.html_url,
      version: release.tag_name
    };
  }

  // No release or empty body - try CHANGELOG.md
  const changelog = await getChangelog(repo, token);

  if (changelog) {
    return {
      content: changelog.content,
      type: 'changelog',
      url: changelog.url
    };
  }

  // Nothing found
  const repoUrl = `https://github.com/${repo.owner}/${repo.repo}`;
  throw new Error(
    `No release notes or CHANGELOG.md found for ${repo.owner}/${repo.repo}\nCheck: ${repoUrl}/releases`
  );
}
