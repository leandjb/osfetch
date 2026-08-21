import { getCPU } from '../../../src/modules/cpu.js';
import { makeBackend } from '../../helpers/mockBackend.js';

describe('cpu module', () => {
  test('linux cpu', async () => {
    const b = makeBackend('linux');
    const res = await getCPU(b);
    expect(res.label).toBe('CPU');
    expect(res.value).toMatch(/Intel/);
    expect(res.value).toMatch(/\(/);
  });
  test('darwin cpu', async () => {
    const b = makeBackend('darwin');
    const res = await getCPU(b);
    expect(res.value).toContain('Intel');
  });
  test('win32 cpu', async () => {
    const b = makeBackend('win32');
    const res = await getCPU(b);
    expect(res.value).toMatch(/\(8\)/);
  });
  test('includes core count', async () => {
    const b = makeBackend('linux', { cpus: [{ model: 'TestCPU 1.0', speed: 1000, times: {} }, { model: 'TestCPU 1.0', speed: 1000, times: {} }] });
    expect((await getCPU(b)).value).toBe('TestCPU 1.0 (2)');
  });
  test('returns null when cpus fails', async () => {
    const b = { platform: 'linux', os: { cpus: () => { throw new Error(); } } };
    expect(await getCPU(b)).toBeNull();
  });
  test('returns null when no cpus', async () => {
    const b = { platform: 'linux', os: { cpus: () => [] } };
    expect(await getCPU(b)).toBeNull();
  });
});
