## Purpose

Garantiza que los metadatos de publicación de `@leandjb/osfetch` en `package.json` son válidos y verificables automáticamente, de modo que la firma de provenance de npm (Sigstore) pueda vincular el paquete con el repositorio `leandjb/osfetch` sin errores `E422`.

## ADDED Requirements

### Requirement: Nombre del paquete scoped

`package.json` SHALL declarar `name: "@leandjb/osfetch"` para permitir acceso público sin colisión de nombres.

#### Scenario: Nombre scoped presente
- **WHEN** se leen los metadatos de publicación desde `package.json`
- **THEN** el campo `name` es exactamente `"@leandjb/osfetch"` y no el nombre sin scope `osfetch`

### Requirement: Repository URL coincide con el repositorio de provenance

`package.json` SHALL declarar `repository.url` que, una vez normalizado por npm (sin prefijo `git+` ni sufijo `.git`), sea igual a `https://github.com/leandjb/osfetch`, requisito de la verificación Sigstore al publicar con `--provenance`.

#### Scenario: Repository URL normalizada coincide con provenance
- **WHEN** se normaliza `package.json#repository.url` eliminando el prefijo `git+` y el sufijo `.git`
- **THEN** el resultado es exactamente `https://github.com/leandjb/osfetch`

#### Scenario: Repository URL vacío o ausente es inválido
- **WHEN** `repository.url` está vacío, ausente o no apunta a `github.com/leandjb/osfetch`
- **THEN** los metadatos se consideran inválidos para publicar con provenance y cualquier verificación automatizada debe fallar antes del publish

### Requirement: Campos de soporte alineados al repositorio

`package.json` SHALL declarar `homepage` apuntando a `https://github.com/leandjb/osfetch#readme` y `bugs.url` apuntando a `https://github.com/leandjb/osfetch/issues`, coherentes con el repositorio declarado.

#### Scenario: Homepage y bugs apuntan al repositorio
- **WHEN** se validan los metadatos de publicación
- **THEN** `homepage` es `https://github.com/leandjb/osfetch#readme` y `bugs.url` es `https://github.com/leandjb/osfetch/issues`

### Requirement: Versión semver válida y superior a la última publicada

`package.json` SHALL declarar un campo `version` que cumpla SemVer y sea estrictamente mayor que la última versión publicada en el registro npm, evitando `E409` por versiones duplicadas.

#### Scenario: Versión cumple SemVer
- **WHEN** se valida el campo `version` de `package.json`
- **THEN** coincide con el formato `MAJOR.MINOR.PATCH` de SemVer

### Requirement: Entrypoint bin existente y empaquetado

`package.json` SHALL declarar `bin.osfetch` apuntando a `./bin/osfetch.js`, un archivo que existe en el repositorio, y el campo `files` SHALL incluir `bin` y `src` para que el tarball publicado contenga el ejecutable y el módulo exportado en `exports`.

#### Scenario: Bin apunta a archivo existente incluido en el tarball
- **WHEN** se valida `bin.osfetch` contra el sistema de archivos y el campo `files`
- **THEN** `bin/osfetch.js` existe, `files` incluye `bin` y `src`, y `exports."."` resuelve a un archivo dentro de los directorios empaquetados

### Requirement: Verificación automatizada de metadatos mediante Jest

La suite de tests SHALL incluir tests unitarios de Jest que validen todos los requisitos anteriores leyendo `package.json` real del proyecto, de modo que cualquier regresión de metadatos falle en CI (`pnpm test`) antes de llegar al paso de publish.

#### Scenario: Suite de metadatos pasa con el estado actual
- **WHEN** se ejecuta `pnpm test` sobre el repositorio con los metadatos correctos
- **THEN** todos los tests de `publish-metadata` pasan sin modificaciones externas

#### Scenario: Regresión de metadatos detectada por la suite
- **WHEN** se elimina o corrompe cualquier campo crítico (`name`, `repository.url`, `version`, `bin`) de `package.json` y se ejecuta la suite
- **THEN** al menos un test de `publish-metadata` falla indicando el campo inválido
