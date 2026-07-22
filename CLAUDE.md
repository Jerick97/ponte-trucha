# Ponte Trucha Kids — instrucciones para el agente

Web app donde niños de 8 a 13 años practican a detectar estafas digitales en un
teléfono simulado, con un estafador conversacional que corre **on-device**.
Proyecto del Hackathon Kiro + AWS (Código Facilito). Equipo: Jerick (frontend),
Francis (backend/AWS), Clau (PM y contenido).

## Reglas de oro

1. **Responde en español.** Comentarios, commits y documentación en español.
2. **Las fuentes de verdad son `.kiro/steering/`.** Antes de cambiar algo, revisa:
   - `estandares-de-codigo.md` — convenciones
   - `arquitectura.md` — dónde va cada cosa y qué puede importar qué
   - `tono-infantil.md` — cómo se le habla a un niño
   - `seguridad-infantil.md` — límites innegociables del producto
3. **No inventes alcance.** Lo que hay que hacer está en `.kiro/specs/*/tasks.md`.
   Si algo no está ahí, propónlo antes de construirlo.
4. **Es un producto para menores.** Cero recolección de datos, cero API keys en
   el cliente, guardrails intactos. Ante la duda, la opción más conservadora.
5. **No agregues dependencias** sin acuerdo del equipo.

## Flujo de trabajo (spec-driven, como manda Kiro)

```
requirements.md  (QUÉ, en formato EARS)
      ↓
design.md        (CÓMO, interfaces y decisiones)
      ↓
tasks.md         (PASOS, checklist enlazada a requisitos)
      ↓
código
```

Al terminar una tarea: márcala `[x]` en el `tasks.md` correspondiente y di a
quién del equipo le toca el siguiente paso.

## Reparto de propiedad

| Área | Owner | Carpetas |
|---|---|---|
| UI y experiencia | Jerick | `src/components/`, `src/index.css`, `index.html` |
| LLM e infraestructura | Francis | `src/llm/`, `infra/` |
| Contenido y reglas de juego | Clau | `src/data/`, `src/game/`, `.kiro/steering/tono-infantil.md` |
| Compartido (avisar antes de tocar) | — | `src/types/`, `src/store/`, `src/App.tsx` |

Si un cambio toca la carpeta de otra persona, dilo explícitamente en el resumen.

## Skills del proyecto

Viven en `.claude/skills/` (y espejadas en `.kiro/skills/` para Kiro):

| Skill | Cuándo |
|---|---|
| `escenario-trucha` | Crear, revisar o corregir escenarios del banco |
| `pantalla-trucha` | Construir o modificar UI del juego |
| `deploy-trucha` | Desplegar a AWS o diagnosticar el despliegue |

Si copias las skills a `.kiro/skills/`, recuerda mantener ambas copias
sincronizadas: `cp -r .claude/skills/* .kiro/skills/`.

## Skills globales que aplican aquí

| Tarea | Skill a cargar |
|---|---|
| Diseño visual de pantallas | `frontend-design`, `ui-ux-pro-max` |
| Accesibilidad (foco, contraste, teclado) | `accessibility` |
| Rendimiento y peso del bundle | `core-web-vitals`, `performance` |
| Patrones React modernos | `vercel-react-best-practices` |
| Diagrama de arquitectura | `mermaid-diagrams` |
| Pruebas primero | `tdd` |
| Revisión de seguridad antes de entregar | `cyber-neo`, `insecure-defaults` |
| Segunda opinión sobre un cambio grande | `second-opinion` |
| Edición del video de 3 minutos | `video-use` |
| Slides del pitch | `pptx` |

## Comandos

```bash
npm run dev                  # desarrollo
npm run lint                 # ESLint
npm run test                 # Vitest (lógica pura y guardrails)
npm run validar:escenarios   # valida el banco de contenido
npm run build                # build estático para S3
```

## Verificación antes de dar algo por terminado

- Tocaste `src/data/` → `npm run validar:escenarios`
- Tocaste `src/game/` o `src/llm/` → `npm run test`
- Tocaste cualquier `.ts`/`.tsx` → `npm run lint`
- Tocaste UI → además `npm run build` y describe qué debería verse distinto

No afirmes que algo funciona sin haberlo ejecutado. Si un comando falla, muestra
la salida; no lo maquilles.
