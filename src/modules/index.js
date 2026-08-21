import os from './os.js';
import kernel from './kernel.js';
import uptime from './uptime.js';
import shell from './shell.js';
import cpu from './cpu.js';
import memory from './memory.js';

export const registry = [
  { name: 'os', probe: os },
  { name: 'kernel', probe: kernel },
  { name: 'uptime', probe: uptime },
  { name: 'shell', probe: shell },
  { name: 'cpu', probe: cpu },
  { name: 'memory', probe: memory },
];

export default registry;
