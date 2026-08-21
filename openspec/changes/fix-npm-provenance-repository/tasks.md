## 1. Package metadata (provenance)

- [x] 1.1 Añadir a `package.json` `repository: { "type": "git", "url": "git+https://github.com/leandjb/osfetch.git" }` y opcional `homepage: "https://github.com/leandjb/osfetch#readme"` y `bugs: { "url": "https://github.com/leandjb/osfetch/issues" }`, manteniendo `name: "@leandjb/osfetch"` y `bin: { "osfetch": "bin/osfetch.js" }`; verificar con `node -p "require('./package.json').repository.url"` que contiene `github.com/leandjb/osfetch` y `node -p "require('./package.json').name"` es `@leandjb/osfetch`
- [x] 1.2 Verificar que `npm pkg fix` y `npm pack --dry-run` no limpian `bin` ni `repository` y que el tarball muestra `name: @leandjb/osfetch` y `repository` intacto; ejecutar `npm pkg fix` y luego `cat package.json | grep -A2 repository` y `npm pack --dry-run 2>&1 | grep -E "name:|repository|bin\[osfetch\]"` y confirmar `total files: 24` sin warning `bin[osfetch] cleaned`

## 2. Validación de workflows y specs

- [x] 2.1 Confirmar que `.github/workflows/publish.yml` mantiene `setup-node@v5`, `cache: 'pnpm'`, `pnpm install --frozen-lockfile`, `pnpm test`, `npm publish --provenance --access public` con `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` y no requiere cambios para `repository` (la validación es de `package.json`); verificar `yamllint publish.yml` y `grep -q "provenance" publish.yml`
- [x] 2.2 Actualizar `README.md` si se documenta `repository`/`homepage` (opcional): añadir link al repo en sección Package o Publishing; verificar `grep -q "github.com/leandjb/osfetch" README.md`

## 3. Validación e2e

- [x] 3.1 Ejecutar validación `npx openspec validate fix-npm-provenance-repository --strict` y `npm test` (14 suites 112 tests) y confirmar que `specs/github-workflows/spec.md` tiene requisito MODIFIED con escenarios `####` que mencionan `repository.url` y `E422` y `bin` intacto
- [x] 3.2 Simular publish dry-run con repo fix: ejecutar `NODE_AUTH_TOKEN=dummy npm publish --dry-run` y verificar que log ya no contiene `E422` ni `repository.url is ""`, sino `Publishing to https://registry.npmjs.org/ with tag latest and public access` para `@leandjb/osfetch@<version>` y `Provenance statement published` sin error; verificar `npm pack --dry-run` muestra `repository` y no warning
- [x] 3.3 Verificar bump de versión y rollback: comprobar que `package.json` `version` es `1.0.2` (o siguiente patch tras `1.0.1` fallida) y que revertir `repository.url` a `""` reproduce `E422` localmente (dry-run con provenance no lo reproduce, pero `npm publish --provenance` lo haría); documentar en release notes que se requiere bump tras `E422`
