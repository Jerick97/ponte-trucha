<div align="center">

# 🐟 Ponte Trucha Kids

**El juego que le enseña a los niños a no caer en estafas digitales**

Hackathon Kiro + AWS · Código Facilito · Vertical: Aplicaciones web

[Demo](#) · [Video (3 min)](#) · [Arquitectura](#arquitectura)

</div>

---

## Qué es

Existen niños de 8 a 13 años que hoy sufren estafas dentro de sus videojuegos
—Robux gratis, sorteos falsos, robo de cuentas— y se defienden solos, sin
herramientas a su medida.

**Ponte Trucha Kids** es una web app donde practican a detectar esas trampas en
un teléfono simulado, con un **estafador conversacional que corre en su propio
dispositivo**. Cada partida es distinta, se juega en segundos y enseña con la
emoción de un juego, no con el miedo de una charla.

## Cómo se juega

1. La pantalla simula un teléfono. Llegan mensajes del chat del juego, WhatsApp,
   SMS o Discord.
2. El niño decide: **¿trampa o de confianza?**
3. Al responder, el juego **resalta las señales** que delataban la estafa y
   explica la lección en lenguaje de niño.
4. Se mezclan estafas con mensajes legítimos reales: el objetivo es que aprendan
   a **distinguir**, no a desconfiar de todo.
5. Al final: racha, puntaje y un **nivel de trucha** compartible.

### El momento wow

Tras el mensaje inicial, el niño puede **responderle al estafador**. Un LLM
improvisa como lo haría uno real: presiona, mete prisa, insiste. Vive la presión
de la estafa sin riesgo y aprende a cortarla. Ninguna herramienta estática puede
hacer esto.

## Por qué es innovador

| | |
|---|---|
| 🔒 **LLM on-device** | El estafador corre con la Prompt API de Chrome (Gemini Nano) **en el navegador del niño**. Cero latencia, cero costo por token, cero datos saliendo del dispositivo. |
| 🛡️ **Seguridad por diseño** | Cubre estafas y fraudes; **nunca** simula acoso ni manipulación personal. Doble capa de contención: prompt acotado + filtro de salida. |
| 🇵🇪 **Hecho para Latam** | Español latino neutro, con las estafas que existen de verdad en Roblox, Free Fire y Discord. |
| 💸 **Costo cero** | Sitio estático en S3 + CloudFront y una Lambda de fallback. Todo dentro del free tier. |

---

## Arquitectura

```
                    ┌──────────────────────────────┐
                    │   Navegador del niño         │
                    │  ┌────────────────────────┐  │
                    │  │ Gemini Nano on-device  │  │  ← plan A: nada sale de aquí
                    │  └────────────────────────┘  │
                    └───────┬──────────────┬───────┘
                            │ HTTPS        │ solo si no hay plan A
                            ▼              ▼
                  ┌──────────────┐   ┌──────────────────┐
                  │  CloudFront  │   │ Lambda Function  │
                  │  (OAC, TLS)  │   │ URL (nodejs22.x) │
                  └──────┬───────┘   └────────┬─────────┘
                         ▼                    ▼
                  ┌──────────────┐   ┌──────────────────┐
                  │  S3 privado  │   │  API de Mistral  │
                  └──────────────┘   └──────────────────┘
```

**Stack:** React 18 · TypeScript · Vite 6 · Tailwind 4 · Zustand · Vitest
**AWS:** S3 · CloudFront · Lambda

Detalle completo en [`.kiro/steering/arquitectura.md`](.kiro/steering/arquitectura.md).

## Estructura del proyecto

```
ponte-trucha/
├── .kiro/                    # Todo lo que Kiro usa para construir el proyecto
│   ├── specs/                #   4 features: requirements + design + tasks
│   ├── steering/             #   Guías que Kiro aplica siempre
│   ├── hooks/                #   Automatizaciones (validación, tono, seguridad)
│   ├── skills/               #   Skills propias del proyecto
│   ├── settings/             #   Metadatos del proyecto y MCP de AWS
│   └── docs/                 #   Plan de 7 días, guion del video, despliegue
├── src/
│   ├── components/           # UI pura, sin reglas de juego
│   ├── game/                 # Lógica pura: puntaje, rondas, nivel de trucha
│   ├── llm/                  # Estafador: proveedores, prompts, guardrails
│   ├── data/                 # Banco de escenarios + esquema JSON
│   ├── store/                # Orquestación (zustand)
│   ├── types/                # Contratos compartidos
│   └── test/                 # Vitest
├── infra/lambda/estafador/   # Fallback del LLM
└── scripts/                  # Validador del banco de escenarios
```

---

## Cómo lo construimos con Kiro

Este proyecto se desarrolla **spec-driven**: no se escribe código hasta que el
requisito está escrito.

```
requirements.md  →  design.md  →  tasks.md  →  código
   (EARS)            (cómo)       (checklist)
```

### Specs

| Spec | Qué cubre | Owner |
|---|---|---|
| [`loop-de-juego`](.kiro/specs/loop-de-juego/) | Teléfono simulado, decisión, feedback, puntaje, nivel | Jerick |
| [`banco-escenarios`](.kiro/specs/banco-escenarios/) | Contenido, esquema y pipeline de validación | Clau |
| [`estafador-conversacional`](.kiro/specs/estafador-conversacional/) | LLM on-device, fallback y guardrails | Francis |
| [`despliegue-aws`](.kiro/specs/despliegue-aws/) | S3, CloudFront, Lambda y entregables | Francis |

### Steering

Reglas que Kiro aplica en cada edición, sin repetirlas en cada prompt:
[estándares de código](.kiro/steering/estandares-de-codigo.md) ·
[arquitectura](.kiro/steering/arquitectura.md) ·
[tono infantil](.kiro/steering/tono-infantil.md) ·
[seguridad infantil](.kiro/steering/seguridad-infantil.md)

### Hooks

| Hook | Cuándo dispara | Qué hace |
|---|---|---|
| `validar-escenarios` | Se edita el banco | Corre el validador de contenido |
| `revisar-tono-infantil` | Se escribe texto visible | Verifica el steering de tono antes de guardar |
| `guardrails-intactos` | Se toca el prompt o el filtro del LLM | Bloquea cambios que debiliten la contención |
| `lint-y-test-al-guardar` | Se edita un `.ts`/`.tsx` | ESLint + Vitest |
| `seguridad-secrets` | Antes de un comando de shell | Escanea credenciales expuestas |
| `resumen-al-terminar` | Al completar una tarea | Marca el `tasks.md` y dice a quién le toca seguir |

---

## Cómo dividimos el trabajo

Tres personas, tres capas que casi no se pisan. Cada quien es dueño de sus
carpetas y de sus specs.

### 🎨 Jerick — Frontend y experiencia

**Carpetas:** `src/components/`, `src/index.css`, `index.html`
**Spec:** `loop-de-juego`

- Teléfono simulado y sistema de burbujas con resaltado de señales
- Máquina de pantallas: inicio → mensaje → feedback → chat → resultado
- Design tokens, tratamiento visual por canal (WhatsApp, Discord, SMS…)
- Accesibilidad, responsive móvil y peso del bundle
- Capturas y GIF para el README

**Por qué:** es la cara del producto y lo que se ve durante 90 segundos del
video. El pulido visual es lo que separa un demo de hackathon de un producto.

### ⚙️ Francis — Backend, LLM y AWS

**Carpetas:** `src/llm/`, `infra/`
**Specs:** `estafador-conversacional`, `despliegue-aws`

- Capa LLM: Prompt API on-device (plan A) + Lambda con Mistral (plan B)
- Guardrails de seguridad infantil sobre la salida del modelo
- S3 + CloudFront con OAC, script de despliegue, control de costos
- Diagrama de arquitectura y revisión de seguridad final

**Por qué:** es la parte de arquitectura pura y la que sostiene los criterios de
innovación (30 %) y uso de AWS (10 %).

### 🎯 Clau — PM, contenido y lógica de negocio

**Carpetas:** `src/data/`, `src/game/`
**Spec:** `banco-escenarios`

- Banco de ~20 escenarios: las estafas reales del mundo gamer, en voz de niño
- Reglas del juego: puntaje, rachas, cortes del nivel de trucha
- Tono infantil y límites de seguridad del producto (steering)
- Guion del video, narrativa del pitch y coordinación del plan de 7 días
- Playtest con un niño real antes de la entrega

**Por qué:** el contenido **es** el producto. Y las dinámicas de juego —qué
premia, qué castiga, cómo se siente fallar— definen si un niño aprende o se
frustra.

### Zonas compartidas

`src/types/`, `src/store/` y `src/App.tsx` los toca cualquiera, pero **se avisa
antes**. Son el pegamento entre las tres capas.

Plan día por día: [`.kiro/docs/plan-7-dias.md`](.kiro/docs/plan-7-dias.md).

---

## Empezar

```bash
npm install
cp .env.example .env.local
npm run dev
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build estático para S3 |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (lógica pura y guardrails) |
| `npm run validar:escenarios` | Valida el banco de contenido |

Guía completa: [`.kiro/docs/primeros-pasos.md`](.kiro/docs/primeros-pasos.md).

---

## Seguridad infantil

Es un producto para menores, así que los límites son explícitos y son una
fortaleza del diseño, no una limitación:

- El juego cubre **estafas y fraudes**; nunca simula acosadores ni manipulación
  personal.
- El LLM corre **on-device**: ningún dato del niño sale del navegador.
- **Sin login, sin nombre, sin correo, sin analítica.** Nada que recolectar.
- Doble capa de contención: prompt acotado + filtro de salida independiente.
- El estafador **se rinde** si el niño se niega o dice que le contará a un adulto:
  enseñamos que cortar funciona.

Detalle en [`.kiro/steering/seguridad-infantil.md`](.kiro/steering/seguridad-infantil.md).

## Roadmap (fuera del MVP)

Dificultad adaptativa · Leaderboard · Generación semanal de escenarios con Kiro ·
Modo para docentes

---

<div align="center">

**Ponernos trucha desde niños, para no caer de grandes.**

</div>
