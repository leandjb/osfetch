import path from 'node:path';

function basename(p) {
  if (!p) return null;
  // Handle both posix and win32 paths
  const base = path.posix.basename(p) || path.win32.basename(p);
  // For cases like "/bin/bash", posix basename gives "bash"
  // For "C:\\Program Files\\PowerShell\\7\\pwsh.exe", win32 gives "pwsh.exe"
  // Strip extension for exe
  if (base.toLowerCase().endsWith('.exe')) return base.slice(0, -4);
  return base;
}

export async function getShell(backend) {
  try {
    const platform = backend?.platform;
    const env = backend?.env || process.env;

    if (platform === 'win32') {
      // Heuristics in order: PSModulePath -> pwsh/PowerShell, PROMPT -> cmd, optional exec
      if (env.PSModulePath) {
        const psPath = String(env.PSModulePath);
        // PowerShell 7 has path containing "PowerShell\7"
        if (psPath.includes('PowerShell\\7') || psPath.includes('PowerShell/7') || psPath.toLowerCase().includes('pwsh')) {
          return { label: 'Shell', value: 'pwsh' };
        }
        return { label: 'Shell', value: 'PowerShell' };
      }
      if (env.PROMPT) {
        // PROMPT is set in cmd
        return { label: 'Shell', value: 'cmd' };
      }
      // Optional exec probe, failure-tolerant
      if (backend.exec) {
        try {
          const result = await backend.exec('Get-CimInstance Win32_Process -Filter "ProcessId=$PID" | Select-Object -ExpandProperty CommandLine');
          if (result && typeof result === 'string') {
            const lower = result.toLowerCase();
            if (lower.includes('pwsh')) return { label: 'Shell', value: 'pwsh' };
            if (lower.includes('powershell')) return { label: 'Shell', value: 'PowerShell' };
            if (lower.includes('cmd')) return { label: 'Shell', value: 'cmd' };
          }
        } catch {
          // ignore
        }
      }
      return null;
    }

    // POSIX: use $SHELL
    const shellPath = env.SHELL || env.shell;
    if (shellPath && typeof shellPath === 'string' && shellPath.trim()) {
      const base = basename(shellPath.trim());
      if (base) return { label: 'Shell', value: base };
    }

    // Fallback: try exec? But spec says no mandatory subprocesses on linux/mac, so we just return null
    return null;
  } catch {
    return null;
  }
}

export default getShell;
