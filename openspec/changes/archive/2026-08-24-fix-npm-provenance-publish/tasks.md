## 1. Tests de metadatos de publicación (Jest)

- [x] 1.1 Crear `test/unit/publish-metadata.test.js` con helpers para leer `package.json` y normalizar `repository.url` (quitar `git+` y `.git`), replicando la semántica de npm; verificar que el archivo carga sin errores con `pnpm test -- publish-metadata`
- [x] 1.2 Añadir tests: `name === "@leandjb/osfetch"`, URL normalizada igual a `https://github.com/leandjb/osfetch`, `homepage` y `bugs.url` del mismo repo, `version` cumple SemVer; verificar que pasan con el estado actual (`pnpm test`)
- [x] 1.3 Añadir tests: `bin.osfetch` apunta a `./bin/osfetch.js`, el archivo existe en disco, `files` incluye `bin` y `src`, y `exports."."` resuelve a un archivo dentro de los directorios empaquetados; verificar con `pnpm test`
- [x] 1.4 Añadir test estructural de `.github/workflows/publish.yml`: contiene triggers `release: published` y `workflow_dispatch`, `id-token: write`, `npm publish --provenance --access public`, y `pnpm test` antes del publish; verificar con `pnpm test`
- [x] 1.5 Verificar detección de regresiones: modificar temporalmente `repository.url` a `""` en un checkout desechable (o simular con objeto mutado) y confirmar que la suite falla indicando el campo inválido; restaurar después

## 2. Workflow fail-fast

- [x] 2.1 Insertar en `.github/workflows/publish.yml` un paso `Verify provenance metadata` entre `Run tests` y `Publish to npm`: script Node inline que lee `package.json`, normaliza `repository.url` y hace exit 1 con mensaje claro si no es `https://github.com/leandjb/osfetch`; verificar sintaxis YAML y que el paso aparece después de los tests
- [x] 2.2 Confirmar que la configuración existente no cambia: triggers, permisos (`contents: read`, `id-token: write`), `setup-node@v5` Node 22, `pnpm install --frozen-lockfile`, `npm publish --provenance --access public` con `NODE_AUTH_TOKEN`; verificar con diff del archivo

## 3. Documentación y validación final

- [x] 3.1 Documentar en README el proceso de release correcto (bump de versión → push a `main` → tag sobre ese commit → Release) y por qué una Release sobre un tag antiguo falla; verificar que la sección existe
- [x] 3.2 Ejecutar suite completa `pnpm test` y confirmar que todos los tests nuevos y existentes pasan; ejecutar `./node_modules/.bin/openspec validate fix-npm-provenance-publish --strict`
