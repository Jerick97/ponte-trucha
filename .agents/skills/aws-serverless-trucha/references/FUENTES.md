# Procedencia

Skill adaptada el 23 de julio de 2026 para Terraform + Python + privacidad
infantil a partir de:

- AWS Labs Agent Plugins, plugin `aws-serverless`, skills `aws-lambda` y
  `api-gateway`.
- Repositorio: https://github.com/awslabs/agent-plugins
- Commit auditado: `bc78579b3d65d590de8a3f3abef4b23e72ff9e59`
- Licencia: Apache-2.0.
- Catálogo compatible con Kiro:
  https://docs.aws.amazon.com/agent-toolkit/latest/userguide/aws-cli.html

No se copió el plugin completo porque su configuración genérica habilita MCP de
escritura y prioriza CDK/TypeScript. Esta variante conserva los controles
relevantes y fija el stack decidido por el proyecto.

Antes de recomendar runtimes, precios o retención, consultar documentación AWS
actual:

- https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
- https://docs.aws.amazon.com/powertools/python/latest/
- https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html
- https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html
- https://aws.amazon.com/free/

