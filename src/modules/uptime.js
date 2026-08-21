export function formatUptime(seconds) {
  const s = Math.floor(Number(seconds) || 0);
  if (s < 0) return null;
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const parts = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (mins > 0) parts.push(`${mins} min${mins === 1 ? '' : 's'}`);
  if (parts.length === 0) {
    parts.push(`${secs} sec${secs === 1 ? '' : 's'}`);
  }
  return parts.join(', ');
}

export async function getUptime(backend) {
  try {
    let secs;
    try {
      secs = backend.os.uptime();
    } catch {
      return null;
    }
    if (typeof secs !== 'number' || Number.isNaN(secs)) return null;
    const formatted = formatUptime(secs);
    if (!formatted) return null;
    return { label: 'Uptime', value: formatted };
  } catch {
    return null;
  }
}

export default getUptime;
