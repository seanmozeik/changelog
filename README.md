# changelog

Show release notes for any installed CLI tool.

```
changelog bat
```

Detects how a command was installed (Homebrew, npm, Cargo, pip/uv), finds its GitHub repository, and displays the latest release notes formatted with `bat`.

## Installation

```bash
brew install seanmozeik/tap/changelog
```

Or build from source:

```bash
bun install
bun run build
```

## Usage

```bash
changelog <command> [flags]
```

### Examples

```bash
changelog bat          # Show latest bat release notes
changelog rg --local   # Show release notes for installed version
changelog fd -n 5      # Show last 5 releases
changelog fd --open    # Open release page in browser
changelog prettier -r  # Output raw markdown
```

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--count` | `-n` | Show last N releases |
| `--local` | `-l` | Show release notes for installed version |
| `--raw` | `-r` | Output raw markdown (skip bat) |
| `--json` | `-j` | Output release data as JSON |
| `--open` | `-o` | Open release page in browser |
| `--help` | `-h` | Show help |
| `--version` | `-v` | Show version |

## Supported Package Managers

| Manager | Detection | Source |
|---------|-----------|--------|
| Homebrew | `/opt/homebrew/`, `/usr/local/Cellar/` | `brew info --json=v2` |
| npm/bun | `/node_modules/.bin/`, `~/.bun/bin/` | `npm view` |
| Cargo | `~/.cargo/bin/` | crates.io API |
| pip/uv | `~/.local/bin/`, venv paths | PyPI API |

## Dependencies

### Runtime

- [bat](https://github.com/sharkdp/bat) - syntax highlighting and paging
- [gh](https://cli.github.com/) - GitHub authentication (uses `gh auth token`)

### Build

- [Bun](https://bun.sh/) - runtime and bundler

### npm packages

- `figlet` - ASCII banner
- `gradient-string` - gradient colors
- `picocolors` - terminal colors
- `boxen` - help box formatting

## Development

```bash
# Run tests
bun test

# Run in dev mode
bun run dev bat

# Lint
bunx biome check src

# Build executable
bun run build
```

## How It Works

1. Finds the binary path with `which`
2. Detects package manager from the path
3. Queries package manager for GitHub repo URL
4. Fetches release notes from GitHub API (or falls back to CHANGELOG.md)
5. Pipes output through `bat` for formatting

## License

MIT
