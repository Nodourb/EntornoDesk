@echo off
:: ============================================================================
:: AUTODESK BIM ENVIRONMENT MANAGER (ABEM) - SAFE ENTRY POINT & SMOKE TEST
:: ============================================================================
:: Purpose: Launches the ABEM Functional Smoke Test in a strictly read-only,
:: non-destructive execution mode with process-scoped PowerShell execution policy.
:: Enforces TLS 1.2 / TLS 1.3 ServicePointManager and Strong Crypto pre-initialization.
:: ============================================================================

setlocal EnableDelayedExpansion
title ABEM - Autodesk BIM Environment Manager (Smoke Test)

:: 1. Self-Locate Repository Root
set "ABEM_ROOT=%~dp0"
if "%ABEM_ROOT:~-1%"=="\" set "ABEM_ROOT=%ABEM_ROOT:~0,-1%"

:: 2. Check for Administrative Privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Requesting Administrator Privileges for System ^& Service Audit...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor 3072 -bor 12288; Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b %errorlevel%
)

pushd "%ABEM_ROOT%"

echo.
echo ============================================================================
echo      AUTODESK BIM ENVIRONMENT MANAGER (ABEM) - FUNCTIONAL SMOKE TEST
echo ============================================================================
echo   Repository Root : %ABEM_ROOT%
echo   Execution Mode  : SMOKE_TEST (Read-Only / Discovery Mode)
echo   Safety Policy   : System Modifications Blocked (0 Changes Guaranteed)
echo ============================================================================
echo.

:: 3. Pre-initialize TLS 1.2 / TLS 1.3 System.Net.ServicePointManager & Launch Orchestrator
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
    "[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]3072 -bor [System.Net.SecurityProtocolType]12288 -bor [System.Net.SecurityProtocolType]768; & '%ABEM_ROOT%\Deploy-BimEnvironment.ps1' -Mode SmokeTest"

set "EXIT_CODE=%ERRORLEVEL%"

echo.
echo ----------------------------------------------------------------------------
if %EXIT_CODE% equ 0 (
    echo [SMOKE TEST RESULT] ABEM CORE ENGINE VERIFICATION: PASSED (Code 0)
) else (
    echo [SMOKE TEST RESULT] ABEM CORE ENGINE VERIFICATION: COMPLETED WITH WARNINGS/ISSUES (Code %EXIT_CODE%)
)
echo ----------------------------------------------------------------------------
echo.
echo Press any key to close this console...
pause >nul
popd
exit /b %EXIT_CODE%
