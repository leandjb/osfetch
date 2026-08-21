## 1. Separar workflow de CI (tests)

- [x] 1.1 Auditar `.github/workflows/ci.yml` actual y confirmar que cubre `on: push: branches:[main]` + `pull_request: branches:[main]`, matrix `os: [ubuntu/macos/windows] × node [18,20,22]`, steps `checkout@v4`, `setup-node@v4` con `cache: npm`, `npm ci`, `npm test`; verificar con `yamllint .github/workflows/ci.yml` y `npm test` local
- [x] 1.2 Refactorizar `ci.yml` como workflow dedicado solo a tests: asegurar que NO contiene `release:`, `NPM_TOKEN`, `npm publish` ni `permissions: id-token: write`; añadir opcional `workflow_dispatch` para re-run manual; verificar que `grep -c "release:" ci.yml` es 0 y `yamllint` pasa
- [x] 1.3 Verificar que CI se dispara correctamente en push/PR/merge a main: inspeccionar `on:` y probar con `act` o push a rama feature y observar 9 jobs (3 OS × 3 Node) en GitHub Actions

## 2. Crear workflow de publish a npm

- [x] 2.1 Crear `.github/workflows/publish.yml` con `name: Publish to npm`, `on: release: types:[published]` y `workflow_dispatch`, `permissions: {contents: read, id-token: write}`, `runs-on: ubuntu-latest`; steps: `checkout@v4`, `setup-node@v4` con `node:22` y `registry-url: https://registry.npmjs.org` + `cache: npm`, `npm ci`, `npm test` (gate), `npm publish --provenance --access public` con `env.NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`; verificar `yamllint publish.yml` y `grep -q "NPM_TOKEN" && grep -q "provenance"`
- [x] 2.2 Validar que `publish.yml` NO se dispara en `push`/`pull_request`: asegurar que `on:` no contiene `push` ni `pull_request`; verificar que `grep -c "push:" publish.yml` es 0 y que el workflow solo aparece en runs de tipo Release
- [x] 2.3 Probar publish en dry-run sin publicar: ejecutar `npm pack --dry-run` y `npm publish --dry-run` localmente con `NODE_AUTH_TOKEN=dummy` y confirmar que tarball contiene solo `bin/`, `src/`, `package.json`, `README.md`, `LICENSE` (sin `test/`, `.github/`, `openspec/`)

## 3. Secretos, permisos y documentación

- [x] 3.1 Verificar secreto `NPM_TOKEN` (classic `automation`) en `Settings > Secrets and variables > Actions` y documentar en `publish.yml` que se usa como `secrets.NPM_TOKEN` sin hardcodear; probar `setup-node` auth con `registry-url` genera `.npmrc` correctamente (log `npm config get registry` en workflow)
- [x] 3.2 Actualizar `README.md` con sección CI/Release: describir que `ci.yml` corre tests en cada push/PR/merge a main (matrix 3×3) y que `publish.yml` publica solo en Release publicada usando `NPM_TOKEN` con provenance y gate de tests; verificar links y bloques de código renderizan (`grep -q "ci.yml" README.md && grep -q "publish.yml"`)

## 4. Validación e2e y entrega

- [x] 4.1 Ejecutar validación completa: `npx openspec validate --change separate-github-workflows --strict` y `npm test` (suite Jest con `--experimental-vm-modules`) deben pasar; verificar que no hay `skip_specs` y que spec `github-workflows` tiene 3 requisitos con escenarios `####`
- [x] 4.2 Simular release localmente: crear tag `v9.9.9-test` + Release draft `published` en GitHub, observar que `publish.yml` se dispara una vez en `ubuntu-latest` con Node 22, que `npm test` gate pasa y que `npm publish` log muestra provenance (o degradación documentada si token no soporta OIDC); verificar paquete en npmjs provenance badge
- [x] 4.3 Verificar separación final: `ls .github/workflows/` muestra `ci.yml` y `publish.yml` como ficheros distintos, `ci.yml` sin `NPM_TOKEN`/`provenance` y `publish.yml` sin matrix `os:` ni `pull_request`; confirmar con `yamllint .github/workflows/*.yml` y `git status`
