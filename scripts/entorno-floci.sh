#!/bin/sh
# Escribe .env.local con las coordenadas del despliegue emulado (Floci) para que
# el frontend hable con el API real y con el User Pool real.
#
#   export AWS_ENDPOINT_URL=http://localhost:4566
#   sh scripts/entorno-floci.sh
#
# Aqui no hay secretos: son identificadores publicos (URL del API, id del pool y
# del app client). Las credenciales del emulador van por variables de entorno.
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
: "${AWS_ENDPOINT_URL:?Define AWS_ENDPOINT_URL con el endpoint de Floci.}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"

DESTINO="${1:-$ROOT_DIR/.env.local}"
TERRAFORM_DIR="$ROOT_DIR/infra/environments/dev"

API_ENDPOINT=$(terraform -chdir="$TERRAFORM_DIR" output -raw api_endpoint)
USER_POOL_ID=$(terraform -chdir="$TERRAFORM_DIR" output -raw cognito_user_pool_id)
CLIENT_ID=$(terraform -chdir="$TERRAFORM_DIR" output -raw cognito_spa_client_id)

# El id del HTTP API es el subdominio del endpoint que publica API Gateway.
API_ID=$(printf '%s' "$API_ENDPOINT" | sed -e 's|^https\{0,1\}://||' -e 's|\..*$||')

cat > "$DESTINO" <<EOF
# Generado por scripts/entorno-floci.sh — no se versiona.
# Backend: API Gateway + Lambda + DynamoDB del emulador local.

# Rutas servidas por el proxy del dev server (ver vite.config.ts).
VITE_API_BASE_URL=/api
VITE_COGNITO_URL=/cognito
VITE_COGNITO_CLIENT_ID=$CLIENT_ID
VITE_COGNITO_USER_POOL_ID=$USER_POOL_ID

# Solo para el proxy de Vite (Node). No entran al bundle publico.
PTK_LOCAL_API_ID=$API_ID
PTK_LOCAL_AWS_ENDPOINT=$AWS_ENDPOINT_URL
EOF

echo "Escrito $DESTINO"
echo "  API   $AWS_ENDPOINT_URL/restapis/$API_ID/\$default/_user_request_"
echo "  Pool  $USER_POOL_ID (app client $CLIENT_ID)"
