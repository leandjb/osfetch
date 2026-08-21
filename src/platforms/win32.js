import os from 'node:os';
import { readFile } from 'node:fs/promises';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

const execP = promisify(execCb);

export function createWin32Backend() {
  return {
    platform: 'win32',
    os,
    env: process.env,
    readFile: async (absPath) => readFile(absPath, 'utf8'),
    exec: async (cmd) => {
      const { stdout } = await execP(cmd, { windowsHide: true, timeout: 2000 });
      return stdout;
    },
  };
}

export default createWin32Backend;
