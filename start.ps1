# Start Intelligent Prompt-to-Visualization Agent Full-Stack Application (FastAPI + React Vite)
$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Intelligent Prompt-to-Visualization Agent" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Resolve project base directory
$baseDir = if (Test-Path "$PSScriptRoot\ChartCraft-main\backend") { "$PSScriptRoot\ChartCraft-main" } else { $PSScriptRoot }
$backendDir = "$baseDir\backend"
$frontendDir = "$baseDir\frontend"
$pythonExe = "$backendDir\venv\Scripts\python.exe"

# 1. Verify / Launch FastAPI Backend on Port 8000
$port8000Active = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
if ($port8000Active) {
    Write-Host "[OK] Backend is already running on http://127.0.0.1:8000 (PID: $($port8000Active.OwningProcess[0]))" -ForegroundColor Green
} else {
    Write-Host "[...] Starting FastAPI Backend at http://127.0.0.1:8000 ..." -ForegroundColor Yellow
    if (Test-Path $pythonExe) {
        Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "Set-Location '$backendDir'; Write-Host 'ChartCraft Backend (FastAPI)' -ForegroundColor Cyan; & '$pythonExe' -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
    } else {
        Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "Set-Location '$backendDir'; Write-Host 'ChartCraft Backend (FastAPI)' -ForegroundColor Cyan; python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
    }
}

# 2. Verify / Launch React Vite Frontend on Port 5173
$port5173Active = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
if ($port5173Active) {
    Write-Host "[OK] Frontend is already running on http://localhost:5173 (PID: $($port5173Active.OwningProcess[0]))" -ForegroundColor Green
} else {
    Write-Host "[...] Starting Vite React Frontend at http://localhost:5173 ..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "Set-Location '$frontendDir'; Write-Host 'ChartCraft Frontend (Vite React)' -ForegroundColor Cyan; npm run dev"
}

# Wait briefly for startup and launch browser
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Intelligent Prompt-to-Visualization Agent is Live!" -ForegroundColor Green
Write-Host "  Frontend Canvas: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
