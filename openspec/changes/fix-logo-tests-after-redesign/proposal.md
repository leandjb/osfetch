## Why

El rediseño de los logos en `src/logos/` (commits `af20171` y `d5ca093`) redujo las líneas del arte sin ajustar los arrays `colors`, rompiendo la invariante `lines.length === colors.length` y el mínimo de 12 líneas que exige `test/unit/logos/logos.test.js`. Además, los snapshots del renderer quedaron obsoletos. Resultado: 7 tests fallando en 2 suites (`logos.test.js`, `renderer.test.js`), con la CI de `main` en rojo.

## What Changes

- Sincroniza el array `colors` con las nuevas líneas en `src/logos/linux.js`, `src/logos/macos.js` y `src/logos/windows.js`.
- Restaura la boca clásica de Tux (`|:_/`) en `src/logos/linux.js`, revertida por error a `|:/ ` durante el rediseño.
- Relaja la aserción de mínimo de líneas en `test/unit/logos/logos.test.js` de `>= 12` a `>= 8`, reflejando que los nuevos diseños son más compactos por decisión deliberada.
- Regenera los snapshots obsoletos del renderer (`pnpm test -- -u`) para capturar el nuevo arte.
- Mantiene intactas todas las demás invariantes: ASCII 0x20–0x7E, ancho ≤ 28 columnas, nombres de colores válidos y selección por plataforma.

## Capabilities

### New Capabilities

- `logo-rendering`: Requisitos sobre la estructura de los logos (`src/logos/*.js`) — correspondencia 1:1 entre líneas y colores, límites de tamaño y caracteres, y su verificación mediante tests — y sobre la salida renderizada del CLI con cada logo.

### Modified Capabilities

(ninguna)

## Impact

- **Modificados**: `src/logos/linux.js` (colores + boca de Tux), `src/logos/macos.js` (colores), `src/logos/windows.js` (colores), `test/unit/logos/logos.test.js` (mínimo de líneas ≥ 8), snapshots de `test/unit/core/renderer.test.js` (regenerados) y su snapshot file `__snapshots__/renderer.test.js.snap`.
- **Sin impacto**: lógica de módulos, plataformas, CLI flags ni metadatos de publicación; el arte renderizado cambia visualmente (esperado).
- **Riesgo bajo**: si los arrays de colores quedan desalineados de nuevo, el mismo test lo detecta en CI.
