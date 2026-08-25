## Purpose

Define la estructura que deben cumplir los logos de `src/logos/*.js` (correspondencia entre líneas y colores, límites de tamaño y caracteres) y su renderizado por el CLI, de modo que el arte pueda rediseñarse libremente sin romper la suite.

## ADDED Requirements

### Requirement: Correspondencia uno a uno entre líneas y colores

Cada logo SHALL declarar un array `colors` con exactamente tantos elementos como líneas tenga `lines`, de modo que cada línea del arte tenga un color asignado.

#### Scenario: Conteo coincidente tras un rediseño
- **WHEN** se edita `lines` en cualquier archivo de `src/logos/` y se ejecuta la suite
- **THEN** el test de estructura falla si `colors.length !== lines.length` y pasa cuando ambos conteos coinciden

### Requirement: Límites de tamaño del arte

Cada logo SHALL tener entre 8 y 20 líneas, y cada línea SHALL tener a lo sumo 28 columnas, manteniendo el arte compacto y compatible con el layout de dos columnas del renderer.

#### Scenario: Logo compacto aceptado
- **WHEN** un logo rediseñado tiene entre 8 y 20 líneas con líneas de hasta 28 caracteres
- **THEN** el test de estructura pasa sin requerir cambios en los tests

#### Scenario: Arte fuera de rango rechazado
- **WHEN** un logo declara menos de 8 o más de 20 líneas, o una línea supera las 28 columnas
- **THEN** el test de estructura falla indicando el logo inválido

### Requirement: Caracteres seguros para terminal

Cada línea de un logo SHALL contener únicamente caracteres imprimibles ASCII (0x20–0x7E), evitando problemas de codificación UTF-8 en distintas terminales y plataformas.

#### Scenario: Arte solo ASCII
- **WHEN** se valida cada carácter de cada línea de los tres logos
- **THEN** todos los códigos de carácter están dentro del rango 0x20–0x7E

### Requirement: Colores válidos del palette de 8

Cada entrada de `colors` SHALL ser uno de los ocho nombres válidos: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`.

#### Scenario: Nombres de colores válidos
- **WHEN** se validan los arrays `colors` de los tres logos
- **THEN** todas las entradas pertenecen al set de 8 colores soportados

### Requirement: Selección de logo por plataforma

El selector de logos SHALL devolver `macos` para `darwin`, `windows` para `win32` y `linux` para cualquier otra plataforma (incluyendo fallback con plataforma indefinida).

#### Scenario: Plataformas mapean a su logo
- **WHEN** se consulta el logo para `darwin`, `win32`, `linux`, otra plataforma no reconocida o `undefined`
- **THEN** se obtienen respectivamente `macos`, `windows`, `linux` (fallback), `linux` (fallback) y `linux` (fallback)

### Requirement: Snapshots del renderer reflejan el arte actual

Los tests de snapshot del renderer SHALL corresponder al estado actual del arte de los logos; tras un cambio intencional de diseño, los snapshots SHALL regenerarse como parte del mismo change.

#### Scenario: Renderizado estable tras regenerar snapshots
- **WHEN** los snapshots se regeneran después de sincronizar los logos y se ejecuta la suite completa dos veces
- **THEN** todos los tests de snapshot pasan en ambas corridas sin diferencias
