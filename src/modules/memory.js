function formatBytes(bytes) {
  const gib = bytes / (1024 * 1024 * 1024);
  if (gib >= 1) {
    return `${gib.toFixed(2)} GiB`;
  }
  const mib = bytes / (1024 * 1024);
  return `${Math.round(mib)} MiB`;
}

function parseMeminfo(text) {
  const lines = text.split('\n');
  let totalKB = null;
  let availableKB = null;
  let freeKB = null;
  for (const line of lines) {
    const m = line.match(/^(\w+):\s+(\d+)\s+kB/);
    if (!m) continue;
    const key = m[1];
    const val = parseInt(m[2], 10);
    if (key === 'MemTotal') totalKB = val;
    if (key === 'MemAvailable') availableKB = val;
    if (key === 'MemFree') freeKB = val;
  }
  return { totalKB, availableKB, freeKB };
}

export async function getMemory(backend) {
  try {
    const platform = backend?.platform;
    // Try Linux meminfo first
    if (platform === 'linux') {
      try {
        const content = await backend.readFile('/proc/meminfo');
        const { totalKB, availableKB, freeKB } = parseMeminfo(content);
        if (totalKB != null) {
          const total = totalKB * 1024;
          let available = null;
          if (availableKB != null) available = availableKB * 1024;
          else if (freeKB != null) available = freeKB * 1024;
          if (available != null) {
            const used = total - available;
            return { label: 'Memory', value: `${formatBytes(used)} / ${formatBytes(total)}` };
          }
        }
      } catch {
        // fall through to os method
      }
    }
    // Fallback: totalmem/freemem
    let total, free;
    try { total = backend.os.totalmem(); } catch { return null; }
    try { free = backend.os.freemem(); } catch { return null; }
    if (typeof total !== 'number' || typeof free !== 'number') return null;
    const used = total - free;
    if (used < 0 || total <= 0) return null;
    return { label: 'Memory', value: `${formatBytes(used)} / ${formatBytes(total)}` };
  } catch {
    return null;
  }
}

export default getMemory;
export { formatBytes, parseMeminfo };
