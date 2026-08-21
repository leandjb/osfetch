## Purpose

Renders the collected system info as a neofetch-style report: a platform ASCII logo beside the info lines, per-line logo colors, and a trailing color palette row, using only printable ASCII characters.

## ADDED Requirements

### Requirement: ASCII-only logo set

The tool SHALL ship original ASCII logos for Linux (Tux-style, used for every Linux distro), macOS (Apple-style), and Windows (4-pane style), drawn exclusively with printable ASCII characters (0x20-0x7E) so they render on any terminal including legacy Windows consoles.

#### Scenario: Logo matches platform

- **WHEN** the tool runs on macOS
- **THEN** the macOS logo is shown; on Windows the Windows logo; on any Linux distro the Linux logo

#### Scenario: Logo character set

- **WHEN** any shipped logo is rendered
- **THEN** every character of the logo is within printable ASCII (0x20-0x7E)

### Requirement: Side-by-side layout

The report SHALL place the logo on the left and the info lines on the right, vertically aligned with a consistent gutter, and MUST NOT produce misaligned rows regardless of the relative heights of logo and info columns.

#### Scenario: Info column taller than logo

- **WHEN** there are more info lines than logo lines
- **THEN** the logo area is padded with spaces so every info row starts at the same column

#### Scenario: Color palette row

- **WHEN** the report is rendered with colors enabled
- **THEN** a final row shows the 8 standard terminal colors as background blocks, aligned with the info column

### Requirement: Colored output with opt-out

Logo lines and labels SHALL be colorized with ANSI escape codes (logo colors defined per line by the logo data), and the tool MUST honor a `--no-color` flag and the `NO_COLOR` environment variable by emitting zero ANSI escape sequences.

#### Scenario: NO_COLOR set

- **WHEN** the `NO_COLOR` environment variable is set (any value)
- **THEN** the entire output contains no ANSI escape sequences

#### Scenario: --no-color flag

- **WHEN** the tool is invoked with `--no-color`
- **THEN** the entire output contains no ANSI escape sequences

### Requirement: Title line

The first info line SHALL be the current user and host name (e.g. `leandb@myhost`), underlined by a row of dashes of equal display width, matching classic neofetch presentation.

#### Scenario: Title and underline

- **WHEN** the report is rendered
- **THEN** line one shows `user@host` and line two shows a dash underline of the same visible length
