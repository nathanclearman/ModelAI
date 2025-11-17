# Script to add GitHub remote and push to GitHub
# GitHub Username: nathanclearman
# Repository: ModelAI

# Navigate to project
cd "$env:USERPROFILE\Downloads\ModelAI\ModelAI"

# Add GitHub remote
git remote add origin https://github.com/nathanclearman/ModelAI.git

# Check it was added
Write-Host "Checking remotes..." -ForegroundColor Green
git remote -v

# Check current branch
Write-Host "`nChecking current branch..." -ForegroundColor Green
git branch

# Add all changes
Write-Host "`nAdding all changes..." -ForegroundColor Green
git add .

# Commit
Write-Host "`nCommitting changes..." -ForegroundColor Green
git commit -m "Fix Railway build configuration and add deployment files"

# Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Green
git push -u origin main

Write-Host "`nDone! Check your GitHub repository to see the changes." -ForegroundColor Green

