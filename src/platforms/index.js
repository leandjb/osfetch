import { createLinuxBackend } from './linux.js';
import { createDarwinBackend } from './darwin.js';
import { createWin32Backend } from './win32.js';

export function createBackend(platform = process.platform) {
  if (platform === 'darwin') return createDarwinBackend();
  if (platform === 'win32') return createWin32Backend();
  return createLinuxBackend();
}

export default createBackend;

export { createLinuxBackend, createDarwinBackend, createWin32Backend };
