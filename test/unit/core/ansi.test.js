import { paint, paintBg, strip, enabled, fg, bg, colors, bgColors } from '../../../src/core/ansi.js';

describe('ansi', () => {
  test('fg map has 8 colors with correct codes', () => {
    expect(Object.keys(fg)).toHaveLength(8);
    expect(fg.black).toBe(30);
    expect(fg.red).toBe(31);
    expect(fg.green).toBe(32);
    expect(fg.yellow).toBe(33);
    expect(fg.blue).toBe(34);
    expect(fg.magenta).toBe(35);
    expect(fg.cyan).toBe(36);
    expect(fg.white).toBe(37);
  });

  test('bg map has 8 colors with correct codes', () => {
    expect(Object.keys(bg)).toHaveLength(8);
    expect(bg.black).toBe(40);
    expect(bg.red).toBe(41);
    expect(bg.green).toBe(42);
    expect(bg.yellow).toBe(43);
    expect(bg.blue).toBe(44);
    expect(bg.magenta).toBe(45);
    expect(bg.cyan).toBe(46);
    expect(bg.white).toBe(47);
  });

  test('aliases colors/bgColors match fg/bg', () => {
    expect(colors).toEqual(fg);
    expect(bgColors).toEqual(bg);
  });

  test('paint wraps text with ANSI fg code', () => {
    const out = paint('hello', 'red');
    expect(out).toBe('\x1b[31mhello\x1b[0m');
  });

  test('paint returns text unchanged for unknown color', () => {
    expect(paint('hello', 'unknown')).toBe('hello');
  });

  test('paintBg wraps with bg code', () => {
    expect(paintBg(' ', 'red')).toBe('\x1b[41m \x1b[0m');
  });

  test('strip removes ANSI sequences', () => {
    const painted = paint('hello', 'green') + ' ' + paintBg('world', 'blue');
    expect(strip(painted)).toBe('hello world');
    expect(strip('\x1b[31mhello\x1b[0m')).toBe('hello');
    expect(strip('plain')).toBe('plain');
  });

  test('enabled honors NO_COLOR', () => {
    const orig = process.env.NO_COLOR;
    process.env.NO_COLOR = '1';
    expect(enabled()).toBe(false);
    expect(enabled({ noColor: false })).toBe(false);
    if (orig === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = orig;
    expect(enabled()).toBe(true);
  });

  test('enabled honors --no-color flag', () => {
    expect(enabled({ noColor: true })).toBe(false);
    expect(enabled({ noColor: false })).toBe(true);
    expect(enabled({})).toBe(true);
  });

  test('strip handles multiple sequences', () => {
    const s = '\x1b[31mred\x1b[0m \x1b[42m green bg \x1b[0m';
    expect(strip(s)).toBe('red  green bg ');
  });
});
