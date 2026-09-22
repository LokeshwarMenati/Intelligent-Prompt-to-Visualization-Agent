# Run the React frontend. Use from project root (DataViz-Agent-main).
# Start the backend first (run-backend.ps1) in another terminal.
$frontendDir = Join-Path $PSScriptRoot "frontend"
if (-not (Test-Path $frontendDir)) { Write-Error "frontend folder not found"; exit 1 }
Set-Location $frontendDir
npm install
Write-Host "Starting frontend at http://localhost:5173"
npm run dev
