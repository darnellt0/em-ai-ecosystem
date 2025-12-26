# ============================================
# DAILY BRIEF - WINDOWS TASK SCHEDULER SCRIPT
# ============================================
# This script is called by Windows Task Scheduler

$LogFile = "C:\dev\elevated-movements\em-ai-ecosystem\logs\daily-brief.log"
$ApiUrl = "http://localhost:3001/api/exec-admin/dispatch"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $LogFile -Append
}

Write-Log "Starting Daily Brief..."

try {
    # Call Daily Brief Agent
    $response = Invoke-WebRequest `
        -Uri $ApiUrl `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body '{"intent":"daily_brief","payload":{"userId":"darnell@elevatedmovements.com","mode":"live"}}' `
        -TimeoutSec 60

    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Log "Daily Brief generated successfully"
        
        # TODO: Send email with brief content
        # For now, save to file
        $briefFile = "C:\dev\elevated-movements\em-ai-ecosystem\logs\daily-brief-$(Get-Date -Format 'yyyy-MM-dd').json"
        $data | ConvertTo-Json -Depth 10 | Out-File -FilePath $briefFile
        
        Write-Log "Brief saved to $briefFile"
    } else {
        Write-Log "Daily Brief failed: $($data | ConvertTo-Json)"
    }
} catch {
    Write-Log "ERROR: $($_.Exception.Message)"
}

Write-Log "Daily Brief complete"
