## 1. Diagnóstico y decisión de ventana Node

- [x] 1.1 Confirmar errores en Actions: reproducir `Error: Dependencies lock file is not found` con `cache: 'npm'` vs `pnpm-lock.yaml` y warning `Node 20 is being deprecated` con `setup-node@v4`; decidir matrix final `[18,20,22]` (spec actual) vs `[18,22,24]` y registrar decisión en `design.md` Open Questions; verificar con `grep -r "setup-node" .github/workflows/` y `ls pnpm-lock.yaml`

## 2. Fix `ci.yml` (CI de tests)

- [x] 2.1 Actualizar `.github/workflows/ci.yml` a `actions/setup-node@v5` y añadir `pnpm/action-setup@v4` (version 9) antes de `setup-node`, cambiar `cache: 'npm'` → `cache: 'pnpm'` con `cache-dependency-path: pnpm-lock.yaml`, reemplazar `run: npm ci` → `run: pnpm install --frozen-lockfile`, restaurar `matrix: os: [ubuntu/macos/windows] × node: [18,20,22]` y mantener `workflow_dispatch`; verificar `yamllint ci.yml` y `grep -q "setup-node@v5" && grep -q "cache: 'pnpm'" && grep -q "pnpm install"`
- [x] 2.2 Verificar que `ci.yml` ya no contiene Node20 deprecado ni cache npm: asegurar `grep -c "setup-node@v4"` es 0, `grep -c "cache: 'npm'"` es 0, `grep -c "ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION"` es 0; ejecutar `pnpm install --frozen-lockfile && npm test` local y confirmar 14 suites 112 tests pasan

## 3. Fix `publish.yml` (publish a npm)

- [x] 3.1 Actualizar `.github/workflows/publish.yml` a `actions/setup-node@v5` con `pnpm/action-setup@v4`, `cache: 'pnpm'`, `pnpm install --frozen-lockfile` (gate), mantener `registry-url: https://registry.npmjs.org`, `permissions: {contents: read, id-token: write}`, `node-version: 22`, `npm publish --provenance --access public` con `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`; verificar `yamllint publish.yml` y `grep -q "setup-node@v5" && grep -q "pnpm install" && grep -q "NPM_TOKEN"`
- [x] 3.2 Validar que `publish.yml` no dispara en `push`/`pull_request` y solo en `release: types: [published]` + `workflow_dispatch`; verificar `grep -c "push:" publish.yml` es 0 y `grep -q "release:" publish.yml`

## 4. Docs y validación de specs

- [x] 4.1 Actualizar `README.md` sección GitHub Workflows para reflejar `pnpm` y `setup-node@v5` (mencionar `pnpm-lock.yaml`, `pnpm/action-setup`, matrix Node y `publish.yml` con `pnpm`); verificar `grep -q "pnpm" README.md && grep -q "setup-node@v5" README.md`
- [x] 4.2 Ejecutar validación completa: `npx openspec validate fix-actions-node-pnpm-lock --strict` y `npx openspec validate --strict` deben pasar, y `npm test` (o `pnpm test`) con `--experimental-vm-modules` 14 suites 112 tests; verificar que `specs/github-workflows/spec.md` tiene 3 requisitos MODIFIED con escenarios `####` y sin `setup-node@v4`/`cache: 'npm'`

## 5. Verificación final e2e

- [x] 5.1 Verificar separación y ausencia de errores: `ls .github/workflows/` muestra `ci.yml` y `publish.yml` separados, ambos con `setup-node@v5` y `cache: 'pnpm'`, `ci.yml` con `matrix` 3×3 y sin `NPM_TOKEN`, `publish.yml` sin `matrix` completa ni `pull_request`; `yamllint .github/workflows/*.yml` pasa; `npm pack --dry-run` sigue mostrando solo `bin/`, `src/`, `package.json`, `README.md`, `LICENSE` (24 ficheros)
- [x] 5.2 Simular CI local con `act` o push a rama feature y observar que `ci.yml` corre 9 jobs (3 OS × 3 Node) sin `Node 20 is being deprecated` ni `lock file not found`; si no hay `act`, verificar via `grep` y `pnpm install --frozen-lockfile` local como proxy
