# Navigate to backend directory
Set-Location -Path $PSScriptRoot

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start backend
Write-Host "🚀 Starting Emirati Journey Platform Backend..." -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:5003" -ForegroundColor Yellow
Write-Host "Health check: http://localhost:5003/health" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Red

python app.py
