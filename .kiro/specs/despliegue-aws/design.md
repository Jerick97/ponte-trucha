# Design Document: Despliegue en AWS

## Overview

Arquitectura mínima a propósito: un sitio estático y una función. Menos piezas
significa menos que puede fallar durante la demo y USD 0 de costo. Todo cabe en
el free tier con holgura.

## Architecture

```
                    ┌──────────────────────────────┐
                    │   Navegador del niño         │
                    │                              │
                    │  ┌────────────────────────┐  │
                    │  │ Gemini Nano on-device  │  │  ← plan A: nada sale de aquí
                    │  └────────────────────────┘  │
                    └───────┬──────────────┬───────┘
                            │ HTTPS        │ HTTPS (solo si no hay plan A)
                            ▼              ▼
                  ┌──────────────┐   ┌──────────────────┐
                  │  CloudFront  │   │ Lambda Function  │
                  │  (OAC, TLS)  │   │ URL (nodejs22.x) │
                  └──────┬───────┘   └────────┬─────────┘
                         │                    │
                         ▼                    ▼
                  ┌──────────────┐   ┌──────────────────┐
                  │  S3 privado  │   │  API de Mistral  │
                  │   dist/      │   │  (externa)       │
                  └──────────────┘   └──────────────────┘
```

Servicios AWS usados: **S3**, **CloudFront**, **Lambda**. Nada más. Sin API
Gateway (la Function URL basta), sin Cognito (no hay login), sin DynamoDB en el
MVP (el puntaje vive en `localStorage`).

## Configuración

### S3

- Bucket privado, sin website hosting (lo sirve CloudFront).
- Versionado desactivado; el historial está en git.
- Política que permite lectura solo al OAC de la distribución.

### CloudFront

- Origin: el bucket, vía OAC.
- Default root object: `index.html`.
- Custom error response: 403 y 404 → `/index.html` con status 200 (la app es SPA).
- Compresión automática activada.
- Precio clase 100 (Norteamérica + Europa) para mantener el costo en cero.

### Lambda

| Parámetro | Valor | Motivo |
|---|---|---|
| Runtime | `nodejs22.x` | `fetch` y `AbortSignal.timeout` nativos |
| Memoria | 256 MB | La latencia la manda la API externa, no la CPU |
| Timeout | 10 s | El cliente aborta a los 4 s; margen para el log |
| Concurrencia reservada | 5 | Techo duro de costo ante un abuso |
| Variables | `MISTRAL_API_KEY`, `ORIGEN_PERMITIDO`, `MISTRAL_MODEL` | La key nunca sale de aquí |

## Script de despliegue

`scripts/desplegar.sh` (bash, corre también en Git Bash de Windows):

```bash
set -e                                    # si el build falla, no sube nada
npm run lint && npm run test && npm run build
aws s3 sync dist/ "s3://$BUCKET" --delete
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
echo "Listo: https://$DOMINIO"
```

Las variables salen de `.env.deploy` (ignorado por git). El `set -e` cumple el
requisito de no subir un build roto.

## Costos estimados

| Servicio | Uso esperado en el hackathon | Free tier | Costo |
|---|---|---|---|
| S3 | < 10 MB, cientos de GET | 5 GB, 20k GET | USD 0 |
| CloudFront | < 1 GB de transferencia | 1 TB/mes | USD 0 |
| Lambda | < 1000 invocaciones | 1M req/mes | USD 0 |
| Mistral | Solo fallback, tier gratuito | — | USD 0 |

El riesgo real de costo no es AWS: es la API del LLM. Por eso la concurrencia
reservada de 5 y el timeout corto.

## Seguridad

- Bucket privado + OAC: nadie llega al S3 directamente.
- CORS de la Function URL restringido al dominio de CloudFront.
- Sin credenciales en el repo; `.env.example` documenta las claves vacías.
- Hook de Kiro que escanea secretos antes de cualquier comando de shell.
- HTTPS obligatorio en toda la cadena.

## Plan de contingencia para la demo

1. Grabar el video con la app ya desplegada, no en `localhost`.
2. Tener una captura de respaldo del juego funcionando por si la red falla.
3. Verificar la URL desde un dispositivo fuera de la red del equipo el mismo día.
