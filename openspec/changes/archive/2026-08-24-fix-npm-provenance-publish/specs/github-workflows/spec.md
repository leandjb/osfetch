## ADDED Requirements

### Requirement: Publish workflow valida metadatos de provenance antes de publicar

El workflow `publish.yml` SHALL ejecutar un paso de verificación fail-fast que compruebe que `package.json#repository.url` normalizado es igual a `https://github.com/leandjb/osfetch` antes de ejecutar `npm publish --provenance`, de modo que una release creada sobre un commit con metadatos incompletos falle temprano con un mensaje accionable y nunca llegue a intentar firmar provenance.

#### Scenario: Metadatos válidos permiten el publish
- **WHEN** la verificación previa se ejecuta sobre un commit cuyo `package.json` declara `repository.url` normalizado igual a `https://github.com/leandjb/osfetch`
- **THEN** la verificación pasa y el workflow continúa hacia `npm publish --provenance --access public`

#### Scenario: Metadatos inválidos abortan antes del publish
- **WHEN** el workflow hace checkout de un tag cuyo commit no declara `repository.url` (o lo declara apuntando a otro repositorio)
- **THEN** el paso de verificación falla con un mensaje que identifica el campo `repository.url` como inválido, `npm publish` no se ejecuta y no se intenta firmar provenance

#### Scenario: Release desde commit sin fix detectada por tests en CI
- **WHEN** se crea una Release sobre un tag antiguo cuyo `package.json` carece de metadatos válidos
- **THEN** los tests de Jest de metadatos de publicación (ejecutados dentro del workflow antes del publish) fallan, abortando el job antes de publicar

### Requirement: Publish workflow conserva su configuración actual

El workflow `publish.yml` SHALL mantener su comportamiento existente: disparo por `release: [published]` y `workflow_dispatch`, permisos `contents: read` e `id-token: write`, setup con pnpm y Node 22, instalación con `pnpm install --frozen-lockfile`, ejecución de `pnpm test` como gate previo, y publicación con `npm publish --provenance --access public` usando `NODE_AUTH_TOKEN`.

#### Scenario: Configuración existente intacta tras el cambio
- **WHEN** se revisa `.github/workflows/publish.yml` después del cambio
- **THEN** contiene los triggers `release: published` y `workflow_dispatch`, `id-token: write`, `pnpm/action-setup@v4`, `setup-node@v5` con Node 22, `pnpm install --frozen-lockfile`, `pnpm test` antes del publish, y `npm publish --provenance --access public` con `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`

### Requirement: Proceso de release documentado y consistente

El proyecto SHALL documentar que las releases se crean siempre sobre tags que apuntan a commits de `main` con la suite de tests en verde (bump de versión → push a `main` → tag → Release), garantizando que el checkout del workflow siempre contiene metadatos válidos.

#### Scenario: Release creada siguiendo el proceso documentado
- **WHEN** se bumpa la versión en `main`, se pushea, se crea el tag sobre ese commit y se publica la Release para ese tag
- **THEN** el checkout del workflow corresponde al commit con metadatos válidos, los tests pasan y `npm publish --provenance` completa sin `E422`
