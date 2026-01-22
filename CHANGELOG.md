# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-22
### Added

- Initial release of changelog CLI tool
- Show release notes for any installed CLI tool via `changelog <command>`
- Support for Homebrew, npm, Cargo, and pip/uv package managers
- Automatic GitHub repository detection from package metadata
- Symlink resolution for bun-installed packages
- Display release notes formatted with bat syntax highlighting
- Flags: `--local` for installed version, `--raw` for plain markdown, `--json` for JSON output, `--open` to open in browser
- Flag: `-n <count>` to show last N releases concatenated
- Clean output: strips markdown links, tables, and download sections
