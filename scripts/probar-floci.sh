#!/bin/sh
# Comprueba la infraestructura emulada y recorre el flujo completo del API con
# un login real de Cognito. Uso:
#
#   export AWS_ENDPOINT_URL=http://localhost:4566
#   sh scripts/probar-floci.sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
: "${AWS_ENDPOINT_URL:?Define AWS_ENDPOINT_URL con el endpoint de Floci.}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"

PYTHON="$ROOT_DIR/backend/.venv/bin/python"

"$PYTHON" "$ROOT_DIR/backend/scripts/check_floci.py"
"$PYTHON" "$ROOT_DIR/backend/scripts/smoke_floci.py"
