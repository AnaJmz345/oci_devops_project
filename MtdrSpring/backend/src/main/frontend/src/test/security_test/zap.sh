#!/bin/bash

set -e

TARGET_URL="http://host.docker.internal:3000"
OUTPUT_DIR="//c/zap-evidence"
OUTPUT_FILE="results.xml"
IMAGE="ghcr.io/zaproxy/zaproxy:stable"

echo "======================================"
echo "Running OWASP ZAP scan"
echo "Target: $TARGET_URL"
echo "Output folder: C:/zap-evidence"
echo "Output file: $OUTPUT_FILE"
echo "======================================"

docker pull --platform linux/amd64 $IMAGE

MSYS_NO_PATHCONV=1 docker run --rm --platform linux/amd64 --user 0:0 \
  -v "$OUTPUT_DIR:/zap/wrk:rw" \
  -t $IMAGE \
  zap.sh -cmd \
  -quickurl "$TARGET_URL" \
  -quickout "/zap/wrk/$OUTPUT_FILE"

echo "======================================"
echo "ZAP scan finished successfully"
echo "XML report generated at: C:/zap-evidence/$OUTPUT_FILE"
echo "======================================"