import { linux } from '../../../src/logos/linux.js';
import { macos } from '../../../src/logos/macos.js';
import { windows } from '../../../src/logos/windows.js';
import { getLogo } from '../../../src/logos/index.js';

describe('logos', () => {
  const logos = [linux, macos, windows];

  test('each logo has name, lines, colors', () => {
    for (const logo of logos) {
      expect(typeof logo.name).toBe('string');
      expect(Array.isArray(logo.lines)).toBe(true);
      expect(Array.isArray(logo.colors)).toBe(true);
      expect(logo.lines.length).toBe(logo.colors.length);
      expect(logo.lines.length).toBeGreaterThanOrEqual(12);
      expect(logo.lines.length).toBeLessThanOrEqual(20);
    }
  });

  test('logo lines are ASCII 0x20-0x7E only and <=28 cols', () => {
    for (const logo of logos) {
      for (const line of logo.lines) {
        expect(line.length).toBeLessThanOrEqual(28);
        for (let i = 0; i < line.length; i++) {
          const code = line.charCodeAt(i);
          expect(code).toBeGreaterThanOrEqual(0x20);
          expect(code).toBeLessThanOrEqual(0x7e);
        }
      }
    }
  });

  test('colors are valid 8-color names', () => {
    const valid = new Set(['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']);
    for (const logo of logos) {
      for (const c of logo.colors) {
        expect(valid.has(c)).toBe(true);
      }
    }
  });

  test('getLogo selects per platform', () => {
    expect(getLogo('darwin')).toBe(macos);
    expect(getLogo('win32')).toBe(windows);
    expect(getLogo('linux')).toBe(linux);
    expect(getLogo('freebsd')).toBe(linux);
    expect(getLogo(undefined)).toBe(linux);
  });

  test('linux is fallback for all distros', () => {
    expect(getLogo('linux')).toBe(linux);
  });
});
