# Run the FastAPI backend
$backendDir = Join-Path $PSScriptRoot "backend"
if (-not (Test-Path $backendDir)) { Write-Error "backend folder not found"; exit 1 }
Set-Location $backendDir
$pythonExe = Join-Path $backendDir "venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "Creating venv..."
    python -m venv venv
    & "$pythonExe" -m pip install -r requirements.txt -q
}

Write-Host "Starting backend at http://localhost:8000 (docs: http://localhost:8000/docs)" -ForegroundColor Green
& "$pythonExe" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
