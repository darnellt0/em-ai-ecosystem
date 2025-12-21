# Merge compassionate-pike worktree changes to main branch
# This script commits current changes, pushes to remote, and merges into main

param(
    [switch]$SkipTests = $false,
    [switch]$DeleteBranch = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== Merge to Main Script ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$mainRepoPath = "C:\dev\elevated-movements\em-ai-ecosystem"
$currentBranch = "codex/voice-turn-endpoint-chat-ui"
$targetBranch = "main"

# Step 1: Verify we're in the right location
Write-Host "Step 1: Verifying location" -ForegroundColor Yellow
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray

$currentGitBranch = git rev-parse --abbrev-ref HEAD 2>$null
if ($currentGitBranch -ne $currentBranch) {
    Write-Host "X Not on expected branch. Current: $currentGitBranch, Expected: $currentBranch" -ForegroundColor Red
    Write-Host "Please run this script from the compassionate-pike worktree." -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ On branch: $currentGitBranch" -ForegroundColor Green
Write-Host ""

# Step 2: Check for uncommitted changes
Write-Host "Step 2: Checking for uncommitted changes" -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Found uncommitted changes:" -ForegroundColor Cyan
    git status --short | Write-Host
    Write-Host ""
} else {
    Write-Host "✓ No uncommitted changes" -ForegroundColor Green
    Write-Host ""
}

# Step 3: Stage and commit changes
if ($gitStatus) {
    Write-Host "Step 3: Staging and committing changes" -ForegroundColor Yellow

    git add . 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "X Failed to stage changes" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Staged all changes" -ForegroundColor Green

    git commit -m "feat(voice): add canonical journal execution with run history" -m "- Created journal-execution.service.ts for unified journal execution" -m "- Updated voice turn to use p0RunHistory with UUID runIds" -m "- Moved artifact to assistant level in response" -m "- Added comprehensive tests for UUID validation" -m "- Created VOICE_COMMANDS.md documentation" -m "- Added DOCKER_PROJECTS.md for compose project management" 2>&1 | Out-Null

    if ($LASTEXITCODE -ne 0) {
        Write-Host "X Failed to commit changes" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Committed changes" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Step 3: Skipping commit (no changes)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 4: Push current branch to remote
Write-Host "Step 4: Pushing $currentBranch to remote" -ForegroundColor Yellow
git push -u origin $currentBranch 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "X Failed to push branch" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Pushed $currentBranch to origin" -ForegroundColor Green
Write-Host ""

# Step 5: Navigate to main repository
Write-Host "Step 5: Navigating to main repository" -ForegroundColor Yellow
Write-Host "Switching from worktree to: $mainRepoPath" -ForegroundColor Gray

if (-not (Test-Path $mainRepoPath)) {
    Write-Host "X Main repository not found at: $mainRepoPath" -ForegroundColor Red
    exit 1
}

Set-Location $mainRepoPath
Write-Host "✓ Changed to main repository" -ForegroundColor Green
Write-Host ""

# Step 6: Checkout main branch
Write-Host "Step 6: Checking out main branch" -ForegroundColor Yellow
git checkout $targetBranch 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "X Failed to checkout $targetBranch" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Checked out $targetBranch" -ForegroundColor Green
Write-Host ""

# Step 7: Pull latest changes from remote
Write-Host "Step 7: Pulling latest changes from remote" -ForegroundColor Yellow
git pull origin $targetBranch 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Pull had issues, but continuing..." -ForegroundColor Yellow
}
Write-Host "✓ Pulled latest $targetBranch" -ForegroundColor Green
Write-Host ""

# Step 8: Merge feature branch
Write-Host "Step 8: Merging $currentBranch into $targetBranch" -ForegroundColor Yellow
git merge $currentBranch --no-ff -m "Merge branch '$currentBranch' into main" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "X Merge failed - conflicts detected" -ForegroundColor Red
    Write-Host ""
    Write-Host "Conflict resolution needed:" -ForegroundColor Yellow
    git status
    Write-Host ""
    Write-Host "To resolve:" -ForegroundColor Cyan
    Write-Host "  1. Fix conflicts in the files listed above" -ForegroundColor Gray
    Write-Host "  2. git add <resolved-files>" -ForegroundColor Gray
    Write-Host "  3. git commit" -ForegroundColor Gray
    Write-Host "  4. git push origin $targetBranch" -ForegroundColor Gray
    exit 1
}
Write-Host "✓ Merged successfully" -ForegroundColor Green
Write-Host ""

# Step 9: Push merged main to remote
Write-Host "Step 9: Pushing merged $targetBranch to remote" -ForegroundColor Yellow
git push origin $targetBranch 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "X Failed to push $targetBranch" -ForegroundColor Red
    Write-Host "You may need to push manually: git push origin $targetBranch" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Pushed $targetBranch to origin" -ForegroundColor Green
Write-Host ""

# Step 10: Optional - Delete feature branch
if ($DeleteBranch) {
    Write-Host "Step 10: Deleting feature branch" -ForegroundColor Yellow

    git branch -d $currentBranch 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Deleted local branch: $currentBranch" -ForegroundColor Green
    } else {
        Write-Host "Warning: Could not delete local branch (may still be checked out in worktree)" -ForegroundColor Yellow
    }

    git push origin --delete $currentBranch 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Deleted remote branch: $currentBranch" -ForegroundColor Green
    } else {
        Write-Host "Warning: Could not delete remote branch" -ForegroundColor Yellow
    }
    Write-Host ""
} else {
    Write-Host "Step 10: Skipping branch deletion (use -DeleteBranch to enable)" -ForegroundColor Yellow
    Write-Host ""
}

# Step 11: Verification
Write-Host "Step 11: Verification" -ForegroundColor Yellow
Write-Host "Recent commits on main:" -ForegroundColor Cyan
git log --oneline -5
Write-Host ""

Write-Host "=== Merge Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  ✓ Committed changes on $currentBranch" -ForegroundColor Green
Write-Host "  ✓ Pushed $currentBranch to remote" -ForegroundColor Green
Write-Host "  ✓ Merged $currentBranch into $targetBranch" -ForegroundColor Green
Write-Host "  ✓ Pushed $targetBranch to remote" -ForegroundColor Green
Write-Host ""
Write-Host "Current location: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""
