$ErrorActionPreference = "Stop"

# Base URL (Docker-first). Allow override via API_BASE_URL env.
$BaseUrl = $env:API_BASE_URL
if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = "http://localhost:3000"
}

Write-Host "Using API base: $BaseUrl"

function Invoke-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        $Body = $null
    )

    $uri = "$BaseUrl$Path"
    try {
        if ($Body) {
            $json = $Body | ConvertTo-Json -Depth 10
            $resp = Invoke-RestMethod -Uri $uri -Method $Method -ContentType "application/json" -Body $json
        } else {
            $resp = Invoke-RestMethod -Uri $uri -Method $Method
        }
        [PSCustomObject]@{
            endpoint = $Path
            status   = "OK"
            success  = $true
            data     = $resp
        }
    } catch {
        Write-Error "Endpoint failed: $Name ($Path) - $($_.Exception.Message)"
        exit 1
    }
}

$results = @()

$results += Invoke-Endpoint -Name "Health" -Method "GET" -Path "/health"
$results += Invoke-Endpoint -Name "Registry" -Method "GET" -Path "/api/agents/registry"
$results += Invoke-Endpoint -Name "SystemHealth" -Method "GET" -Path "/api/system/health"

$p0Body = @{ userId = "darnell" }
$p0 = Invoke-Endpoint -Name "P0 Daily Focus" -Method "POST" -Path "/api/exec-admin/p0/daily-focus" -Body $p0Body
$results += $p0

$p1Body = @{
    userId   = "darnell"
    agentKey = "brand.storyteller.generate"
    input    = @{ topic = "Elevated Movements corporate partnerships" }
}
$p1 = Invoke-Endpoint -Name "P1 Brand Storyteller" -Method "POST" -Path "/api/exec-admin/p1/run" -Body $p1Body
$results += $p1

$results += Invoke-Endpoint -Name "Actions Pending" -Method "GET" -Path "/api/actions/pending"

Write-Host ""
Write-Host "Verification Summary"
$results | ForEach-Object {
    $path = $_.endpoint
    $ok = $_.success
    Write-Host ("{0,-40} success={1}" -f $path, $ok)
}

Write-Host ""
Write-Host "P0 Daily Focus key fields:"
Write-Host ("  qaStatus: {0}" -f $p0.data.qaStatus)
Write-Host ("  runId:    {0}" -f $p0.data.runId)
Write-Host ("  confidenceScore: {0}" -f $p0.data.confidenceScore)

Write-Host ""
Write-Host "P1 Brand Storyteller key fields:"
Write-Host ("  agentKey: {0}" -f $p1.data.agentKey)
$plannedCount = 0
if ($p1.data.plannedActionIds) { $plannedCount = $p1.data.plannedActionIds.Count }
Write-Host ("  plannedActionIds: {0}" -f $plannedCount)

Write-Host ""
Write-Host "All endpoints verified." -ForegroundColor Green
