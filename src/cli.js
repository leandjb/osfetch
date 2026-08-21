import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function parseArgs(argv = []) {
  const flags = {
    json: false,
    noColor: false,
    noLogo: false,
    help: false,
    version: false,
    unknown: null,
  };

  for (const arg of argv) {
    if (arg === '--json') flags.json = true;
    else if (arg === '--no-color') flags.noColor = true;
    else if (arg === '--no-logo') flags.noLogo = true;
    else if (arg === '--help' || arg === '-h') flags.help = true;
    else if (arg === '--version' || arg === '-v') flags.version = true;
    else if (arg.startsWith('-')) {
      flags.unknown = arg;
      break;
    } else {
      flags.unknown = arg;
      break;
    }
  }

  return flags;
}

export function getHelpText() {
  return `osfetch - pure Node.js system fetch

Usage: osfetch [options]

Options:
  --json        Output as JSON (no logo, no colors)
  --no-color    Strip all ANSI colors
  --no-logo     Hide ASCII logo
  --help        Show this help
  --version     Show version

Examples:
  osfetch
  osfetch --json
  osfetch --no-color --no-logo
`;
}

export function getVersion() {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pkgPath = path.resolve(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

export function formatError(flag) {
  return `Unknown flag: ${flag}`;
}
