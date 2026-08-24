## Why

El intento de publicación de `@leandjb/osfetch` falló con `E422 Unprocessable Entity - Error verifying sigstore provenance bundle: repository.url is ""`. La causa raíz no es solo el campo faltante (ya corregido en `main` por `fix-npm-provenance-repository`), sino que el workflow se dispara por `release: published` y hace checkout del commit etiquetado: la release `1.0.1` apuntaba al tag `1.0.1` → commit `6621d1e`, cuyo `package.json` aún no tenía `repository`. No existe ninguna prueba automatizada que valide los metadatos de publicación ni que impida publicar desde un commit sin metadatos válidos, por lo que el fallo puede repetirse con cualquier tag antiguo.

## What Changes

- Añade tests de Jest (`test/unit/publish-metadata.test.js`) que validan los metadatos críticos de `package.json`: nombre scoped `@leandjb/osfetch`, `repository.url` normalizado igual a `https://github.com/leandjb/osfetch`, presencia de `homepage` y `bugs.url` del mismo repositorio, versión semver válida, `bin.osfetch` apuntando a un archivo existente y `files` incluyendo `bin/` y `src/`.
- Añade test de Jest que valida la estructura de `.github/workflows/publish.yml`: dispara en `release: published` + `workflow_dispatch`, usa `npm publish --provenance --access public`, requiere `id-token: write` y ejecuta los tests antes de publicar.
- Añade al workflow un paso previo al publish ("verify provenance metadata") que hace fail-fast si `repository.url` no coincide con `https://github.com/leandjb/osfetch`, para que el error se detecte antes de intentar firmar provenance.
- Documenta el procedimiento correcto de release: bump de versión en `package.json` → push a `main` → crear tag sobre ese commit → crear la Release sobre ese tag, garantizando que el checkout del workflow siempre contiene metadatos válidos.

## Capabilities

### New Capabilities

- `publish-metadata`: Requisitos sobre los metadatos de `package.json` necesarios para publicar con provenance (nombre scoped, `repository.url` coincidente con el repo de GitHub, campos de soporte) y su verificación automatizada mediante tests de Jest.

### Modified Capabilities

- `github-workflows`: El workflow `publish.yml` SHALL validar los metadatos de provenance (`repository.url` vs `https://github.com/leandjb/osfetch`) con un paso fail-fast antes de `npm publish`, de modo que una release creada sobre un commit sin metadatos válidos falle temprano con un mensaje claro y no llegue a intentar firmar provenance.

## Impact

- **Nuevos archivos**: `test/unit/publish-metadata.test.js` (tests de metadatos y workflow).
- **Modificados**: `.github/workflows/publish.yml` (nuevo paso de verificación previa al publish); posible actualización menor de `README.md` documentando el proceso de release.
- **Sin impacto runtime**: `src/`, `bin/`, lógica existente y tests actuales intactos; no se agregan dependencias (Jest ya está presente como devDependency y `js-yaml` NO es necesario si el test parsea el YAML con verificación de texto o se agrega como devDependency solo si se decide parsear estrictamente).
- **Proceso**: las próximas releases deben crearse siempre sobre tags que apunten a commits de `main` con los tests de metadatos en verde; la CI existente (`ci.yml`) ya ejecuta `pnpm test` en cada push, lo que correrá los nuevos tests automáticamente.
