import { createBackend } from './platforms/index.js';
import { assemble } from './core/assembler.js';
import { render as coreRender } from './core/renderer.js';
import { getLogo } from './logos/index.js';
import { parseArgs } from './cli.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export async function getSystemInfo(backend) {
  const b = backend || createBackend();
  const lines = await assemble(b);
  // Build object with lowercased keys for json mode, plus keep lines
  const info = {};
  for (const { label, value } of lines) {
    // keys as specified in spec: os, kernel, uptime, shell, cpu, memory
    const key = label.toLowerCase();
    info[key] = value;
  }
  // Add username/hostname for rendering
  try {
    const userInfo = b.os.userInfo();
    if (userInfo && userInfo.username) info.username = userInfo.username;
  } catch {}
  // Fallback to env USER/USERNAME
  if (!info.username) {
    info.username = (b.env && (b.env.USER || b.env.USERNAME)) || process.env.USER || process.env.USERNAME || 'user';
  }
  try {
    const host = b.os.hostname();
    if (host) info.hostname = host;
  } catch {}
  if (!info.hostname) {
    info.hostname = 'host';
  }
  info.platform = b.platform;
  // Keep raw lines for renderer
  info._lines = lines;
  return info;
}

export function render(info, opts = {}) {
  // opts may include platform, color, noColor, noLogo, username, hostname
  // info may be object from getSystemInfo or raw array
  let lines;
  let username = opts.username;
  let hostname = opts.hostname;
  let platform = opts.platform;

  if (info && Array.isArray(info._lines)) {
    lines = info._lines;
    if (!username) username = info.username;
    if (!hostname) hostname = info.hostname;
    if (!platform) platform = info.platform;
  } else if (Array.isArray(info)) {
    lines = info;
  } else if (info && typeof info === 'object') {
    // info is object with keys os etc.
    if (info._lines) lines = info._lines;
    else {
      // convert object to lines
      const order = ['os', 'kernel', 'uptime', 'shell', 'cpu', 'memory'];
      const labels = { os: 'OS', kernel: 'Kernel', uptime: 'Uptime', shell: 'Shell', cpu: 'CPU', memory: 'Memory' };
      lines = [];
      for (const key of order) {
        if (info[key] != null) lines.push({ label: labels[key], value: String(info[key]) });
      }
      // if still empty, try generic
      if (lines.length === 0 && info.lines) lines = info.lines;
    }
    if (!username) username = info.username;
    if (!hostname) hostname = info.hostname;
    if (!platform) platform = info.platform;
  } else {
    lines = [];
  }

  if (!username && opts.username) username = opts.username;
  if (!hostname && opts.hostname) hostname = opts.hostname;
  const logo = opts.logo || getLogo(platform || process.platform);

  const renderOpts = {
    username,
    hostname,
    color: opts.color,
    noColor: opts.noColor,
    noLogo: opts.noLogo,
    logo,
  };
  return coreRender(lines, logo, renderOpts);
}

export async function run(argv = [], backend) {
  const flags = parseArgs(argv);
  if (flags.help) {
    const help = getHelpText();
    return help;
  }
  if (flags.version) {
    const version = getVersion();
    return version;
  }
  if (flags.json) {
    const info = await getSystemInfo(backend);
    // Build json object as per spec: keys os, kernel, uptime, shell, cpu, memory; absent keys for failed probes
    const out = {};
    for (const key of ['os', 'kernel', 'uptime', 'shell', 'cpu', 'memory']) {
      if (info[key] != null) out[key] = info[key];
    }
    return JSON.stringify(out, null, 2);
  }

  const info = await getSystemInfo(backend);
  const platform = backend?.platform || info.platform || process.platform;
  const logo = getLogo(platform);
  const out = coreRender(info._lines, logo, {
    username: info.username,
    hostname: info.hostname,
    color: !flags.noColor,
    noColor: flags.noColor,
    noLogo: flags.noLogo,
  });
  return out;
}

function getHelpText() {
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

function getVersion() {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pkgPath = path.resolve(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}
