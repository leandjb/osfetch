## Why

El repo tiene un único workflow `.github/workflows/ci.yml` que ejecuta tests en matrix 3 OS × 3 Node, pero no existe automatización para publicar en npmjs.com aunque el secreto `NPM_TOKEN` ya está creado en GitHub. El usuario quiere dos flujos claramente separados: uno que valide cada `push`/`PR`/`merge` a `main` con Jest, y otro que publique el paquete solo cuando se crea una Release en GitHub. Sin separación, hay confusión de responsabilidades, se dificulta añadir gates distintos (p.ej. `provenance`, permisos `id-token`) y se acopla el ciclo de CI al ciclo de release.

## What Changes

- **Separa workflows por responsabilidad** en `.github/workflows/`:
  - **CI de tests** (dedicado a Jest): `ci.yml` o `test.yml` que corre `npm ci && npm test` en matrix `{ubuntu-latest, macos-latest, windows-latest} × {node 18,20,22}` en `on: push: branches:[main]` y `on: pull_request: branches:[main]` (incluye merges a main como push a main).
  - **Publish a npm** (dedicado a release): nuevo `publish.yml` que se dispara solo en `on: release: types:[published]` (y opcional `workflow_dispatch` manual), hace `checkout`, `setup-node` con `registry-url: https://registry.npmjs.org`, `npm ci`, gate `npm test`, y `npm publish --provenance --access public` usando `env.NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`.
- **Aclara triggers**: CI nunca publica; publish nunca corre en `push`/`PR`.
- **Documenta secreto y permisos**: `permissions: contents:read, id-token:write` para provenance, sin hardcodear el token.
- **Mantiene `files` whitelist y `pnpm-lock.yaml` compatible** (CI puede seguir con `npm ci` — coherente con `package.json:21` scripts — o migrar a `pnpm` si se decide).
- **No hay cambios de código de producto**: `bin/`, `src/`, `test/` quedan intactos; solo tooling `.github/` y docs.

## Capabilities

### New Capabilities

- `github-workflows`: Separación y orquestación de workflows de GitHub Actions — comportamiento observable de CI (tests en push/PR/merge a main) y de release (publish a npm en release publicada con `NPM_TOKEN`, gateado por tests y con provenance). Incluye triggers, matrix, caching, permisos y mensajes de error.

### Modified Capabilities

<!-- none — la separación es nueva capacidad de tooling; no modifica specs de producto existentes (cli/fetch-display/system-info) -->

## Impact

- **Nuevos/Modificados**: `.github/workflows/ci.yml` (ajuste/renombrado), `.github/workflows/publish.yml` (nuevo), opcional `README.md` (sección CI/Release).
- **Sin impacto runtime**: `package.json`, `src/`, `bin/` no cambian; `files: ["bin","src"]` sigue excluyendo `.github/`, `test/`, `openspec/`.
- **Dependencias**: ninguna nueva (reusa `actions/checkout@v4`, `actions/setup-node@v4`). `NPM_TOKEN` ya existe como secreto classic `automation`.
- **Compatibilidad**: `npm publish --provenance` requiere `id-token: write`; si el token es classic sin OIDC, se degrada a publish sin provenance.
- **Riesgo si no se hace**: publishes manuales propensos a error, falta de gate de tests en release, confusión de triggers.
