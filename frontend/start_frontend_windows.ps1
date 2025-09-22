# Emirati Journey Platform - Frontend Windows Startup Script

Write-Host "🇦🇪 EMIRATI JOURNEY PLATFORM - FRONTEND STARTUP" -ForegroundColor Green
Write-Host "=" * 50

# Check if we're in the frontend directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the frontend directory" -ForegroundColor Red
    Write-Host "Expected: frontend/package.json should exist" -ForegroundColor Yellow
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Clear Vite cache
Write-Host "🧹 Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.vite") {
    Remove-Item "node_modules/.vite" -Recurse -Force
}

# Start the development server
Write-Host "🚀 Starting Vite development server..." -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:8080" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray

npm run dev
