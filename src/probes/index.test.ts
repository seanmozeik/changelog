import { describe, expect, test } from 'bun:test';
import { detectPackageManager, probe, whichCommand } from './index';

describe('detectPackageManager', () => {
  test('detects Homebrew from /opt/homebrew/', () => {
    expect(detectPackageManager('/opt/homebrew/bin/rg')).toBe('brew');
    expect(detectPackageManager('/opt/homebrew/Cellar/ripgrep/14.0.0/bin/rg')).toBe('brew');
  });

  test('detects Homebrew from /usr/local/Cellar/', () => {
    expect(detectPackageManager('/usr/local/Cellar/bat/0.24.0/bin/bat')).toBe('brew');
  });

  test('detects Cargo from ~/.cargo/bin/', () => {
    expect(detectPackageManager('/Users/sean/.cargo/bin/rg')).toBe('cargo');
  });

  test('detects npm from node_modules/.bin/', () => {
    expect(
      detectPackageManager('/Users/sean/.nvm/versions/node/v20/lib/node_modules/.bin/prettier')
    ).toBe('npm');
    expect(detectPackageManager('/usr/local/lib/node_modules/.bin/eslint')).toBe('npm');
  });

  test('detects pypi from ~/.local/bin/', () => {
    expect(detectPackageManager('/Users/sean/.local/bin/httpie')).toBe('pypi');
  });

  test('detects pypi from venv paths', () => {
    expect(detectPackageManager('/Users/sean/project/.venv/bin/black')).toBe('pypi');
    expect(detectPackageManager('/Users/sean/project/venv/bin/ruff')).toBe('pypi');
  });

  test('defaults /usr/local/bin/ to brew', () => {
    expect(detectPackageManager('/usr/local/bin/bat')).toBe('brew');
  });

  test('returns null for unknown paths', () => {
    expect(detectPackageManager('/usr/bin/ls')).toBeNull();
    expect(detectPackageManager('/some/random/path/cmd')).toBeNull();
  });
});

describe('whichCommand', () => {
  test('finds existing commands', async () => {
    const result = await whichCommand('ls');
    expect(result).toBeTruthy();
    expect(result?.binPath).toContain('/ls');
    expect(result?.resolvedPath).toBeTruthy();
  });

  test('returns null for non-existent commands', async () => {
    const result = await whichCommand('definitely-not-a-real-command-xyz');
    expect(result).toBeNull();
  });
});

describe('probe (integration)', () => {
  test('probes bat (installed via brew)', async () => {
    const result = await probe('bat');
    console.log('bat probe result:', result);

    // bat should be found via brew on this system
    if (result.manager === 'brew') {
      expect(result.packageName).toBe('bat');
      expect(result.githubRepo).toEqual({ owner: 'sharkdp', repo: 'bat' });
      expect(result.version).toBeTruthy();
      expect(result.binPath).toBeTruthy();
    } else {
      // If not brew, just check we got some result
      expect(result.binPath).toBeTruthy();
    }
  });

  test('returns error for unknown command', async () => {
    const result = await probe('definitely-not-a-real-command-xyz');
    console.log('unknown probe result:', result);

    expect(result.manager).toBeNull();
    expect(result.binPath).toBeNull();
    expect(result.error).toContain('Command not found');
  });
});
