import { getShell } from '../../../src/modules/shell.js';
import { makeBackend } from '../../helpers/mockBackend.js';

describe('shell module', () => {
  test('linux returns basename of SHELL', async () => {
    const b = makeBackend('linux', { env: { SHELL: '/bin/bash' } });
    expect(await getShell(b)).toEqual({ label: 'Shell', value: 'bash' });
  });

  test('linux handles zsh', async () => {
    const b = makeBackend('linux', { env: { SHELL: '/usr/bin/zsh' } });
    expect((await getShell(b)).value).toBe('zsh');
  });

  test('linux returns null when SHELL missing', async () => {
    const b = makeBackend('linux', { env: {} });
    expect(await getShell(b)).toBeNull();
  });

  test('darwin returns shell', async () => {
    const b = makeBackend('darwin', { env: { SHELL: '/bin/zsh' } });
    expect((await getShell(b)).value).toBe('zsh');
  });

  test('win32 PSModulePath pwsh', async () => {
    const b = makeBackend('win32', { env: { PSModulePath: 'C:\\Program Files\\PowerShell\\7\\Modules' } });
    expect((await getShell(b)).value).toBe('pwsh');
  });

  test('win32 PSModulePath powershell', async () => {
    const b = makeBackend('win32', { env: { PSModulePath: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\Modules' } });
    expect((await getShell(b)).value).toBe('PowerShell');
  });

  test('win32 PROMPT -> cmd', async () => {
    const b = makeBackend('win32', { env: { PROMPT: '$P$G' } });
    expect((await getShell(b)).value).toBe('cmd');
  });

  test('win32 failure -> null when exec fails and no heuristics', async () => {
    const b = makeBackend('win32', { env: {}, execShouldFail: true });
    expect(await getShell(b)).toBeNull();
  });

  test('win32 optional exec failure tolerant returns null', async () => {
    const b = makeBackend('win32', { env: {}, execShouldFail: true });
    const res = await getShell(b);
    expect(res).toBeNull();
  });

  test('failure -> null cases never throw', async () => {
    const b = { platform: 'linux', env: {}, os: {} };
    await expect(getShell(b)).resolves.toBeNull();
  });
});
