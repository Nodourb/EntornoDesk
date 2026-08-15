@echo off
:: ============================================================================
:: WINFIX UNIFIED - BACKEND LOCAL DE REPARACION Y REMEDIACION DE WINDOWS
:: ============================================================================
:: Proposito: Suite de auto-sanacion para Windows 10/11:
::   - Reparacion profunda de Windows Update (SoftwareDistribution + catroot2)
::   - Reparacion de integridad del sistema (DISM /RestoreHealth + SFC)
::   - Correccion del bloqueo de archivos locales (Zonas de Seguridad IE/Edge)
::   - Limpieza y re-escaneo de controladores PnP (Intel, Realtek, Samsung)
::   - Instalacion automatizada de dependencias .NET Desktop
:: 100% LOCAL - CERO DEPENDENCIAS DE SERVICIOS EXTERNOS
:: ============================================================================

setlocal EnableDelayedExpansion
title WinFix Unified - Local Windows Remediation Suite

:: 1. Auto-Elevacion de Privilegios UAC
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando privilegios de Administrador para WinFix...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\winfix_uac.vbs"
    echo UAC.ShellExecute "%~f0", "%*", "", "runas", 1 >> "%temp%\winfix_uac.vbs"
    "%temp%\winfix_uac.vbs"
    del "%temp%\winfix_uac.vbs" >nul 2>&1
    exit /b
)

set "WINFIX_ROOT=%~dp0"
if "%WINFIX_ROOT:~-1%"=="\" set "WINFIX_ROOT=%WINFIX_ROOT:~0,-1%"
pushd "%WINFIX_ROOT%"

:MENU
cls
echo ============================================================================
echo        WINFIX UNIFIED - BACKEND TECNICO DE REMEDIACION LOCAL
echo ============================================================================
echo   Ubicacion : %WINFIX_ROOT%
echo   Privilegios: Administrador (Elevado)
echo ============================================================================
echo.
echo   [1] REPARACION COMPLETA AUTOMATIZADA (Recomendado)
echo       - Reset Windows Update + DISM + SFC + Drivers + Desbloqueo de Seguridad
echo.
echo   [2] Solo Reset de Windows Update y Componentes
echo       - Purgar SoftwareDistribution, reiniciar wuauserv, bits, cryptsvc
echo.
echo   [3] Reparar Error de Seguridad Amarillo ("No se pueden abrir estos archivos")
echo       - Restablecer Zonas de Seguridad 0/1 y desbloquear archivos locales
echo.
echo   [4] Re-escanear y Depurar Drivers de Hardware (Intel, Realtek, Samsung)
echo       - Ejecutar pnputil /scan-devices y depuracion PnP
echo.
echo   [5] Instalar y Reparar Runtimes .NET (8.0 Desktop, Core 3.1)
echo       - Instalar dependencias para Revit y Plugins BIM
echo.
echo   [6] Activar Security Sandbox Layer (Desbloqueo de CMD, SmartScreen y NTFS)
echo       - Ejecutar SecuritySandbox-Engine.ps1 con politicas soberanas
echo.
echo   [7] Salir
echo ============================================================================
echo.
set /p "CHOICE= Seleccione una opcion (1-7) y presione ENTER: "

if "%CHOICE%"=="1" goto OP_FULL
if "%CHOICE%"=="2" goto OP_WU
if "%CHOICE%"=="3" goto OP_SEC
if "%CHOICE%"=="4" goto OP_DRV
if "%CHOICE%"=="5" goto OP_DOTNET
if "%CHOICE%"=="6" goto OP_SANDBOX
if "%CHOICE%"=="7" goto OP_EXIT
goto MENU

:OP_FULL
echo.
echo [INFO] Ejecutando Reparacion Completa...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%WINFIX_ROOT%\WinFix-Backend.ps1" -Mode FullRepair
if exist "%WINFIX_ROOT%\SecurityZone-Fix.ps1" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%WINFIX_ROOT%\SecurityZone-Fix.ps1"
)
pause
goto MENU

:OP_WU
echo.
echo [INFO] Ejecutando Reset de Windows Update...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%WINFIX_ROOT%\WinFix-Backend.ps1" -Mode WindowsUpdateOnly
pause
goto MENU

:OP_SEC
echo.
echo [INFO] Ejecutando Reparacion de Zonas de Seguridad...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%WINFIX_ROOT%\SecurityZone-Fix.ps1"
pause
goto MENU

:OP_DRV
echo.
echo [INFO] Ejecutando Re-escaneo de Drivers...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%WINFIX_ROOT%\WinFix-Backend.ps1" -Mode DriversOnly
pause
goto MENU

:OP_DOTNET
echo.
echo [INFO] Ejecutando Instalacion de Runtimes .NET...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%WINFIX_ROOT%\DotNet-Fix.ps1"
pause
goto MENU

:OP_SANDBOX
echo.
echo [INFO] Ejecutando Security Sandbox Engine (Remediacion Soberana)...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%WINFIX_ROOT%\SecuritySandbox-Engine.ps1" -Action RemediateAll
pause
goto MENU

:OP_EXIT
popd
exit /b 0
