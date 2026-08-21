## Context

Ver `proposal.md - Why` y `specs/github-workflows/spec.md`. Estado actual en `main` tras `separate-github-workflows`:

- `.github/workflows/ci.yml:1` y `publish.yml:1` ambos usan `actions/setup-node@v4` con `cache: 'npm'` y `run: npm ci`. El repo tiene `pnpm-lock.yaml` (102k) pero no `package-lock.json`, por lo que `setup-node` con `cache:'npm'` falla en `windows` con `Error: Dependencies lock file is not found`.
- `setup-node@v4` está compilado con Node20; GitHub ahora avisa `Node 20 is being deprecated. This workflow is running with Node 24 by default` (`DEP0040` punycode) y sugiere `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true` o migrar a `v5`.
- `ci.yml` en HEAD fue parcheado a `node: [22]` solo (commit `51495e7`), divergiendo de spec que requiere `18,20,22` 3×3 (9 jobs). Hay que realinear matrix y decidir ventana soportada sin Node20 deprecado.

Restricciones: solo tooling `.github/`, no tocar `src/`/`bin/`; mantener `engines >=18`; `NPM_TOKEN` classic `automation` ya existe; `files: ["bin","src"]` excluye `.github/`.

## Goals / Non-Goals

**Goals:**
- CI y publish pasen en los 3 OS con lock correcto y sin warnings Node20.
- Migrar ambos workflows a `pnpm` como fuente de verdad (`pnpm-lock.yaml` existente) con `pnpm/action-setup@v4` y `cache: 'pnpm'`.
- Actualizar `actions/setup-node` a `v5` (Node24) y eliminar `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION`.
- Restaurar matrix CI a 3×3 con ventana soportada documentada (ej. `[18,20,22]` o `[18,22,24]`), decidir y actualizar spec/README.

**Non-Goals:**
- Generar `package-lock.json` para mantener `npm ci` (rechazado, duplica locks).
- Migrar a Trusted Publishing OIDC sin `NPM_TOKEN` (follow-up).
- Auto-bump de versión o creación automática de Release.
- Cambiar `npm publish` por `pnpm publish` (publish sigue siendo `npm publish --provenance`).

## Decisions

### D1 — `cache: 'pnpm'` + `pnpm/action-setup` vs `cache: 'npm'` + `package-lock.json`
Elegido: **`cache: 'pnpm'` con `pnpm/action-setup@v4` y `cache-dependency-path: pnpm-lock.yaml`**.

- Rationale: `pnpm-lock.yaml` ya es lock de verdad del repo (102k, usado por `pnpm install` local). `setup-node` con `cache:'npm'` busca `package-lock.json`/`yarn.lock` y falla. Cambiar a `pnpm` es 2 líneas por workflow y usa lock existente.
- Alternativa rechazada: `npm install --package-lock-only` para generar `package-lock.json` y mantener `cache:'npm'`. Rechazada por duplicar locks y riesgo divergencia `pnpm` vs `npm`.
- Alternativa `cache: ''` (sin cache): funciona pero pierde caché y ralentiza CI.

### D2 — `actions/setup-node@v4` → `v5` vs `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true`
Elegido: **migrar a `actions/setup-node@v5`**.

- Rationale: `v5` está compilado con Node24, elimina warning `Node 20 is being deprecated` y `DEP0040` punycode sin env var insegura. `v5` es estable desde 2025 y soporta `cache: 'pnpm'`.
- Alternativa `v4` + `env: ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION: true`: funciona como parche temporal pero mantiene Node20 deprecado, no recomendado.
- Mitigación: si `v5` aún en RC en algún runner, fallback a `v4` con env var es degradación documentada.

### D3 — Matrix Node: `[18,20,22]` vs `[22]` vs `[18,22,24]`
Elegido: **restaurar `matrix: os:[ubuntu/macos/windows] × node:[18,20,22]` como en spec original, pero documentar que Node20 corre con `setup-node@v5` sin warning**. Si se quiere evitar 20 totalmente, alternativa `[18,22,24]` es aceptable pero requiere actualizar `spec.md` y `README.md` para reflejar ventana `>=18` con 20 excluido.

- Rationale: `package.json engines >=18` soporta 18,20,22; spec exige 9 jobs. Mantener 3×3 preserva cobertura cross-platform de probes. Node20 con `v5` ya no es deprecado, por lo que se puede mantener.
- Alternativa `[22]` solo (estado actual HEAD): reduce cobertura, diverge de spec, rechazada.
- Otra alternativa `[18,22,24]`: cubre LTS actuales evitando 20, pero cambia spec y requiere consenso. Se deja como variante documentada en `design.md` de este fix para decidir.

### D4 — `npm ci` → `pnpm install --frozen-lockfile`
Elegido: **`pnpm install --frozen-lockfile`** en ambos workflows, manteniendo `npm test` (el test corre vía `node --experimental-vm-modules` y funciona con ambos managers) y `npm publish` para publish.

- Rationale: `pnpm install --frozen-lockfile` respeta `pnpm-lock.yaml` y falla si lock desactualizado (gate). `npm ci` ignora `pnpm-lock.yaml`.
- `npm test` no cambia porque `package.json` scripts son agnósticos al manager.
- `publish` sigue `npm publish --provenance` porque `npm` registry es target, no `pnpm publish`.

## Risks / Trade-offs

- [Cambiar `cache:'npm'` → `'pnpm'` rompe runners con `package-lock.json` en caché] → Mitigación: `cache-dependency-path: pnpm-lock.yaml` explícito; primer run miss es aceptable.
- [`setup-node@v5` aún no disponible en algún runner] → Mitigación: degradar a `v4` con `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true` temporal, documentado.
- [Matrix 3×3 con Node20 aún muestra warning si se usa `v4`] → Mitigación: usar `v5` elimina warning, Node20 deja de ser deprecado.
- [`pnpm/action-setup` requiere `version` pin] → Mitigación: usar `pnpm/action-setup@v4` con `version: 9` (o 8) explícita para reproducibilidad.
- [Divergencia `pnpm-lock.yaml` vs `package.json` `engines`] → Mitigación: `pnpm install --frozen-lockfile` falla si desalineado, fuerza actualización de lock.
- [Commit `51495e7` ya cambió `ci.yml` a `[22]`] → Mitigación: este fix lo revierte a `[18,20,22]` (o `[18,22,24]` si se elige) y actualiza spec/README para alinear.

## Migration Plan

1. Actualizar `ci.yml`: `actions/setup-node@v4` → `v5`, añadir `pnpm/action-setup@v4` antes de `setup-node`, `cache:'pnpm'`, `run: pnpm install --frozen-lockfile`, restaurar `matrix node:[18,20,22]` (y `workflow_dispatch` ya existe).
2. Actualizar `publish.yml`: mismo cambio `setup-node@v5` + `pnpm/action-setup`, `cache:'pnpm'`, `pnpm install --frozen-lockfile`, mantener `registry-url`, `NODE_AUTH_TOKEN`, `npm publish --provenance`.
3. `yamllint` ambos ficheros, `pnpm install --frozen-lockfile && npm test` local.
4. Push a rama feature → observar 9 jobs verdes sin `Node 20 deprecated` ni `lock file not found` en `ubuntu/macos/windows`.
5. Crear Release draft `v9.9.9-test` → verificar `publish.yml` corre una vez en `ubuntu-latest` `node 22` con `pnpm`, gate `npm test` pasa.
6. Rollback: revertir a `cache:'npm'` + `npm ci` y `setup-node@v4` si `pnpm` falla; no afecta runtime.

## Open Questions

- ¿Ventana final de Node: `[18,20,22]` (spec actual) o `[18,22,24]` (evita 20 totalement)? **Resuelto en implementación: se mantiene `[18,20,22]`** porque `setup-node@v5` (Node24) elimina el warning `Node 20 is being deprecated` incluso para Node20 en matrix; preserva 9 jobs y alinea con `spec.md` y `README.md`. Alternativa `[18,22,24]` queda como follow-up si se decide excluir Node20 totalmente.
