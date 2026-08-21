import { getUptime, formatUptime } from '../../../src/modules/uptime.js';
import { makeBackend } from '../../helpers/mockBackend.js';

describe('uptime module', () => {
  test('formatUptime handles days, hours, mins', () => {
    expect(formatUptime(0)).toBe('0 secs');
    expect(formatUptime(30)).toBe('30 secs');
    expect(formatUptime(60)).toBe('1 min');
    expect(formatUptime(3600)).toBe('1 hour');
    expect(formatUptime(86400)).toBe('1 day');
    expect(formatUptime(90061)).toBe('1 day, 1 hour, 1 min');
    expect(formatUptime(123456)).toBe('1 day, 10 hours, 17 mins');
  });

  test('linux uptime', async () => {
    const b = makeBackend('linux', { uptime: 123456 });
    expect(await getUptime(b)).toEqual({ label: 'Uptime', value: '1 day, 10 hours, 17 mins' });
  });
  test('darwin uptime', async () => {
    const b = makeBackend('darwin', { uptime: 98765 });
    const res = await getUptime(b);
    expect(res.label).toBe('Uptime');
    expect(res.value).toMatch(/day|hour|min|sec/);
  });
  test('win32 uptime', async () => {
    const b = makeBackend('win32', { uptime: 54321 });
    expect(await getUptime(b)).toEqual({ label: 'Uptime', value: '15 hours, 5 mins' });
  });
  test('returns null on failure', async () => {
    const b = { platform: 'linux', os: { uptime: () => { throw new Error(); } } };
    expect(await getUptime(b)).toBeNull();
  });
  test('human-readable example from spec', async () => {
    // 2 days, 3 hours = 2*86400 + 3*3600 = 183600
    const b = makeBackend('linux', { uptime: 183600 });
    const res = await getUptime(b);
    expect(res.value).toBe('2 days, 3 hours');
  });
});
