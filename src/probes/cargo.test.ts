import { describe, expect, test } from 'bun:test';
import { probe } from './cargo.js';

describe('cargo probe', () => {
  test('finds ripgrep', async () => {
    const result = await probe('ripgrep');
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

  test('finds fd-find (fd)', async () => {
    // Note: The crate is named fd-find, not fd
    const result = await probe('fd-find');
    console.log('fd-find result:', result);

    expect(result.packageName).toBe('fd-find');
    expect(result.githubRepo).toEqual({ owner: 'sharkdp', repo: 'fd' });
    expect(result.version).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('returns error for unknown crate', async () => {
    const result = await probe('definitely-not-a-real-crate-xyz-12345');
    console.log('unknown result:', result);

    expect(result.githubRepo).toBeNull();
    expect(result.error).toBeTruthy();
  });
});
