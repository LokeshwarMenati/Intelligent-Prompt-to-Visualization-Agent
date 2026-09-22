@echo off
setlocal enabledelayedexpansion

echo ====================================================
echo Starting Intelligent Prompt-to-Visualization Agent
echo ====================================================

REM Resolve base directory cleanly
set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%ChartCraft-main\backend" (
    set "BASE_DIR=%SCRIPT_DIR%ChartCraft-main"
) else (
    set "BASE_DIR=%SCRIPT_DIR%"
)

REM Strip trailing slash if present
if "%BASE_DIR:~-1%"=="\" set "BASE_DIR=%BASE_DIR:~0,-1%"

set "PYTHON_EXE=%BASE_DIR%\backend\venv\Scripts\python.exe"

REM Start Backend
if exist "%PYTHON_EXE%" (
    echo Starting FastAPI Backend using venv python...
    start "ChartCraft Backend" cmd /k "cd /d "%BASE_DIR%\backend" && "%PYTHON_EXE%" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
) else (
    echo Starting FastAPI Backend using system python...
    start "ChartCraft Backend" cmd /k "cd /d "%BASE_DIR%\backend" && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
)

REM Start Frontend
echo Starting Frontend (Vite React on port 5173)...
start "ChartCraft Frontend" cmd /k "cd /d "%BASE_DIR%\frontend" && npm run dev"

timeout /t 3 >nul
start http://localhost:5173

echo ====================================================
echo Intelligent Prompt-to-Visualization Agent is Live!
echo Frontend Canvas: http://localhost:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ====================================================
