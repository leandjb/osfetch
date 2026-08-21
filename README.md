# osfetch

Pure Node.js system fetch — neofetch-style report with **zero runtime dependencies**.

```
       .--.          leandb@myhost
      |o_o |         -------------
      |:_/ |         OS: Ubuntu 22.04.3 LTS
     //   \ \        Kernel: 6.5.0-21-generic
    (|     | )       Uptime: 2 days, 3 hours
   /'\_   _/`\       Shell: bash
   \___)=(___/       CPU: Intel(R) Core(TM) i7-10700K (8)
    `-----`          Memory: 7.81 GiB / 15.63 GiB
   Linux Tux         ████████████████████████
```

## Install

Requires **Node.js >= 18**.

```bash
npm install -g osfetch
# or
npx osfetch
```

Local dev:

```bash
pnpm install
npm test
node bin/osfetch.js
```

## Usage

```bash
osfetch
osfetch --json
osfetch --no-color
osfetch --no-logo
osfetch --help
osfetch --version
```

### Flags

| Flag | Description |
|------|-------------|
| `--json` | Machine-readable JSON (keys: `os`, `kernel`, `uptime`, `shell`, `cpu`, `memory`; absent keys for failed probes, no logo/colors) |
| `--no-color` | Strip all ANSI sequences (also honors `NO_COLOR` env) |
| `--no-logo` | Render info lines without logo column (starts at column 0) |
| `--help` | Show usage and flag list, exit 0 |
| `--version` | Show version from `package.json`, exit 0 |

Unknown flags print an error to `stderr`, show usage, and exit non-zero:

```bash
$ osfetch --frobnicate
Error: unknown flag --frobnicate
# usage printed...
exit 1
```

## Platform Support

| Platform | OS | Kernel | Uptime | Shell | CPU | Memory |
|----------|----|--------|--------|-------|-----|--------|
| `linux` (all distros) | `/etc/os-release` `PRETTY_NAME` | `os.release()` | `os.uptime()` | `$SHELL` basename | `os.cpus()` | `/proc/meminfo` `MemAvailable` → `totalmem/freemem` fallback |
| `darwin` (macOS) | Darwin → macOS marketing name table (Sonoma/Ventura/…) | `os.release()` | `os.uptime()` | `$SHELL` | `os.cpus()` | `os.totalmem()/freemem()` |
| `win32` (Windows 10/11) | build ≥ 22000 → Windows 11 else Windows 10 | `os.release()`/`os.version()` | `os.uptime()` | `PSModulePath` → pwsh/PowerShell, `PROMPT` → cmd, optional CIM probe | `os.cpus()` | `os.totalmem()/freemem()` |

No `child_process` on Linux/macOS. On Windows, bash/PowerShell are **not required**; any optional subprocess probe is failure-tolerant and skipped silently.

Tested via CI matrix `{ubuntu-latest, macos-latest, windows-latest} × {node 18, 20, 22}`.

## Memory Semantics Caveat

- **Linux**: `Memory` is `MemTotal - MemAvailable` from `/proc/meminfo`, which is cache-aware and matches `free`/`htop`.
- **macOS / Windows**: Node's `os.totalmem()` / `os.freemem()` is used. This overstates memory pressure compared to cache-aware tools (e.g., `vm_stat`, Task Manager) because it counts disk cache as used. Accepted for v1 minimal scope; future versions may add platform-specific cache-aware probes.

Documented as a known trade-off in `openspec/changes/add-osfetch-cli/design.md`.

## Architecture

```
bin/osfetch.js -> src/cli.js -> src/index.js -> src/core/assembler.js -> src/modules/*.js
                     |                |
                     |                v -> src/platforms/*.js (only impure layer)
                     v
               src/core/renderer.js -> src/core/ansi.js, src/logos/*.js (pure)
```

- **Pure layer**: `modules/*`, `renderer`, `ansi`, `logos` are pure functions over an injected backend.
- **Impure layer**: `platforms/*` only files that import `os`/`fs`/`child_process`.
- Adding a new info line = one file in `src/modules/`, one entry in registry, one test.

## Packaging

Published files whitelist is `["bin","src"]` (plus `package.json`, `README.md`, `LICENSE`). Tests, fixtures, CI, and OpenSpec never ship:

```bash
npm pack --dry-run
```

Verify tarball contains only `bin/`, `src/`, `package.json`, `README.md`, `LICENSE`.

## License

MIT — see [LICENSE](./LICENSE).
