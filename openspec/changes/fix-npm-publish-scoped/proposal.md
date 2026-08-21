## Why

`npm publish --provenance --access public` en `publish.yml` falla con `E403 403 Forbidden - Package name too similar to existing packages ofetch,fetch,unfetch; try renaming your package to '@leandjb/osfetch'`. El nombre `osfetch` es bloqueado por la política anti-typosquat de npm. Además, `npm pkg fix` limpia `bin[osfetch]` (warning `bin[osfetch] script name was cleaned`), lo que indica que el campo `bin` debe alinearse con el package scoped. Sin fix, ninguna Release puede publicarse aunque el provenance se firme correctamente.

## What Changes

- **BREAKING**: Renombra el paquete en `package.json` de `osfetch` → `@leandjb/osfetch` (scoped). Mantiene el bin `osfetch` para UX (`npx @leandjb/osfetch`, `npx osfetch` via bin alias), corrige `bin` para que `npm pkg fix` no lo limpie (usa `bin: { "osfetch": "./bin/osfetch.js" }` compatible con scoped).
- Actualiza `publish.yml` para verificar el nombre scoped antes de publicar y documenta el uso exclusivo de `npm publish --access public --provenance` con scoped (requerido para primer publish de scoped).
- Actualiza `README.md`, `package.json` `name`, y cualquier referencia a `npm install -g osfetch` → `@leandjb/osfetch`, manteniendo compatibilidad de bin.
- Verifica que `npm pack --dry-run` no limpia `bin[osfetch]` tras el fix y que el tarball sigue conteniendo solo `bin/`, `src/`, `package.json`, `README.md`, `LICENSE` (24 ficheros).
- No cambia la lógica de `src/`/`bin/`; solo metadata de distribución.

## Capabilities

### New Capabilities

<!-- none — fix de distribución existente -->

### Modified Capabilities

- `github-workflows`: El workflow `publish.yml` SHALL publicar el paquete scoped `@leandjb/osfetch` (no `osfetch`) con `npm publish --provenance --access public`, usando `NPM_TOKEN`, gateado por tests. Antes publicaba `osfetch` y fallaba con E403.

## Impact

- **Modificados**: `package.json` (`name` → `@leandjb/osfetch`, `bin` alineado, `publishConfig` si se añade), `.github/workflows/publish.yml` (valida nombre scoped), `README.md` (instrucciones de instalación con scope), `pnpm-lock.yaml` / lock tras rename (si se usa `pnpm`).
- **Sin impacto runtime**: `src/`, `test/`, `jest.config.js` intactos; `files: ["bin","src"]` excluye `.github/`.
- **Breaking**: Consumidores que hacían `npm install -g osfetch` deberán migrar a `npm install -g @leandjb/osfetch` (bin `osfetch` sigue funcionando, pero el nombre del paquete cambia). Se documenta como **BREAKING** en release notes.
- **Dependencias**: ninguna nueva; reusa `actions/checkout`, `pnpm/action-setup`, `setup-node@v5`.
- **Riesgo si no se hace**: toda Release publicada falla con E403, provenance se firma pero nunca llega a registry, bloquea distribución.
