# Setup propuesto — backend, IaC y Kiro

**Estado:** decisión de tooling; no instala dependencias ni crea recursos.

## Recomendación

Usar una pirámide local, no intentar que un emulador sustituya AWS:

1. Python/pytest sin AWS para dominio y casos de uso.
2. Adapters con mocks/fakes y contract tests.
3. **Floci** para integraciones locales de DynamoDB, Cognito, API Gateway v2,
   Lambda y S3.
4. Runtime local de FastAPI con Uvicorn para ciclos HTTP rápidos.
5. AWS SAM CLI solo cuando se necesite fidelidad del runtime Lambda/container.
6. Cuenta AWS `dev` para las pocas pruebas de integración que validen diferencias
   reales.

## Floci

Floci es una opción razonable para este hackathon porque es MIT, no exige token
y declara soporte para los servicios que usamos. Sin embargo, es un proyecto
joven: se adopta como **acelerador**, no como prueba de compatibilidad total.

Decisiones:

- pin de versión/digest, nunca `latest` en CI;
- modo `memory` para tests y `hybrid` opcional para desarrollo;
- credenciales locales ficticias, aisladas de credenciales AWS reales;
- endpoint local solo en configuración `dev/test`;
- contract/integration tests críticos también corren contra AWS `dev`;
- no evaluar seguridad IAM real únicamente con el emulador;
- no confiar en emulación para costos, quotas, Cognito Hosted UI, CloudFront,
  retención Bedrock o semántica exacta de API Gateway.

No agregar `compose.yaml` ni Floci hasta que la tarea de setup sea aprobada,
porque sería una dependencia/tooling nueva.

Referencias:

- [Floci GitHub](https://github.com/floci-io/floci)
- [Servicios soportados](https://floci.io/floci/services/)
- [AWS: guía de pruebas de Lambda](https://docs.aws.amazon.com/lambda/latest/dg/testing-guide.html)

## Herramientas objetivo

| Área | Herramienta | Decisión |
|---|---|---|
| Python | `uv` o Poetry | preferir `uv`; cerrar con ADR antes de instalar |
| API local | FastAPI + Uvicorn | ciclo rápido y OpenAPI |
| Lambda | AWS Lambda Web Adapter | documentar en ADR frente a Mangum; spike solo si hay riesgo |
| Unit/contract | pytest | TDD |
| Lint/format | Ruff | una herramienta |
| Tipos | mypy o pyright | elegir una, no ambas inicialmente |
| AWS local | Floci + Docker | integración, no paridad |
| Runtime Lambda | SAM CLI | selectivo |
| IaC | Terraform | source of truth |
| API docs | OpenAPI 3.1 + Scalar | Scalar interno/opcional |
| AWS CLI | AWS CLI v2 | diagnóstico y bootstrap, no infraestructura manual |

## MCP, CLI y skills

### Kiro MCP

`.kiro/settings/mcp.json` mantiene `aws-docs` habilitado para consultas
read-only. `aws-iac` y `aws-billing` siguen deshabilitados hasta revisar:

- permisos/credenciales;
- operaciones de escritura;
- costo;
- necesidad concreta frente a Terraform/CLI.

No habilitar un MCP con escritura “por si acaso”.

### Skills

Usar:

- `aws-serverless-trucha` para arquitectura/servicios;
- `terraform-trucha` para HCL/tests;
- `seguridad-serverless-trucha` antes de entregar;
- skills existentes del proyecto para contenido/UI/deploy legado.

### CLI

Terraform es quien muta infraestructura. AWS CLI se reserva para:

- comprobar identidad/región;
- consultar recursos/logs;
- bootstrap aprobado del backend de state;
- smoke tests o recuperación documentada.

No crear recursos manualmente que luego Terraform no pueda gobernar.

## Credenciales

- Perfiles separados `ponte-trucha-dev` y `ponte-trucha-prod`.
- Preferir credenciales temporales/SSO.
- Nunca exportar credenciales reales al shell que ejecuta Floci.
- `.env.local` solo cliente público/configuración no secreta.
- DSN/token de proveedores en secretos de backend/CI.
- `terraform plan` puede contener secretos si se modelan mal: tratarlo como
  artifact sensible.

## Secuencia cuando Kiro implemente

1. ADR de package manager, empaquetado de Web Adapter y sesión.
2. Crear estructura Python.
3. Primer test rojo de dominio.
4. CI de pytest/Ruff/tipos.
5. Terraform fmt/validate/test con mocks.
6. Floci fijado y tests de adapters.
7. OpenAPI + contract tests.
8. AWS `dev` y pruebas selectivas.

## Condición de salida

El setup queda aceptado cuando una persona nueva puede:

- ejecutar tests unitarios sin AWS/Docker;
- ejecutar integraciones locales con un comando documentado;
- validar Terraform sin aplicar;
- levantar FastAPI y abrir OpenAPI local;
- desplegar a `dev` solo mediante un plan revisado.
