# ADR-001 — Lambda Web Adapter y empaquetado

- **Estado:** aceptado para el MVP
- **Fecha:** 2026-07-24
- **Owner:** Francis
- **Requisitos:** backend-serverless R1 y R8

## Decisión

`api-core` y `api-ia` se desplegarán como archivos ZIP en el runtime gestionado
`python3.14` sobre arquitectura `arm64`. Las aplicaciones HTTP usarán AWS Lambda
Web Adapter y cada ZIP incluirá sus dependencias Python y un script `run.sh`
ejecutable que inicia Uvicorn.

Se usa la capa pública de Lambda Web Adapter para `arm64` en regiones comerciales,
con la versión declarada como variable de infraestructura. En un sandbox Floci no
se adjunta la capa pública: el sandbox valida recursos y contrato de infraestructura,
mientras las pruebas HTTP ejecutan FastAPI directamente.

## Consecuencias

- No se necesita imagen, ECR ni una VPC, evitando componentes y costo iniciales.
- El empaquetado debe construirse en Linux compatible con Lambda antes de un
despliegue real; no se reutilizan artefactos creados para macOS.
- La invocación de Lambda Web Adapter se vuelve a validar en `dev` antes de
habilitar rutas de usuario.
- Un cambio a Mangum o a una imagen exige un ADR nuevo y evidencia de un spike.
