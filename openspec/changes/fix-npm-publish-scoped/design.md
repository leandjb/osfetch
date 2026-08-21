## Context

Ver `proposal.md - Why` y `specs/github-workflows/spec.md`. Tras `separate-github-workflows` y `fix-actions-node-pnpm-lock`, `publish.yml` está separado y ya usa `pnpm` + `setup-node@v5`, pero publica `osfetch@1.0.0`:

```
npm publish --provenance --access public → E403 Package name too similar to ofetch,fetch,unfetch; try @leandjb/osfetch
npm warn publish bin[osfetch] script name was cleaned
```

El scope `@leandjb` pertenece al usuario (GitHub `leandb`), por lo que `@leandjb/osfetch` es publicable con `--access public`. El bin debe permanecer `osfetch` (UX `npx @leandjb/osfetch` ejecuta bin `osfetch`), sin que `npm pkg fix` lo elimine. `package.json: name` y `README` aún referencian `osfetch` no scoped.

Restricciones: cambio BREAKING para consumidores `npm install -g osfetch`; mantener `bin` ejecutable; `files: ["bin","src"]` sigue excluyendo `.github/`; no tocar `src/`; `NPM_TOKEN` ya es classic `automation` con `provenance`.

## Goals / Non-Goals

**Goals:**
- Renombrar `package.json` `name` a `@leandjb/osfetch` con `publishConfig` si se requiere y corregir `bin` para no ser limpiado.
- Actualizar `publish.yml` para validar/gatear que publica el scoped, manteniendo `pnpm`, `setup-node@v5`, `provenance`.
- Actualizar `README.md`, `bin` references y docs de instalación a scoped (`npm i -g @leandjb/osfetch`).
- Verificar `npm pack --dry-run` sin warnings `bin[osfetch] cleaned` y tarball con 24 ficheros `name: @leandjb/osfetch`.

**Non-Goals:**
- Cambiar el bin de `osfetch` a otro nombre (se mantiene `osfetch`).
- Migrar a Trusted Publishing sin `NPM_TOKEN` (sigue usando token).
- Renombrar repo GitHub o crear un nuevo paquete no scoped (`osfetch-cli`, etc.).
- Cambiar lógica `src/`/`test/` (runtime idéntico).

## Decisions

### D1 — Scoped `@leandjb/osfetch` vs intentar apelar `osfetch` o elegir otro nombre no scoped
Elegido: **`@leandjb/osfetch`**.

- Rationale: `osfetch` está bloqueado por política anti-typosquat de npm (colisiona con `ofetch` 3M dls, `fetch`, `unfetch`). La sugerencia oficial del error es `@leandjb/osfetch`, y `@leandjb` es namespace del owner. Alternativas `osfetch-cli`, `os-fetch`, `sysfetch` requerirían búsqueda de disponibilidad y perderían el bin `osfetch` deseado. Apelar a npm para desbloquear `osfetch` es lento e incierto.
- Alternativa rechazada: `osfetch2`, `node-osfetch` — rompen branding y requieren verificar disponibilidad; no resuelven bin cleaning.

### D2 — Mantener `bin: { "osfetch": "./bin/osfetch.js" }` con package scoped
Elegido: **mantener `bin` con key `osfetch`** (sin scope) para package `@leandjb/osfetch`.

- Rationale: npm permite que un scoped package exponga bin no scoped (`npx @leandjb/osfetch` instala y expone `osfetch` en PATH). `npm pkg fix` limpia `bin[osfetch]` si el `name` no coincide con bin, pero con `bin` como objeto `{ "osfetch": "./bin/osfetch.js" }` es válido y no debe limpiarse tras fix (el warning se debía a `name` no scoped + `bin` implícito). Se mantiene `#!/usr/bin/env node` en `bin/osfetch.js`.
- Alternativa: cambiar bin a `{"@leandjb/osfetch": "./bin/osfetch.js"}` — rompería `npx osfetch`.
- Alternativa: `bin: "./bin/osfetch.js"` (string vs objeto) — npm lo normaliza a `{ "osfetch": "./bin/osfetch.js" }`, pero objeto explícito es más claro para scoped.

### D3 — `publish.yml` valida nombre scoped antes de publish
Elegido: **publish verifica `package.json` `name` es `@leandjb/osfetch` antes de `npm publish`** (via `jq` o `node -p "require('./package.json').name"`), falla early si no es scoped.

- Rationale: evita E403 de nuevo si alguien revierte `name`. Gate adicional a `npm test`.
- Alternativa: solo confiar en `npm publish` error — menos feedback.

### D4 — README e instrucciones con scope, manteniendo bin `osfetch`
Elegido: **actualizar `README.md` a `npm install -g @leandjb/osfetch`, `npx @leandjb/osfetch`, pero documentar que el bin sigue siendo `osfetch`**.

- Rationale: UX scoped requiere `npx @leandjb/osfetch` (o `npm i -g @leandjb/osfetch` luego `osfetch`). Se documenta migración **BREAKING** para usuarios de `osfetch` previo.
- Alternativa: documentar ambos `osfetch` y `@leandjb/osfetch` — confunde, se elige scoped como primario y nota de migración.

### D5 — No crear `package-lock.json`, mantener `pnpm-lock.yaml`
Elegido: **mantener `pnpm` como fuente de verdad**, no generar `package-lock.json`.

- Rationale: `fix-actions-node-pnpm-lock` ya migró CI a `pnpm` y `setup-node@v5` + `cache: pnpm`. Consistente.
- publish sigue `npm publish` (registry npm) pero install previo es `pnpm install --frozen-lockfile`.

## Risks / Trade-offs

- [Renombrar a scoped es BREAKING para `npm i -g osfetch`] → Mitigación: nota BREAKING en proposal, README con migración, bin `osfetch` sigue igual tras instalar scoped, y `npx @leandjb/osfetch` funciona.
- [`npm pkg fix` volvió a limpiar `bin` si el objeto bin no es exacto] → Mitigación: usar `bin: { "osfetch": "./bin/osfetch.js" }` explícito y verificar con `npm pack --dry-run` que no hay warning.
- [Scope `@leandjb` no existe o no pertenece al token] → Mitigación: usuario `leandb` ya es owner de `@leandjb`; token classic `automation` con `access public` puede publicar primer scoped (requiere `--access public`).
- [Usuarios intentan `npm install osfetch` y no encuentran] → Mitigación: README y release notes explican migración; considerar `npm deprecate osfetch` si alguna vez existió (no es el caso, estaba bloqueado).
- [Provenance con scoped requiere `id-token: write`] → Mitigación: `publish.yml` ya tiene `permissions: id-token: write`, `setup-node@v5` con `registry-url` lo soporta.

## Migration Plan

1. Actualizar `package.json`: `name: "@leandjb/osfetch"`, asegurar `bin: { "osfetch": "./bin/osfetch.js" }`, opcional `publishConfig: { "access": "public" }`.
2. Actualizar `README.md`: instrucciones `npm install -g @leandjb/osfetch`, `npx @leandjb/osfetch`, ejemplos `bin/osfetch.js`, y nota BREAKING.
3. Actualizar `.github/workflows/publish.yml` si se añade validación de nombre (grep `jq`).
4. `pnpm install` (actualiza `pnpm-lock.yaml` si cambia `name`), `npm pkg fix` → verificar no limpia bin, `npm pack --dry-run` → 24 ficheros sin warnings.
5. Push a rama → CI `ci.yml` 9 jobs con `pnpm`.
6. Crear Release `v1.0.0` (o `v1.0.1`) → `publish.yml` publica `@leandjb/osfetch` con provenance, verificar en `https://www.npmjs.com/package/@leandjb/osfetch` y `https://search.sigstore.dev`.
7. Rollback: revertir `package.json` `name` a `osfetch` (volverá a E403) o publicar con nuevo scope; no afecta runtime.

## Open Questions

- ¿Mantener alias `osfetch` sin scope en npm como placeholder (si algún día se desbloquea) o solo scoped? Decisión: solo scoped por ahora.
- ¿Añadir `bin` alias adicional `@leandjb/osfetch` además de `osfetch`? No necesario, `osfetch` bin ya cubre ambos.
