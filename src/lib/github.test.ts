import { describe, expect, test } from 'bun:test';
import {
  getChangelog,
  getChangelogContent,
  getGitHubToken,
  getLatestRelease,
  getReleaseByTag
} from './github';

describe('getGitHubToken', () => {
  test('returns token or null', async () => {
    const token = await getGitHubToken();
    // Token may or may not be available depending on gh auth status
    expect(token === null || typeof token === 'string').toBe(true);
    if (token) {
      expect(token.length).toBeGreaterThan(0);
    }
  });
});

describe('getLatestRelease', () => {
  test('gets latest release for ripgrep', async () => {
    const token = await getGitHubToken();
    const release = await getLatestRelease({ owner: 'BurntSushi', repo: 'ripgrep' }, token);
    console.log('ripgrep latest release:', release?.tag_name);

    expect(release).not.toBeNull();
    expect(release?.tag_name).toBeTruthy();
    expect(release?.html_url).toContain('github.com');
  });

  test('returns null for non-existent repo', async () => {
    const token = await getGitHubToken();
    const release = await getLatestRelease(
      { owner: 'definitely-not-real', repo: 'fake-repo-xyz' },
      token
    );

    expect(release).toBeNull();
  });
});

describe('getReleaseByTag', () => {
  test('gets release by tag with v prefix', async () => {
    const token = await getGitHubToken();
    const release = await getReleaseByTag({ owner: 'sharkdp', repo: 'bat' }, 'v0.24.0', token);
    console.log('bat v0.24.0 release:', release?.tag_name);

    expect(release).not.toBeNull();
    expect(release?.tag_name).toBe('v0.24.0');
  });

  test('gets release by tag without v prefix (tries both)', async () => {
    const token = await getGitHubToken();
    const release = await getReleaseByTag(
      { owner: 'sharkdp', repo: 'bat' },
      '0.24.0', // Without v prefix
      token
    );

    expect(release).not.toBeNull();
    expect(release?.tag_name).toBe('v0.24.0');
  });

  test('returns null for non-existent tag', async () => {
    const token = await getGitHubToken();
    const release = await getReleaseByTag({ owner: 'sharkdp', repo: 'bat' }, 'v999.999.999', token);

    expect(release).toBeNull();
  });
});

describe('getChangelog', () => {
  test('gets CHANGELOG.md from repo', async () => {
    const token = await getGitHubToken();
    // prettier has a CHANGELOG.md
    const changelog = await getChangelog({ owner: 'prettier', repo: 'prettier' }, token);
    console.log('prettier CHANGELOG.md length:', changelog?.content.length);

    expect(changelog).not.toBeNull();
    expect(changelog?.content.length).toBeGreaterThan(100);
    expect(changelog?.url).toContain('github.com');
  });
});

describe('getChangelogContent', () => {
  test('gets release content for bat', async () => {
    const result = await getChangelogContent({ owner: 'sharkdp', repo: 'bat' });
    console.log('bat changelog type:', result.type, 'version:', result.version);

    expect(result.type).toBe('release');
    expect(result.content.length).toBeGreaterThan(10);
    expect(result.url).toContain('github.com');
    expect(result.version).toBeTruthy();
  });

  test('gets specific version for bat', async () => {
    const result = await getChangelogContent({ owner: 'sharkdp', repo: 'bat' }, { tag: 'v0.24.0' });
    console.log('bat v0.24.0 changelog:', result.version);

    expect(result.version).toBe('v0.24.0');
  });
});
