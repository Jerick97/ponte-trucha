# Plan UI pendiente — acuerdos de la reunión (23-jul-2026)

Documento de planeación de Jerick para no perder lo acordado en la reunión de
equipo y lo que pidió Claudia. Se retoma al terminar la UI de Roblox.
Nada de esto se construye sin pasar antes por su spec/tasks correspondiente.

## Orden de trabajo

1. **UI de Roblox (chat-juego)** — en curso, rama `feature/app-roblox`.
2. **UI de Gmail (correo)** — última app del teléfono (tarea 14 de
   `interfaz-telefono`).
3. **Flujo del padre/tutor** — login, registro y dashboard (nuevo).
4. **Mejoras de juego pedidas por Claudia** — feedback y progresión (nuevo).

## 3. Flujo del padre/tutor

Decisión de la reunión: **sí habrá login, pero solo del padre/tutor**. El
teléfono simulado recién carga después de este flujo.

Pantallas a construir (todas en **tono adulto**, ver sección "Dos audiencias"
de `tono-infantil.md`):

- [ ] **Registro / login del padre** — contra Cognito. Depende de la spec
      `autenticacion-consentimiento-parental` de Francis (age gate con fecha
      en memoria, consentimientos separados, sin dark patterns). La sesión
      exacta (Hosted UI + PKCE vs UI propia) es el ADR-002, aún abierto:
      no construir el manejo de tokens hasta que Francis lo cierre.
- [ ] **Registro de hijos** — crear perfil por hijo con **nickname (alias)**,
      avatar de catálogo y banda etaria (8-10 / 11-13). Coincide con el
      `ChildProfile` de la spec de Francis: alias + avatar de catálogo, nunca
      nombre real ni datos del niño.
- [ ] **Dashboard del padre** — visualizar el avance de cada hijo: escenarios
      jugados, aciertos, nivel, racha. Los datos vienen de
      `GET /v1/perfiles/{childId}/progreso` cuando exista; mientras tanto se
      puede construir la UI con datos mock para no bloquearse.
- [ ] **Selección de perfil → teléfono** — al elegir el hijo que va a jugar,
      recién se muestra el teléfono simulado actual.

Coordinación: esto es la **tarea 9** de la spec de auth ("toca UI de Jerick y
estado compartido; avisar antes"). El estado de sesión/perfil activo tocará
`src/store/` y `src/App.tsx` (carpetas compartidas — avisar al equipo).

## 4. Mejoras de juego (pedidas por Claudia)

- [ ] **Confeti al acertar** — animación al responder bien. Respetar
      `prefers-reduced-motion` (ya es patrón del proyecto). Sin dependencias
      nuevas sin acuerdo: evaluar hacerlo con CSS/canvas propio.
- [ ] **Popup de puntaje** — mostrar los puntos ganados en un popup al
      responder (hoy los puntos solo se ven en el HUD y la tarjeta de
      feedback).
- [ ] **Niveles según escenarios completados** — progresión visible por
      niveles. Hoy existe `nivelFinal()` en el store (nivel al terminar la
      partida); esto lo convertiría en progresión continua. Toca `src/game/`
      → coordinar con Clau, y reconciliar con el backend autoritativo de
      Francis (el PRD dice que el servidor calculará puntos y nivel).
- [ ] **Bonus por racha al responder la siguiente** — ojo: el motor actual
      **ya tiene** bonus de racha (`100 + min(racha×25, 100)` + bonus de
      velocidad, fórmula del RFC v2). Aclarar con Claudia si pide una mecánica
      nueva (p. ej. bonus extra por encadenar respuestas rápidas) o hacer
      **visible** el bonus existente (que hoy no se muestra desglosado).
      Cualquier cambio de fórmula pasa por Clau y por el contrato de score
      del backend (tarea 24 de Francis).

## Dependencias y riesgos

- El flujo del padre depende de que Francis avance Cognito + API; la UI se
  puede adelantar con mocks, pero la integración real espera las tareas 9
  (auth) y 23-24 (cliente OpenAPI + loop remoto).
- Confeti y popup son puramente frontend: se pueden hacer apenas termine
  Roblox, sin esperar backend.
- Niveles y bonus tocan reglas de juego (`src/game/` es de Clau) y el futuro
  score del servidor: definir la fórmula una sola vez, en equipo.
