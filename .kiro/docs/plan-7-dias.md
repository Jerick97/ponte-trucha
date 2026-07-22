# Plan de 7 días

Basado en el plan del brief, con owners asignados. Las noches son de trabajo
corto (2-3 h); el sábado y el domingo son los bloques largos.

## Días 1-2 (noches) — Cimientos

| Quién | Qué | Entregable |
|---|---|---|
| Todos | Revisar `.kiro/specs/` y ajustar los requisitos que no compartan | Specs aprobadas |
| Jerick | Esqueleto de la app, tokens, `MarcoTelefono`, `Burbuja` | Un mensaje se ve en pantalla |
| Francis | Contrato de proveedores LLM, prompts y guardrails + pruebas | `npm run test` en verde |
| Clau | Esquema del banco, validador y 8 escenarios semilla | `npm run validar:escenarios` en verde |

**Cierre del día 2:** el juego muestra un mensaje real del banco.

## Días 3-4 (noches) — Loop completo y deploy temprano

| Quién | Qué | Entregable |
|---|---|---|
| Jerick | `BarraDecision`, `TarjetaFeedback`, `Hud`, máquina de fases | Partida completa jugable con contenido estático |
| Francis | Bucket S3, CloudFront con OAC, script de despliegue | **URL pública viva** |
| Clau | Escenarios 9 a 16, balance de dificultad y canales | 16 escenarios validados |

**Regla del brief:** el deploy no se deja para el final. Si el día 4 no hay URL
pública, se para todo lo demás hasta que la haya.

## Día 5 (noche) — El momento wow

| Quién | Qué | Entregable |
|---|---|---|
| Francis | Prompt API on-device + Lambda desplegada + selector | El niño le responde al estafador |
| Jerick | UI del chat, indicador "escribiendo…", rachas visibles | Chat pulido |
| Clau | Perfiles de estafador de los escenarios conversacionales | Personajes con carácter |

**Cierre del día 5:** funciona el estafador conversacional en la URL pública.

## Sábado — Pulido

- Jerick: que se sienta mensajería real (canales, transiciones, sonidos),
  pantalla de resultado compartible, pasada de accesibilidad.
- Clau: escenarios 17 a 20, pasada de tono sobre todo el banco, playtest con un
  niño real.
- Francis: revisión de seguridad, CORS al dominio final, costo en USD 0,
  diagrama de arquitectura.

**Cierre del sábado:** producto terminado. El domingo no se programa.

## Domingo — Entregables

- Clau: guion y grabación del video de 3 minutos (ver `guion-video.md`).
- Jerick: capturas y GIF del juego para el README.
- Francis: diagrama final, README revisado, prueba de la URL desde un
  dispositivo ajeno al equipo.

**Antes de entregar, checklist de `.kiro/specs/despliegue-aws/requirements.md`
requisito 4.**

## Rituales

- **Daily de 10 minutos** por chat, cada noche antes de empezar: qué hice, qué
  sigue, qué me bloquea.
- **Nadie edita la carpeta de otro sin avisar.** Los archivos compartidos
  (`src/types/`, `src/store/`, `src/App.tsx`) se avisan siempre.
- **Commits pequeños y en español.** Rama por feature, merge a `main` cuando la
  URL pública sigue funcionando.
