## Purpose

Defines the `osfetch` command-line interface: the flags it accepts, machine-readable output mode, and how it behaves in non-interactive environments.

## ADDED Requirements

### Requirement: Invocation

The package SHALL install an `osfetch` executable (via the npm `bin` field) that prints the system report to stdout and exits with code 0 on success.

#### Scenario: Default run

- **WHEN** the user runs `osfetch` with no arguments
- **THEN** the system report is printed to stdout and the process exits 0

### Requirement: Help and version

The tool SHALL support `--help` (usage, flag list, examples) and `--version` (package version), each printed to stdout with exit code 0.

#### Scenario: --help

- **WHEN** the user runs `osfetch --help`
- **THEN** usage text listing every supported flag is printed and the exit code is 0

#### Scenario: --version

- **WHEN** the user runs `osfetch --version`
- **THEN** the version from package.json is printed and the exit code is 0

### Requirement: JSON output mode

The tool SHALL support `--json`, which prints the collected info as a single JSON object (keys: `os`, `kernel`, `uptime`, `shell`, `cpu`, `memory`; absent keys for failed probes) to stdout, with no logo, colors, or decoration.

#### Scenario: --json is machine-readable

- **WHEN** the user runs `osfetch --json`
- **THEN** stdout parses as valid JSON containing the available info keys and nothing else

### Requirement: Display opt-out flags

The tool SHALL support `--no-color` (strip all ANSI sequences) and `--no-logo` (render info lines without the logo column).

#### Scenario: --no-logo

- **WHEN** the user runs `osfetch --no-logo`
- **THEN** info lines start at column 0 and no logo art is printed

### Requirement: Unknown flags

An unrecognized flag MUST NOT crash the tool; it SHALL print an error message to stderr, show usage, and exit with a non-zero code.

#### Scenario: Bad flag

- **WHEN** the user runs `osfetch --frobnicate`
- **THEN** an error and usage text are printed and the exit code is non-zero
