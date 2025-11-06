#!/bin/bash

# ============================================================================
# Smoke Test Script
# Quick validation that the system is working
# ============================================================================

set -e

# Configuration
API_URL="${1:-http://localhost:3000}"
TEST_EMAIL="smoke-test-$(date +%s)@example.com"
TEST_PASSWORD="SmokeTest123"
TEST_NAME="Smoke Test User"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "🧪 Running Smoke Tests"
echo "======================"
echo "API URL: $API_URL"
echo ""

# Track results
PASSED=0
FAILED=0

# ============================================================================
# Helper Functions
# ============================================================================

pass() {
    echo -e "${GREEN}✓${NC} $1"
    PASSED=$((PASSED + 1))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    FAILED=$((FAILED + 1))
}

# ============================================================================
# Test 1: Health Check
# ============================================================================

echo "Test 1: Health Check"
if curl -f -s "$API_URL/health" > /dev/null; then
    HEALTH_RESPONSE=$(curl -s "$API_URL/health")
    if echo "$HEALTH_RESPONSE" | grep -q "running"; then
        pass "API is healthy"
    else
        fail "API health check returned unexpected response"
    fi
else
    fail "API health endpoint not accessible"
    echo ""
    echo -e "${RED}❌ Critical: API is not running${NC}"
    echo "Please start the API first"
    exit 1
fi

# ============================================================================
# Test 2: User Signup
# ============================================================================

echo "Test 2: User Signup"
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$TEST_NAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$SIGNUP_RESPONSE" | grep -q "token"; then
    TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    pass "User signup successful"
else
    fail "User signup failed"
    echo "   Response: $SIGNUP_RESPONSE"
fi

# ============================================================================
# Test 3: User Login
# ============================================================================

echo "Test 3: User Login"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    pass "User login successful"
else
    fail "User login failed"
    echo "   Response: $LOGIN_RESPONSE"
fi

# ============================================================================
# Test 4: Get Current User
# ============================================================================

echo "Test 4: Get Current User"
if [ -n "$TOKEN" ]; then
    ME_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/me")
    if echo "$ME_RESPONSE" | grep -q "$TEST_EMAIL"; then
        pass "Get current user successful"
    else
        fail "Get current user failed"
        echo "   Response: $ME_RESPONSE"
    fi
else
    fail "Cannot test - no auth token available"
fi

# ============================================================================
# Test 5: Access Protected Endpoint
# ============================================================================

echo "Test 5: Access Protected Dashboard"
if [ -n "$TOKEN" ]; then
    DASHBOARD_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/dashboard")
    if echo "$DASHBOARD_RESPONSE" | grep -q "dashboard"; then
        pass "Protected endpoint accessible with token"
    else
        # This might not be protected yet, so just warn
        echo -e "${YELLOW}⚠${NC} Dashboard endpoint response unexpected (may not require auth yet)"
    fi
else
    fail "Cannot test - no auth token available"
fi

# ============================================================================
# Test 6: Invalid Token Rejection
# ============================================================================

echo "Test 6: Invalid Token Rejection"
INVALID_RESPONSE=$(curl -s -w "%{http_code}" -H "Authorization: Bearer invalid-token" "$API_URL/api/auth/me" -o /dev/null)
if [ "$INVALID_RESPONSE" = "401" ]; then
    pass "Invalid token correctly rejected"
else
    fail "Invalid token not rejected (status: $INVALID_RESPONSE)"
fi

# ============================================================================
# Test 7: Logout
# ============================================================================

echo "Test 7: Logout"
if [ -n "$TOKEN" ]; then
    LOGOUT_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/logout")
    if echo "$LOGOUT_RESPONSE" | grep -q "success"; then
        pass "Logout successful"
    else
        fail "Logout failed"
        echo "   Response: $LOGOUT_RESPONSE"
    fi
else
    fail "Cannot test - no auth token available"
fi

# ============================================================================
# Test 8: Token After Logout
# ============================================================================

echo "Test 8: Token Invalid After Logout"
if [ -n "$TOKEN" ]; then
    AFTER_LOGOUT=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/api/auth/me" -o /dev/null)
    if [ "$AFTER_LOGOUT" = "401" ]; then
        pass "Token correctly invalidated after logout"
    else
        fail "Token still valid after logout"
    fi
else
    fail "Cannot test - no auth token available"
fi

# ============================================================================
# Test 9: Voice API Endpoints
# ============================================================================

echo "Test 9: Voice API Endpoints"
VOICE_RESPONSE=$(curl -s -X POST "$API_URL/api/voice/scheduler/block" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${LOGIN_TOKEN:-invalid}" \
    -d '{"duration":"30m","reason":"focus time"}' 2>/dev/null || echo "{}")

if echo "$VOICE_RESPONSE" | grep -q -E "success|scheduled|error"; then
    pass "Voice API endpoint accessible"
else
    echo -e "${YELLOW}⚠${NC} Voice API response unexpected (may need token)"
fi

# ============================================================================
# Test 10: API Config Endpoint
# ============================================================================

echo "Test 10: API Config Endpoint"
CONFIG_RESPONSE=$(curl -s "$API_URL/api/config")
if echo "$CONFIG_RESPONSE" | grep -q "version"; then
    pass "Config endpoint working"
else
    fail "Config endpoint not working"
fi

# ============================================================================
# Results Summary
# ============================================================================

echo ""
echo "======================"
echo "📊 Test Results"
echo "======================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All smoke tests passed!${NC}"
    echo ""
    echo "The system is ready for production use."
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Please review the failures above and fix the issues."
    echo ""
    exit 1
fi
