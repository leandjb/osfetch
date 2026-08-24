import { describe, test, expect } from '@jest/globals';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const pkg = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'));

const EXPECTED_REPO = 'https://github.com/leandjb/osfetch';

// Replicates npm's normalization when comparing repository.url against the
// provenance OIDC claims: strip "git+" prefix and trailing ".git".
// Keep in sync with the inline verification in .github/workflows/publish.yml.
export function normalizeRepoUrl(url) {
  return String(url || '')
    .replace(/^git\+/, '')
    .replace(/\.git$/, '');
}

/**
 * Validates publish metadata required for `npm publish --provenance`.
 * Returns an array of human-readable problems (empty = valid).
 */
export function validatePublishMetadata(p) {
  const errors = [];
  if (p.name !== '@leandjb/osfetch') {
    errors.push(`package.json: "name" must be "@leandjb/osfetch", got "${p.name}"`);
  }
  if (normalizeRepoUrl(p.repository?.url) !== EXPECTED_REPO) {
    errors.push(
      `package.json: "repository.url" is "${p.repository?.url ?? ''}", expected to match "${EXPECTED_REPO}" from provenance`
    );
  }
  if (p.homepage !== `${EXPECTED_REPO}#readme`) {
    errors.push(`package.json: "homepage" must be "${EXPECTED_REPO}#readme"`);
  }
  if (p.bugs?.url !== `${EXPECTED_REPO}/issues`) {
    errors.push(`package.json: "bugs.url" must be "${EXPECTED_REPO}/issues"`);
  }
  if (!/^\d+\.\d+\.\d+(-[\w.-]+)?(\+[\w.-]+)?$/.test(String(p.version))) {
    errors.push(`package.json: "version" is not valid SemVer: "${p.version}"`);
  }
  if ((p.bin?.osfetch || '').replace(/^\.\//, '') !== 'bin/osfetch.js') {
    errors.push(`package.json: "bin.osfetch" must point to "bin/osfetch.js"`);
  }
  for (const dir of ['bin', 'src']) {
    if (!Array.isArray(p.files) || !p.files.includes(dir)) {
      errors.push(`package.json: "files" must include "${dir}"`);
    }
  }
  return errors;
}

describe('publish metadata (provenance)', () => {
  test('name is scoped @leandjb/osfetch', () => {
    expect(pkg.name).toBe('@leandjb/osfetch');
  });

  test('repository.url normalizes to the provenance repository', () => {
    expect(normalizeRepoUrl(pkg.repository.url)).toBe(EXPECTED_REPO);
    expect(pkg.repository.type).toBe('git');
  });

  test('homepage points to the repository readme', () => {
    expect(pkg.homepage).toBe(`${EXPECTED_REPO}#readme`);
  });

  test('bugs.url points to the repository issues', () => {
    expect(pkg.bugs.url).toBe(`${EXPECTED_REPO}/issues`);
  });

  test('version is valid SemVer', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+(-[\w.-]+)?(\+[\w.-]+)?$/);
  });

  test('bin.osfetch points to an existing entrypoint', () => {
    expect(pkg.bin.osfetch.replace(/^\.\//, '')).toBe('bin/osfetch.js');
    expect(existsSync(resolve(projectRoot, 'bin/osfetch.js'))).toBe(true);
  });

  test('files whitelist includes bin and src', () => {
    expect(Array.isArray(pkg.files)).toBe(true);
    expect(pkg.files).toContain('bin');
    expect(pkg.files).toContain('src');
  });

  test('exports "." resolves to a packaged file', () => {
    expect(pkg.exports['.']).toBeDefined();
    const exported = typeof pkg.exports['.'] === 'string' ? pkg.exports['.'] : pkg.exports['.'].default;
    const resolvedPath = resolve(projectRoot, exported.replace(/^\.\//, ''));
    expect(existsSync(resolvedPath)).toBe(true);
    // Must live inside one of the whitelisted "files" directories.
    const insidePackagedDir = ['bin', 'src'].some((dir) => resolvedPath.startsWith(resolve(projectRoot, dir)));
    expect(insidePackagedDir).toBe(true);
  });
});

describe('regression detection (mutated metadata)', () => {
  test('empty repository.url is reported as invalid', () => {
    const broken = structuredClone(pkg);
    broken.repository.url = '';
    const errors = validatePublishMetadata(broken);
    expect(errors.some((e) => e.includes('"repository.url"') && e.includes('expected to match'))).toBe(true);
  });

  test('unscoped name is reported as invalid', () => {
    const broken = structuredClone(pkg);
    broken.name = 'osfetch';
    expect(validatePublishMetadata(broken)).toHaveLength(1);
  });

  test('valid metadata yields no errors', () => {
    expect(validatePublishMetadata(pkg)).toEqual([]);
  });
});

describe('publish.yml structure', () => {
  const workflow = readFileSync(resolve(projectRoot, '.github/workflows/publish.yml'), 'utf8');

  test('triggers on release published and manual dispatch', () => {
    expect(workflow).toMatch(/release:\s*\n\s*types:/);
    expect(workflow).toMatch(/types:\s*\[published\]/);
    expect(workflow).toContain('workflow_dispatch');
  });

  test('keeps id-token write permission for provenance signing', () => {
    expect(workflow).toMatch(/id-token:\s*write/);
    expect(workflow).toMatch(/contents:\s*read/);
  });

  test('publishes with npm publish --provenance --access public', () => {
    expect(workflow).toContain('npm publish --provenance --access public');
  });

  test('runs pnpm install and pnpm test as a gate before publishing', () => {
    expect(workflow).toContain('pnpm install --frozen-lockfile');
    expect(workflow.indexOf('pnpm test')).toBeGreaterThan(-1);
    expect(workflow.indexOf('pnpm test')).toBeLessThan(workflow.indexOf('npm publish --provenance --access public'));
  });

  test('verifies provenance metadata after tests and before publishing', () => {
    const verifyStep = workflow.indexOf('Verify provenance metadata');
    const publishStep = workflow.indexOf('- name: Publish to npm');
    expect(verifyStep).toBeGreaterThan(-1);
    expect(publishStep).toBeGreaterThan(-1);
    expect(verifyStep).toBeGreaterThan(workflow.indexOf('Run tests'));
    expect(verifyStep).toBeLessThan(publishStep);
  });
});
