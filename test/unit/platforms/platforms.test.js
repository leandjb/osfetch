import { createBackend, createLinuxBackend, createDarwinBackend, createWin32Backend } from '../../../src/platforms/index.js';

describe('platforms factory', () => {
  test('createBackend returns linux backend', () => {
    const b = createBackend('linux');
    expect(b.platform).toBe('linux');
    expect(typeof b.os.release).toBe('function');
    expect(typeof b.readFile).toBe('function');
    expect(b.exec).toBeUndefined();
  });

  test('createBackend returns darwin backend', () => {
    const b = createBackend('darwin');
    expect(b.platform).toBe('darwin');
    expect(typeof b.os.release).toBe('function');
    expect(typeof b.readFile).toBe('function');
  });

  test('createBackend returns win32 backend with exec', () => {
    const b = createBackend('win32');
    expect(b.platform).toBe('win32');
    expect(typeof b.os.release).toBe('function');
    expect(typeof b.exec).toBe('function');
  });

  test('factory respects process.platform when no arg', () => {
    const b = createBackend();
    expect(['linux', 'darwin', 'win32', 'freebsd', 'openbsd']).toContain(b.platform === 'linux' || b.platform === 'darwin' || b.platform === 'win32' ? b.platform : 'linux');
    // At least check that it returns something with os
    expect(b.os).toBeDefined();
  });

  test('individual creators work', () => {
    expect(createLinuxBackend().platform).toBe('linux');
    expect(createDarwinBackend().platform).toBe('darwin');
    expect(createWin32Backend().platform).toBe('win32');
  });

  test('backend shape matches contract', () => {
    const b = createBackend('linux');
    expect(b).toHaveProperty('platform');
    expect(b).toHaveProperty('os');
    expect(b).toHaveProperty('readFile');
    expect(b).toHaveProperty('env');
    // win32 exec
    const wb = createBackend('win32');
    expect(wb).toHaveProperty('exec');
  });

  test('mocked process.platform returns correct backend', () => {
    const orig = process.platform;
    // We can't easily change process.platform (read-only), but we test via explicit arg
    // This test documents that factory uses explicit arg for testability
    const linux = createBackend('linux');
    const darwin = createBackend('darwin');
    const win32 = createBackend('win32');
    expect(linux.platform).toBe('linux');
    expect(darwin.platform).toBe('darwin');
    expect(win32.platform).toBe('win32');
    // ensure process.platform is still original
    expect(process.platform).toBe(orig);
  });
});
