# Implementation Plan: Banco de escenarios

> Mantener estas tareas solo para contenido curado. Factory, DynamoDB, IA y API
> se implementan desde `../backend-serverless/tasks.md`.

## Overview

Owner: **Clau**. Es la ruta crítica del proyecto: sin contenido no hay demo.
Meta: 20 escenarios validados antes del sábado.

Tareas centrales: 10 · Opcionales: 3 · Estimado: 3 noches repartidas.

## Tasks

### Fase 1: Contrato y herramientas

- [x] 1. Definir el esquema JSON del banco
  - Crear `src/data/escenarios.schema.json` con enums, requeridos y longitudes
  - `additionalProperties: false` para atrapar typos
  - _Requisitos: 1.1, 1.2, 1.3, 1.5_

- [x] 2. Escribir el validador de reglas de contenido
  - Crear `scripts/validar-escenarios.mjs` sin dependencias
  - Errores cortan con exit 1; avisos solo se imprimen
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.2, 5.4_

- [x] 3. Conectar el validador a un hook de Kiro
  - `.kiro/hooks/validar-escenarios.kiro.hook` con `fileEdited` sobre `src/data/**`
  - _Requisitos: 5.1_

- [x] 4. Cargar los primeros 8 escenarios semilla
  - Cubrir las 6 familias de estafa + 2 legítimos
  - _Requisitos: 3.2, 3.5_

### Fase 2: Completar el banco

- [ ] 5. Escribir 5 escenarios más de robo de cuenta y monedas gratis
  - Variar el disfraz: admin, youtuber, soporte técnico, amigo
  - _Requisitos: 3.1, 3.2, 4.1_

- [ ] 6. Escribir 4 escenarios de link tramposo y archivo con virus
  - Al menos uno con dominio tipográficamente confuso (`rn` por `m`, `0` por `o`)
  - _Requisitos: 3.1, 3.2_

- [ ] 7. Completar los mensajes legítimos hasta llegar a 7
  - Código de verificación real, invitación de un amigo, aviso oficial del juego,
    mensaje de un familiar, notificación de compra hecha por el propio niño
  - Ninguno debe ser una trampa disfrazada
  - _Requisitos: 3.3, 4.4_

- [ ] 8. Balancear dificultad y canales
  - Repartir 1/2/3 y cubrir los cinco canales
  - _Requisitos: 3.4, 3.5_

### Fase 3: Calidad del contenido

- [ ] 9. Pasada de tono sobre todo el banco
  - Revisar cada texto contra el checklist de `tono-infantil.md`
  - Eliminar jerga técnica y lenguaje de miedo
  - _Requisitos: 4.1, 4.2, 4.3_

- [ ] 10. Revisión de seguridad infantil de los perfiles de estafador
  - Ningún `perfilEstafador` puede rozar temas prohibidos
  - _Requisitos: 4.1, 5.3_

- [ ] 11*. Playtest con un niño de 8 a 13
  - Anotar qué mensajes le costaron y qué palabras no entendió
  - Ajustar antes del video
  - _Requisitos: 4.1_

- [ ] 12*. Tabla de escenarios para el README y el video
  - Tipo, ejemplo, señal que lo delata (formato del brief)
  - _Requisitos: 3.1_

- [ ] 13*. Semilla de roadmap: generación semanal con Kiro
  - Documentar cómo se generarían escenarios nuevos cada semana (fuera del MVP)
  - _Requisitos: 5.3_
