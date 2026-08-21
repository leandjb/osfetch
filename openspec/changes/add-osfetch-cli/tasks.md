## 1. Package scaffold

- [ ] 1.1 Rewrite `package.json` per design D5 (name `osfetch`, `type: module`, `bin`, `exports`, `files: ["bin","src"]`, `engines >= 18`, `sideEffects: false`, MIT, Jest devDependency + ESM-safe test scripts); verify with `node -e "JSON.parse(require('fs').readFileSync('package.json'))"` and `pnpm install` resolving Jest
- [ ] 1.2 Add `jest.config.js` (testEnvironment `node`, roots `test/`, coverage from `src/**`); verify `npm test` runs and reports "no tests" gracefully
- [ ] 1.3 Add `.gitignore` (`node_modules/`, `coverage/`) and MIT `LICENSE`; verify `git status --ignored` excludes them

## 2. Test fixtures and platform simulation

- [ ] 2.1 Create `test/fixtures/linux/` with real `os-release` samples (ubuntu, arch, alpine) and a real `/proc/meminfo` sample; verify files parse as text
- [ ] 2.2 Create `test/fixtures/darwin/` (Darwin version samples per release) and `test/fixtures/win32/` (build-number samples for 10 and 11, sample `os.cpus()` payload); verify files parse
- [ ] 2.3 Add `test/helpers/mockBackend.js` exposing `makeBackend('linux'|'darwin'|'win32')` returning the design-D1 backend contract over fixtures; verify with a smoke test that all three builders return objects

## 3. Core rendering (pure layer)

- [ ] 3.1 Implement `src/core/ansi.js` (8-color fg/bg map, `paint(text, color)`, `strip(text)`, `enabled` honoring flag + `NO_COLOR`); unit tests in `test/unit/core/ansi.test.js` pass
- [ ] 3.2 Create `src/logos/{linux,macos,windows}.js` as pure data (`{ name, lines[], colors[] }`, ASCII 0x20–0x7E only, ~16 lines ≤ 28 cols) + `src/logos/index.js` with `getLogo(platform)`; unit tests assert ASCII-only charset and per-platform selection pass
- [ ] 3.3 Implement `src/core/renderer.js` (pure: title + underline, side-by-side layout with gutter + column padding, 8-color palette row, `--no-logo`/`--no-color` paths); Jest snapshots in `test/snapshots/` pass for all three logos and both color modes

## 4. Info modules (probes)

- [ ] 4.1 Implement `src/modules/os.js` (os-release parse, Darwin→macOS table, build→Windows 10/11 table); unit tests against all three fixture backends pass, including Win build 22000 boundary
- [ ] 4.2 Implement `src/modules/kernel.js`, `src/modules/uptime.js` (human-readable "Xd Xh Xm"), `src/modules/cpu.js` (model + core count); unit tests pass on all three simulated platforms
- [ ] 4.3 Implement `src/modules/memory.js` (Linux `MemAvailable` parse; `totalmem/freemem` fallback) and `src/modules/shell.js` (`$SHELL` basename; win32 env heuristics, optional exec); unit tests pass, including failure → `null` cases
- [ ] 4.4 Implement `src/modules/index.js` registry and `src/core/assembler.js` (run probes in parallel, drop `null`s, keep registry order); unit test asserts failed probes vanish and order is stable

## 5. Platform backends and public API

- [ ] 5.1 Implement `src/platforms/{linux,darwin,win32}.js` + `index.js` factory (`createBackend()`); unit test asserts factory returns the right backend shape per `process.platform` (mocked)
- [ ] 5.2 Implement `src/index.js` exporting `getSystemInfo(backend?)`, `render(info, opts)`, `run(argv)`; integration test calls `run([])` against a mock backend and asserts full report text

## 6. CLI

- [ ] 6.1 Implement `src/cli.js` flag parsing (`--json`, `--no-color`, `--no-logo`, `--help`, `--version`, unknown → stderr + non-zero exit) and `bin/osfetch.js` entry with `#!/usr/bin/env node`; unit tests on the parser pass
- [ ] 6.2 Add `test/e2e/cli.test.js` spawning the real bin: exit 0, report shape, `--json` parses with expected keys, `--no-color` emits zero ANSI sequences, `--no-logo` starts at column 0, bad flag exits non-zero; suite passes locally via `npm test`

## 7. Cross-platform CI and packaging

- [ ] 7.1 Add `.github/workflows/ci.yml` matrix `{ubuntu-latest, macos-latest, windows-latest} × {node 18, 20, 22}` running `npm ci && npm test`; verify workflow YAML parses and (if pushed) all legs go green
- [ ] 7.2 Write `README.md` (sample output, install/usage, flags, platform support, memory-semantics caveat from design risks); verify links and code blocks render
- [ ] 7.3 Run `npm pack --dry-run` and verify the tarball contains only `bin/`, `src/`, `package.json`, `README.md`, `LICENSE` (no `test/`, `.github/`, `openspec/`)
- [ ] 7.4 Final full-suite run `npm test` green on the development machine, and spot-check `node bin/osfetch.js`, `--json`, `--no-color`, `--no-logo` outputs manually
