# Implementation Plan: Interfaz del teléfono simulado

> Mantener las tareas de UI vigentes. Roblox, SMS, email y WhatsApp son las apps
> requeridas para el backend MVP; Discord no bloquea la entrega.

## Overview

Owner: **Jerick** (UI). La tarea 6 (contrato y escenario de correo) toca
`src/types/` y `src/data/`: **avisar a Clau antes de empezarla**.

Regla de esta spec: toda lógica pura se hace con TDD — el test se escribe y
se ve fallar **antes** de implementar. Las tareas marcadas con `*` son
opcionales (pulido) y se hacen solo si el core está en verde.

Tareas centrales: 15 · Opcionales: 3 · Estimado: 3 noches + fin de semana.

## Tasks

### Fase 1: Lógica pura del teléfono (TDD)

- [x] 1. Máquina de estados del teléfono
  - Escribir `src/test/maquinaTelefono.test.ts` primero y verlo en rojo:
    encendido normal y con `saltarAnimacion`, desbloqueo, bloqueo que conserva
    `appAbierta`, giro ortogonal, eventos ignorados fuera de estado
  - Implementar `src/components/telefono/maquina.ts` hasta verde
  - _Requisitos: 1.2, 1.4, 1.5, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 10.4_

- [x] 2. Registro de apps y mapeo canal→app
  - Escribir `src/test/apps.test.ts` primero: `appPorCanal` total sobre todos
    los valores de `CanalMensaje`, sin ids duplicados, orden estable del grid
  - Implementar `src/components/telefono/apps.ts` hasta verde
  - _Requisitos: 4.3, 5.2, 10.4_

- [x] 3. Vista previa del banner de notificación
  - Escribir `src/test/vistaPrevia.test.ts` primero: recorte ≤ 80 caracteres,
    corte en límite de palabra, elipsis, mensajes cortos intactos
  - Implementar `src/components/telefono/vistaPrevia.ts` hasta verde
  - _Requisitos: 5.1, 10.4_

### Fase 2: Contrato del canal correo (coordinar con Clau)

- [ ] 4. Ampliar el contrato para correo
  - `remitente.direccion?` y `asunto?` en `src/types/escenario.ts`
  - En `escenarios.schema.json` y `scripts/validar-escenarios.mjs`:
    obligatorios si `canal === 'correo'`, prohibidos en otros canales
  - _Requisitos: 8.1, 8.2_

- [ ] 5. Escenario de correo de ejemplo
  - Un escenario `correo` en el banco (premio falso o "cuenta suspendida"),
    con la dirección rara del remitente como señal delatora
  - `npm run validar:escenarios` en verde
  - _Requisitos: 8.3, 8.4_

### Fase 3: Hardware del teléfono

- [x] 6. Design tokens del teléfono y las apps
  - Agregar a `@theme` los tokens de carcasa, pantalla apagada, lock,
    notificación y los pares `--color-app-*` / `--color-app-*-fondo`
  - Verificar contraste 4.5:1 de cada par color/texto antes de fijarlos
  - _Requisitos: 6.5, 9.4_

- [x] 7. Carcasa `Iphone` con parte trasera y giro
  - Bordes, notch, botones laterales, `ParteTrasera` (cámaras + logo)
  - Giro con `rotateY` + `backface-visibility`; control "Girar teléfono"
    accesible; sin animación bajo `prefers-reduced-motion`
  - _Requisitos: 1.1, 3.1, 3.2, 3.4_

- [x] 8. Encendido: `PantallaApagada` + `AnimacionArranque`
  - CTA "Encender" → secuencia: entra por atrás, gira, logo 🐟, zoom que
    revela el bloqueo; `FIN_ANIMACION` desde `useEffect` en `App.tsx`
  - Con `prefers-reduced-motion`: directo a bloqueado
  - _Requisitos: 1.2, 1.3, 1.4, 1.5, 9.3_

- [x] 9. `PantallaBloqueo` y botón lateral de bloqueo
  - Hora y fecha simuladas; desbloqueo por arrastre **y** botón con `Tab`
  - Botón lateral de la carcasa bloquea (`aria-label`); sin audio externo
  - Widgets de un vistazo (clima simulado, avisos, música) y reproductor
    que autodetecta pistas locales en `src/assets/audio` (pedido del equipo,
    inspirado en el CodePen xxjpgbg de mr-zouraiz123)
  - _Requisitos: 2.1, 2.2, 2.3, 2.5, 9.5_

- [x] 10. `StatusBar`
  - Hora, señal y batería simuladas, visible en toda pantalla frontal
  - _Requisitos: 4.2_

### Fase 4: Home y notificaciones

- [x] 11. `HomeScreen` con `IconoApp` y dock
  - Wallpaper con gradiente de tokens, grid desde `APPS`, badge por app,
    área táctil ≥ 44 px; app sin notificación abre en estado vacío/resuelto
  - _Requisitos: 4.1, 4.3, 4.4, 4.5_

- [x] 12. `BannerNotificacion`
  - Remitente + vista previa (tarea 3); tocar banner o ícono abre la app;
    anuncio con `aria-live="polite"`; una notificación activa a la vez
  - _Requisitos: 5.1, 5.2, 5.3, 9.2_

### Fase 5: Apps y loop de juego

- [ ] 13. `AppConversacion` con identidad por canal
  - `EncabezadoApp` (nombre, avatar, verificado) + variantes de tokens para
    whatsapp, sms, discord y chat-juego; reescribir `Burbuja` (mismo algoritmo
    de resaltado), `BarraDecision`, `TarjetaFeedback`, `ChatEstafador` y `Hud`
    dentro de `src/components/apps/`
  - _Requisitos: 6.1, 6.2, 6.4, 7.1, 7.2, 7.3, 7.4_

- [ ] 14. `AppGmail`
  - Vista de correo: remitente con dirección, asunto y cuerpo; decisión y
    feedback dentro de la misma vista
  - _Requisitos: 6.3, 7.1, 7.2_

- [ ] 15. Recablear `App.tsx` y retirar la UI vieja
  - `useReducer(maquina)` + tabla de sincronización del design; volver al home
    tras `siguiente()`; resultado a pantalla completa dentro del teléfono;
    eliminar `MarcoTelefono` y `PantallaInicio`
  - `npm run test` en verde sin tocar los tests existentes
  - _Requisitos: 5.4, 5.5, 7.5, 10.1, 10.2, 10.3_

### Fase 6: Verificación y pulido

- [ ] 16. Pasada de accesibilidad
  - Partida completa solo con teclado (encender → desbloquear → notificación
    → decidir → resultado); contraste AA en cada app; foco visible
  - _Requisitos: 9.1, 9.2, 9.4_

- [ ] 17*. Presupuesto de bundle
  - `npm run build`; si pasa de 200 KB gzip, revisar qué entró
  - _Requisitos: 9.5_

- [ ] 18*. Pulido de animaciones
  - Llegada del banner, apertura de app; todo tras `prefers-reduced-motion`
  - _Requisitos: 9.3_
