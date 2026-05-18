#!/usr/bin/env bash

# This helps us avoid saying that the scan worked when actually something failed. (-e: stops the script if any command fails, -u: stops the script if we use a variable that does not exist, pipefail: stops the script if a command inside a pipe fails)
set -euo pipefail
# This is the URL that OWASP ZAP is going to scan.
#TARGET_URL="${1:-http://host.docker.internal:3000}"
TARGET_URL="${1:-http://160.34.219.135/}"

IMAGE="ghcr.io/zaproxy/zaproxy:2.16.1"
RESULT_FILE="results.xml"

# gets the path where the script is located, so results.xml is saved in the same path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

rm -f "$RESULT_FILE"

#for windows path compatibility,  since I am running the script from Windows using bash, the path format can be different, cygpath converts the bash path into a Windows path that Docker can understand better.
if command -v cygpath >/dev/null 2>&1; then
  WORKDIR="$(cygpath -w "$SCRIPT_DIR")"
else
  WORKDIR="$SCRIPT_DIR"
fi

# for debugging purposes, we print out the configuration that we are using for the scan, so we can verify that everything is correct before running the scan.
echo "======================================"
echo "OWASP ZAP Security Scan"
echo "Target: $TARGET_URL"
echo "Output: $SCRIPT_DIR/$RESULT_FILE"
echo "Docker workdir: $WORKDIR"
echo "======================================"

# downolads ZAP image, if it isn't already downoloaded, if it is already downloaded, it checks it is available.
docker pull "$IMAGE"


#  Docker creates a  container using the ZAP image. Inside that container, the ZAP script is executed with the command bash /zap/zap.sh. The option --user 0:0 runs the container with root permissions using the numeric user ID. The script receives the URL of the local app through TARGET_URL, and then ZAP starts analyzing it. After the scan finishes, ZAP saves the report as results.xml. The -v volume option is necessary to save results.xml on my computer because the file is originally saved inside the container. Finally, because the script uses --rm, the container is removed automatically, so it does not leave unnecessary containers after the scan. The  -quickprogress shows the scan progress in the terminal

MSYS_NO_PATHCONV=1 docker run --rm --user 0:0 \
  -v "$WORKDIR:/zap/wrk/:rw" \
  -t "$IMAGE" \
  bash /zap/zap.sh \
  -cmd \
  -quickurl "$TARGET_URL" \
  -quickout "/zap/wrk/$RESULT_FILE" \
  -quickprogress

echo "======================================"
echo "Generated files:"
ls -la
echo "======================================"

if [ -s "$RESULT_FILE" ]; then
  echo "OK: results.xml was created"
else
  echo "ERROR: results.xml was not created"
  exit 1
fi