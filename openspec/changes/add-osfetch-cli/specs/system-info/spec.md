## Purpose

Collects the six system info lines (OS, Kernel, Uptime, Shell, CPU, Memory) identically on Windows 10/11, macOS, and every Linux distro, degrading gracefully when a value cannot be determined.

## ADDED Requirements

### Requirement: Cross-platform execution

The tool SHALL run on Node.js >= 18 on the platforms `win32` (Windows 10 and 11), `darwin` (macOS), and `linux` (all distros), producing a report on each without platform-specific installation steps.

#### Scenario: Runs on Windows 11

- **WHEN** the tool is executed with Node >= 18 on Windows 11
- **THEN** it prints a complete report and exits with code 0

#### Scenario: Runs on macOS

- **WHEN** the tool is executed with Node >= 18 on macOS
- **THEN** it prints a complete report and exits with code 0

#### Scenario: Runs on any Linux distro

- **WHEN** the tool is executed with Node >= 18 on a Linux distro (e.g. Ubuntu, Fedora, Arch, Alpine)
- **THEN** it prints a complete report and exits with code 0

### Requirement: OS line

The OS line SHALL identify the operating system: the distro name on Linux (parsed from `/etc/os-release`), the marketing name and version on macOS (e.g. "macOS Sonoma 14.x"), and the product name on Windows (e.g. "Windows 11", distinguishing Windows 10 from 11 by build number).

#### Scenario: Linux distro detection

- **WHEN** the tool runs on a Linux system whose `/etc/os-release` declares `NAME`/`PRETTY_NAME`
- **THEN** the OS line shows that distro name, regardless of distro family

#### Scenario: macOS name resolution

- **WHEN** the tool runs on macOS
- **THEN** the OS line shows "macOS" with the marketing release name derived from the Darwin/kernel version

#### Scenario: Windows 10 vs 11 distinction

- **WHEN** the tool runs on Windows with build number >= 22000
- **THEN** the OS line reports "Windows 11"; below 22000 with NT 10.0 it reports "Windows 10"

### Requirement: Standard info lines

The tool SHALL report Kernel (OS kernel release), Uptime (human-readable, e.g. "2 days, 3 hours"), Shell (the user's shell name), CPU (model name and logical core count), and Memory (used / total in human-readable units).

#### Scenario: All six lines present on a healthy system

- **WHEN** the tool runs on a standard Windows 10/11, macOS, or Linux installation
- **THEN** the report contains OS, Kernel, Uptime, Shell, CPU, and Memory lines

### Requirement: Graceful degradation

If any single value cannot be determined, the tool MUST omit only that line and still render the rest of the report; a probe failure MUST NOT crash the tool, print a stack trace, or change the exit code.

#### Scenario: One probe fails

- **WHEN** the shell cannot be detected on the current platform
- **THEN** the Shell line is absent and all other lines render normally with exit code 0

### Requirement: No mandatory subprocesses

On Linux and macOS the tool MUST NOT spawn child processes to gather the six lines. On Windows it MUST NOT require bash, PowerShell, or any external interpreter for the report to render; any optional subprocess probe MUST be failure-tolerant and skipped silently when unavailable.

#### Scenario: Environment with no shell-outs available

- **WHEN** the tool runs in an environment where spawning processes fails
- **THEN** it still renders all lines that are obtainable from the Node.js runtime and plain file reads, and exits 0
