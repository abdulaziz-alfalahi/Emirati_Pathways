# Navigate to frontend directory
Set-Location -Path $PSScriptRoot

Write-Host "🚀 Starting Emirati Journey Platform Frontend..." -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:8080" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Red

npm run dev
