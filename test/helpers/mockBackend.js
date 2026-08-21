import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesRoot = path.resolve(__dirname, '..', 'fixtures');

function loadText(rel) {
  return readFileSync(path.join(fixturesRoot, rel), 'utf8');
}

function loadJson(rel) {
  return JSON.parse(readFileSync(path.join(fixturesRoot, rel), 'utf8'));
}

// Preload fixtures
const osReleaseUbuntu = loadText('linux/os-release-ubuntu');
const osReleaseArch = loadText('linux/os-release-arch');
const osReleaseAlpine = loadText('linux/os-release-alpine');
const meminfo = loadText('linux/meminfo');
const cpusFixture = loadJson('win32/cpus.json');

export function makeBackend(platform, opts = {}) {
  if (platform === 'linux') {
    const variant = opts.variant || 'ubuntu';
    let osReleaseContent;
    if (variant === 'arch') osReleaseContent = osReleaseArch;
    else if (variant === 'alpine') osReleaseContent = osReleaseAlpine;
    else osReleaseContent = osReleaseUbuntu;

    return {
      platform: 'linux',
      os: {
        release: () => opts.release || '6.5.0-21-generic',
        version: () => opts.version || '#21~22.04.1-Ubuntu SMP PREEMPT_DYNAMIC Thu Jan  1 00:00:00 UTC 2026',
        uptime: () => (opts.uptime !== undefined ? opts.uptime : 123456),
        totalmem: () => (opts.totalmem !== undefined ? opts.totalmem : 16384256 * 1024),
        freemem: () => (opts.freemem !== undefined ? opts.freemem : 8192000 * 1024),
        cpus: () => opts.cpus || cpusFixture.slice(0, 4).map(c => ({ ...c, model: 'Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz' })),
        hostname: () => opts.hostname || 'testhost',
        userInfo: () => ({ username: opts.username || 'testuser' }),
      },
      env: opts.env || { SHELL: '/bin/bash', USER: 'testuser' },
      readFile: async (absPath) => {
        if (absPath === '/etc/os-release') {
          if (opts.readFileShouldFail) throw new Error('readFile fail');
          return osReleaseContent;
        }
        if (absPath === '/proc/meminfo') {
          if (opts.readFileShouldFail) throw new Error('readFile fail');
          return meminfo;
        }
        throw new Error(`ENOENT: no such file, open '${absPath}'`);
      },
      // linux has no exec per design
    };
  }

  if (platform === 'darwin') {
    const release = opts.release || '23.0.0';
    return {
      platform: 'darwin',
      os: {
        release: () => release,
        version: () => opts.version || `Darwin Kernel Version 23.0.0: Wed Dec  1 00:00:00 PST 2026; root:xnu-10002.1.13~1/RELEASE_X86_64`,
        uptime: () => (opts.uptime !== undefined ? opts.uptime : 98765),
        totalmem: () => (opts.totalmem !== undefined ? opts.totalmem : 17179869184),
        freemem: () => (opts.freemem !== undefined ? opts.freemem : 8589934592),
        cpus: () => opts.cpus || cpusFixture.slice(0, 8),
        hostname: () => opts.hostname || 'MacBook-Pro',
        userInfo: () => ({ username: opts.username || 'macuser' }),
      },
      env: opts.env || { SHELL: '/bin/zsh' },
      readFile: async (absPath) => {
        throw new Error(`ENOENT: no such file, open '${absPath}'`);
      },
    };
  }

  if (platform === 'win32') {
    const release = opts.release || '10.0.22631';
    const version = opts.version || 'Windows 11 Pro';
    return {
      platform: 'win32',
      os: {
        release: () => release,
        version: () => version,
        uptime: () => (opts.uptime !== undefined ? opts.uptime : 54321),
        totalmem: () => (opts.totalmem !== undefined ? opts.totalmem : 17179869184),
        freemem: () => (opts.freemem !== undefined ? opts.freemem : 8589934592),
        cpus: () => opts.cpus || cpusFixture,
        hostname: () => opts.hostname || 'WIN-HOST',
        userInfo: () => ({ username: opts.username || 'winuser' }),
      },
      env: opts.env !== undefined ? opts.env : { PSModulePath: 'C:\\Program Files\\PowerShell\\7\\Modules', PROMPT: '$P$G', USERNAME: 'winuser' },
      readFile: async (absPath) => {
        throw new Error(`ENOENT: no such file, open '${absPath}'`);
      },
      exec: async (cmd) => {
        if (opts.execShouldFail) throw new Error('exec fail');
        // optional CIM probe simulation
        if (cmd.includes('Get-CimInstance') || cmd.includes('wmic')) {
          return 'PowerShell 7.3.0';
        }
        return '';
      },
    };
  }

  throw new Error(`Unknown platform: ${platform}`);
}

// Also export fixtures for direct use in tests
export const fixtures = {
  osReleaseUbuntu,
  osReleaseArch,
  osReleaseAlpine,
  meminfo,
  cpusFixture,
};
