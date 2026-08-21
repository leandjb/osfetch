import { getOS } from '../../../src/modules/os.js';
import { makeBackend } from '../../helpers/mockBackend.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('os module', () => {
  test('linux ubuntu returns Ubuntu name', async () => {
    const b = makeBackend('linux', { variant: 'ubuntu' });
    const res = await getOS(b);
    expect(res).toEqual({ label: 'OS', value: 'Ubuntu 22.04.3 LTS' });
  });

  test('linux arch returns Arch Linux', async () => {
    const b = makeBackend('linux', { variant: 'arch' });
    expect(await getOS(b)).toEqual({ label: 'OS', value: 'Arch Linux' });
  });

  test('linux alpine returns Alpine', async () => {
    const b = makeBackend('linux', { variant: 'alpine' });
    expect(await getOS(b)).toEqual({ label: 'OS', value: 'Alpine Linux v3.18' });
  });

  test('linux handles readFile failure gracefully', async () => {
    const b = makeBackend('linux', { variant: 'ubuntu' });
    b.readFile = async () => { throw new Error('fail'); };
    const res = await getOS(b);
    expect(res).toEqual({ label: 'OS', value: 'Linux' });
  });

  test('darwin 23 => Sonoma', async () => {
    const b = makeBackend('darwin', { release: '23.0.0' });
    expect(await getOS(b)).toEqual({ label: 'OS', value: 'macOS Sonoma 14.0' });
  });

  test('darwin 22 => Ventura', async () => {
    const b = makeBackend('darwin', { release: '22.5.0' });
    expect((await getOS(b)).value).toMatch(/Ventura/);
  });

  test('darwin 19 => Catalina', async () => {
    const b = makeBackend('darwin', { release: '19.6.0' });
    expect((await getOS(b)).value).toMatch(/Catalina/);
  });

  test('darwin unknown falls back to macOS', async () => {
    const b = makeBackend('darwin', { release: '99.0.0' });
    expect((await getOS(b)).value).toMatch(/macOS/);
  });

  test('win32 build 19045 => Windows 10', async () => {
    const b = makeBackend('win32', { release: '10.0.19045' });
    expect(await getOS(b)).toEqual({ label: 'OS', value: 'Windows 10' });
  });

  test('win32 build 22000 boundary => Windows 11', async () => {
    const b = makeBackend('win32', { release: '10.0.22000' });
    expect(await getOS(b)).toEqual({ label: 'OS', value: 'Windows 11' });
  });

  test('win32 build 22631 => Windows 11', async () => {
    const b = makeBackend('win32', { release: '10.0.22631' });
    expect(await getOS(b)).toEqual({ label: 'OS', value: 'Windows 11' });
  });

  test('win32 build 21999 => Windows 10', async () => {
    const b = makeBackend('win32', { release: '10.0.21999' });
    expect(await getOS(b)).toEqual({ label: 'OS', value: 'Windows 10' });
  });

  test('parses os-release fixtures directly', async () => {
    const content = readFileSync(path.join(__dirname, '../../fixtures/linux/os-release-ubuntu'), 'utf8');
    expect(content).toContain('PRETTY_NAME');
    const b = makeBackend('linux', { variant: 'ubuntu' });
    const res = await getOS(b);
    expect(res.value).toContain('Ubuntu');
  });
});
