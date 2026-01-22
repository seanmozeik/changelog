import { describe, expect, test } from 'bun:test';
import { probe } from './npm.js';

describe('npm probe', () => {
  test('finds prettier', async () => {
    const result = await probe('prettier');
    console.log('prettier result:', result);

    expect(result.packageName).toBe('prettier');
    expect(result.githubRepo).toEqual({ owner: 'prettier', repo: 'prettier' });
    expect(result.version).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('finds eslint', async () => {
    const result = await probe('eslint');
    console.log('eslint result:', result);

    expect(result.packageName).toBe('eslint');
    expect(result.githubRepo).toEqual({ owner: 'eslint', repo: 'eslint' });
    expect(result.version).toBeTruthy();
    expect(result.error).toBeUndefined();
  });

  test('finds typescript', async () => {
    const result = await probe('typescript');
    console.log('typescript result:', result);

    expect(result.packageName).toBe('typescript');
    expect(result.githubRepo).toEqual({
      owner: 'microsoft',
      repo: 'TypeScript'
    });
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
