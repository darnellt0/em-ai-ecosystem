#!/bin/bash

echo "=== Security Tests ==="

echo -e "\n1. Test Auth - Missing Token (should return 401)"
curl -s -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Content-Type: application/json" \
  -d '{"minutes":45,"founder":"shria"}'

echo -e "\n\n2. Test Auth - Invalid Token (should return 401)"
curl -s -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer wrong-token-12345" \
  -H "Content-Type: application/json" \
  -d '{"minutes":45,"founder":"shria"}'

echo -e "\n\n3. Test Auth - Valid Token (should return 200)"
curl -s -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer test-voice-api-token-qa-testing-2024" \
  -H "Content-Type: application/json" \
  -d '{"minutes":45,"founder":"shria"}'

echo -e "\n\n=== Idempotency Tests ==="

echo -e "\n1. First Request with Idempotency-Key"
RESPONSE1=$(curl -s -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer test-voice-api-token-qa-testing-2024" \
  -H "Idempotency-Key: test-key-99999" \
  -H "Content-Type: application/json" \
  -d '{"minutes":30,"founder":"shria"}')
echo "$RESPONSE1"

echo -e "\n\n2. Second Request with Same Idempotency-Key (should return cached)"
RESPONSE2=$(curl -s -X POST http://localhost:3000/api/voice/scheduler/block \
  -H "Authorization: Bearer test-voice-api-token-qa-testing-2024" \
  -H "Idempotency-Key: test-key-99999" \
  -H "Content-Type: application/json" \
  -d '{"minutes":30,"founder":"shria"}')
echo "$RESPONSE2"

echo -e "\n\n=== Rate Limiting Test ==="
echo "Sending 10 rapid requests..."
for i in {1..10}; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/voice/scheduler/block \
    -H "Authorization: Bearer test-voice-api-token-qa-testing-2024" \
    -H "Content-Type: application/json" \
    -d '{"minutes":10,"founder":"shria"}')
  echo "Request $i: HTTP $HTTP_CODE"
  sleep 0.1
done
