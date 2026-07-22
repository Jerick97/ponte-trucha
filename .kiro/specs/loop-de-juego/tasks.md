# Implementation Plan: Loop de juego y teléfono simulado

## Overview

Owner: **Jerick** (UI) con Clau en las reglas de puntaje.
Las tareas marcadas con `*` son opcionales (pruebas y pulido) y se hacen solo si
el core ya está en verde.

Tareas centrales: 12 · Opcionales: 4 · Estimado: 2 noches + sábado de pulido.

## Tasks

### Fase 1: Esqueleto y contratos

- [x] 1. Definir el contrato de datos del escenario
  - Crear `src/types/escenario.ts` con `Escenario`, `SenalDelatora`, `Veredicto`
  - Mantenerlo alineado con `src/data/escenarios.schema.json`
  - _Requisitos: 1.2, 3.1_

- [x] 2. Implementar el motor puro de partida
  - Crear `src/game/motor.ts` con `crearPartida`, `responder`, `calcularPuntos`
  - Aleatoriedad inyectable en `barajar` y `armarRonda`
  - _Requisitos: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

- [x] 3. Implementar el nivel de trucha
  - Crear `src/game/nivelTrucha.ts` con los cortes 90/70/45
  - _Requisitos: 6.2, 6.3_

- [x] 4. Crear el store de partida con zustand
  - `src/store/usePartida.ts` con fases y acciones
  - El store no calcula puntaje: delega en el motor
  - _Requisitos: 2.3, 4.5, 6.1, 6.5_

### Fase 2: Teléfono simulado

- [x] 5. Definir los design tokens
  - `@theme` en `src/index.css`: marca, veredictos, superficies, niveles
  - Regla: los componentes no usan color crudo
  - _Requisitos: 1.1, 7.5_

- [x] 6. Construir `MarcoTelefono`
  - Ancho máximo 420 px, altura `100dvh`, header y pie fijos
  - _Requisitos: 1.1, 1.2_

- [x] 7. Construir `Burbuja` con resaltado de señales
  - Partir el texto por fragmentos literales, en orden de aparición
  - _Requisitos: 1.4, 3.1_

- [ ] 8. Aplicar el tratamiento visual por canal
  - Variantes para `chat-juego`, `whatsapp`, `sms`, `discord`
  - Cambiar header, color de burbuja y tipografía según el canal
  - _Requisitos: 1.3_

### Fase 3: Loop completo

- [x] 9. Construir `BarraDecision` y `Hud`
  - Botones de 56 px de alto, bloqueados fuera de la fase `mensaje`
  - _Requisitos: 2.1, 2.2, 2.4, 4.5_

- [x] 10. Construir `TarjetaFeedback`
  - Señales, explicaciones y lección; refuerzo distinto para acierto y fallo
  - _Requisitos: 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 11. Cablear `App.tsx` como máquina de fases
  - Transiciones inicio → mensaje → feedback → (chat) → resultado
  - _Requisitos: 2.3, 6.1_

- [x] 12. Construir `PantallaInicio` y `PantallaResultado`
  - Web Share API con fallback a portapapeles
  - _Requisitos: 6.3, 6.4, 6.5_

### Fase 4: Pulido y verificación

- [x] 13*. Pruebas unitarias del motor y del nivel
  - `src/test/motor.test.ts`: racha, tope de bonus, orden por dificultad, sin repetidos
  - _Requisitos: 4.1, 4.2, 4.3, 5.1, 5.3, 6.2_

- [ ] 14. Pasada de accesibilidad
  - `aria-live` en el feedback, foco visible, partida completa con teclado
  - Verificar contraste 4.5:1 en todos los textos
  - _Requisitos: 7.2, 7.3, 7.4, 7.5_

- [ ] 15*. Animaciones y sonidos
  - Transición de burbuja entrante, vibración corta al fallar (si el dispositivo lo soporta)
  - Respetar `prefers-reduced-motion`
  - _Requisitos: 7.2_

- [ ] 16*. Presupuesto de bundle
  - Medir el build; si pasa de 200 KB gzip, revisar qué entró
  - _Requisitos: 7.1_
