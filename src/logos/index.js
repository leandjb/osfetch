import { linux } from './linux.js';
import { macos } from './macos.js';
import { windows } from './windows.js';

export { linux, macos, windows };

export function getLogo(platform) {
  if (platform === 'darwin') return macos;
  if (platform === 'win32') return windows;
  return linux;
}

export default getLogo;
