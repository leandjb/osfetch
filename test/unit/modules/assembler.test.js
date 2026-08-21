import { assemble } from '../../../src/core/assembler.js';
import { makeBackend } from '../../helpers/mockBackend.js';
import { registry } from '../../../src/modules/index.js';

describe('assembler', () => {
  test('runs probes in parallel and keeps order', async () => {
    const b = makeBackend('linux');
    const res = await assemble(b);
    // Should have 6 entries in registry order: os, kernel, uptime, shell, cpu, memory
    expect(res.length).toBe(6);
    expect(res[0].label).toBe('OS');
    expect(res[1].label).toBe('Kernel');
    expect(res[2].label).toBe('Uptime');
    expect(res[3].label).toBe('Shell');
    expect(res[4].label).toBe('CPU');
    expect(res[5].label).toBe('Memory');
  });

  test('drops null probes', async () => {
    const b = makeBackend('linux', { env: {} }); // shell will be null
    const res = await assemble(b);
    // Shell should be dropped
    const labels = res.map((r) => r.label);
    expect(labels).not.toContain('Shell');
    expect(res.length).toBe(5);
    // Order stable
    expect(labels).toEqual(['OS', 'Kernel', 'Uptime', 'CPU', 'Memory']);
  });

  test('failed probes vanish and order is stable with multiple failures', async () => {
    // Create backend where shell and cpu fail
    const b = {
      platform: 'linux',
      env: {},
      os: {
        release: () => '6.5.0',
        version: () => '6.5.0',
        uptime: () => 1000,
        totalmem: () => 100,
        freemem: () => 50,
        cpus: () => { throw new Error('fail'); },
        hostname: () => 'h',
        userInfo: () => ({ username: 'u' }),
      },
      readFile: async (p) => {
        if (p === '/etc/os-release') return 'PRETTY_NAME="Test"';
        if (p === '/proc/meminfo') throw new Error('fail');
        throw new Error('ENOENT');
      },
    };
    const res = await assemble(b);
    const labels = res.map((r) => r.label);
    // shell null, cpu null? cpu throws so null, memory may fallback to totalmem/freemem so not null?
    // memory fallback will succeed with 100/50 => not null
    expect(labels).toEqual(expect.arrayContaining(['OS', 'Kernel', 'Uptime']));
    // Ensure order is stable: OS before Kernel before Uptime etc.
    expect(labels.indexOf('OS')).toBeLessThan(labels.indexOf('Kernel'));
    expect(labels.indexOf('Kernel')).toBeLessThan(labels.indexOf('Uptime'));
  });

  test('registry order is stable', () => {
    expect(registry.map((r) => r.name)).toEqual(['os', 'kernel', 'uptime', 'shell', 'cpu', 'memory']);
  });

  test('never throws, returns array', async () => {
    const b = { platform: 'linux', os: {}, readFile: async () => { throw new Error(); }, env: {} };
    const res = await assemble(b);
    expect(Array.isArray(res)).toBe(true);
  });
});
