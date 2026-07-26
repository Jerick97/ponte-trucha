# ADR-006 — Nova Lite con retención cero y activación diferida

- **Estado:** aceptado
- **Fecha:** 2026-07-25
- **Owner:** Francis
- **Requisitos:** backend-serverless R3, R6 y R8

## Contexto

ADR-005 dejó Bedrock apagado hasta demostrar una configuración compatible con
la privacidad infantil. El adapter y los guardrails ya pueden implementarse y
probarse sin invocar AWS, pero habilitar el servicio genera consumo y requiere
mantener el límite de permisos entre `api-core` y `api-ia`.

## Evidencia verificada

En el perfil operativo `ponte-trucha`, región `us-east-1`:

- `amazon.nova-lite-v1:0` aparece activo;
- `GetAccountDataRetention` devuelve `mode: none`;
- `GetModelInvocationLoggingConfiguration` no devuelve una configuración de
  logging;
- una invocación mínima y desidentificada mediante `Converse` respondió bajo
  esa configuración.

La evidencia no contiene IDs de cuenta, prompts de usuarios ni respuestas de
niños.

## Decisión

El adapter usa `amazon.nova-lite-v1:0` y recibe únicamente canal, banda etaria,
dificultad y veredicto. Su salida es un candidato: solo puede reemplazar el
contenido curado si pasa la cadena completa de guardrails.

Bedrock permanece deshabilitado por defecto y sin permisos
`bedrock:InvokeModel` en Terraform porque el equipo no dispone de créditos. El
loop continúa funcionando únicamente con el banco curado.

La extensión en `IssueNextChallenge` depende del puerto `ScenarioGenerator`, no
del SDK de AWS. El adapter concreto de Bedrock no se conecta a `api-core`;
cuando exista aprobación de costo, la integración deberá conservar el límite
de permisos en `api-ia`.

## Condiciones para habilitarlo después

1. Aprobar un presupuesto y un límite de uso.
2. Revalidar `mode: none` y ausencia de model invocation logging.
3. Mantener un kill switch apagado por defecto.
4. Diseñar y probar la comunicación `api-core` → `api-ia` sin enviar identidad
   ni texto libre infantil.
5. Añadir IAM limitado al modelo y únicamente a `api-ia`.
6. Ejecutar pruebas E2E en `dev` y comprobar el fallback curado.

Si cualquiera de estas condiciones falla, Bedrock permanece apagado.
