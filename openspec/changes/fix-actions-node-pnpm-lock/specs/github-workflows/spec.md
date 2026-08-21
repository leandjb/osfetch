## MODIFIED Requirements

### Requirement: CI workflow ejecuta tests en push, PR y merge a main

El workflow de CI SHALL ejecutar la suite de Jest en cada evento que pueda integrar código a `main`, garantizando que ningún cambio llegue a `main` sin pasar tests en la matrix soportada, usando `pnpm` y `setup-node@v5` sin depender de `Node 20` deprecado.

#### Scenario: Push a main dispara CI
- **WHEN** se hace `git push` a `main` (incluye merge de PR vía GitHub)
- **THEN** el workflow `ci.yml` se inicia en `ubuntu-latest`, `macos-latest` y `windows-latest` con `node` 18, 20 y 22 (o ventana equivalente documentada), ejecuta `pnpm/action-setup@v4`, `actions/setup-node@v5` con `cache: 'pnpm'` y `cache-dependency-path: pnpm-lock.yaml`, luego `pnpm install --frozen-lockfile` y `pnpm test` (o `npm test` compatible)

#### Scenario: Pull Request hacia main dispara CI
- **WHEN** se abre o actualiza un `pull_request` cuyo `base` es `main`
- **THEN** el mismo workflow `ci.yml` se ejecuta en la matrix completa y su estado se reporta como check requerido

#### Scenario: CI no dispara publish
- **WHEN** se hace `push` o `pull_request` a cualquier rama (incluida `main`)
- **THEN** el workflow `publish.yml` NO se ejecuta

### Requirement: Publish workflow publica a npm solo en Release publicada

El workflow de publish SHALL publicar el paquete `osfetch` a `https://registry.npmjs.org` únicamente cuando se publica una Release en GitHub, usando el secreto `NPM_TOKEN`, gateado por tests, con `pnpm` y `setup-node@v5` y provenance.

#### Scenario: Release publicada dispara publish
- **WHEN** se crea una Release en GitHub con tipo `published` (o se dispara `workflow_dispatch` manual)
- **THEN** el workflow `publish.yml` se ejecuta en `ubuntu-latest` con `node` 22, hace `checkout`, `pnpm/action-setup@v4`, `setup-node@v5` con `registry-url: https://registry.npmjs.org` y `cache: 'pnpm'`, `pnpm install --frozen-lockfile`, `pnpm test`, y si pasa, ejecuta `npm publish --provenance --access public` con `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`

#### Scenario: Publish falla si tests fallan
- **WHEN** el paso de tests falla en `publish.yml`
- **THEN** el job no ejecuta `npm publish` y el workflow termina en fallo

#### Scenario: Push o PR no dispara publish
- **WHEN** ocurre `push` a `main` o `pull_request` sin Release
- **THEN** `publish.yml` no se ejecuta (no aparece en la lista de runs para ese evento)

### Requirement: Workflows separados con permisos y triggers no acoplados

Los dos workflows SHALL estar en ficheros distintos con triggers, permisos y caching no acoplados, usando `pnpm` lock correctamente y `setup-node@v5` sin `Node 20` deprecado, de modo que cambios en CI no afecten publish y viceversa.

#### Scenario: Ficheros separados
- **WHEN** se lista `.github/workflows/`
- **THEN** existen `ci.yml` y `publish.yml` como ficheros distintos y `ci.yml` no contiene `release: types: [published]` ni secreto `NPM_TOKEN`, y `publish.yml` no contiene `pull_request` ni matrix completa 3×3

#### Scenario: Permisos mínimos
- **WHEN** se inspecciona `publish.yml`
- **THEN** declara `permissions: { contents: read, id-token: write }` para habilitar provenance y no otorga `contents: write` innecesario

#### Scenario: Cache y setup coherente
- **WHEN** se ejecuta cualquiera de los dos workflows
- **THEN** usa `actions/checkout@v4`, `pnpm/action-setup@v4` y `actions/setup-node@v5` con `cache: 'pnpm'` y `cache-dependency-path: pnpm-lock.yaml` sin duplicar lógica entre ficheros y sin buscar `package-lock.json`
