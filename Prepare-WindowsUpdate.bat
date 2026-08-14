@echo off
:: ============================================================================
:: AUTODESK BIM ENVIRONMENT MANAGER (ABEM) / AKS WORKSPACE PIPELINE
:: WINDOWS UPDATE PREPARATION MANAGER (ZERO DATA LOSS IN-PLACE PREPARATION)
:: ============================================================================
:: Purpose: Orquesta de manera segura y ordenada todas las fases de preparacion
:: previa para la actualizacion a Windows 11 / Windows 10 22H2:
:: 1. Desbloqueo de descargas en Edge & SmartScreen overrides
:: 2. Exclusion temporal en Defender para rutas de Staging y Autodesk
:: 3. Verificacion y auto-reparacion de integridad (DISM + SFC)
:: 4. Validacion y sincronizacion de Certificados Raiz de Microsoft
:: 5. Auditoria de instaladores registrados (ISO 24H2/25H2, .NET 4.8.1, Win11 Assistant)
:: 6. Generacion de reporte estructurado JSON para el workspace AKS
:: ============================================================================

setlocal EnableDelayedExpansion
title ABEM - Windows Update Preparation Manager (AKS Workspace Engine)

echo.
echo ============================================================================
echo   ABEM / AKS WORKSPACE - WINDOWS UPDATE PREPARATION MANAGER
echo ============================================================================
echo   Pipeline: PREPARACION, INTEGRIDAD Y AUDITORIA PREVIA DE WINDOWS
echo   Garantia: 100%% SIN PERDIDA DE DATOS NI DESCARGAS AUTOMATICAS FORZADAS
echo ============================================================================
echo.

:: 1. Elevacion a Administrador (CMD nativo puro)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando privilegios de Administrador para ejecutar DISM y SFC...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin_prep.vbs"
    echo UAC.ShellExecute "%~f0", "", "", "runas", 1 >> "%temp%\getadmin_prep.vbs"
    "%temp%\getadmin_prep.vbs"
    del "%temp%\getadmin_prep.vbs" >nul 2>&1
    exit /b
)

echo [+] Privilegios de Administrador verificados.
echo.

:: 2. Crear carpetas de registro y staging de AKS
set "WORKSPACE_ROOT=%~dp0"
if "%WORKSPACE_ROOT:~-1%"=="\" set "WORKSPACE_ROOT=%WORKSPACE_ROOT:~0,-1%"

if not exist "%WORKSPACE_ROOT%\reports" mkdir "%WORKSPACE_ROOT%\reports"
if not exist "%WORKSPACE_ROOT%\logs" mkdir "%WORKSPACE_ROOT%\logs"
if not exist "C:\BIM\Staging_Upgrade" mkdir "C:\BIM\Staging_Upgrade"

echo [*] Workspace AKS localizado en: %WORKSPACE_ROOT%
echo [*] Directorio de Staging preparado en: C:\BIM\Staging_Upgrade
echo.

:: 3. Opciones de Pipeline Interactivo
echo Selecciona la fase de ejecucion deseada:
echo   [1] Pipeline Completo de Preparacion (Edge + Defender + DISM/SFC + Certificados + Auditoria)
echo   [2] Solo Diagnostico y Auditoria Rapida (Sin tocar Component Store)
echo   [3] Reparacion Profunda de Integridad (DISM /RestoreHealth + SFC /scannow)
echo   [4] Post-Update Scanner (WinSxS Store, CBS/DISM Logs, Windows Update Agent)
echo.
set /p "CHOICE=Selecciona una opcion (1-4, Default=1): "
if "%CHOICE%"=="" set "CHOICE=1"

set "PIPELINE_MODE=FullPreparation"
if "%CHOICE%"=="2" set "PIPELINE_MODE=AuditOnly"
if "%CHOICE%"=="3" set "PIPELINE_MODE=RepairStore"
if "%CHOICE%"=="4" set "PIPELINE_MODE=PostUpdateScan"

echo.
echo [*] Iniciando ejecucion en modo: %PIPELINE_MODE%...
echo ----------------------------------------------------------------------------

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%WORKSPACE_ROOT%\modules\07_WindowsUpdatePreparationManager.ps1" -PipelineMode "%PIPELINE_MODE%" -AksWorkspaceRoot "%WORKSPACE_ROOT%"

set "PREP_EXIT=%ERRORLEVEL%"

echo.
echo ============================================================================
if %PREP_EXIT% equ 0 (
    echo   [EXITO] Pipeline de preparacion completado satisfactoriamente.
    echo   Revisa tu reporte consolidado en la carpeta: .\reports\
) else (
    echo   [AVISO] El pipeline finalizo con advertencias (Codigo %PREP_EXIT%).
    echo   Consulta los registros detallados en: .\logs\
)
echo ============================================================================
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
