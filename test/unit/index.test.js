import { getSystemInfo, render, run } from '../../src/index.js';
import { makeBackend } from '../helpers/mockBackend.js';

describe('src/index public API', () => {
  test('getSystemInfo returns object with expected keys', async () => {
    const b = makeBackend('linux');
    const info = await getSystemInfo(b);
    expect(info).toHaveProperty('os');
    expect(info).toHaveProperty('kernel');
    expect(info).toHaveProperty('uptime');
    expect(info).toHaveProperty('cpu');
    expect(info).toHaveProperty('memory');
    // shell may be present or not, but on linux mock it is bash
    expect(info.shell).toBe('bash');
    expect(info.username).toBe('testuser');
    expect(info.hostname).toBe('testhost');
  });

  test('render produces report text', async () => {
    const b = makeBackend('linux');
    const info = await getSystemInfo(b);
    const out = render(info, { color: false });
    expect(out).toContain('testuser@testhost');
    expect(out).toContain('OS:');
    expect(out).toContain('Kernel:');
  });

  test('run([]) integration against mock backend returns full report', async () => {
    const b = makeBackend('linux');
    const out = await run([], b);
    expect(out).toContain('testuser@testhost');
    expect(out).toContain('OS:');
    expect(out).toContain('Ubuntu');
    expect(out).toContain('Kernel:');
    expect(out).toContain('Uptime:');
    expect(out).toContain('CPU:');
    expect(out).toContain('Memory:');
    // Should contain logo when not --no-logo
    expect(out).toContain('.--.');
  });

  test('run --json returns valid JSON', async () => {
    const b = makeBackend('linux');
    const out = await run(['--json'], b);
    const parsed = JSON.parse(out);
    expect(parsed.os).toBeDefined();
    expect(parsed.kernel).toBeDefined();
    // no logo, colors in json mode
    expect(out).not.toContain('\x1b[');
  });

  test('run --help returns help text', async () => {
    const b = makeBackend('linux');
    const out = await run(['--help'], b);
    expect(out.toLowerCase()).toContain('usage');
    expect(out).toContain('--json');
  });

  test('run --version returns version', async () => {
    const b = makeBackend('linux');
    const out = await run(['--version'], b);
    expect(out).toMatch(/\d+\.\d+\.\d+/);
  });
});
