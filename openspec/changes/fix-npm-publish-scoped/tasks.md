## 1. Package metadata (scoped)

- [x] 1.1 Actualizar `package.json` `name` de `osfetch` → `@leandjb/osfetch`, asegurar `bin: { "osfetch": "./bin/osfetch.js" }` (objeto explícito) y opcional `publishConfig: { "access": "public" }`; verificar con `node -p "require('./package.json').name"` y `node -p "require('./package.json').bin.osfetch"` y `npm pkg fix` no limpia bin
- [x] 1.2 Regenerar lock y verificar tarball: ejecutar `pnpm install` (actualiza `pnpm-lock.yaml` si cambia `name`), luego `npm pack --dry-run` y confirmar que no aparece `bin[osfetch] script name was cleaned`, que el tarball muestra `name: @leandjb/osfetch` y `total files: 24` con solo `bin/`, `src/`, `package.json`, `README.md`, `LICENSE`

## 2. Workflows de publish

- [x] 2.1 Actualizar `.github/workflows/publish.yml` para validar/gatear scoped name: añadir paso `Verify package name is scoped` con `jq -e '.name == "@leandjb/osfetch"' package.json` o `node -p` antes de `npm publish`, manteniendo `setup-node@v5`, `cache: 'pnpm'`, `pnpm install`, `provenance`; verificar `yamllint publish.yml` y `grep -q "@leandjb/osfetch" publish.yml || grep -q "jq.*@leandjb"`
- [x] 2.2 Verificar que `publish.yml` sigue sin `push`/`pull_request` y solo `release: types: [published]` + `workflow_dispatch`, con `permissions: id-token: write` y `registry-url`; verificar `grep -c "push:" publish.yml` es 0 y `yamllint` pasa

## 3. Documentación

- [x] 3.1 Actualizar `README.md` para scoped: cambiar `npm install -g osfetch` → `npm install -g @leandjb/osfetch`, `npx osfetch` → `npx @leandjb/osfetch` (manteniendo bin `osfetch`), añadir nota BREAKING de migración; verificar `grep -q "@leandjb/osfetch" README.md` y `grep -q "npx @leandjb/osfetch" README.md` y que `bin` sigue documentado como `osfetch`
- [x] 3.2 Verificar que `README.md` no referencia `osfetch` sin scope como paquete principal (salvo bin): `grep -q "npm install -g @leandjb" README.md` y `grep -q "osfetch" README.md` para bin, y que los bloques `bash` renderizan

## 4. Validación e2e

- [x] 4.1 Ejecutar validación `npx openspec validate fix-npm-publish-scoped --strict` y `npm test` (14 suites 112 tests) y confirmar que `specs/github-workflows/spec.md` tiene requisito MODIFIED con escenarios `####` y menciona `@leandjb/osfetch` y bin intacto
- [x] 4.2 Simular publish dry-run con scoped: ejecutar `NODE_AUTH_TOKEN=dummy npm publish --dry-run` y verificar que log muestra `Publishing to https://registry.npmjs.org/ with tag latest and public access` para `@leandjb/osfetch@1.0.0` sin `E403`, y que `npm pack --dry-run` muestra `name: @leandjb/osfetch` y sin warning `bin[osfetch] cleaned`
- [x] 4.3 Verificar separación final y rollback: `ls .github/workflows/` muestra `ci.yml` y `publish.yml` separados, `git status` muestra solo `package.json`, `README.md`, `publish.yml`, `pnpm-lock.yaml`; `npm pack --dry-run` 24 ficheros; documentar que revertir `name` a `osfetch` reproduce E403
