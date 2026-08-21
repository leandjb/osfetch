## Why

CI en GitHub Actions falla en `windows` con dos errores bloqueantes: 1) `Node 20 is being deprecated` desde `actions/setup-node@v4` (compilado con Node20, GitHub ahora usa Node24 por defecto) y 2) `Dependencies lock file is not found` porque `setup-node` con `cache: 'npm'` busca `package-lock.json`/`yarn.lock` pero el repo usa `pnpm-lock.yaml`. Sin fix, ningún `push`/`PR`/`merge` a `main` pasa CI y `publish.yml` tampoco puede correr `npm ci`.

## What Changes

- **Corrige cache de dependencias** en `.github/workflows/ci.yml` y `.github/workflows/publish.yml`: cambia `cache: 'npm'` → `cache: 'pnpm'` y añade `pnpm/action-setup@v4` + `cache-dependency-path` apuntando a `pnpm-lock.yaml`, o alternativamente genera `package-lock.json` si se decide mantener `npm`. Se elige camino `pnpm` como fuente de verdad (repo ya tiene `pnpm-lock.yaml` de 102k).
- **Actualiza `actions/setup-node` de v4 a v5** (compilado con Node24) para eliminar warning `DEP0040`/`punycode` y deprecación Node20. Alternativa temporal `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true` se evita; se migra a `v5` directamente.
- **Ajusta matrix de Node en `ci.yml`**: alinea con `engines >=18` y con `spec` previa `github-workflows` (`18,20,22`) → migra a `[18,20,22]` sin `24` o a `[18,22,24]` excluyendo 20 deprecated; documenta decisión y actualiza `README.md`. Mantiene 3 OS (`ubuntu/macos/windows`) × 3 Node = 9 jobs.
- **Instala con `pnpm`**: reemplaza `npm ci` → `pnpm install --frozen-lockfile` en `ci.yml` y `publish.yml` (y mantiene `npm test` que corre vía `pnpm`/`npm` indistinto). Asegura `npm publish` sigue usando `NPM_TOKEN`.
- **Verifica `publish.yml`**: mantiene `on: release: types:[published]`, `permissions: id-token:write`, `registry-url`, `npm publish --provenance`, pero con `cache: pnpm` y `pnpm` install.

## Capabilities

### New Capabilities

<!-- none — fix de tooling existente -->

### Modified Capabilities

- `github-workflows`: Requiere que CI y publish usen `pnpm` lock correctamente, que `setup-node` no use Node20 deprecado, y que la matrix de Node refleje la ventana soportada sin warnings. Cambia requisitos de caching, instalación y versión de la acción.

## Impact

- **Modificados**: `.github/workflows/ci.yml`, `.github/workflows/publish.yml`, opcional `README.md` (sección GitHub Workflows), opcional `package.json` si se genera `package-lock.json` (no recomendado).
- **Sin impacto runtime**: `src/`, `bin/`, `test/` intactos; `files: ["bin","src"]` sigue excluyendo `.github/`.
- **Dependencias**: reusa `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v5`; no nuevas deps runtime.
- **Riesgo si no se hace**: CI permanece rojo en `windows`, bloquea merges a `main`, publish no puede validar `npm test` gate.
