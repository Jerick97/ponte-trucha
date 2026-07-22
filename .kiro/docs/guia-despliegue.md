# Guía de despliegue paso a paso

Owner: **Francis**. Objetivo: URL pública viva el día 4, costo USD 0.

## 1. Bucket S3 privado

```bash
export BUCKET=ponte-trucha-web
aws s3api create-bucket --bucket "$BUCKET" --region us-east-1
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

No se activa website hosting: el sitio lo sirve CloudFront.

## 2. Origin Access Control + distribución

En la consola de CloudFront:

1. **Create distribution** → Origin: el bucket S3.
2. **Origin access**: Origin access control settings → crear un OAC nuevo.
3. Copiar la política que sugiere CloudFront y pegarla en el bucket.
4. **Default root object**: `index.html`.
5. **Custom error responses**: 403 → `/index.html` (200) y 404 → `/index.html` (200).
6. **Compress objects automatically**: sí.
7. **Price class**: solo Norteamérica y Europa (clase 100).

Anota el **Distribution ID** y el **dominio** (`d1234abcd.cloudfront.net`).

## 3. Variables de despliegue

Crea `.env.deploy` en la raíz (está en `.gitignore`):

```bash
BUCKET=ponte-trucha-web
DISTRIBUTION_ID=E123456ABCDEF
DOMINIO=d1234abcd.cloudfront.net
```

## 4. Desplegar el frontend

```bash
set -a; source .env.deploy; set +a
npm run lint && npm run test && npm run validar:escenarios && npm run build
aws s3 sync dist/ "s3://$BUCKET" --delete
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
echo "https://$DOMINIO"
```

Si cualquier verificación falla, **no se sube nada**.

## 5. Lambda del estafador

```bash
cd infra/lambda/estafador
zip -r ../estafador.zip index.mjs
cd ../../..

aws lambda create-function \
  --function-name ponte-trucha-estafador \
  --runtime nodejs22.x \
  --handler index.handler \
  --zip-file fileb://infra/lambda/estafador.zip \
  --role "$ROLE_ARN" \
  --timeout 10 \
  --memory-size 256

aws lambda put-function-concurrency \
  --function-name ponte-trucha-estafador \
  --reserved-concurrent-executions 5

aws lambda update-function-configuration \
  --function-name ponte-trucha-estafador \
  --environment "Variables={MISTRAL_API_KEY=$KEY,ORIGEN_PERMITIDO=https://$DOMINIO}"

aws lambda create-function-url-config \
  --function-name ponte-trucha-estafador \
  --auth-type NONE \
  --cors "AllowOrigins=https://$DOMINIO,AllowMethods=POST"
```

El `ROLE_ARN` es un rol con `AWSLambdaBasicExecutionRole` y nada más.

Copia la URL resultante a `.env.local` como `VITE_LLM_ENDPOINT` y vuelve a
desplegar el frontend.

## 6. Actualizar la Lambda

```bash
cd infra/lambda/estafador && zip -r ../estafador.zip index.mjs && cd ../../..
aws lambda update-function-code \
  --function-name ponte-trucha-estafador \
  --zip-file fileb://infra/lambda/estafador.zip
```

## 7. Verificación final

```bash
curl -X POST "$VITE_LLM_ENDPOINT" \
  -H 'Content-Type: application/json' \
  -d '{"escenarioId":"prueba","mensajeOriginal":"Robux gratis","historial":[{"autor":"nino","texto":"no te creo"}]}'
```

Debe responder `{"texto":"..."}`. Luego revisa CloudWatch: los logs **no** deben
contener el texto del chat.

## 8. Checklist antes de entregar

- [ ] La URL abre en un celular fuera de la red del equipo
- [ ] `ORIGEN_PERMITIDO` apunta al dominio real, no a `*`
- [ ] Concurrencia reservada en 5
- [ ] Cost Explorer marca USD 0
- [ ] No hay API keys en el repositorio
