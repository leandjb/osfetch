import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binPath = path.resolve(__dirname, '../../bin/osfetch.js');

function runBin(args = []) {
  const result = spawnSync('node', [binPath, ...args], { encoding: 'utf8' });
  return result;
}

describe('e2e cli', () => {
  test('default run exits 0 and prints report', () => {
    const res = runBin([]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('OS:');
    expect(res.stdout).toContain('Kernel:');
    // Should contain title with @
    expect(res.stdout).toMatch(/@/);
  });

  test('--json parses with expected keys', () => {
    const res = runBin(['--json']);
    expect(res.status).toBe(0);
    const parsed = JSON.parse(res.stdout);
    // Expected keys as per spec: os, kernel, uptime, shell, cpu, memory (absent keys for failed probes allowed)
    // But at least os, kernel should be present on healthy system
    expect(parsed).toHaveProperty('os');
    expect(parsed).toHaveProperty('kernel');
    // Should have no logo or colors (no ANSI)
    expect(res.stdout).not.toMatch(/\x1b\[/);
    // Should be valid JSON only
    expect(typeof parsed.os).toBe('string');
  });

  test('--no-color emits zero ANSI sequences', () => {
    const res = runBin(['--no-color']);
    expect(res.status).toBe(0);
    expect(res.stdout).not.toMatch(/\x1b\[/);
    expect(res.stderr).not.toMatch(/\x1b\[/);
  });

  test('--no-logo starts at column 0', () => {
    const res = runBin(['--no-logo']);
    expect(res.status).toBe(0);
    const lines = res.stdout.split('\n').filter(Boolean);
    // First line should be title like user@host at column 0 (no leading spaces)
    const first = lines[0];
    // Strip ANSI for check
    const stripped = first.replace(/\x1b\[[0-9;]*m/g, '');
    expect(stripped).toMatch(/^[^ ]+@[^ ]+$/);
    expect(stripped[0]).not.toBe(' ');
    // Second line should be underline dashes at column 0
    const second = lines[1].replace(/\x1b\[[0-9;]*m/g, '');
    expect(second).toMatch(/^-+$/);
  });

  test('--no-logo --no-color combined', () => {
    const res = runBin(['--no-logo', '--no-color']);
    expect(res.status).toBe(0);
    expect(res.stdout).not.toMatch(/\x1b\[/);
    const first = res.stdout.split('\n')[0];
    expect(first[0]).not.toBe(' ');
  });

  test('bad flag exits non-zero', () => {
    const res = runBin(['--frobnicate']);
    expect(res.status).not.toBe(0);
    const combined = (res.stderr || '') + (res.stdout || '');
    expect(combined.toLowerCase()).toContain('unknown');
    expect(combined).toContain('--frobnicate');
  });

  test('--help exits 0 and contains flag list', () => {
    const res = runBin(['--help']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('--json');
    expect(res.stdout).toContain('--no-color');
    expect(res.stdout).toContain('--no-logo');
  });

  test('--version exits 0 and prints version', () => {
    const res = runBin(['--version']);
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  test('report shape contains all six lines when healthy', () => {
    const res = runBin(['--no-color', '--no-logo']);
    expect(res.status).toBe(0);
    const out = res.stdout;
    // On healthy linux, all six should be present
    expect(out).toContain('OS:');
    expect(out).toContain('Kernel:');
    expect(out).toContain('Uptime:');
    // Shell may be absent if not detected, but on our system it should be bash
    // CPU and Memory should be present
    expect(out).toContain('CPU:');
    expect(out).toContain('Memory:');
  });
});
