import { type ProbeResult, parseGitHubUrl } from './types.js';

interface PyPIResponse {
  info: {
    name: string;
    version: string;
    home_page: string | null;
    project_urls: Record<string, string> | null;
  };
}

/**
 * Probe PyPI for package info and GitHub repo
 * Works for packages installed via pip, uv, or pipx
 */
export async function probe(command: string): Promise<ProbeResult> {
  try {
    const response = await fetch(`https://pypi.org/pypi/${command}/json`);

    if (!response.ok) {
      if (response.status === 404) {
        return {
          error: `Not found on PyPI: ${command}`,
          githubRepo: null,
          packageName: command,
          version: null
        };
      }
      throw new Error(`PyPI returned ${response.status}`);
    }

    const data = (await response.json()) as PyPIResponse;
    const { info } = data;

    // Find GitHub URL from project_urls or home_page
    const projectUrls = info.project_urls || {};
    const urlCandidates = [
      projectUrls.GitHub,
      projectUrls.Repository,
      projectUrls.Source,
      projectUrls['Source Code'],
      projectUrls.Homepage,
      info.home_page
    ];
    const githubUrl = urlCandidates.find((url) => url?.includes('github.com'));
    const githubRepo = parseGitHubUrl(githubUrl || '');

    return {
      error: githubRepo ? undefined : 'No GitHub URL found in package',
      githubRepo,
      packageName: info.name,
      version: info.version
    };
  } catch (err) {
    return {
      error: `PyPI lookup failed: ${err instanceof Error ? err.message : String(err)}`,
      githubRepo: null,
      packageName: command,
      version: null
    };
  }
}
