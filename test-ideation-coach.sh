#!/bin/bash

echo "========================================="
echo "  Ideation Coach Agent - Live Testing"
echo "========================================="

API_TOKEN="test-voice-api-token-qa-testing-2024"
BASE_URL="http://localhost:3000/api/voice"

echo ""
echo "=== TEST 1: Start Ideation Session ==="
echo "Starting a new ideation session for a client..."

RESPONSE=$(curl -s -X POST "$BASE_URL/ideation/start" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Maya Thompson",
    "initialIdea": "I want to create a wellness app for busy professionals that helps them integrate mindfulness into their workday without taking too much time. Something quick and practical.",
    "clientEmail": "maya@example.com",
    "founder": "shria"
  }')

echo "$RESPONSE" | python3 -m json.tool

# Extract session ID for next tests
SESSION_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('sessionId', ''))" 2>/dev/null)

if [ -z "$SESSION_ID" ]; then
  echo "ERROR: Could not extract session ID"
  exit 1
fi

echo ""
echo "Session ID: $SESSION_ID"

echo ""
echo "=== TEST 2: Continue Ideation Session ==="
echo "Client responds to coach's first question..."

sleep 2

curl -s -X POST "$BASE_URL/ideation/continue" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"clientResponse\": \"I think the core problem is that people want to be mindful but they feel like they don't have time. Traditional meditation apps ask for 10-20 minutes, but that's too much for someone in back-to-back meetings.\"
  }" | python3 -m json.tool

echo ""
echo "=== TEST 3: Continue with Deeper Response ==="
echo "Client explores the idea further..."

sleep 2

curl -s -X POST "$BASE_URL/ideation/continue" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"clientResponse\": \"What if we made micro-meditations - just 60-90 seconds - that people could do between meetings? Like a transition ritual. And we could integrate with their calendar to automatically suggest these moments.\"
  }" | python3 -m json.tool

echo ""
echo "=== TEST 4: Get Session Summary ==="
echo "Retrieving session summary and insights..."

sleep 1

curl -s -X GET "$BASE_URL/ideation/summary/$SESSION_ID" \
  -H "Authorization: Bearer $API_TOKEN" | python3 -m json.tool

echo ""
echo "=== TEST 5: Continue to Action Phase ==="
echo "Moving toward concrete next steps..."

sleep 2

curl -s -X POST "$BASE_URL/ideation/continue" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"clientResponse\": \"I'm excited about this! I have experience with meditation and I know a developer who could help build a prototype. I think we could start with Google Calendar integration.\"
  }" | python3 -m json.tool

echo ""
echo "=== TEST 6: End Session ==="
echo "Ending the ideation session and getting final summary..."

sleep 1

curl -s -X POST "$BASE_URL/ideation/end" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\"
  }" | python3 -m json.tool

echo ""
echo "=== TEST 7: Get All Active Sessions ==="
echo "Checking all active ideation sessions..."

curl -s -X GET "$BASE_URL/ideation/sessions" \
  -H "Authorization: Bearer $API_TOKEN" | python3 -m json.tool

echo ""
echo "========================================="
echo "  Testing Complete!"
echo "========================================="
