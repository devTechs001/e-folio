# tests/load/run-load-test.sh
#!/bin/bash

# Load test execution script

echo "Starting load test..."

# Set environment variables
export BASE_URL=${BASE_URL:-"http://localhost:5000"}
export VUS=${VUS:-100}
export DURATION=${DURATION:-"10m"}

# Run k6 load test
k6 run \
  --vus $VUS \
  --duration $DURATION \
  --out json=results.json \
  --out influxdb=http://localhost:8086/k6 \
  k6-load-test.js

# Generate HTML report
k6 cloud upload results.json

# Check results
if [ $? -eq 0 ]; then
  echo "Load test completed successfully"
  
  # Parse results
  echo "Analyzing results..."
  node analyze-results.js results.json
else
  echo "Load test failed"
  exit 1
fi