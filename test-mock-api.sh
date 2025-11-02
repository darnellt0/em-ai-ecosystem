#!/bin/bash

# Quick testing script for Voice API with mock responses
# Usage: bash test-mock-api.sh [docker|local]
# Examples:
#   bash test-mock-api.sh              # Test local instance
#   bash test-mock-api.sh docker       # Test Docker container

MODE="${1:-local}"
TOKEN="elevenlabs-voice-secure-token-2025"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function to make HTTP requests
if [ "$MODE" = "docker" ]; then
  make_request() {
    local method=$1
    local path=$2
    local data=$3
    docker exec em-api node -e "
const http = require('http');
const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '$path',
  method: '$method',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $TOKEN'
  }
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const obj = JSON.parse(data);
      console.log('STATUS:', res.statusCode);
      console.log('RESPONSE:', JSON.stringify(obj, null, 2));
    } catch (e) {
      console.log('STATUS:', res.statusCode);
      console.log('RESPONSE:', data);
    }
  });
});
req.on('error', (e) => console.error('ERROR:', e.message));
if ('$method' === 'POST') {
  req.write('$data');
}
req.end();
" 2>&1
  }
else
  make_request() {
    local method=$1
    local path=$2
    local data=$3
    curl -s -X "$method" "http://localhost:3000$path" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      -w "\n"
  }
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Voice API Mock Testing Suite                          ║"
echo "║         Mode: $([ "$MODE" = "docker" ] && echo "Docker" || echo "Local")"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Test 1: Health Check
echo -e "${BLUE}[Test 1] Health Check${NC}"
echo "GET /health"
echo ""
if [ "$MODE" = "docker" ]; then
  docker exec em-api node -e "
const http = require('http');
http.get('http://127.0.0.1:3000/health', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log(JSON.parse(data).humanSummary || JSON.stringify(JSON.parse(data), null, 2));
  });
});
" 2>&1
else
  curl -s http://localhost:3000/health | jq '.'
fi
echo ""
sleep 1

# Test 2: Block Focus Time
echo -e "${BLUE}[Test 2] Block Focus Time${NC}"
echo "POST /api/voice/scheduler/block"
echo ""
make_request "POST" "/api/voice/scheduler/block" '{"minutes": 45, "founder": "shria"}'
echo ""
sleep 1

# Test 3: Confirm Meeting
echo -e "${BLUE}[Test 3] Confirm Meeting${NC}"
echo "POST /api/voice/scheduler/confirm"
echo ""
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || python3 -c "from datetime import datetime; print(datetime.utcnow().isoformat() + 'Z')")
make_request "POST" "/api/voice/scheduler/confirm" "{\"title\": \"Team Sync\", \"startAtISO\": \"$NOW\", \"durationMinutes\": 60, \"founder\": \"shria\"}"
echo ""
sleep 1

# Test 4: Reschedule Meeting
echo -e "${BLUE}[Test 4] Reschedule Meeting${NC}"
echo "POST /api/voice/scheduler/reschedule"
echo ""
NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || python3 -c "from datetime import datetime; print(datetime.utcnow().isoformat() + 'Z')")
make_request "POST" "/api/voice/scheduler/reschedule" "{\"eventId\": \"evt-123\", \"newStartAtISO\": \"$NOW\", \"newDurationMinutes\": 30, \"founder\": \"darnell\"}"
echo ""
sleep 1

# Test 5: Start Pause
echo -e "${BLUE}[Test 5] Start Meditation Pause${NC}"
echo "POST /api/voice/coach/pause"
echo ""
make_request "POST" "/api/voice/coach/pause" '{"style": "grounding", "seconds": 60, "founder": "shria"}'
echo ""
sleep 1

# Test 6: Log Complete
echo -e "${BLUE}[Test 6] Log Task Complete${NC}"
echo "POST /api/voice/support/log-complete"
echo ""
make_request "POST" "/api/voice/support/log-complete" '{"taskId": "task-789", "note": "Completed", "founder": "shria"}'
echo ""
sleep 1

# Test 7: Follow-up
echo -e "${BLUE}[Test 7] Create Follow-up${NC}"
echo "POST /api/voice/support/follow-up"
echo ""
DUE=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || python3 -c "from datetime import datetime; print(datetime.utcnow().isoformat() + 'Z')")
make_request "POST" "/api/voice/support/follow-up" "{\"subject\": \"Follow up on Q4 planning\", \"dueISO\": \"$DUE\", \"context\": \"From board meeting\", \"founder\": \"darnell\"}"
echo ""
sleep 1

# Test 8: Authentication (Missing Token)
echo -e "${BLUE}[Test 8] Authentication - Missing Token${NC}"
echo "Should return 401 Unauthorized"
echo ""
if [ "$MODE" = "docker" ]; then
  docker exec em-api node -e "
const http = require('http');
const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/voice/scheduler/block',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};
const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
});
req.write(JSON.stringify({minutes: 45, founder: 'shria'}));
req.end();
" 2>&1
else
  curl -s -X POST http://localhost:3000/api/voice/scheduler/block \
    -H "Content-Type: application/json" \
    -d '{"minutes": 45, "founder": "shria"}' \
    -w "Status: %{http_code}\n"
fi
echo ""
sleep 1

# Test 9: Validation (Invalid Input)
echo -e "${BLUE}[Test 9] Input Validation - Missing Required Field${NC}"
echo "Should return 400 Bad Request"
echo ""
make_request "POST" "/api/voice/scheduler/block" '{"founder": "shria"}'
echo ""
sleep 1

# Test 10: Rate Limiting
echo -e "${BLUE}[Test 10] Rate Limiting (Sending 25 requests)${NC}"
echo "First 20 should succeed (200), 21+ should be throttled (429)"
echo ""

if [ "$MODE" = "docker" ]; then
  # Docker mode - use Node.js
  docker exec em-api node << 'EOFNODE'
const http = require('http');
let successCount = 0;
let throttledCount = 0;

for (let i = 1; i <= 25; i++) {
  const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/voice/scheduler/block',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer elevenlabs-voice-secure-token-2025'
    }
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) successCount++;
    if (res.statusCode === 429) throttledCount++;
    if (i === 25) {
      console.log('Results: ' + successCount + ' successful (200), ' + throttledCount + ' throttled (429)');
      if (successCount >= 20 && throttledCount > 0) {
        console.log('✅ Rate limiting working correctly!');
      }
    }
  });

  req.write(JSON.stringify({minutes: 5, founder: 'shria'}));
  req.end();
}
EOFNODE
else
  # Local mode - use curl with background jobs
  RESULTS=$(
    for i in {1..25}; do
      curl -s -X POST http://localhost:3000/api/voice/scheduler/block \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"minutes": 5, "founder": "shria"}' \
        -o /dev/null \
        -w "%{http_code}\n" &
    done
    wait
  )

  SUCCESS=$(echo "$RESULTS" | grep -c "200")
  THROTTLED=$(echo "$RESULTS" | grep -c "429")
  echo "Results: $SUCCESS successful (200), $THROTTLED throttled (429)"

  if [ $SUCCESS -ge 20 ] && [ $THROTTLED -gt 0 ]; then
    echo "✅ Rate limiting working correctly!"
  fi
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Testing Complete!                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}All 6 voice endpoints tested with mock responses.${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the responses above - they show realistic mock data"
echo "  2. Check TESTING_WITH_MOCKS.md for detailed examples"
echo "  3. When ready, wire real agents in voice.services.ts"
echo ""
