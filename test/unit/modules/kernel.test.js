import { getKernel } from '../../../src/modules/kernel.js';
import { makeBackend } from '../../helpers/mockBackend.js';

describe('kernel module', () => {
  test('linux returns release', async () => {
    const b = makeBackend('linux', { release: '6.5.0-21-generic' });
    expect(await getKernel(b)).toEqual({ label: 'Kernel', value: '6.5.0-21-generic' });
  });
  test('darwin returns release', async () => {
    const b = makeBackend('darwin', { release: '23.0.0' });
    expect(await getKernel(b)).toEqual({ label: 'Kernel', value: '23.0.0' });
  });
  test('win32 returns release', async () => {
    const b = makeBackend('win32', { release: '10.0.22631' });
    expect(await getKernel(b)).toEqual({ label: 'Kernel', value: '10.0.22631' });
  });
  test('fallback to version when release empty', async () => {
    const b = makeBackend('win32', { release: '' , version: 'Windows 11 Pro' });
    b.os.release = () => '';
    b.os.version = () => 'Windows 11 Pro';
    expect(await getKernel(b)).toEqual({ label: 'Kernel', value: 'Windows 11 Pro' });
  });
  test('returns null when both fail', async () => {
    const b = { platform: 'linux', os: { release: () => { throw new Error(); }, version: () => { throw new Error(); } } };
    expect(await getKernel(b)).toBeNull();
  });
});
