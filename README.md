# osfetch

Pure Node.js system fetch — a neofetch-style system report with **zero runtime dependencies**. Works on Linux, macOS and Windows (Node.js >= 18).

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

```bash
npm install -g @leandjb/osfetch
pnpm add -g @leandjb/osfetch
```

Or run it without installing:

```bash
npx @leandjb/osfetch
pnpm exec @leandjb/osfetch
```

## Usage

```bash
osfetch              # full report with logo and colors
osfetch --json       # machine-readable JSON output
osfetch --no-color   # disable ANSI colors (also honors NO_COLOR)
osfetch --no-logo    # render info lines only
osfetch --help       # show usage
osfetch --version    # show version
```

### Platform support

| Platform | Notes |
|----------|-------|
| **Linux** | All distros; reads `/etc/os-release` and `/proc/meminfo`. No subprocesses needed. |
| **macOS** | Detects the macOS marketing name (Sonoma, Ventura, ...). |
| **Windows** | Windows 10/11 detection; PowerShell/cmd shell detection. Bash is not required. |

Unknown flags print an error to `stderr` and exit non-zero.

## Running tests

Requires Node.js >= 18. With [pnpm](https://pnpm.io):

```bash
pnpm install
pnpm test
```

Or with npm:

```bash
npm install
npm test
```

Tests run on Linux, macOS and Windows across Node 18, 20 and 22 in CI.

## License

MIT — see [LICENSE](./LICENSE).
