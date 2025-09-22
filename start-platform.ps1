Write-Host "🚀 Starting Complete Emirati Journey Platform..." -ForegroundColor Green
Write-Host "=================================================="

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-File", ".\backend\start-backend.ps1"

# Wait a moment for backend to start
Start-Sleep -Seconds 5

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-File", ".\frontend\start-frontend.ps1"

Write-Host ""
Write-Host "✅ Platform started successfully!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:8080" -ForegroundColor Yellow
Write-Host "🔧 Backend API: http://localhost:5003" -ForegroundColor Yellow
Write-Host "🛡️ Admin Dashboard: http://localhost:8080/admin" -ForegroundColor Yellow
Write-Host ""
Write-Host "Close the PowerShell windows to stop the services" -ForegroundColor Red
