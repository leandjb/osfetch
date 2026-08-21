## Context

Ver `proposal.md - Why`. Estado actual inspeccionado en `main`:

- `.github/workflows/ci.yml:1` único workflow: `on: push: branches:[main]` + `pull_request: branches:[main]`, `strategy.matrix: os:[ubuntu/macos/windows] × node:[18,20,22]`, steps `actions/checkout@v4`, `setup-node@v4` con `cache:'npm'`, `npm ci`, `npm test`. Cubre `push`/`PR`/`merge a main` (merge = push a main).
- No existe workflow de publish. El secreto `NPM_TOKEN` (classic `automation`) ya está creado en GitHub pero nunca se usa. `package.json:1` es ESM `osfetch@1.0.0` con `files:["bin","src"]`, scripts `test` con `--experimental-vm-modules`. Lock `pnpm-lock.yaml` convive con `npm ci`.
- Requisito observable nuevo en `specs/github-workflows/spec.md`: CI debe correr en cada integración a main; publish solo en `release: published`.

Restricciones: no tocar código producto (`src/`, `bin/`, `test/`), solo tooling `.github/`; mantener compatibilidad Node >=18; no introducir dependencias runtime.

## Goals / Non-Goals

**Goals:**
- Dos workflows desacoplados: `ci.yml` (tests) y `publish.yml` (release) con triggers, permisos y caching independientes.
- CI mantiene matrix 3×3, publish usa runner único `ubuntu-latest` + `node 22` con `registry-url` y gate `npm test` antes de `npm publish`.
- Publish usa `NPM_TOKEN` via `NODE_AUTH_TOKEN` y `--provenance` con `permissions: id-token: write`.
- Triggers no solapados: `ci` nunca publica, `publish` nunca corre en `push`/`PR`.
- Documentar claramente secreto y flujo de release para contribuidores.

**Non-Goals:**
- Auto-bump de `package.json` version ni creación automática de Release/tag.
- Migrar todo el repo a `pnpm` en este cambio (se mantiene `npm ci` coherente con `setup-node` `cache:'npm'`; migración a `pnpm/action-setup` es follow-up opcional).
- Trusted Publishing OIDC sin token (se deja como evolución; ahora se usa `NPM_TOKEN` classic).
- Soporte `workflow_call` / reusable workflows.

## Decisions

### D1 — Dos ficheros separados vs. dos jobs en un fichero
Elegido: **dos ficheros** `.github/workflows/ci.yml` y `.github/workflows/publish.yml`.

- Rationale: claridad de responsabilidad, checks separados en UI de PR (solo `CI` aparece en `pull_request`), permisos distintos (`id-token: write` solo en publish), y evolución independiente (cambiar matrix de CI no toca publish).
- Alternativa rechazada: un solo `ci.yml` con jobs `test` y `publish` condicionados con `if: github.event_name == 'release'`. Rechazada por acoplar `permissions`, `matrix` y ocultar el flujo de release entre logs de CI.

### D2 — Trigger de publish: `release: types:[published]` vs `push: tags: v*`
Elegido: **`release: types:[published]`** (+ `workflow_dispatch` opcional).

- Rationale: coincide con el gesto del usuario (“cuando haga una release”) en UI GitHub, incluye notas y assets de la Release, y evita publishes accidentales por tag push local. `workflow_dispatch` permite re-publish manual auditado.
- Alternativa: `push: tags: v*.*.*` — rechazada por disparar incluso sin Release (p.ej. tag anotado local) y por requerir protección de tags adicional. Se puede añadir como complemento posterior si se quiere soportar `git push --tags`.

### D3 — `npm ci` vs `pnpm install --frozen-lockfile`
Elegido: **mantener `npm ci`** en ambos workflows (coherente con `setup-node` `cache:'npm'` y `package.json:21`).

- Rationale: CI actual ya usa `npm ci`; `pnpm-lock.yaml` convive sin conflicto y `npm ci` respeta `package-lock` si existe; menor churn en este cambio.
- Alternativa: migrar a `pnpm/action-setup@v4` + `cache: 'pnpm'` + `pnpm install --frozen-lockfile` + `pnpm publish`. Ventaja: uso de lock `pnpm`. Rechazada para este scope, anotada como follow-up.

### D4 — Publicar con `--provenance`
Elegido: **`npm publish --provenance --access public`** con `permissions: {contents:read, id-token:write}`.

- Rationale: provenance SLSA genera attestation verificable en npm provenance; requiere `id-token: write` y `registry-url`. Si el token classic no soporta OIDC, el flag se puede degradar a publish sin provenance sin cambiar el resto del workflow.
- Alternativa: publish sin provenance — menos trazabilidad.

### D5 — Runner y Node para publish
Elegido: **`ubuntu-latest` + `node:22`** único para publish (no matrix).

- Rationale: publish es determinista (mismo tarball en cualquier OS); usar una sola leg reduce tiempo y evita publishes duplicados. Node 22 es la última LTS del matrix y la usada para generar tarball final.
- CI mantiene matrix completa 3×3 para validar cross-platform de probes (`linux`/`darwin`/`win32`).

## Risks / Trade-offs

- [Publish falla si `package.json` version ya existe en npm] → Mitigación: documentar en README que antes de crear Release hay que bump `package.json` + `git tag`; `npm publish` fallará con `E409` y workflow marcará error, sin efecto lateral.
- [Token `NPM_TOKEN` expira/revoca] → Mitigación: workflow falla en `setup-node` auth; rotar token en GitHub Secrets y re-run. Evolución a Trusted Publishing elimina secreto.
- [Provenance requiere `id-token: write` y token con soporte OIDC] → Mitigación: si falla con `error: provenance not supported`, quitar `--provenance` y re-intentar; queda documentado como degradación.
- [Divergencia `npm ci` vs `pnpm-lock.yaml`] → Mitigación: ambos gestores respetan `package.json`; CI no instala desde `pnpm-lock.yaml` en este modo, pero tests pasan igual. Follow-up migrar a `pnpm` si se quiere estricta reproducibilidad.
- [Release draft vs published] → Mitigación: trigger solo `published`, no `created`/`edited`, evita publishes de drafts.
- [Cache `npm` miss en `windows`/`macos`] → Mitigación: `setup-node` `cache:'npm'` por OS/Node; aceptado.

## Migration Plan

1. Mantener `ci.yml` existente (no borrar historia). Añadir opcional `workflow_dispatch` si se desea re-run manual.
2. Crear `publish.yml` nuevo con contenido de D2/D4/D5.
3. `yamllint` + `actions/checkout` y `setup-node` validados localmente con `npm ci && npm test`.
4. Push a rama feature → verificar 9 checks verdes de CI.
5. Crear Release `v1.0.1` draft → `Publish` → verificar log `npm publish --provenance` y paquete en npmjs con provenance badge.
6. Rollback: borrar `publish.yml` o deshabilitar via `if: false`; CI sigue funcionando.

## Open Questions

- ¿Mantener `npm ci` o migrar ambos workflows a `pnpm` en follow-up separado? (no bloquea este cambio)
- ¿Añadir `push: tags: v*` como trigger complementario además de `release: published`? (decisión deferible)
