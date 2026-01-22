import { describe, expect, test } from 'bun:test';
import { probe } from './pypi';

describe('pypi probe', () => {
  test('finds httpie', async () => {
    const result = await probe('httpie');
    console.log('httpie result:', result);

    expect(result.packageName).toBe('httpie');
    expect(result.githubRepo).toEqual({ owner: 'httpie', repo: 'cli' });
    expect(result.version).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('finds black', async () => {
    const result = await probe('black');
    console.log('black result:', result);

    expect(result.packageName).toBe('black');
    expect(result.githubRepo).toEqual({ owner: 'psf', repo: 'black' });
    expect(result.version).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('finds ruff', async () => {
    const result = await probe('ruff');
    console.log('ruff result:', result);

    expect(result.packageName).toBe('ruff');
    expect(result.githubRepo).toEqual({ owner: 'astral-sh', repo: 'ruff' });
    expect(result.version).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('returns error for unknown package', async () => {
    const result = await probe('definitely-not-a-real-package-xyz-12345');
    console.log('unknown result:', result);

    expect(result.githubRepo).toBeNull();
    expect(result.error).toBeTruthy();
  });
});
