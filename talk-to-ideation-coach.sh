#!/bin/bash

# Interactive Ideation Coach Client
# Talk to your agent conversationally from the command line

API_TOKEN="test-voice-api-token-qa-testing-2024"
BASE_URL="http://localhost:3000/api/voice"

echo "========================================="
echo "  💡 Ideation Coach - Interactive Mode"
echo "========================================="
echo ""

# Get client name
read -p "What's your name? " CLIENT_NAME

# Get initial idea
echo ""
echo "Tell me about your idea (press Enter when done):"
read -p "> " INITIAL_IDEA

echo ""
echo "Starting your ideation session..."
echo ""

# Start session
RESPONSE=$(curl -s -X POST "$BASE_URL/ideation/start" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientName\": \"$CLIENT_NAME\",
    \"initialIdea\": \"$INITIAL_IDEA\",
    \"founder\": \"shria\"
  }")

# Extract session ID
SESSION_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('sessionId', ''))" 2>/dev/null)

if [ -z "$SESSION_ID" ]; then
  echo "❌ Error: Could not start session"
  echo "$RESPONSE"
  exit 1
fi

# Get first coach response
COACH_RESPONSE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('coachResponse', ''))" 2>/dev/null)

echo "🤖 Coach: $COACH_RESPONSE"
echo ""

# Main conversation loop
TURN=1
while true; do
  # Get client response
  read -p "You: " CLIENT_RESPONSE

  # Check for exit commands
  if [[ "$CLIENT_RESPONSE" == "exit" ]] || [[ "$CLIENT_RESPONSE" == "quit" ]] || [[ "$CLIENT_RESPONSE" == "done" ]]; then
    echo ""
    echo "Ending your session..."

    # End session
    SUMMARY=$(curl -s -X POST "$BASE_URL/ideation/end" \
      -H "Authorization: Bearer $API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"sessionId\": \"$SESSION_ID\"}")

    # Display final summary
    echo ""
    echo "========================================="
    echo "  Session Complete!"
    echo "========================================="
    echo ""

    FINAL_MESSAGE=$(echo "$SUMMARY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('finalMessage', ''))" 2>/dev/null)
    echo "$FINAL_MESSAGE"
    echo ""

    # Show insights
    echo "🔑 Key Insights:"
    echo "$SUMMARY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
insights = data.get('keyInsights', [])
if insights:
    for i, insight in enumerate(insights, 1):
        print(f'{i}. {insight}')
else:
    print('(No insights captured)')
" 2>/dev/null

    echo ""
    echo "📋 Suggested Next Steps:"
    echo "$SUMMARY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
steps = data.get('suggestedNextSteps', [])
for i, step in enumerate(steps, 1):
    print(f'{i}. {step}')
" 2>/dev/null

    echo ""
    echo "Session ID: $SESSION_ID"
    echo ""
    break
  fi

  # Check for summary command
  if [[ "$CLIENT_RESPONSE" == "summary" ]]; then
    SUMMARY=$(curl -s -X GET "$BASE_URL/ideation/summary/$SESSION_ID" \
      -H "Authorization: Bearer $API_TOKEN")

    echo ""
    echo "📊 Session Summary:"
    echo "$SUMMARY" | python3 -m json.tool 2>/dev/null || echo "$SUMMARY"
    echo ""
    continue
  fi

  # Continue conversation
  echo ""
  RESPONSE=$(curl -s -X POST "$BASE_URL/ideation/continue" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"sessionId\": \"$SESSION_ID\",
      \"clientResponse\": \"$CLIENT_RESPONSE\"
    }")

  # Get coach response
  COACH_RESPONSE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('coachResponse', ''))" 2>/dev/null)

  # Get stage
  STAGE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('stage', ''))" 2>/dev/null)

  echo "🤖 Coach [$STAGE]: $COACH_RESPONSE"
  echo ""

  TURN=$((TURN + 1))
done

echo "Thank you for using the Ideation Coach! 🎉"
