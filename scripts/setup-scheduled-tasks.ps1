# ============================================
# SETUP WINDOWS SCHEDULED TASKS
# ============================================
# Run this script as Administrator to create scheduled tasks

# Daily Brief - 6:00 AM PT (Mon-Fri)
$taskName = "EM-DailyBrief"
$scriptPath = "C:\dev\elevated-movements\em-ai-ecosystem\scripts\daily-brief-task.ps1"

# Remove existing task if present
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# Create trigger (6 AM, Mon-Fri)
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At 6:00AM

# Create action
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""

# Create settings
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

# Register task
Register-ScheduledTask -TaskName $taskName -Trigger $trigger -Action $action -Settings $settings -Description "EM AI Ecosystem - Daily Brief Generator"

Write-Host "✅ Created scheduled task: $taskName"
Write-Host "   Schedule: 6:00 AM PT, Monday-Friday"
Write-Host ""
Write-Host "To test immediately, run:"
Write-Host "   Start-ScheduledTask -TaskName '$taskName'"
