import { describe, expect, test } from 'bun:test';
import { getCommandVersion, parseVersion } from './version.js';

describe('parseVersion', () => {
  test("parses 'bat 0.24.0' format", () => {
    expect(parseVersion('bat 0.24.0')).toBe('0.24.0');
  });

  test("parses 'ripgrep 14.1.0' format", () => {
    expect(parseVersion('ripgrep 14.1.0')).toBe('14.1.0');
  });

  test('parses version with newlines', () => {
    expect(parseVersion('bat 0.24.0\n')).toBe('0.24.0');
  });

  test("parses 'v1.2.3' format", () => {
    expect(parseVersion('v1.2.3')).toBe('1.2.3');
  });

  test('parses version with prerelease', () => {
    expect(parseVersion('1.2.3-beta.1')).toBe('1.2.3-beta.1');
  });

  test('parses version with build metadata', () => {
    expect(parseVersion('1.2.3+build.123')).toBe('1.2.3+build.123');
  });

  test("parses 'prettier 3.2.5' format", () => {
    expect(parseVersion('prettier 3.2.5')).toBe('3.2.5');
  });

  test('parses verbose output', () => {
    const output = `ripgrep 14.1.0
-SIMD -AVX (compiled)
+SIMD +AVX (runtime)`;
    expect(parseVersion(output)).toBe('14.1.0');
  });

  test('returns null for no version', () => {
    expect(parseVersion('no version here')).toBeNull();
  });
});

describe('getCommandVersion', () => {
  test('gets bat version', async () => {
    const version = await getCommandVersion('bat');
    console.log('bat version:', version);

    expect(version).toBeTruthy();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test('gets rg version', async () => {
    const version = await getCommandVersion('rg');
    console.log('rg version:', version);

    expect(version).toBeTruthy();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test('returns null for non-existent command', async () => {
    const version = await getCommandVersion('definitely-not-a-real-command-xyz');
    expect(version).toBeNull();
  });
});
