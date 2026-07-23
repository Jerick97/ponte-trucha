---
name: deploy-trucha
description: Despliega Ponte Trucha Kids a AWS (S3 + CloudFront) y la Lambda del estafador, o diagnostica un despliegue roto. Úsala cuando se pida "deployar", "subir a AWS", "actualizar la URL pública", "configurar la Lambda", "la URL no carga" o revisar costos del free tier.
license: MIT
---

# Deploy Trucha

Owner de la infra: **Francis**.

## Antes de tocar AWS

1. Lee `infra/README.md` y `.kiro/specs/despliegue-aws/design.md`.
2. Confirma que existen las variables en `.env.deploy` (ignorado por git):
   `BUCKET`, `DISTRIBUTION_ID`, `DOMINIO`.
3. Si hace falta consultar documentación de AWS, usa el MCP `aws-docs` que ya
   está configurado en `.kiro/settings/mcp.json`.

## Orden del despliegue del frontend

Nunca subas un build que no pasó las verificaciones:

```bash
npm run lint
npm run test
npm run validar:escenarios
npm run build
aws s3 sync dist/ "s3://$BUCKET" --delete
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
```

Si cualquier paso falla, **detente**: no sincronices.

## Reglas de seguridad (se verifican en cada despliegue)

- El bucket S3 permanece privado; se sirve solo por CloudFront con OAC.
- `ORIGEN_PERMITIDO` de la Lambda apunta al dominio de CloudFront, nunca a `*`
  en la entrega final.
- `MISTRAL_API_KEY` vive solo en las variables de entorno de la Lambda.
  Si aparece una API key bajo `src/`, es un bug: párate y avisa.
- Las variables `VITE_*` son públicas por definición: ahí solo va la URL del
  endpoint.
- La Lambda no loguea el contenido del chat.

## Control de costo

- Concurrencia reservada de la Lambda: **5**. No la subas sin acordarlo.
- Timeout de la Lambda: 10 s; el cliente ya aborta a los 4 s.
- Meta del proyecto: USD 0. Si algo va a costar, dilo antes de crearlo.

## Diagnóstico rápido

| Síntoma | Primera sospecha |
|---|---|
| La URL da 403 | Falta la política de OAC en el bucket |
| Cambios que no se ven | Falta invalidar CloudFront |
| Ruta directa da 404 | Falta el custom error response 403/404 → `/index.html` |
| El chat del estafador no responde | Revisa `VITE_LLM_ENDPOINT` y el CORS de la Function URL |
| CORS bloqueado | `ORIGEN_PERMITIDO` no coincide con el dominio real |

## Cierre obligatorio

Imprime la URL pública y verifícala. Antes de la entrega, ábrela desde un
dispositivo fuera de la red del equipo: es un requisito de la spec, no un extra.
