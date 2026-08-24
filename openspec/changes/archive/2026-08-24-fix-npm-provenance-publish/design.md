## Context

`main` ya declara `repository.url: "git+https://github.com/leandjb/osfetch.git"` (fix de `fix-npm-provenance-repository`), pero el E422 persistió porque la Release `1.0.1` apuntaba al tag `1.0.1` → commit `6621d1e`, cuyo `package.json` aún no tenía el campo. El workflow `.github/workflows/publish.yml` se dispara por `release: published` y `actions/checkout@v4` obtiene el commit del tag, no `main`. No existe ninguna prueba automatizada que valide los metadatos de publicación ni la integridad del tag. Jest 29 ya es devDependency (`pnpm test` con `node --experimental-vm-modules`), y los tests viven en `test/unit/**`.

## Goals / Non-Goals

**Goals:**
- Detectar metadatos de publicación inválidos en CI, antes del publish, mediante tests de Jest.
- Fail-fast dentro de `publish.yml` si `repository.url` no coincide con el repo de provenance.
- Documentar el proceso de release correcto para que ningún tag vuelva a apuntar a un commit sin fix.

**Non-Goals:**
- No cambiar el mecanismo de disparo (sigue siendo `release: published` + `workflow_dispatch`).
- No migrar la publicación a otra herramienta (npm publish + pnpm se mantienen).
- No tocar código runtime (`src/`, `bin/`) ni tests funcionales existentes.

## Decisions

### D1: Tests de Jest como guardián de metadatos (no un script ad-hoc)
Se crea `test/unit/publish-metadata.test.js` leyendo `package.json` real con `fs` y validando cada campo crítico. Razón: `ci.yml` ya corre `pnpm test` en cada push/PR y `publish.yml` lo corre antes de publicar, así que cualquier regresión se detecta gratis en ambos flujos sin duplicar infraestructura. Alternativa descartada: script suelto invocado solo desde el workflow — no correría localmente ni en PRs.

### D2: Normalización de URL replicando la lógica de npm
El test normaliza `repository.url` eliminando prefijo `git+` y sufijo `.git` antes de comparar contra `https://github.com/leandjb/osfetch`. Esto replica exactamente cómo npm compara contra el claim OIDC, permitiendo tanto `git+https://...git` como la URL plana. Alternativa descartada: exigir la forma exacta `https://github.com/leandjb/osfetch` — rompería si alguien prefiere el formato `git+`.

### D3: Verificación en el workflow con Node inline (sin dependencias nuevas)
Paso previo al publish con `node -e` que lee `package.json`, normaliza `repository.url` y hace `process.exit(1)` con mensaje claro si no coincide. Alternativa descartada: añadir `js-yaml` o action de terceros para parsear YAML — dependencia extra innecesaria para una comprobación de un campo.

### D4: Test estructural del workflow por coincidencia de texto, sin parser YAML
Un segundo test valida que `publish.yml` contiene las líneas clave (`id-token: write`, `npm publish --provenance --access public`, `pnpm test`, triggers). Se usa regex sobre el archivo plano en vez de parsear YAML para no introducir `js-yaml` solo para tests; el trade-off es menor robustez ante reformateo, aceptable porque el archivo es pequeño y estable.

### D5: El fix operativo es proceso, no más código
La raíz del incidente fue crear la Release sobre un tag antiguo. Ningún test puede impedir que GitHub haga checkout de ese commit; lo que sí pueden hacer es fallar rápido ahí. La mitigación definitiva es documentar: bump → push → tag sobre ese commit → Release. Queda en tasks.md y README.

## Risks / Trade-offs

- [Test estructural frágil ante reformat del workflow] → Mantener aserciones mínimas sobre cadenas estables; si se migra a parser YAML, actualizar solo este test.
- [Duplicación de la lógica de normalización entre test y workflow] → Ambas son 3 líneas; documentar en comentarios que deben mantenerse sincronizadas con la semántica de npm.
- [Release futura sobre tag viejo sigue posible] → Los nuevos tests + paso fail-fast abortan antes de firmar provenance, con mensaje accionable en lugar de E422 críptico.
- [Versión publicada vs `package.json`] → Si la versión ya existe en npm, npm devolverá E409 después de los tests; el test de SemVer cubre formato, no unicidad (requeriría llamada al registry, fuera de scope).

## Migration Plan

1. Añadir `test/unit/publish-metadata.test.js`; verificar `pnpm test` en verde.
2. Insertar el paso de verificación en `publish.yml` entre `Run tests` y `Publish to npm`.
3. Documentar proceso de release en README.
4. Rollback: revertir el commit del change; ningún cambio afecta runtime ni al paquete publicado.

## Open Questions

Ninguna abierta que bloquee specs o tareas. La decisión de bump exacto de versión (¿`1.0.2` ya está libre en el registry?) se resuelve al momento de crear la release.
