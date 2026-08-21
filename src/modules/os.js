const DARWIN_TABLE = {
  23: { name: 'Sonoma', version: '14' },
  22: { name: 'Ventura', version: '13' },
  21: { name: 'Monterey', version: '12' },
  20: { name: 'Big Sur', version: '11' },
  19: { name: 'Catalina', version: '10.15' },
  18: { name: 'Mojave', version: '10.14' },
  17: { name: 'High Sierra', version: '10.13' },
  16: { name: 'Sierra', version: '10.12' },
  15: { name: 'El Capitan', version: '10.11' },
  14: { name: 'Yosemite', version: '10.10' },
};

function parseOsRelease(text) {
  const out = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function darwinToMacOS(release) {
  const major = parseInt(String(release).split('.')[0], 10);
  if (Number.isNaN(major)) return 'macOS';
  const entry = DARWIN_TABLE[major];
  if (!entry) return 'macOS';
  // Return "macOS Name version" e.g. "macOS Sonoma 14.0" or for Big Sur "macOS Big Sur 11.6"
  // If version contains dot already, use as is; otherwise append .0?
  // For simplicity, if entry.version includes dot, return as is, else add .0
  // Use release minor for more precise? But we just use table version
  const ver = entry.version.includes('.') ? entry.version : `${entry.version}.0`;
  // Special for Big Sur and above, use major only? But keep ver
  return `macOS ${entry.name} ${ver}`;
}

function windowsFromBuild(release, version) {
  // Try release first, then version
  const candidates = [release, version].filter(Boolean);
  for (const str of candidates) {
    const parts = String(str).split('.');
    // Expected "10.0.19045" or "10.0.22631"
    if (parts.length >= 3) {
      const build = parseInt(parts[2], 10);
      if (!Number.isNaN(build)) {
        if (build >= 22000) return 'Windows 11';
        // NT 10.0 with build <22000 is Win10
        // Check major is 10
        if (parts[0] === '10' && parts[1] === '0') return 'Windows 10';
        return 'Windows 10';
      }
    }
    // Fallback: search for build number in string like "19045"
    const m = String(str).match(/(\d{4,5})/);
    if (m) {
      const build = parseInt(m[1], 10);
      if (!Number.isNaN(build)) {
        if (build >= 22000) return 'Windows 11';
        return 'Windows 10';
      }
    }
  }
  // Fallback to parsing version string that may contain "Windows 11" directly
  if (version && /Windows\s+11/i.test(version)) return 'Windows 11';
  if (version && /Windows\s+10/i.test(version)) return 'Windows 10';
  return 'Windows';
}

export async function getOS(backend) {
  try {
    const platform = backend?.platform || process.platform;
    if (platform === 'linux') {
      try {
        const content = await backend.readFile('/etc/os-release');
        const data = parseOsRelease(content);
        const pretty = data.PRETTY_NAME || data.NAME || 'Linux';
        return { label: 'OS', value: pretty };
      } catch {
        return { label: 'OS', value: 'Linux' };
      }
    }
    if (platform === 'darwin') {
      let release = '0.0.0';
      try {
        release = backend.os.release();
      } catch {
        release = '0.0.0';
      }
      const macos = darwinToMacOS(release);
      // Append Darwin version for completeness? But spec says marketing name and version e.g. "macOS Sonoma 14.x"
      // We return marketing name; if we want to include Darwin, we could append but keep simple
      // Check if we should include version detail: we include table version, but also could include release patch
      // For Sonoma 14.x, we could return "macOS Sonoma 14.0" with Darwin.
      // Add Darwin version in parentheses for clarity? Not required.
      // Return with version: e.g. "macOS Sonoma 14.0"
      // If unknown Darwin, fallback to "macOS" + release
      if (macos === 'macOS') {
        return { label: 'OS', value: `macOS ${release}` };
      }
      return { label: 'OS', value: macos };
    }
    if (platform === 'win32') {
      let release = '';
      let version = '';
      try { release = backend.os.release(); } catch {}
      try { version = backend.os.version(); } catch {}
      const win = windowsFromBuild(release, version);
      return { label: 'OS', value: win };
    }
    // fallback
    return { label: 'OS', value: String(platform) };
  } catch {
    return null;
  }
}

export default getOS;

// Also export helpers for testing
export { parseOsRelease, darwinToMacOS, windowsFromBuild, DARWIN_TABLE };
