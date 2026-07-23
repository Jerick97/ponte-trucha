# Estándares de código

Aplican al frontend existente, al backend Python objetivo y a Terraform.
Ninguna dependencia nueva se instala sin acuerdo del equipo y una tarea
aprobada.

## Flujo obligatorio

1. Leer `requirements.md`, `design.md` y `tasks.md` de la feature.
2. Elegir una tarea pequeña y escribir primero la prueba que falla.
3. Implementar el mínimo para pasarla.
4. Refactorizar sin cambiar comportamiento.
5. Ejecutar las verificaciones indicadas por la tarea.
6. Marcar `[x]` únicamente lo que realmente se ejecutó y verificó.

No se acepta “agregar pruebas después” como TDD.

## TypeScript y React

- TypeScript estricto; evitar `any`.
- Componentes funcionales y hooks.
- Props e interfaces con nombres descriptivos.
- Componentes de presentación no importan reglas desde infraestructura.
- La lógica pura permanece en `src/game/` o `src/llm/`.
- Estados remotos deben distinguir `idle`, `loading`, `success` y `error`.
- No guardar tokens, fecha de nacimiento ni consentimiento en `localStorage`.
- Texto visible sigue `tono-infantil.md` o el tono adulto del onboarding.

## Python

- Runtime objetivo: Python 3.14 mientras AWS Lambda lo mantenga soportado.
- FastAPI/Pydantic solo en el borde HTTP; dominio con dataclasses/value objects.
- Type hints completos y `from __future__ import annotations` cuando aplique.
- Nombres de clases y código en inglés; conceptos del dominio pueden conservar
  nombres inequívocos en español si mejoran la conversación del equipo.
- Funciones pequeñas, una responsabilidad, sin estado global mutable.
- Excepciones de dominio propias; no filtrar mensajes internos al cliente.
- No loguear cuerpos, tokens, correos, chat, fecha de nacimiento ni texto del
  escenario.

Herramientas objetivo, sujetas a aprobación al crear el backend:

- `pytest` + `pytest-cov` para TDD y cobertura.
- `ruff` para formato/lint.
- `mypy` o `pyright` para tipos; elegir uno mediante ADR.
- `FastAPI`, `Pydantic` y AWS Lambda Web Adapter.
- `aws-lambda-powertools` para logs, métricas, tracing e idempotencia.

## SOLID aplicado

- **S**: un caso de uso por intención, no “servicios” gigantes.
- **O**: añadir un canal mediante factory/strategy, no editar múltiples
  condicionales.
- **L**: todos los adapters respetan el mismo contrato y sus contract tests.
- **I**: puertos pequeños (`ChallengeRepository`, `AnalyticsPort`), no una
  interfaz universal.
- **D**: los casos de uso dependen de `Protocol`, nunca de boto3 o SDK externos.

## API HTTP

- Base path `/v1`; recursos en plural.
- GET no cambia estado; POST crea/ejecuta; PATCH modifica parcialmente; DELETE
  revoca o elimina.
- JSON `camelCase`; modelos Python internos pueden ser `snake_case`.
- UTC y RFC 3339 para timestamps.
- `application/problem+json` y RFC 9457 para errores.
- `Idempotency-Key` obligatorio en intentos, consentimiento y borrado.
- Paginación por cursor opaco, nunca por scan público de DynamoDB.
- No incluir respuesta correcta en el payload del reto.
- OpenAPI 3.1 debe incluir ejemplos sanitizados, security schemes y errores.

## Pruebas

Pirámide objetivo:

1. Muchas pruebas unitarias del dominio y casos de uso sin AWS.
2. Contract tests para repositories, factories, guardrails y OpenAPI.
3. Integration tests con DynamoDB Local o emulador acordado.
4. Pocas pruebas end-to-end en `dev`.

Cobertura mínima propuesta: 90 % en dominio/guardrails y 80 % en backend total.
La cobertura no reemplaza casos de borde.

Casos obligatorios:

- ownership/IDOR entre dos padres;
- consentimiento ausente, revocado y desactualizado;
- doble envío de un intento;
- reto expirado o ya respondido;
- salida insegura del LLM y fallback curado;
- caída de Mixpanel/Sentry sin afectar respuesta;
- logs y errores sin PII;
- límites de dificultad por banda etaria.

## Terraform

- Ejecutar `terraform fmt -check`, `terraform validate` y `terraform test`.
- Versionar providers y Terraform con restricciones explícitas.
- Módulos pequeños con variables tipadas, descripciones y validaciones.
- IAM de mínimo privilegio; prohibido `Action = "*"` y `Resource = "*"` salvo
  excepción documentada.
- Cifrado, bloqueo de acceso público y logs con retención definida.
- Secrets solo en Secrets Manager/SSM o variables protegidas de CI; nunca en
  state, outputs o repositorio.
- Primero tests con mocks/plan. Un test con `command = apply` requiere revisión
  porque crea recursos y puede generar costo.

## Convenciones de commits y documentación

- Commits y documentación en español.
- Un commit por intención coherente.
- ADR para decisiones costosas de revertir: adapter Lambda, modelo DynamoDB,
  sesión web, proveedor IA y residencia de datos.
- Los diagramas editables y su fuente se versionan junto al diseño.

## Verificación

Frontend:

```bash
npm run lint
npm run test
npm run validar:escenarios
npm run build
```

Backend objetivo:

```bash
ruff check .
ruff format --check .
mypy backend/src
pytest --cov
```

Infra objetivo:

```bash
terraform fmt -check -recursive infra
terraform validate
terraform test
```

Los comandos de backend/infra son contrato del plan; todavía no deben afirmarse
como disponibles hasta que las tareas creen el setup.
