# Emirati Journey Platform - Windows Startup Script
# Run this script to start both backend and frontend

Write-Host "🇦🇪 EMIRATI JOURNEY PLATFORM - WINDOWS STARTUP" -ForegroundColor Green
Write-Host "=" * 50

# Check if we're in the right directory
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "Expected structure: backend/ and frontend/ folders" -ForegroundColor Yellow
    exit 1
}

# Function to start backend
function Start-Backend {
    Write-Host "🚀 Starting Backend Server..." -ForegroundColor Cyan
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd backend; python start_backend_windows.py"
}

# Function to start frontend
function Start-Frontend {
    Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
}

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.11+" -ForegroundColor Red
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

# Install backend dependencies if needed
if (-not (Test-Path "backend/venv")) {
    Write-Host "📦 Setting up Python virtual environment..." -ForegroundColor Yellow
    cd backend
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    cd ..
}

# Install frontend dependencies if needed
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    cd frontend
    npm install
    cd ..
}

Write-Host "🎯 Starting servers..." -ForegroundColor Green
Write-Host "Backend will start on: http://localhost:5003" -ForegroundColor Cyan
Write-Host "Frontend will start on: http://localhost:8080" -ForegroundColor Cyan

# Start both servers
Start-Backend
Start-Sleep -Seconds 3
Start-Frontend

Write-Host "✅ Both servers are starting in separate windows" -ForegroundColor Green
Write-Host "🌐 Open http://localhost:8080 in your browser" -ForegroundColor Yellow
Write-Host "🔐 Test login: ahmed.almansouri@gmail.com / TestPassword123!" -ForegroundColor Yellow
