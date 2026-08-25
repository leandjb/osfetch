## 1. Corrección de logos

- [x] 1.1 En `src/logos/linux.js`: restaurar la línea de la boca a `'      |:_/ |       '` y reescribir `colors` con exactamente 9 entradas alineadas a las 9 líneas (blanco/amarillo/cian según diseño); verificar conteo con `node -e "import('./src/logos/linux.js').then(m=>console.log(m.linux.lines.length, m.linux.colors.length))"`
- [x] 1.2 En `src/logos/macos.js`: contar las líneas actuales y reescribir `colors` con el mismo número de entradas; verificar con el mismo comando para `macos`
- [x] 1.3 En `src/logos/windows.js`: reescribir `colors` con exactamente 8 entradas (azul paneles superiores, rojo división, verde base o según intención visual); verificar conteo para `windows`

## 2. Ajuste del test de estructura

- [x] 2.1 En `test/unit/logos/logos.test.js`: cambiar la aserción `toBeGreaterThanOrEqual(12)` por `toBeGreaterThanOrEqual(8)`, manteniendo `<= 20`, el chequeo `lines.length === colors.length` y las demás invariantes; verificar que la suite de logos pasa excepto snapshots
- [x] 2.2 Añadido durante apply: en `test/unit/core/renderer.test.js`, el test de layout "logo taller que info" dependía de la altura del logo real de linux (indexaba `lines[10]`); reescrito con un logo sintético de 12 líneas para desacoplarlo del arte real; verificar con la suite completa en verde

## 3. Regeneración de snapshots y validación final

- [x] 3.1 Revisar el diff esperado de los snapshots y regenerarlos con `pnpm test -- -u`; confirmar que solo cambian las líneas del arte en `__snapshots__/renderer.test.js.snap`
- [x] 3.2 Ejecutar `pnpm test` completo dos veces consecutivas y confirmar 15/15 suites y 128/128 tests en verde en ambas corridas
- [x] 3.3 Verificación visual: ejecutar `node bin/osfetch.js` y confirmar que los tres logos se ven correctos y coloreados sin desalineaciones; ejecutar `./node_modules/.bin/openspec validate fix-logo-tests-after-redesign --strict`
