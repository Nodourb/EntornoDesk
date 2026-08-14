@echo off
:: ============================================================================
:: AUTODESK BIM ENVIRONMENT MANAGER (ABEM) - POWERSHELL 7 BOOTSTRAP INSTALLER
:: ============================================================================
:: Purpose: Descarga e instala de forma silenciosa la version mas reciente de
:: PowerShell 7 (x64) (pwsh.exe) directamente en tu sistema Windows local,
:: reemplazando las limitaciones y corrupciones del antiguo PowerShell 5.1.
:: Funciona mediante winget oficial o descarga directa desde GitHub de Microsoft.
:: ============================================================================

setlocal EnableDelayedExpansion
title ABEM - Instalador Oficial de PowerShell 7 (x64)

echo.
echo ============================================================================
echo   ABEM - INSTALADOR OFICIAL DE POWERSHELL 7 (x64) PARA WINDOWS
echo ============================================================================
echo.

:: 1. Verificar Privilegios de Administrador (CMD nativo)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando permisos de Administrador...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin_ps7.vbs"
    echo UAC.ShellExecute "%~f0", "", "", "runas", 1 >> "%temp%\getadmin_ps7.vbs"
    "%temp%\getadmin_ps7.vbs"
    del "%temp%\getadmin_ps7.vbs" >nul 2>&1
    exit /b
)

echo [+] Privilegios de Administrador confirmados.
echo.

:: 2. Probar instalacion mediante Windows Package Manager (winget)
echo [*] METODO 1: Verificando disponibilidad de Windows Package Manager (winget)...
where winget >nul 2>&1
if %errorlevel% equ 0 (
    echo   [+] 'winget' detectado. Iniciando instalacion silenciosa de PowerShell 7...
    echo.
    winget install --id Microsoft.PowerShell --exact --source winget --accept-package-agreements --accept-source-agreements --silent
    if %errorlevel% equ 0 (
        echo.
        echo ============================================================================
        echo   [EXITO] PowerShell 7 (x64) se ha instalado correctamente via winget.
        echo   Puedes abrirlo escribiendo 'pwsh' en cualquier terminal o menu de inicio.
        echo ============================================================================
        goto :TEST_AND_FINISH
    )
)

echo.
echo [*] METODO 2: Descarga directa del instalador MSI oficial desde Microsoft GitHub...
echo ----------------------------------------------------------------------------
set "PS7_URL=https://github.com/PowerShell/PowerShell/releases/download/v7.4.5/PowerShell-7.4.5-win-x64.msi"
set "MSI_PATH=%temp%\PowerShell-7.4.5-win-x64.msi"

echo   Descargando instalador MSI de 64-bit...
curl.exe -L -o "%MSI_PATH%" "%PS7_URL%"

if exist "%MSI_PATH%" (
    echo   [+] Descarga completada. Ejecutando instalador en modo desatendido...
    msiexec.exe /i "%MSI_PATH%" /qn /norestart ADD_EXPLORER_CONTEXT_MENU_OPENPOWERSHELL=1 ADD_FILE_CONTEXT_MENU_RUNPOWERSHELL=1 ENABLE_PSREMOTING=1 REGISTER_MANIFEST=1
    del "%MSI_PATH%" >nul 2>&1
    echo   [+] Instalacion MSI finalizada.
) else (
    echo   [!] No se pudo descargar el instalador automaticamente.
    echo   Por favor descargalo manualmente desde:
    echo   https://github.com/PowerShell/PowerShell/releases
)

:TEST_AND_FINISH
echo.
echo [*] PASO 3: Verificando ejecucion del nuevo motor 'pwsh.exe'...
echo ----------------------------------------------------------------------------
where pwsh >nul 2>&1
if %errorlevel% equ 0 (
    pwsh.exe -NoProfile -Command "Write-Host 'PowerShell 7 Engine: LISTO Y OPERATIVO ($($PSVersionTable.PSVersion))' -ForegroundColor Green"
) else (
    echo [INFO] Para que el comando 'pwsh' sea reconocido globalmente, reinicia tu terminal o sesion.
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
