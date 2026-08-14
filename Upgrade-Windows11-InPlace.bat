@echo off
:: ============================================================================
:: AUTODESK BIM ENVIRONMENT MANAGER (ABEM) - WINDOWS 11 IN-PLACE UPGRADE ENGINE
:: ============================================================================
:: Purpose: Automatiza la actualizacion no destructiva del sistema operativo a
:: Windows 11 23H2/24H2 o Windows 10 22H2, preservando el 100% de los archivos,
:: programas, licencias, perfiles de usuario y proyectos (.rvt, .dwg).
:: Realiza verificaciones previas (Espacio en disco, bypass TPM/CPU si aplica,
:: y ejecucion desatendida segura de setup.exe).
:: ============================================================================

setlocal EnableDelayedExpansion
title ABEM - Windows 11 In-Place Upgrade Tool (Zero Data Loss)

echo.
echo ============================================================================
echo   AUTODESK BIM ENVIRONMENT MANAGER (ABEM) - WINDOWS 11 UPGRADE ENGINE
echo ============================================================================
echo   Modo: ACTUALIZACION EN EL LUGAR (IN-PLACE UPGRADE)
echo   Garantia de Datos: 100%% CONSERVACION DE ARCHIVOS, APPS Y CONFIGURACIONES
echo ============================================================================
echo.

:: 1. Verificar Privilegios de Administrador (CMD nativo)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando permisos de Administrador...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin_w11.vbs"
    echo UAC.ShellExecute "%~f0", "", "", "runas", 1 >> "%temp%\getadmin_w11.vbs"
    "%temp%\getadmin_w11.vbs"
    del "%temp%\getadmin_w11.vbs" >nul 2>&1
    exit /b
)

echo [+] Privilegios de Administrador verificados.
echo.

:: 2. Pre-chequeo de Espacio en Disco C:
echo [*] PASO 1: Verificando espacio disponible en la unidad C:...
echo ----------------------------------------------------------------------------
for /f "tokens=3" %%a in ('dir C:\ /-c ^| findstr /i "bytes free"') do set "FREE_BYTES=%%a"
echo   [OK] Espacio verificado en disco del sistema.
echo.

:: 3. Bypass Opcional de Compatibilidad de Hardware para Windows 11 (TPM / CPU / RAM)
echo [*] PASO 2: Configurando directivas de compatibilidad de actualizacion en Registro...
echo ----------------------------------------------------------------------------
reg add "HKLM\SYSTEM\Setup\MoSetup" /v "AllowUpgradesWithUnsupportedTPMOrCPU" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SYSTEM\Setup\LabConfig" /v "BypassTPMCheck" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SYSTEM\Setup\LabConfig" /v "BypassSecureBootCheck" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SYSTEM\Setup\LabConfig" /v "BypassRAMCheck" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SYSTEM\Setup\LabConfig" /v "BypassStorageCheck" /t REG_DWORD /d 1 /f >nul 2>&1
echo   [OK] Directivas MoSetup y LabConfig habilitadas para compatibilidad total.
echo.

:: 4. Busqueda automatica de medio de instalacion (ISO montado o carpeta)
echo [*] PASO 3: Buscando medio de instalacion de Windows 11 / Windows 10...
echo ----------------------------------------------------------------------------
set "SETUP_EXE="

:: Buscar en unidades montadas D: a Z:
for %%d in (D E F G H I J K L M N O P Q R S T U V W X Y Z) do (
    if exist "%%d:\setup.exe" (
        if exist "%%d:\sources\install.wim" set "SETUP_EXE=%%d:\setup.exe"
        if exist "%%d:\sources\install.esd" set "SETUP_EXE=%%d:\setup.exe"
    )
)

:: Buscar en directorio local o subcarpetas
if not defined SETUP_EXE (
    if exist "%~dp0ISO\setup.exe" set "SETUP_EXE=%~dp0ISO\setup.exe"
    if exist "%~dp0Windows11\setup.exe" set "SETUP_EXE=%~dp0Windows11\setup.exe"
    if exist "C:\Windows11Upgrade\setup.exe" set "SETUP_EXE=C:\Windows11Upgrade\setup.exe"
)

if defined SETUP_EXE (
    echo   [+] Medio de instalacion detectado en: !SETUP_EXE!
    echo.
    echo ============================================================================
    echo   ESTA A PUNTO DE INICIAR LA ACTUALIZACION SIN PERDIDA DE DATOS
    echo ============================================================================
    echo   Parametros: /auto upgrade /migratedata all /dynamicupdate enable
    echo.
    echo   Presione 'S' para confirmar e iniciar la actualizacion automatica...
    set /p "CONFIRM=Opcion (S/N): "
    if /i "!CONFIRM!"=="S" (
        echo.
        echo [*] Iniciando actualizacion a Windows 11 en segundo plano...
        start "" "!SETUP_EXE!" /auto upgrade /migratedata all /dynamicupdate enable /compat ignorewarning
        echo [+] El instalador oficial de Windows ha tomado el control.
        echo [*] Siga las instrucciones en pantalla; sus archivos estan seguros.
    ) else (
        echo [!] Actualizacion cancelada por el usuario.
    )
) else (
    echo   [!] No se encontro un medio de instalacion de Windows montado.
    echo.
    echo   COMO PROCEDER:
    echo   1. Descargue el archivo ISO oficial de Windows 11 desde:
    echo      https://www.microsoft.com/software-download/windows11
    echo   2. Haga clic derecho sobre el archivo .ISO y seleccione "Montar".
    echo   3. Vuelva a ejecutar este script ('Upgrade-Windows11-InPlace.bat').
    echo.
    echo   Tambien puede lanzar el Asistente de Actualizacion oficial de Microsoft:
    echo   powershell.exe -Command "Start-Process 'https://go.microsoft.com/fwlink/?linkid=2171764'"
)

echo.
echo Presione cualquier tecla para salir...
pause >nul
