## Context

Ver `proposal.md - Why` y `specs/github-workflows/spec.md`. Estado tras `fix-npm-publish-scoped`:

- `package.json:2` es `@leandjb/osfetch@1.0.1` con `bin: { "osfetch": "bin/osfetch.js" }`, `publishConfig.access: public`, `files: ["bin","src"]`, sin campo `repository` (confirmado `node -p "require('./package.json').repository"` → `undefined`). `git remote origin` es `git@github.com:leandjb/osfetch.git` (esperado `https://github.com/leandjb/osfetch` en provenance).
- `publish.yml:35` hace `npm publish --provenance --access public` con `permissions: id-token: write`, `registry-url`, `pnpm` + `setup-node@v5` ya fixeados. El log muestra `Provenance statement published to …logIndex=2551268345` y luego `E422 Failed to validate repository information: package.json: "repository.url" is "", expected to match "https://github.com/leandjb/osfetch"`. Es el check Sigstore que compara `package.json` con el OIDC `repository` del workflow.
- `README.md` y `pnpm-lock.yaml` ya alineados con scoped, pero ningún test valida `repository.url`.

Restricciones: solo metadata `package.json` + docs; no tocar `src/`/`bin/`; mantener `pnpm` + `setup-node@v5`; `NPM_TOKEN` granular ya tiene `Read and write` en `@leandjb`.

## Goals / Non-Goals

**Goals:**
- Añadir `repository` canónico a `package.json` para que `npm publish --provenance` valide contra `leandjb/osfetch` y elimine `E422`.
- Mantener `name: @leandjb/osfetch`, `bin` intacto y `publishConfig` sin cambios.
- Documentar el fix en `README.md` si se añade `homepage`/`bugs`.

**Non-Goals:**
- Quitar `--provenance` para evitar `E422` (rechazado, pierde attestación).
- Migrar a Trusted Publishing sin token (follow-up).
- Cambiar `name`, `bin`, `files` o workflows `ci.yml`/`publish.yml` más allá de lo ya fixeado.
- Añadir `package-lock.json` o cambiar a `npm`.

## Decisions

### D1 — Formato de `repository.url`: `git+https://github.com/leandjb/osfetch.git` vs `https://github.com/leandjb/osfetch`
Elegido: **`{ "type": "git", "url": "git+https://github.com/leandjb/osfetch.git" }`**.

- Rationale: Es el formato canónico que `npm pkg fix` y `npm docs` generan; npm normaliza `git+https` → `https` para provenance, por lo que ambos `git+https://... .git` y `https://github.com/leandjb/osfetch` pasan el check `expected to match "https://github.com/leandjb/osfetch"`. Usar `git+` evita que herramientas como `npm view` sugieran fix y cubre `git@` vs `https` del remote.
- Alternativa: `"repository": "https://github.com/leandjb/osfetch"` (string) — válido pero menos explícito `type: git`.
- Alternativa: `"repository": "leandjb/osfetch"` — falla, npm lo expande pero provenance espera URL completa.
- Verificación: `node -p "require('./package.json').repository.url"` debe contener `github.com/leandjb/osfetch`.

### D2 — Añadir `homepage` y `bugs`
Elegido: **añadir `homepage: "https://github.com/leandjb/osfetch#readme"` y `bugs: { "url": "https://github.com/leandjb/osfetch/issues" }` como complementos**.

- Rationale: No son requeridos para `E422`, pero alinean el package con npm docs y evitan futuros warnings `pkg fix`. No afectan provenance.
- Alternativa: solo `repository` — mínimo viable, pero `homepage`/`bugs` son 2 líneas sin riesgo.

### D3 — Mantener `--provenance` vs quitarlo
Elegido: **mantener `npm publish --provenance --access public`**.

- Rationale: `E422` es verificable y fixeable con `repository.url`; quitar provenance elimina `E422` pero pierde transparencia Sigstore (logIndex) y badge de provenance en npm. El error ya firmó provenance (`logIndex=2551268345`), por lo que fix es solo metadata.
- Alternativa: `npm publish --access public` sin `--provenance` — rechaza por perder seguridad.

### D4 — Dónde validar `repository.url`
Elegido: **no añadir gate extra en `publish.yml` para `repository.url`** (el gate de `package name is scoped` ya existe).

- Rationale: `npm publish --provenance` ya valida `repository.url` y falla con `E422` claro; duplicar `jq` para `repository` es redundante. Se puede añadir `node -e` si se quiere early-fail, pero no es necesario para este fix.
- Alternativa: añadir `jq -e '.repository.url | contains("leandjb/osfetch")'` — útil pero opcional.

## Risks / Trade-offs

- [URL con `git+` vs sin `git+` puede no matchear exacto] → Mitigación: probar ambos formatos localmente con `NODE_AUTH_TOKEN=dummy npm publish --dry-run` (dry-run no valida provenance completo, pero `npm pack --dry-run` muestra `repository`); el check real es en publish, se verifica con `E422` ausente.
- [Bump de versión requerido: `1.0.1` ya fue intentada y falló tras firmar] → Mitigación: bump a `1.0.2` (patch) antes de reintentar Release; npm no permite reutilizar versión aunque `E422` haya fallado.
- [Añadir `repository` no afecta `pnpm-lock.yaml`] → Mitigación: `pnpm install` no regenera lock por solo metadata `repository`, pero `npm` sí lo considera; no se necesita `pnpm install` extra.
- [Si `repository.url` apunta a otro repo (fork) falla de nuevo] → Mitigación: usar exactamente `https://github.com/leandjb/osfetch` (owner `leandjb`), no `leandb` (typo) ni URL SSH.

## Migration Plan

1. Editar `package.json`: añadir `repository: { "type": "git", "url": "git+https://github.com/leandjb/osfetch.git" }`, `homepage`, `bugs`.
2. `node -p "require('./package.json').repository.url"` → contiene `leandjb/osfetch`.
3. `npm pkg fix` → verifica no limpia `bin` ni cambia `repository`.
4. `npm pack --dry-run` → 24 ficheros, `name: @leandjb/osfetch`, sin warnings `bin[osfetch]`.
5. `npm test` 14 suites 112 tests (no afecta runtime).
6. Bump `version` a `1.0.2` (si `1.0.1` ya fue usada en intento fallido), `git tag v1.0.2` + Release `published` → `publish.yml` debe pasar con `Provenance statement published` sin `E422`.
7. Rollback: quitar `repository` o cambiar URL → reproduce `E422`; revertir commit restaura fallo.

## Open Questions

- ¿Mantener `repository.url` con `git+https` o solo `https`? Ambos pasan, se elige `git+` por canonicidad.
- ¿Añadir `funding` o `author` además de `homepage`/`bugs`? No bloquea provenance, deferible.
