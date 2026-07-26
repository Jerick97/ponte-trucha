#!/usr/bin/env bash
#
# Levanta el API local (memoria, sin AWS), recorre el flujo completo y apaga
# el servidor. Uso:  bash scripts/probar-local.sh
#
# Variables opcionales:
#   PTK_LOCAL_PORT  puerto del API local (por defecto 8000)
set -euo pipefail
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ"

PYTHON="$RAIZ/backend/.venv/bin/python"
PUERTO="${PTK_LOCAL_PORT:-8000}"
BASE_URL="http://127.0.0.1:$PUERTO"

if [ ! -x "$PYTHON" ]; then
  echo "ERROR  Falta el entorno del backend. Ver .kiro/docs/setup-backend.md" >&2
  exit 1
fi

# El gateway local se niega a arrancar en modo persistente; se limpia por si la
# terminal viene de una sesion contra Floci.
unset AWS_ENDPOINT_URL DOMAIN_TABLE_NAME IDEMPOTENCY_TABLE_NAME HMAC_SECRET_ARN || true

echo "==> Levantando API local en $BASE_URL"
PTK_LOCAL_PORT="$PUERTO" "$PYTHON" backend/scripts/dev_server.py >/tmp/ptk-local.log 2>&1 &
SERVIDOR_PID=$!
trap 'kill "$SERVIDOR_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL/v1/health" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$SERVIDOR_PID" 2>/dev/null; then
    echo "ERROR  El API local no arranco:" >&2
    cat /tmp/ptk-local.log >&2
    exit 1
  fi
  sleep 0.25
done

echo "==> Recorriendo el flujo"
PTK_LOCAL_BASE_URL="$BASE_URL" "$PYTHON" backend/scripts/smoke_local.py
