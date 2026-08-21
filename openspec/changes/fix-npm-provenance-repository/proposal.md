## Why

`npm publish --provenance` en `publish.yml` firma correctamente pero falla con `E422 Unprocessable Entity - Error verifying sigstore provenance bundle: Failed to validate repository information: package.json: "repository.url" is "", expected to match "https://github.com/leandjb/osfetch"`. Sin `repository.url` en `package.json`, la verificación Sigstore no puede vincular el paquete `@leandjb/osfetch` con el repo `leandjb/osfetch`, bloqueando toda Release aunque el nombre scoped y el lock `pnpm` ya estén fixeados.

## What Changes

- Añade campo `repository` canónico a `package.json` (`{ "type": "git", "url": "git+https://github.com/leandjb/osfetch.git" }`) y opcionalmente `homepage`/`bugs` alineados con el repo GitHub para que provenance valide.
- Mantiene `name: "@leandjb/osfetch"`, `bin: { "osfetch": "bin/osfetch.js" }`, `publishConfig.access: public` ya fixeados; no cambia lógica `src/` ni workflows (ya usan `pnpm` + `setup-node@v5` + `provenance`).
- Verifica que `npm pack --dry-run` no limpia `bin` y que `node -p "require('./package.json').repository.url"` coincide con el repo usado por provenance, y que `NODE_AUTH_TOKEN=dummy npm publish --dry-run` ya no muestra `E422`.
- Documenta que el fix es requerido por npm provenance desde 2023 para paquetes publicados desde GitHub Actions con `id-token: write`.

## Capabilities

### New Capabilities

<!-- none — fix de metadata existente -->

### Modified Capabilities

- `github-workflows`: El workflow `publish.yml` SHALL publicar con provenance solo si `package.json` declara `repository.url` que coincide con `https://github.com/leandjb/osfetch` (o `git+https://...`), evitando `E422`. Antes fallaba con `repository.url is ""`.

## Impact

- **Modificados**: `package.json` (añade `repository`, opcional `homepage`/`bugs`), `pnpm-lock.yaml` si cambia `name` (no en este caso, solo metadata), `README.md` si se documenta repo link.
- **Sin impacto runtime**: `src/`, `bin/`, `test/`, `jest.config.js` intactos; `files: ["bin","src"]` excluye `.github/`.
- **Dependencias**: ninguna nueva; reusa `actions/checkout`, `pnpm/action-setup`, `setup-node@v5`.
- **Riesgo si no se hace**: toda Release con `publish.yml` falla en `E422` tras firmar provenance, bloquea distribución aunque el scope `@leandjb/osfetch` ya esté corregido.
