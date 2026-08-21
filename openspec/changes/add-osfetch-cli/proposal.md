## Why

The `neofetch` package on npm is a republished bash 3.2 script with a thin `child_process.exec` wrapper: it cannot run natively on Windows 10/11 (no bash), ships no tests, and has been unmaintained since 2021 (upstream archived in 2024). There is no pure-Node.js, zero-dependency system-fetch tool that runs the same code on Windows, macOS, and every Linux distro.

## What Changes

- Bootstrap the `osfetch` npm package (ESM, Node >= 18, zero runtime dependencies, Jest as the only devDependency).
- Add a `bin/osfetch.js` CLI that prints a neofetch-style report: ASCII OS logo beside six info lines (OS, Kernel, Uptime, Shell, CPU, Memory) plus an ANSI color palette row.
- Add a cross-platform probe layer that gathers each info line from Node's `os` module or plain file reads — no `child_process` on Linux/macOS, and at most one optional, failure-tolerant probe on Windows. Any line that cannot be determined is silently omitted.
- Ship three original ASCII logos (Linux/Tux as the fallback for all distros, macOS/Apple, Windows/4-pane) as pure-data modules with per-line color maps.
- Add a Jest test suite that simulates all three platforms from fixtures on any machine, plus per-OS smoke tests in CI (ubuntu/macos/windows × Node 18/20/22).
- Publish-ready packaging: `files` whitelist (only `bin/` + `src/`), MIT license, `engines >= 18`.

## Capabilities

### New Capabilities

- `system-info`: Cross-platform collection of the six info lines (OS/distro name, kernel, uptime, shell, CPU, memory) with graceful degradation — a probe that fails MUST drop its line instead of failing the run.
- `fetch-display`: Rendering of the report — ASCII logo selection by platform, per-line logo coloring, side-by-side logo/info layout with correct alignment on any terminal width, and the trailing color palette blocks; honors `--no-color` and `--no-logo`.
- `cli`: The `osfetch` command interface — flags (`--json`, `--no-color`, `--no-logo`, `--help`, `--version`), exit codes, and behavior when stdout is not a TTY.

### Modified Capabilities

<!-- none - new project -->

## Impact

- **New code**: everything under `bin/`, `src/`, `test/`, plus `package.json` expansion, `jest.config.js`, `.github/workflows/ci.yml`. The repo currently contains only OpenSpec tooling; no existing code is affected.
- **Dependencies**: adds `jest` as a devDependency; runtime dependency count stays zero (KISS/DRY and install-size constraint).
- **Compatibility contract**: Node >= 18 on `win32` (Windows 10/11), `darwin`, and `linux` (all distros via `/etc/os-release`).
- **npm registry**: the name `neofetch` is taken; the package will be published as `osfetch` (verified available).
