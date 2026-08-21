import os from 'node:os';
import { readFile } from 'node:fs/promises';

export function createDarwinBackend() {
  return {
    platform: 'darwin',
    os,
    env: process.env,
    readFile: async (absPath) => readFile(absPath, 'utf8'),
  };
}

export default createDarwinBackend;
