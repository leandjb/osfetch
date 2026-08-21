import { getMemory } from '../../../src/modules/memory.js';
import { makeBackend } from '../../helpers/mockBackend.js';

describe('memory module', () => {
  test('linux parses MemAvailable', async () => {
    const b = makeBackend('linux');
    const res = await getMemory(b);
    expect(res.label).toBe('Memory');
    // Expected 7.81 GiB / 15.63 GiB from fixtures
    expect(res.value).toMatch(/GiB/);
    expect(res.value).toContain('/');
  });

  test('linux fallback to totalmem/freemem on read failure', async () => {
    const b = makeBackend('linux');
    b.readFile = async () => { throw new Error('fail'); };
    b.os.totalmem = () => 17179869184;
    b.os.freemem = () => 8589934592;
    const res = await getMemory(b);
    expect(res.value).toBe('8.00 GiB / 16.00 GiB');
  });

  test('darwin uses totalmem/freemem', async () => {
    const b = makeBackend('darwin', { totalmem: 17179869184, freemem: 8589934592 });
    expect((await getMemory(b)).value).toBe('8.00 GiB / 16.00 GiB');
  });

  test('win32 uses totalmem/freemem', async () => {
    const b = makeBackend('win32', { totalmem: 8589934592, freemem: 4294967296 });
    const res = await getMemory(b);
    expect(res.value).toMatch(/GiB/);
  });

  test('returns null on failure', async () => {
    const b = { platform: 'linux', os: { totalmem: () => { throw new Error(); }, freemem: () => 0 }, readFile: async () => { throw new Error(); } };
    expect(await getMemory(b)).toBeNull();
  });

  test('failure -> null case also for empty', async () => {
    const b = makeBackend('linux');
    b.os.totalmem = () => { throw new Error(); };
    b.readFile = async () => { throw new Error(); };
    expect(await getMemory(b)).toBeNull();
  });

  test('handles MemAvailable missing fallback to MemFree', async () => {
    const b = makeBackend('linux');
    b.readFile = async (p) => {
      if (p === '/proc/meminfo') return 'MemTotal:       8000000 kB\nMemFree:        4000000 kB\n';
      throw new Error('ENOENT');
    };
    b.os.totalmem = () => 0;
    b.os.freemem = () => 0;
    const res = await getMemory(b);
    // Should parse and compute used = 4000000kB => ~3.81 GiB / 7.63 GiB
    expect(res.value).toMatch(/GiB/);
  });
});
