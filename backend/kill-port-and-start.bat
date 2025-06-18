@echo off
echo Checking for processes using port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Found process %%a using port 3000
    taskkill /f /pid %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo Successfully killed process %%a
    ) else (
        echo Failed to kill process %%a
    )
)
echo Port 3000 should now be available.
echo Starting server...
npm run dev
