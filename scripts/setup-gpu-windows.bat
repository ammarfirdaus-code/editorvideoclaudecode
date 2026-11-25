@echo off
rem Double-click this file in the project folder to run the Windows GPU setup.
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-gpu-windows.ps1"
echo.
pause
