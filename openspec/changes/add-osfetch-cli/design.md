## Context

Greenfield package in a repo that currently holds only OpenSpec tooling (see proposal.md — Why). Constraints locked during exploration: pure ESM JavaScript (no TypeScript build step), zero runtime dependencies, Jest as the single devDependency, Node >= 18, identical behavior on `win32`/`darwin`/`linux`, ASCII-only logos (user decision, superseding an earlier Unicode idea), minimal v1 scope of six info lines.

## Goals / Non-Goals

**Goals:**

- One impure layer, everything else pure: all `os`/`fs`/`child_process` access concentrated in per-platform backend objects; modules and renderer are pure functions over an injected backend.
- Testable from anywhere: the full Jest suite simulates all three platforms via fixtures on a single machine; real-OS smoke tests run in a CI matrix.
- Additive growth: a new info line = one new file in `src/modules/`, one entry in the registry, one mirrored test file. No other file changes.

**Non-Goals:**

- GPU, disk, battery, packages count, DE/WM, resolution, host model (post-v1).
- Per-distro Linux logos (one Tux logo covers all distros in v1).
- Terminal image protocols (kitty/iTerm/sixel), config file, themes.
- Dual ESM/CJS publishing; ESM only.

## Decisions

### D1 — Backend injection (the one architectural seam)

All probes receive a backend object instead of importing `os`/`fs`/`child_process` directly:

```
bin/osfetch.js ─▶ cli.js ─▶ assembler ─▶ modules/*.js ─┐ (injected, never imported)
                        │                                ▼
                        ▼                         platforms/*.js   ← only impure files
                     renderer.js ─▶ ansi.js, logos/*.js (pure data)
```

Dependency direction is one-way; `modules/*` never import `platforms/*`. A test backend replaying fixtures satisfies the same contract, so Windows/macOS/Linux behavior is testable from any CI runner.

- Backend contract: `{ platform, os, readFile(absPath), exec(cmd) }`. `exec` exists only on backends that need it (win32 optional probe); Linux/macOS backends never spawn.
- Probe contract: `async (backend) => ({ label, value } | null)`. Failures return `null`; the assembler drops nulls. Probes never throw (try/catch inside each probe).

_Alternatives considered:_ `jest.unstable_mockModule` on `os`/`fs` per test — rejected: verbose, brittle, and couples tests to import mechanics rather than behavior. A runtime platform `switch` inside each module — rejected: duplicates platform branching in every file (violates DRY).

### D2 — Zero runtime dependencies; subprocess-free on Linux/macOS

Every v1 line is obtainable from `os` module + file reads:

| Line | Linux | macOS | Windows |
|---|---|---|---|
| OS | read `/etc/os-release` (`PRETTY_NAME`/`NAME`) | Darwin major → macOS marketing name table | build number → "Windows 10/11" table |
| Kernel | `os.release()` | `os.release()` | `os.version()` |
| Uptime | `os.uptime()` | `os.uptime()` | `os.uptime()` |
| Shell | basename of `$SHELL` | basename of `$SHELL` | env heuristics (`PSModulePath` → pwsh/PowerShell, `PROMPT` → cmd); optional failure-tolerant CIM probe as last resort |
| CPU | `os.cpus()[0].model` + core count | same | same |
| Memory | parse `/proc/meminfo` (`MemAvailable`) | `os.totalmem()/freemem()` | `os.totalmem()/freemem()` |

The version-name lookup tables are plain data objects, unit-tested like everything else.

_Alternatives considered:_ `systeminformation` npm package — rejected: adds a large dependency tree against the zero-dep constraint. `sw_vers`/`wmic`/PowerShell execs — rejected: slow (PowerShell startup alone is 200-500 ms) and violates the "no mandatory subprocesses" spec requirement.

### D3 — Logos as pure data, renderer as pure function

Each logo module exports `{ name, lines: string[], colors: string[] }` (one ANSI color name per line). Original ASCII art (~16 lines tall, ≤ 28 cols wide): Tux (Linux fallback for all distros), Apple with 6 retro color bands (macOS), 4-pane window with 4 colors (Windows). `renderer.js` is a pure function `(infoLines, logo, { color, noLogo }) → string`: it left-pads the shorter column, joins with a 2-space gutter, and appends the 8-color palette row (ANSI background blocks). No I/O in the renderer — snapshot-testable.

_Alternatives considered:_ porting neofetch's logo set — rejected: licensing hygiene and scope; three originals cover v1. `chalk` for colors — rejected: 12-line `ansi.js` covers the needed palette (zero-dep constraint).

### D4 — Jest on ESM via VM-modules invocation

Source is `"type": "module"`. Tests run as `node --experimental-vm-modules node_modules/jest/bin/jest.js` — the invocation form that works identically in `cmd.exe`, PowerShell, and POSIX shells (no `cross-env`, no env-var syntax). Test layout mirrors `src/` 1:1 (`test/unit/modules/memory.test.js` ↔ `src/modules/memory.js`). Platform simulation: fixture backend builders (`makeBackend('win32')` etc.) injected into the same probes; renderer covered by Jest snapshots with an ANSI-aware serializer; e2e spawns the real bin on the CI runner's OS.

_Alternatives considered:_ CommonJS source to please Jest — rejected: ESM is the modern npm standard and the user chose plain ESM. `node:test` — rejected: user explicitly requires Jest.

### D5 — Packaging hygiene

`package.json`: `name: "osfetch"` (verified available), `bin`, `exports` map, `files: ["bin", "src"]` whitelist (tests/CI/openspec never ship), `engines: { node: ">=18" }`, `sideEffects: false`, MIT license. CI: GitHub Actions matrix `{ubuntu, macos, windows} × {node 18, 20, 22}` running the full Jest suite on each leg.

## Risks / Trade-offs

- [Windows shell detection is heuristic (`PSModulePath`/`PROMPT`); the optional CIM probe may be blocked] → Spec already requires graceful degradation: the Shell line simply disappears; e2e accepts its absence.
- [macOS/Windows "used memory" via `os.freemem()` overstates pressure vs. cache-aware tools] → Accepted for v1 minimal scope; documented in README; `/proc/meminfo MemAvailable` gives correct semantics on Linux.
- [Jest ESM support is still flagged experimental; the flag prints a warning on some Node versions] → Pinned invocation in npm scripts; warning is cosmetic. If Jest 30 stable ESM lands during implementation, adopt it without spec changes.
- [Logo art quality is subjective and hand-tuned] → Snapshot tests lock alignment (the testable part); aesthetics iterated during implementation with user review.
- [Darwin→macOS and build→Windows lookup tables age with new OS releases] → Tables are small data objects with a safe fallback ("macOS", "Windows" without marketing name); table updates are one-line data PRs.
