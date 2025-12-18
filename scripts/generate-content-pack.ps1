#Requires -Version 7.0
param(
    [switch]$ApproveFirstOne
)

$ErrorActionPreference = "Stop"

$BaseUrl = $env:API_BASE_URL
if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = "http://localhost:3000"
}
Write-Host "Using API base: $BaseUrl"

function Call-P1 {
    param([string]$topic)
    $body = @{
        userId   = "darnell"
        agentKey = "brand.storyteller.generate"
        input    = @{ topic = $topic }
    } | ConvertTo-Json -Depth 10
    Invoke-RestMethod -Uri "$BaseUrl/api/exec-admin/p1/run" -Method Post -ContentType "application/json" -Body $body
}

$topics = @(
    "why strengths-centered leadership works",
    "leading diverse teams without code-switching",
    "what corporate partners actually get: outcomes + ROI"
)

$runs = @()
foreach ($t in $topics) {
    Write-Host "Running P1 brand.storyteller.generate for topic: $t"
    $runs += Call-P1 -topic $t
}

$pending = Invoke-RestMethod -Uri "$BaseUrl/api/actions/pending" -Method Get

Write-Host ""
Write-Host "=== Content Pack (PLAN-only) ==="
for ($i=0; $i -lt $runs.Count; $i++) {
    $r = $runs[$i]
    Write-Host ("Run {0}: {1}" -f ($i+1), $topics[$i])
    Write-Host ("  summary: {0}" -f $r.output.summary)
    if ($r.plannedActionIds) {
        Write-Host ("  plannedActionIds: {0}" -f ($r.plannedActionIds -join ", "))
    }
}

Write-Host ""
Write-Host "Pending actions:"
if ($pending.actions) {
    $pending.actions | ForEach-Object {
        Write-Host ("- {0} [{1}] {2}" -f $_.id, $_.type, $_.detail)
    }
} else {
    Write-Host "(none)"
}

if ($ApproveFirstOne -and $pending.actions -and $pending.actions.Count -gt 0) {
    $first = $pending.actions[0]
    Write-Host ""
    Write-Host "Approving first action (PLAN mode only): $($first.id)"
    $approveBody = @{ approvedBy = "darnell" } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Uri "$BaseUrl/api/actions/$($first.id)/approve" -Method Post -ContentType "application/json" -Body $approveBody | Out-Null

    $execBody = @{ mode = "PLAN" } | ConvertTo-Json -Depth 5
    $receipt = Invoke-RestMethod -Uri "$BaseUrl/api/actions/$($first.id)/execute" -Method Post -ContentType "application/json" -Body $execBody
    Write-Host "Execution receipt (PLAN):"
    $receipt | ConvertTo-Json -Depth 10
}

# Save latest pack response if present
if ($runs.Count -gt 0) {
    $lastPack = $runs[$runs.Count - 1]
    if ($lastPack.pack) {
        $path = Join-Path $outputDir "$($lastPack.pack.packId).json"
        $lastPack.pack | ConvertTo-Json -Depth 10 | Out-File -FilePath $path -Encoding utf8
        Write-Host ""
        Write-Host "Saved latest pack to $path"
    }
}

Write-Host ""
Write-Host "Done. All actions remain PLAN-only unless explicitly approved."
$outputDir = Join-Path (Get-Location) ".outputs/content-packs"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}
