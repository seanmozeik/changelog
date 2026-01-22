import { $ } from 'bun';

/**
 * Parse version from command output
 * Handles various formats:
 * - "bat 0.24.0"
 * - "ripgrep 14.1.0"
 * - "prettier 3.2.5"
 * - "Python 3.11.0"
 * - "v1.2.3"
 * - "1.2.3"
 */
export function parseVersion(output: string): string | null {
  // Match semver-like patterns: X.Y.Z, vX.Y.Z, X.Y.Z-beta, etc.
  const patterns = [
    /(\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?)/, // 1.2.3, 1.2.3-beta, 1.2.3+build
    /v(\d+\.\d+\.\d+)/, // v1.2.3
    /(\d+\.\d+)/ // 1.2 (some tools use this)
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get version of an installed command
 * Tries --version, -V, and version flags
 */
export async function getCommandVersion(command: string): Promise<string | null> {
  const flags = ['--version', '-V', 'version', '-v'];

  for (const flag of flags) {
    try {
      // Use quiet() to suppress stderr, capture stdout
      const result = await $`${command} ${flag}`.quiet().text();
      const version = parseVersion(result);
      if (version) {
        return version;
      }
    } catch {
      // Try next flag
    }
  }

  return null;
}
