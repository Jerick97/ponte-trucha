#!/bin/sh
set -eu

exec python -m uvicorn ponte_trucha.entrypoints.http.app:app --host 0.0.0.0 --port "${AWS_LWA_PORT:-8080}"
