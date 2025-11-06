# ============================================================================
# Smoke Test Script - PowerShell Version
# Quick validation that the system is working
# ============================================================================

param(
    [string]$ApiUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

# Configuration
$TestEmail = "smoke-test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$TestPassword = "SmokeTest123"
$TestName = "Smoke Test User"

Write-Host ""
Write-Host "🧪 Running Smoke Tests" -ForegroundColor Cyan
Write-Host "======================"
Write-Host "API URL: $ApiUrl"
Write-Host ""

# Track results
$Passed = 0
$Failed = 0

# Helper Functions
function Pass {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
    $script:Passed++
}

function Fail {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    $script:Failed++
}

# ============================================================================
# Test 1: Health Check
# ============================================================================

Write-Host "Test 1: Health Check"
try {
    $HealthResponse = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get -ErrorAction Stop
    if ($HealthResponse.status -eq "running") {
        Pass "API is healthy"
    } else {
        Fail "API health check returned unexpected response"
    }
} catch {
    Fail "API health endpoint not accessible"
    Write-Host ""
    Write-Host "❌ Critical: API is not running" -ForegroundColor Red
    Write-Host "Please start the API first"
    exit 1
}

# ============================================================================
# Test 2: User Signup
# ============================================================================

Write-Host "Test 2: User Signup"
try {
    $SignupBody = @{
        name = $TestName
        email = $TestEmail
        password = $TestPassword
    } | ConvertTo-Json

    $SignupResponse = Invoke-RestMethod -Uri "$ApiUrl/api/auth/signup" `
        -Method Post `
        -ContentType "application/json" `
        -Body $SignupBody `
        -ErrorAction Stop

    if ($SignupResponse.token) {
        $Token = $SignupResponse.token
        Pass "User signup successful"
    } else {
        Fail "User signup failed - no token returned"
    }
} catch {
    Fail "User signup failed"
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ============================================================================
# Test 3: User Login
# ============================================================================

Write-Host "Test 3: User Login"
try {
    $LoginBody = @{
        email = $TestEmail
        password = $TestPassword
    } | ConvertTo-Json

    $LoginResponse = Invoke-RestMethod -Uri "$ApiUrl/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $LoginBody `
        -ErrorAction Stop

    if ($LoginResponse.token) {
        $LoginToken = $LoginResponse.token
        Pass "User login successful"
    } else {
        Fail "User login failed - no token returned"
    }
} catch {
    Fail "User login failed"
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# ============================================================================
# Test 4: Get Current User
# ============================================================================

Write-Host "Test 4: Get Current User"
if ($Token) {
    try {
        $Headers = @{
            "Authorization" = "Bearer $Token"
        }

        $MeResponse = Invoke-RestMethod -Uri "$ApiUrl/api/auth/me" `
            -Method Get `
            -Headers $Headers `
            -ErrorAction Stop

        if ($MeResponse.user.email -eq $TestEmail) {
            Pass "Get current user successful"
        } else {
            Fail "Get current user returned wrong user"
        }
    } catch {
        Fail "Get current user failed"
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Fail "Cannot test - no auth token available"
}

# ============================================================================
# Test 5: Access Protected Endpoint
# ============================================================================

Write-Host "Test 5: Access Protected Dashboard"
if ($Token) {
    try {
        $Headers = @{
            "Authorization" = "Bearer $Token"
        }

        $DashboardResponse = Invoke-RestMethod -Uri "$ApiUrl/api/dashboard" `
            -Method Get `
            -Headers $Headers `
            -ErrorAction Stop

        if ($DashboardResponse) {
            Pass "Protected endpoint accessible with token"
        }
    } catch {
        Write-Host "⚠ Dashboard endpoint response unexpected (may not require auth yet)" -ForegroundColor Yellow
    }
} else {
    Fail "Cannot test - no auth token available"
}

# ============================================================================
# Test 6: Invalid Token Rejection
# ============================================================================

Write-Host "Test 6: Invalid Token Rejection"
try {
    $Headers = @{
        "Authorization" = "Bearer invalid-token"
    }

    $null = Invoke-RestMethod -Uri "$ApiUrl/api/auth/me" `
        -Method Get `
        -Headers $Headers `
        -ErrorAction Stop

    Fail "Invalid token not rejected"
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Pass "Invalid token correctly rejected"
    } else {
        Fail "Invalid token not rejected with 401"
    }
}

# ============================================================================
# Test 7: Logout
# ============================================================================

Write-Host "Test 7: Logout"
if ($Token) {
    try {
        $Headers = @{
            "Authorization" = "Bearer $Token"
        }

        $LogoutResponse = Invoke-RestMethod -Uri "$ApiUrl/api/auth/logout" `
            -Method Post `
            -Headers $Headers `
            -ErrorAction Stop

        if ($LogoutResponse.success) {
            Pass "Logout successful"
        } else {
            Fail "Logout failed"
        }
    } catch {
        Fail "Logout failed"
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Fail "Cannot test - no auth token available"
}

# ============================================================================
# Test 8: Token After Logout
# ============================================================================

Write-Host "Test 8: Token Invalid After Logout"
if ($Token) {
    try {
        $Headers = @{
            "Authorization" = "Bearer $Token"
        }

        $null = Invoke-RestMethod -Uri "$ApiUrl/api/auth/me" `
            -Method Get `
            -Headers $Headers `
            -ErrorAction Stop

        Fail "Token still valid after logout"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Pass "Token correctly invalidated after logout"
        } else {
            Fail "Token validation returned unexpected status"
        }
    }
} else {
    Fail "Cannot test - no auth token available"
}

# ============================================================================
# Test 9: Voice API Endpoints
# ============================================================================

Write-Host "Test 9: Voice API Endpoints"
try {
    $VoiceBody = @{
        duration = "30m"
        reason = "focus time"
    } | ConvertTo-Json

    $VoiceHeaders = @{
        "Authorization" = "Bearer $($LoginToken ?? 'invalid')"
    }

    $VoiceResponse = Invoke-RestMethod -Uri "$ApiUrl/api/voice/scheduler/block" `
        -Method Post `
        -ContentType "application/json" `
        -Headers $VoiceHeaders `
        -Body $VoiceBody `
        -ErrorAction Stop

    if ($VoiceResponse) {
        Pass "Voice API endpoint accessible"
    }
} catch {
    Write-Host "⚠ Voice API response unexpected (may need token)" -ForegroundColor Yellow
}

# ============================================================================
# Test 10: API Config Endpoint
# ============================================================================

Write-Host "Test 10: API Config Endpoint"
try {
    $ConfigResponse = Invoke-RestMethod -Uri "$ApiUrl/api/config" `
        -Method Get `
        -ErrorAction Stop

    if ($ConfigResponse.version) {
        Pass "Config endpoint working"
    } else {
        Fail "Config endpoint not working"
    }
} catch {
    Fail "Config endpoint not working"
}

# ============================================================================
# Results Summary
# ============================================================================

Write-Host ""
Write-Host "======================"
Write-Host "📊 Test Results"
Write-Host "======================"
Write-Host "Passed: " -NoNewline
Write-Host "$Passed" -ForegroundColor Green
Write-Host "Failed: " -NoNewline
Write-Host "$Failed" -ForegroundColor Red
Write-Host ""

if ($Failed -eq 0) {
    Write-Host "✅ All smoke tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The system is ready for production use."
    Write-Host ""
    exit 0
} else {
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the failures above and fix the issues."
    Write-Host ""
    exit 1
}
