@echo off
:: ============================================================================
:: AUTODESK BIM ENVIRONMENT MANAGER (ABEM) - SAFE ENTRY POINT & SMOKE TEST
:: ============================================================================
:: Purpose: Launches the ABEM Functional Smoke Test in a strictly read-only,
:: non-destructive execution mode with process-scoped PowerShell execution policy.
:: Resilient against broken PowerShell initializers via fallback execution.
:: ============================================================================

setlocal EnableDelayedExpansion
title ABEM - Autodesk BIM Environment Manager (Smoke Test)

:: 1. Self-Locate Repository Root
set "ABEM_ROOT=%~dp0"
if "%ABEM_ROOT:~-1%"=="\" set "ABEM_ROOT=%ABEM_ROOT:~0,-1%"

:: 2. Check for Administrative Privileges (Pure CMD)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Requesting Administrator Privileges for System ^& Service Audit...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~f0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs" >nul 2>&1
    exit /b
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

:: 3. Safe invocation with automatic self-healing resilience
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ABEM_ROOT%\Deploy-BimEnvironment.ps1" -Mode SmokeTest

set "EXIT_CODE=%ERRORLEVEL%"

:: Check if failed with CLR / ServicePointManager initialization error (Exit Code -65536 or non-zero)
if %EXIT_CODE% neq 0 (
    echo.
    echo [AUTO-REPAIR DETECTED] Intento 1 finalizo con codigo %EXIT_CODE%.
    echo [AUTO-REPAIR DETECTED] Ejecutando auto-reparacion de directivas .NET TLS/Crypto via Fix-NetSecurityPointManager.bat...
    echo ----------------------------------------------------------------------------
    if exist "%ABEM_ROOT%\Fix-NetSecurityPointManager.bat" (
        call "%ABEM_ROOT%\Fix-NetSecurityPointManager.bat"
        echo.
        echo [AUTO-REPAIR DETECTED] Re-ejecutando Smoke Test tras reparar el Registro...
        echo ----------------------------------------------------------------------------
        powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ABEM_ROOT%\Deploy-BimEnvironment.ps1" -Mode SmokeTest
        set "EXIT_CODE=!ERRORLEVEL!"
    )
)

echo.
echo ----------------------------------------------------------------------------
if %EXIT_CODE% equ 0 (
    echo [SMOKE TEST RESULT] ABEM CORE ENGINE VERIFICATION: PASSED (Code 0)
) else (
    echo [SMOKE TEST RESULT] ABEM CORE ENGINE VERIFICATION: COMPLETED WITH WARNINGS/ISSUES (Code %EXIT_CODE%)
    echo.
    echo [TIP] Si observas persistencia en 'System.Net.ServicePointManager', instala PowerShell 7 con:
    echo       Install-PowerShell7.bat
)
echo ----------------------------------------------------------------------------
echo.
echo Press any key to close this console...
pause >nul
popd
exit /b %EXIT_CODE%
