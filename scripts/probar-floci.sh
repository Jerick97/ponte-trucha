#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
: "${AWS_ENDPOINT_URL:?Define AWS_ENDPOINT_URL con el endpoint de Floci.}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"

"$ROOT_DIR/backend/.venv/bin/python" "$ROOT_DIR/backend/scripts/check_floci.py"
