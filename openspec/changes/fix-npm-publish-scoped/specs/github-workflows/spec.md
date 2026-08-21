## MODIFIED Requirements

### Requirement: Publish workflow publica a npm solo en Release publicada

El workflow de publish SHALL publicar el paquete `@leandjb/osfetch` (scoped, no `osfetch`) a `https://registry.npmjs.org` únicamente cuando se publica una Release en GitHub, usando el secreto `NPM_TOKEN`, gateado por tests, con `pnpm` y `setup-node@v5` y provenance, y SHALL respetar `bin: { "osfetch": "./bin/osfetch.js" }` sin que `npm pkg fix` lo limpie.

#### Scenario: Release publicada dispara publish
- **WHEN** se crea una Release en GitHub con tipo `published` (o se dispara `workflow_dispatch` manual)
- **THEN** el workflow `publish.yml` se ejecuta en `ubuntu-latest` con `node` 22, hace `checkout`, `pnpm/action-setup@v4`, `setup-node@v5` con `registry-url: https://registry.npmjs.org` y `cache: 'pnpm'`, `pnpm install --frozen-lockfile`, `pnpm test`, y si pasa, ejecuta `npm publish --provenance --access public` publicando `@leandjb/osfetch@<version>` con `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` y la provenance se firma correctamente

#### Scenario: Publish falla si tests fallan
- **WHEN** el paso de tests falla en `publish.yml`
- **THEN** el job no ejecuta `npm publish` y el workflow termina en fallo

#### Scenario: Push o PR no dispara publish
- **WHEN** ocurre `push` a `main` o `pull_request` sin Release
- **THEN** `publish.yml` no se ejecuta (no aparece en la lista de runs para ese evento)

#### Scenario: Nombre scoped evita E403
- **WHEN** `package.json` declara `name: "@leandjb/osfetch"` y `bin: { "osfetch": "./bin/osfetch.js" }` y el workflow publica con `npm publish --access public`
- **THEN** `npm publish` no retorna `E403 Package name too similar` y `npm pack --dry-run` no emite `bin[osfetch] script name was cleaned`, y el tarball publicado contiene `name: @leandjb/osfetch` con `bin` intacto

#### Scenario: Bin se mantiene tras publish
- **WHEN** se ejecuta `npm pkg fix` o `npm pack --dry-run` sobre el repo con `name: "@leandjb/osfetch"`
- **THEN** el campo `bin` permanece como `{ "osfetch": "./bin/osfetch.js" }` sin ser limpiado y el tarball incluye `bin/osfetch.js` ejecutable
