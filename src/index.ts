#!/usr/bin/env bun

import { $ } from 'bun';
import pc from 'picocolors';
import pkg from '../package.json';
import { type ChangelogResult, getChangelogContent } from './lib/github.js';
import { getCommandVersion } from './lib/version.js';
import { probe } from './probes/index.js';
import { showBanner } from './ui/banner.js';

// Parse CLI arguments
const args = Bun.argv.slice(2);

interface Flags {
  local: boolean;
  raw: boolean;
  json: boolean;
  open: boolean;
  help: boolean;
  version: boolean;
}

const FLAG_MAP: Record<string, keyof Flags> = {
  '--help': 'help',
  '--json': 'json',
  '--local': 'local',
  '--open': 'open',
  '--raw': 'raw',
  '--version': 'version',
  '-h': 'help',
  '-j': 'json',
  '-l': 'local',
  '-o': 'open',
  '-r': 'raw',
  '-v': 'version'
};

function parseArgs(args: string[]): { command: string | null; flags: Flags } {
  const flags: Flags = {
    help: false,
    json: false,
    local: false,
    open: false,
    raw: false,
    version: false
  };

  let command: string | null = null;

  for (const arg of args) {
    const flagKey = FLAG_MAP[arg];
    if (flagKey) {
      flags[flagKey] = true;
    } else if (!arg.startsWith('-') && !command) {
      command = arg;
    }
  }

  return { command, flags };
}

function showHelp(): void {
  showBanner();
  console.log(pc.dim(`v${pkg.version}`));
  console.log();
  console.log('Show release notes for any installed CLI tool');
  console.log();
  console.log(pc.bold('Usage:'));
  console.log(`  ${pc.cyan('changelog')} ${pc.dim('<command>')} ${pc.dim('[flags]')}`);
  console.log();
  console.log(pc.bold('Examples:'));
  console.log(`  ${pc.dim('changelog bat')}          Show latest bat release notes`);
  console.log(`  ${pc.dim('changelog rg --local')}   Show release notes for installed version`);
  console.log(`  ${pc.dim('changelog fd --open')}    Open release page in browser`);
  console.log();
  console.log(pc.bold('Flags:'));
  console.log(`  ${pc.cyan('--local, -l')}    Show installed version's release notes`);
  console.log(`  ${pc.cyan('--raw, -r')}      Output raw markdown (skip bat)`);
  console.log(`  ${pc.cyan('--json, -j')}     Output release JSON`);
  console.log(`  ${pc.cyan('--open, -o')}     Open release page in browser`);
  console.log(`  ${pc.cyan('--help, -h')}     Show this help`);
  console.log(`  ${pc.cyan('--version, -v')} Show version`);
  console.log();
  console.log(pc.bold('Supported package managers:'));
  console.log(`  ${pc.dim('Homebrew, npm, Cargo (crates.io), pip/uv (PyPI)')}`);
  console.log();
}

function showVersion(): void {
  showBanner();
  console.log(pc.dim(`v${pkg.version}`));
  console.log();
}

async function outputToBat(content: string): Promise<void> {
  const termWidth = process.stdout.columns || 80;
  const batProcess = Bun.spawn(
    [
      'bat',
      '--language=markdown',
      '--style=plain',
      '--paging=always',
      `--pager=less -RF -x4`,
      '--wrap=character',
      `--terminal-width=${termWidth}`
    ],
    {
      stderr: 'inherit',
      stdin: 'pipe',
      stdout: 'inherit'
    }
  );

  batProcess.stdin.write(content);
  batProcess.stdin.end();
  await batProcess.exited;
}

function formatRepoName(name: string): string {
  // Capitalize first letter of each word, replace hyphens with spaces
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function stripMarkdownLinks(content: string): string {
  // [text](url) -> text
  return content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function stripMarkdownTables(content: string): string {
  // Remove markdown tables (lines starting with |)
  return content
    .split('\n')
    .filter((line) => !line.trim().startsWith('|'))
    .join('\n');
}

function stripDownloadSections(content: string): string {
  // Remove ## Download and ## Install sections entirely
  const lines = content.split('\n');
  const result: string[] = [];
  let skipping = false;

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    // Start skipping on Download/Install headers
    if (/^##\s+(download|install)\b/.test(trimmed)) {
      skipping = true;
      continue;
    }
    // Stop skipping on next ## header
    if (skipping && /^##\s+/.test(line.trim())) {
      skipping = false;
    }
    if (!skipping) {
      result.push(line);
    }
  }

  return result.join('\n');
}

async function main(): Promise<void> {
  const { command, flags } = parseArgs(args);

  // Handle --help
  if (flags.help) {
    showHelp();
    process.exit(0);
  }

  // Handle --version
  if (flags.version) {
    showVersion();
    process.exit(0);
  }

  // Require a command
  if (!command) {
    console.error(pc.red('Error: No command specified'));
    console.error(pc.dim("Run 'changelog --help' for usage"));
    process.exit(1);
  }

  // Probe for package info
  const probeResult = await probe(command);

  if (probeResult.error && !probeResult.githubRepo) {
    console.error(pc.red(`Error: ${probeResult.error}`));
    process.exit(1);
  }

  if (!probeResult.githubRepo) {
    console.error(pc.red(`Error: Could not find GitHub repo for '${command}'`));
    if (probeResult.manager) {
      console.error(pc.dim(`Package manager: ${probeResult.manager}`));
    }
    process.exit(1);
  }

  // Get version for --local flag
  const localVersion = flags.local ? await getCommandVersion(command) : null;
  if (flags.local && !localVersion) {
    console.error(pc.yellow(`Warning: Could not determine installed version, showing latest`));
  }

  // Fetch changelog
  let changelogResult: ChangelogResult;
  try {
    changelogResult = await getChangelogContent(probeResult.githubRepo, {
      tag: localVersion ?? undefined
    });
  } catch (err) {
    console.error(pc.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }

  // Handle --open
  if (flags.open) {
    await $`open ${changelogResult.url}`;
    process.exit(0);
  }

  // Handle --json
  if (flags.json) {
    console.log(
      JSON.stringify(
        {
          command,
          content: changelogResult.content,
          manager: probeResult.manager,
          package: probeResult.packageName,
          repo: `${probeResult.githubRepo.owner}/${probeResult.githubRepo.repo}`,
          type: changelogResult.type,
          url: changelogResult.url,
          version: changelogResult.version
        },
        null,
        2
      )
    );
    process.exit(0);
  }

  // Build header with repo name
  const repoName = formatRepoName(probeResult.githubRepo.repo);
  const version = changelogResult.version ?? 'latest';
  const header = `# ${repoName} ${version}\n\n`;
  const cleanedContent = stripDownloadSections(
    stripMarkdownTables(stripMarkdownLinks(changelogResult.content))
  );
  const fullContent = header + cleanedContent;

  // Handle --raw
  if (flags.raw) {
    console.log(fullContent);
    process.exit(0);
  }

  // Default: pipe to bat
  await outputToBat(fullContent);
}

main().catch((err) => {
  console.error(pc.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
