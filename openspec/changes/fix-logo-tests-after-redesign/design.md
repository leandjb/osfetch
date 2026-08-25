## Context

El rediseño manual del arte en `src/logos/` (commits `af20171`, `d5ca093`) dejó `colors` desincronizado de `lines` (linux 9/15, windows 8/16, macos por verificar) y revirtió por error la boca de Tux (`|:_/` → `|:/ `). Los tests existentes fallan: invariante de conteo, mínimo de 12 líneas y 5 snapshots obsoletos del renderer. La decisión ya tomada con el usuario: relajar el mínimo a ≥ 8 líneas (los diseños nuevos son compactos por diseño) y restaurar `|:_/`.

## Goals / Non-Goals

**Goals:**
- Suite 100% verde preservando el nuevo arte compacto.
- Invariante líneas↔colores restaurada y protegida para futuros rediseños.

**Non-Goals:**
- No rediseñar ni ampliar el arte (el usuario ya definió los gráficos).
- No cambiar renderer, CLI flags ni módulos de información.

## Decisions

### D1: Relajar el mínimo de líneas a >= 8 (no engordar el arte)
El mínimo original (12) era una convención de la v1 cuando los logos incluían marcos decorativos. El nuevo arte deliberadamente los elimina. Alternativa descartada: rellenar con líneas en blanco — arte inflado sin valor visual.

### D2: Asignación de colores por posición visual, no uniforme
Los nuevos colores se asignan línea a línea respetando la intención del diseño: paneles superiores de Windows en azul, inferiores en rojo/verde según el original; Tux en blanco/amarillo/cian como antes. Es subjetivo pero verificable por conteo.

### D3: Regeneración de snapshots con `-u` como paso explícito del change
Los snapshots describen "el render actual", y el cambio del arte es intencional. Regenerar una vez, dentro de este change, y verificar estabilidad corriendo la suite dos veces.

## Risks / Trade-offs

- [Colores mal asignados a líneas específicas] → Verificación visual ejecutando `node bin/osfetch.js` en las 3 plataformas antes de cerrar.
- [Relajar a >= 8 permite logos demasiado pequeños a futuro] → Rango 8–20 sigue acotado; suficiente para detectar corrupción accidental.
- [Snapshots regenerados pueden ocultar un bug real] → Se revisa el diff del snapshot file antes de aceptarlo; solo deben cambiar las líneas del arte.

## Migration Plan

1. Corregir `src/logos/*.js` (colores sincronizados + boca de Tux).
2. Ajustar mínimo en `test/unit/logos/logos.test.js`.
3. Regenerar snapshots con `-u`; correr suite completa dos veces.
4. Rollback trivial: revertir el commit del change.

## Open Questions

Ninguna.
