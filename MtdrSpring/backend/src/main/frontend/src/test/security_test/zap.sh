#!/usr/bin/env bash

set -euo pipefail

TARGET_URL="${1:-${TARGET_URL:-http://host.docker.internal:3000}}"
IMAGE="${ZAP_IMAGE:-ghcr.io/zaproxy/zaproxy:stable}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-$SCRIPT_DIR/zap-evidence}"

mkdir -p "$OUTPUT_DIR"

if command -v cygpath >/dev/null 2>&1; then
  DOCKER_OUTPUT_DIR="$(cygpath -w "$OUTPUT_DIR")"
else
  DOCKER_OUTPUT_DIR="$OUTPUT_DIR"
fi

echo "======================================"
echo "Running OWASP ZAP baseline scan"
echo "Target: $TARGET_URL"
echo "Output folder: $OUTPUT_DIR"
echo "Docker mount: $DOCKER_OUTPUT_DIR"
echo "======================================"

docker pull "$IMAGE"

MSYS_NO_PATHCONV=1 docker run --rm --user 0:0 \
  -v "$DOCKER_OUTPUT_DIR:/zap/wrk:rw" \
  -e TARGET_URL="$TARGET_URL" \
  -t "$IMAGE" \
  bash -lc '
    cd /zap/wrk

    echo "Inside container:"
    pwd
    ls -la

    python3 /zap/zap-baseline.py \
      -t "$TARGET_URL" \
      -x results.xml \
      -r zap_report.html \
      -J zap_report.json \
      -I

    echo "Files generated inside /zap/wrk:"
    ls -la /zap/wrk
  '

echo "======================================"
echo "ZAP scan finished"
echo "Evidence folder: $OUTPUT_DIR"
echo "======================================"

ls -la "$OUTPUT_DIR"

if [[ ! -s "$OUTPUT_DIR/results.xml" ]]; then
  echo "ERROR: results.xml was not generated or is empty."
  exit 1
fi