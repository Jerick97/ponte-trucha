# Infraestructura AWS

Owner: **Francis** (backend / arquitectura AWS).

Todo lo que corre fuera del navegador vive aqui. Regla del proyecto: si algo
puede resolverse en el cliente, se resuelve en el cliente. El backend existe
solo para el fallback del LLM.

## Componentes

| Componente | Servicio | Para que | Free tier |
|---|---|---|---|
| Hosting del juego | S3 (bucket privado) + CloudFront (OAC) | Servir `dist/` como sitio estatico | Si |
| Fallback del LLM | Lambda Function URL (`infra/lambda/estafador`) | Responder como el estafador cuando el navegador no soporta la Prompt API | Si (1M req/mes) |
| Secreto del proveedor | Variable de entorno de la Lambda (o Secrets Manager si sobra tiempo) | Guardar `MISTRAL_API_KEY` | Si |
| Puntajes (opcional) | localStorage; DynamoDB solo si sobra tiempo | Guardar el mejor puntaje | Si |

No hay login, no hay base de datos de usuarios, no se guarda nada del nino.
Eso es decision de diseno, no falta de tiempo: se cuenta asi en el video.

## Diagrama

```
Navegador del nino
  |
  |-- (a) HTML/JS/CSS  <---- CloudFront <---- S3 (dist/)
  |
  |-- (b) Estafador conversacional
        |
        +-- Plan A: Prompt API de Chrome (Gemini Nano, on-device)
        |     nada sale del dispositivo
        |
        +-- Plan B: fetch POST -> Lambda Function URL -> API de Mistral
              se envia solo escenarioId + lo que el nino escribio
```

## Despliegue del frontend

```bash
npm run build
aws s3 sync dist/ s3://$BUCKET --delete
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

Detalle paso a paso (crear bucket, OAC, distribucion): ver
`.kiro/docs/guia-despliegue.md`.

## Despliegue de la Lambda

```bash
cd infra/lambda/estafador
zip -r ../estafador.zip index.mjs
aws lambda create-function \
  --function-name ponte-trucha-estafador \
  --runtime nodejs22.x \
  --handler index.handler \
  --zip-file fileb://../estafador.zip \
  --role $ROLE_ARN \
  --timeout 10 \
  --environment "Variables={MISTRAL_API_KEY=...,ORIGEN_PERMITIDO=https://tu-dominio}"

aws lambda create-function-url-config \
  --function-name ponte-trucha-estafador \
  --auth-type NONE
```

Luego se pone la URL resultante en `.env.local` como `VITE_LLM_ENDPOINT`.

## Reglas de seguridad

- La API key del proveedor **nunca** va al frontend. Si aparece un
  `VITE_MISTRAL_API_KEY` en el codigo, es un bug de seguridad.
- `ORIGEN_PERMITIDO` se restringe al dominio de CloudFront antes de la entrega.
- La Lambda no loguea el contenido del chat, solo el tipo de error.
- Rate limit basico: `reserved-concurrent-executions` en 5 para que un abuso
  no genere costo.
