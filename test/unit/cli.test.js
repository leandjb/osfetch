import { parseArgs, getHelpText, getVersion } from '../../src/cli.js';

describe('cli parser', () => {
  test('parses --json', () => {
    expect(parseArgs(['--json']).json).toBe(true);
  });
  test('parses --no-color', () => {
    expect(parseArgs(['--no-color']).noColor).toBe(true);
  });
  test('parses --no-logo', () => {
    expect(parseArgs(['--no-logo']).noLogo).toBe(true);
  });
  test('parses --help', () => {
    expect(parseArgs(['--help']).help).toBe(true);
    expect(parseArgs(['-h']).help).toBe(true);
  });
  test('parses --version', () => {
    expect(parseArgs(['--version']).version).toBe(true);
    expect(parseArgs(['-v']).version).toBe(true);
  });
  test('parses combined flags', () => {
    const f = parseArgs(['--json', '--no-color', '--no-logo']);
    expect(f.json).toBe(true);
    expect(f.noColor).toBe(true);
    expect(f.noLogo).toBe(true);
  });
  test('unknown flag sets unknown', () => {
    const f = parseArgs(['--frobnicate']);
    expect(f.unknown).toBe('--frobnicate');
  });
  test('unknown stops parsing', () => {
    const f = parseArgs(['--json', '--unknown', '--no-logo']);
    expect(f.unknown).toBe('--unknown');
  });
  test('empty args gives defaults', () => {
    const f = parseArgs([]);
    expect(f.json).toBe(false);
    expect(f.noColor).toBe(false);
    expect(f.unknown).toBeNull();
  });
  test('getHelpText contains all flags', () => {
    const help = getHelpText();
    expect(help).toContain('--json');
    expect(help).toContain('--no-color');
    expect(help).toContain('--no-logo');
    expect(help).toContain('--help');
    expect(help).toContain('--version');
  });
  test('getVersion returns semver', () => {
    const v = getVersion();
    expect(v).toMatch(/\d+\.\d+\.\d+/);
  });
});
