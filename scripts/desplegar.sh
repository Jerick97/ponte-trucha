#!/usr/bin/env bash
#
# Despliegue del frontend a S3 + CloudFront.
# Corre en Git Bash (Windows) y en Linux/macOS.
#
# Uso:  bash scripts/desplegar.sh
# Requiere .env.deploy en la raiz con BUCKET, DISTRIBUTION_ID y DOMINIO.

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

if [ ! -f .env.deploy ]; then
  echo "ERROR  Falta .env.deploy. Copia las variables de .env.example." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.deploy
set +a

: "${BUCKET:?Falta BUCKET en .env.deploy}"
: "${DISTRIBUTION_ID:?Falta DISTRIBUTION_ID en .env.deploy}"
: "${DOMINIO:?Falta DOMINIO en .env.deploy}"

echo "==> Verificaciones previas"
npm run lint
npm run test
npm run validar:escenarios

echo "==> Build"
npm run build

echo "==> Subiendo a s3://$BUCKET"
aws s3 sync dist/ "s3://$BUCKET" --delete

echo "==> Invalidando cache de CloudFront"
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" >/dev/null

echo ""
echo "Listo: https://$DOMINIO"
