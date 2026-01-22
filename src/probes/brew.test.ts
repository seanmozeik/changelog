import { describe, expect, test } from 'bun:test';
import { probe } from './brew';
import { parseGitHubUrl } from './types';

describe('parseGitHubUrl', () => {
  test('parses https URL', () => {
    const result = parseGitHubUrl('https://github.com/BurntSushi/ripgrep');
    expect(result).toEqual({ owner: 'BurntSushi', repo: 'ripgrep' });
  });

  test('parses git+ prefix', () => {
    const result = parseGitHubUrl('git+https://github.com/owner/repo.git');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  test('parses SSH URL', () => {
    const result = parseGitHubUrl('git@github.com:owner/repo.git');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  test('strips trailing path', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo/tree/main');
    expect(result).toEqual({ owner: 'owner', repo: 'repo' });
  });

  test('returns null for non-GitHub URL', () => {
    const result = parseGitHubUrl('https://gitlab.com/owner/repo');
    expect(result).toBeNull();
  });

  test('returns null for empty string', () => {
    const result = parseGitHubUrl('');
    expect(result).toBeNull();
  });
});

describe('brew probe', () => {
  test('finds ripgrep', async () => {
    const result = await probe('rg');
    console.log('ripgrep result:', result);

    expect(result.packageName).toBe('ripgrep');
    expect(result.githubRepo).toEqual({ owner: 'BurntSushi', repo: 'ripgrep' });
    expect(result.version).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('finds bat', async () => {
    const result = await probe('bat');
    console.log('bat result:', result);

    expect(result.packageName).toBe('bat');
    expect(result.githubRepo).toEqual({ owner: 'sharkdp', repo: 'bat' });
    expect(result.version).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('finds fd', async () => {
    const result = await probe('fd');
    console.log('fd result:', result);

    expect(result.packageName).toBe('fd');
    expect(result.githubRepo).toEqual({ owner: 'sharkdp', repo: 'fd' });
    expect(result.version).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('returns error for unknown package', async () => {
    const result = await probe('definitely-not-a-real-package-xyz');
    console.log('unknown result:', result);

    expect(result.githubRepo).toBeNull();
    expect(result.error).toBeTruthy();
  });
});
