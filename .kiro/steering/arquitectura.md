# Arquitectura de Ponte Trucha Kids

> Steering global. Explica **dónde va cada cosa** y por qué. Antes de crear un
> archivo nuevo, ubícalo en este mapa.

## Principio rector

**Todo lo que puede correr en el navegador, corre en el navegador.**
El backend existe únicamente porque algunos navegadores no soportan la Prompt
API. Esta decisión es lo que hace el proyecto barato (free tier), rápido
(sin latencia de red) y seguro para menores (nada del niño sale del dispositivo).

## Árbol de carpetas

```
ponte-trucha/
├── .kiro/                       # Todo lo que Kiro usa para construir el proyecto
│   ├── settings/
│   │   ├── project.json         # Metadatos, stack, equipo y owners
│   │   └── mcp.json             # Servidores MCP (docs y diagramas de AWS)
│   ├── steering/                # Guías que Kiro aplica SIEMPRE
│   │   ├── estandares-de-codigo.md
│   │   ├── arquitectura.md      # (este archivo)
│   │   ├── tono-infantil.md     # Cómo se le habla a un niño de 8 a 13
│   │   └── seguridad-infantil.md# Límites innegociables del producto
│   ├── specs/                   # Una carpeta por feature
│   │   └── <feature>/
│   │       ├── requirements.md  # QUÉ, en formato EARS (CUANDO/ENTONCES/DEBERÁ)
│   │       ├── design.md        # CÓMO, con interfaces y diagramas
│   │       └── tasks.md         # PASOS, checklist enlazada a requisitos
│   ├── hooks/                   # Automatizaciones (*.kiro.hook)
│   └── docs/                    # Documentación operativa del equipo
│
├── src/
│   ├── components/              # [Jerick] Presentación pura. Sin reglas de juego.
│   ├── game/                    # [Clau]   Lógica pura del juego. Sin React ni DOM.
│   ├── llm/                     # [Francis] Estafador conversacional
│   ├── data/                    # [Clau]   Banco de escenarios + esquema
│   ├── store/                   # [compartido] Orquestación con zustand
│   ├── types/                   # [compartido] Contratos entre las tres áreas
│   ├── test/                    # Pruebas Vitest
│   ├── App.tsx                  # Máquina de fases: decide qué pantalla se ve
│   ├── main.tsx                 # Punto de entrada
│   └── index.css                # Design tokens (@theme) y estilos base
│
├── infra/
│   ├── lambda/estafador/        # [Francis] Fallback del LLM
│   └── README.md                # Despliegue y reglas de seguridad
│
├── scripts/
│   └── validar-escenarios.mjs   # Validador del banco (lo corre un hook)
│
└── docs/                        # Guion del video, capturas, diagrama
```

## Reglas de dependencia entre capas

Las flechas indican quién puede importar a quién. Lo que no aparece, está prohibido.

```
components ──> types
           ──> game (solo tipos y funciones puras de presentación)

store ──> game, llm, data, types

llm ──> types
    ──> (red / Prompt API)

game ──> types          # y NADA más: es la capa pura

data ──> (nada, es JSON)
```

Consecuencias prácticas:

- Un componente **nunca** llama a `fetch` ni a `obtenerProveedor()`. Pide un
  callback por props y el store decide.
- `src/game/` no importa React. Si un test necesita jsdom para probar el motor,
  algo se filtró donde no debía.
- Si `src/llm/` necesita saber de puntaje, la responsabilidad está mal repartida.

## Flujo de una partida

```
PantallaInicio
   │ iniciar()
   ▼
armarRonda(banco)         ← src/game/motor.ts (puro, determinista si se inyecta aleatorio)
   │
   ▼
fase 'mensaje'  ── el niño ve la burbuja y decide ──► responder(estado, escenario, veredicto)
   │                                                        │
   ▼                                                        ▼
fase 'feedback' ── resalta señales + lección ──► ¿permiteConversacion?
   │                                                  │ sí
   │                                                  ▼
   │                                          fase 'chat'
   │                                                  │
   │                                          obtenerProveedor()
   │                                            ├─ Prompt API on-device   (plan A)
   │                                            ├─ Lambda + Mistral       (plan B)
   │                                            └─ guion local            (último recurso)
   │                                                  │
   │                                          filtrarRespuesta()  ← guardrails, SIEMPRE
   ▼
siguiente() … hasta agotar la ronda ──► fase 'resultado' ──► calcularNivel()
```

## Decisiones tomadas y por qué

| Decisión | Motivo |
|---|---|
| React + Vite, no Nuxt | El equipo ya sabe React; el build estático es idéntico para S3 |
| Zustand, no Context | Menos boilerplate y re-renders selectivos; el juego se juega en móvil |
| Escenarios en JSON estático, no en base de datos | Costo cero, cero latencia, y el contenido se versiona en git |
| Guardrails en cliente **y** en Lambda | Dos capas independientes: si el prompt falla, el filtro corta igual |
| Sin login ni persistencia remota en el MVP | Es producto para menores; menos datos es mejor producto |

## Qué NO se hace en este MVP

Fuera de alcance por decisión, no por falta de tiempo (así se cuenta en el video):
dificultad adaptativa, leaderboard, generación semanal de escenarios y modo docente.
Van en la sección de roadmap del README y del video.
