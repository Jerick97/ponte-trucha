---
name: terraform-trucha
description: Genera, revisa y prueba Terraform para Ponte Trucha Kids siguiendo estilo oficial de HashiCorp, terraform test, mocks, mínimo privilegio y controles de costo. Úsala al crear módulos, variables, outputs, tests .tftest.hcl, CI de infraestructura, planes o revisiones de IaC.
---

# Terraform Trucha

Aplicar las convenciones oficiales de HashiCorp dentro de las decisiones del
proyecto.

## Contexto obligatorio

Leer:

- `.kiro/steering/arquitectura.md`
- `.kiro/steering/estandares-de-codigo.md`
- `.kiro/steering/seguridad-infantil.md`
- diseño/tareas de la spec activa
- `infra/README.md`

## Flujo TDD de infraestructura

1. Definir comportamiento, inputs, outputs, IAM, costo y lifecycle.
2. Escribir `.tftest.hcl` antes del recurso/módulo.
3. Preferir `mock_provider` y `command = plan`.
4. Implementar el mínimo.
5. Ejecutar `fmt`, `validate` y `test`.
6. Revisar plan y políticas antes de cualquier apply.

`terraform test` usa `apply` por defecto en ciertos casos y puede crear
recursos. Usar mocks/plan salvo que una prueba de integración autorizada lo
requiera.

## Organización

```text
terraform.tf    # required_version y required_providers
providers.tf    # providers y aliases
main.tf         # recursos/data sources
variables.tf    # alfabéticas, tipadas, descritas y validadas
outputs.tf      # alfabéticos, descritos y sensitive cuando aplique
locals.tf       # solo si mejora lectura
tests/*.tftest.hcl
```

- Dos espacios; `terraform fmt`.
- Nombres descriptivos en `snake_case`.
- Ordenar argumentos antes de bloques.
- Evitar dependencias implícitas difíciles de ver.
- Versionar Terraform/providers; no fijar una versión exacta sin motivo.
- Módulos pequeños por capacidad, no un módulo universal.
- Outputs solo si otro módulo, CI u operador los necesita.

## Seguridad

- IAM mínimo por Lambda. Evitar `Action = "*"` y `Resource = "*"`.
- S3 con block public access, cifrado y acceso por OAC.
- API protegida por JWT/scopes; CORS por ambiente.
- DynamoDB cifrado, PITR según ambiente y TTL donde aplique.
- CloudWatch con retención explícita.
- Secrets no entran en tfvars versionados, state, plan público ni outputs.
- State remoto/cifrado/bloqueado se define mediante ADR/bootstrap.
- No interpolar PII, token o payload en nombres, tags, logs o alarmas.
- `prevent_destroy` no reemplaza backups/rollback y puede bloquear teardown;
  usarlo solo con decisión explícita.

## Costo

Cada recurso nuevo debe documentar:

- por qué es necesario;
- unidad facturable y límites;
- free tier/créditos aplicables a la cuenta real;
- alarma/kill switch;
- forma de borrarlo.

Rechazar EC2, RDS, VPC/NAT, provisioned concurrency o servicios de costo fijo si
la spec no contiene un ADR aprobado.

## Tests mínimos por módulo

- nombres/tags requeridos;
- cifrado y bloqueo público;
- IAM sin wildcards indebidos;
- CORS/orígenes correctos;
- runtimes, timeout, memory y concurrency;
- TTL/retención;
- alarmas y presupuesto;
- outputs sensibles;
- diferencias `dev`/`prod`.

No verificar solo que “el recurso existe”; afirmar la propiedad de seguridad o
comportamiento requerida.

## Apply y destrucción

No ejecutar `apply`, `destroy`, import ni state surgery sin petición explícita.
Para un apply autorizado: confirmar cuenta, región, workspace/ambiente, plan
guardado y costo. Para destroy: resolver targets exactos y explicar recuperación.

## Fuentes

Leer `references/FUENTES.md` para procedencia y documentación oficial.

