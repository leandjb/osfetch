import { render } from '../../../src/core/renderer.js';
import { getLogo } from '../../../src/logos/index.js';
import { strip } from '../../../src/core/ansi.js';

const mockInfo = [
  { label: 'OS', value: 'Ubuntu 22.04.3 LTS' },
  { label: 'Kernel', value: '6.5.0-21-generic' },
  { label: 'Uptime', value: '2 days, 3 hours' },
  { label: 'Shell', value: 'bash' },
  { label: 'CPU', value: 'Intel(R) Core(TM) i7-10700K (8)' },
  { label: 'Memory', value: '8192 MB / 16384 MB' },
];

describe('renderer', () => {
  test('renders with linux logo and color', () => {
    const logo = getLogo('linux');
    const out = render(mockInfo, logo, { username: 'leandb', hostname: 'myhost', color: true });
    expect(out).toContain('leandb@myhost');
    expect(out).toContain('-------------');
    expect(out).toContain('OS:');
    expect(out).toContain('\x1b['); // has ANSI
    expect(out).toMatchSnapshot();
  });

  test('renders with macos logo and color', () => {
    const logo = getLogo('darwin');
    const out = render(mockInfo, logo, { username: 'leandb', hostname: 'myhost', color: true });
    expect(out).toContain('leandb@myhost');
    expect(out).toMatchSnapshot();
  });

  test('renders with windows logo and color', () => {
    const logo = getLogo('win32');
    const out = render(mockInfo, logo, { username: 'leandb', hostname: 'myhost', color: true });
    expect(out).toContain('leandb@myhost');
    expect(out).toMatchSnapshot();
  });

  test('renders with --no-color has zero ANSI', () => {
    const logo = getLogo('linux');
    const out = render(mockInfo, logo, { username: 'leandb', hostname: 'myhost', noColor: true });
    expect(out).not.toMatch(/\x1b\[/);
    expect(strip(out)).toBe(out);
    expect(out).toMatchSnapshot();
  });

  test('renders with --no-logo starts at column 0', () => {
    const logo = getLogo('linux');
    const out = render(mockInfo, logo, { username: 'leandb', hostname: 'myhost', noLogo: true, color: true });
    const lines = out.split('\n');
    // first line should start with color-coded title but after stripping should start with username
    expect(strip(lines[0]).startsWith('leandb@myhost')).toBe(true);
    // no logo art should be present: first line should not contain Tux art like '.-' after stripping? Actually with no-logo, lines start at column 0
    expect(strip(lines[2]).startsWith('OS:')).toBe(true);
    expect(out).toMatchSnapshot();
  });

  test('renders with noColor and noLogo combined', () => {
    const logo = getLogo('linux');
    const out = render(mockInfo, logo, { username: 'a', hostname: 'b', noColor: true, noLogo: true });
    expect(out).not.toMatch(/\x1b\[/);
    const lines = out.split('\n');
    expect(strip(lines[0])).toBe('a@b');
    expect(strip(lines[1])).toBe('---');
    expect(out).toMatchSnapshot();
  });

  test('title and underline display correctly', () => {
    const logo = getLogo('linux');
    const out = render(mockInfo, logo, { username: 'testuser', hostname: 'testhost', noColor: true, noLogo: true });
    const lines = out.split('\n');
    expect(lines[0]).toBe('testuser@testhost');
    expect(lines[1]).toBe('-'.repeat('testuser@testhost'.length));
  });

  test('palette row is present with color and aligned', () => {
    const logo = getLogo('linux');
    const out = render(mockInfo, logo, { username: 'u', hostname: 'h', color: true });
    // palette contains bg blocks (40m, 41m etc)
    expect(out).toMatch(/\x1b\[40m.*\x1b\[47m/);
    // with noColor, no palette (or no ANSI but we check no 40m)
    const outNoColor = render(mockInfo, logo, { username: 'u', hostname: 'h', noColor: true });
    expect(outNoColor).not.toMatch(/\x1b\[4[0-7]m/);
  });

  test('side-by-side layout gutter is 2 spaces and handles logo taller than info', () => {
    const logo = getLogo('linux');
    const shortInfo = [{ label: 'OS', value: 'Test' }];
    const out = render(shortInfo, logo, { username: 'u', hostname: 'h', noColor: true });
    const lines = out.split('\n');
    // First lines should have gutter 2 spaces between logo and info
    expect(lines[0]).toContain('  u@h');
    // Lines beyond info should be logo only (no gutter trailing)
    expect(lines[10].trimEnd()).toBe(logo.lines[10].trimEnd());
  });

  test('info taller than logo pads logo area with spaces', () => {
    const smallLogo = { name: 'tiny', lines: ['a', 'b'], colors: ['red', 'red'] };
    const manyInfo = Array.from({ length: 10 }, (_, i) => ({ label: `Label${i}`, value: `Value${i}` }));
    const out = render(manyInfo, smallLogo, { username: 'u', hostname: 'h', noColor: true });
    const lines = out.split('\n');
    // title+underline(2) + 10 =12, logo 2 => max 12
    expect(lines.length).toBe(12);
    // lines beyond logo should start with spaces + gutter
    const logoWidth = Math.max(...smallLogo.lines.map(l => l.length));
    expect(lines[5].startsWith(' '.repeat(logoWidth) + '  ')).toBe(true);
  });

  test('handles object info shape', () => {
    const logo = getLogo('linux');
    const objInfo = {
      os: 'Arch Linux',
      kernel: '6.1.0',
      uptime: '1 hour',
      shell: 'zsh',
      cpu: 'AMD Ryzen',
      memory: '4000 / 8000 MB',
      username: 'archuser',
      hostname: 'archhost',
    };
    const out = render(objInfo, logo, { noColor: true });
    expect(out).toContain('archuser@archhost');
    expect(out).toContain('OS: Arch Linux');
    expect(out).toMatchSnapshot();
  });

  test('NO_COLOR env disables colors', () => {
    const orig = process.env.NO_COLOR;
    process.env.NO_COLOR = '1';
    const logo = getLogo('linux');
    const out = render(mockInfo, logo, { username: 'u', hostname: 'h' });
    expect(out).not.toMatch(/\x1b\[/);
    if (orig === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = orig;
  });
});
