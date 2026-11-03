#!/usr/bin/env bash
# E-Folio load test runner (offline-friendly, no cloud or InfluxDB required).
set -euo pipefail

cd "$(dirname "$0")"

BASE_URL="${BASE_URL:-http://localhost:5000}"
VUS="${VUS:-20}"
DURATION="${DURATION:-2m}"
P95_MS="${P95_MS:-800}"
RESULTS_DIR="${RESULTS_DIR:-../../../load-test-results}"

if ! command -v k6 >/dev/null 2>&1; then
    echo "k6 is not installed. Running the dependency-free Node load test instead."
    echo "  (install k6 for the full scenario: https://k6.io/docs/get-started/installation/)"
    BASE_URL="$BASE_URL" VUS="$VUS" DURATION="$DURATION" P95_MS="$P95_MS" \
        node smoke-load.js
    exit $?
fi

mkdir -p "$RESULTS_DIR"
OUT="$RESULTS_DIR/k6-$(date +%Y%m%d-%H%M%S).json"

echo "Target:   $BASE_URL"
echo "Load:     $VUS virtual users for $DURATION"
echo "Results:  $OUT"

export BASE_URL VUS DURATION P95_MS
k6 run \
    --vus "$VUS" \
    --duration "$DURATION" \
    --out "json=$OUT" \
    k6-load-test.js

node analyze-results.js "$OUT" --strict
