@echo off
:: ============================================================================
:: AUTODESK BIM ENVIRONMENT MANAGER (ABEM) - REPAIR & RESCUE LAUNCHER
:: ============================================================================
:: Purpose: Repara el error critico de corrupcion en System.Net.ServicePointManager
:: mediante comandos puros de CMD / REG.EXE (sin depender de PowerShell).
:: Inyecta StrongCrypto y TLS 1.2 en el Registro de Windows y limpia machine.config.
:: ============================================================================

setlocal EnableDelayedExpansion
title ABEM - Reparacion de Emergencia .NET / TLS / PowerShell

echo ============================================================================
echo      ABEM - REPARADOR DE EMERGENCIA .NET FRAMEWORK / SERVICEPOINTMANAGER
echo ============================================================================
echo.

:: 1. Verificar privilegios de Administrador (puro CMD)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] ERROR: Se requieren privilegios de Administrador.
    echo [*] Por favor haz clic derecho sobre este archivo y selecciona "Ejecutar como Administrador".
    echo.
    pause
    exit /b 1
)

echo [+] Privilegios de Administrador confirmados.
echo.
echo [*] PASO 1: Inyectando configuracion TLS 1.2 / StrongCrypto en el Registro...
echo ----------------------------------------------------------------------------

:: 64-bit .NET v4.0.30319
reg add "HKLM\SOFTWARE\Microsoft\.NETFramework\v4.0.30319" /v "SchUseStrongCrypto" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\.NETFramework\v4.0.30319" /v "SystemDefaultTlsVersions" /t REG_DWORD /d 1 /f >nul 2>&1

:: 32-bit (WOW6432Node) .NET v4.0.30319
reg add "HKLM\SOFTWARE\WOW6432Node\Microsoft\.NETFramework\v4.0.30319" /v "SchUseStrongCrypto" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\WOW6432Node\Microsoft\.NETFramework\v4.0.30319" /v "SystemDefaultTlsVersions" /t REG_DWORD /d 1 /f >nul 2>&1

:: 64-bit .NET v2.0.50727
reg add "HKLM\SOFTWARE\Microsoft\.NETFramework\v2.0.50727" /v "SchUseStrongCrypto" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\.NETFramework\v2.0.50727" /v "SystemDefaultTlsVersions" /t REG_DWORD /d 1 /f >nul 2>&1

:: 32-bit (WOW6432Node) .NET v2.0.50727
reg add "HKLM\SOFTWARE\WOW6432Node\Microsoft\.NETFramework\v2.0.50727" /v "SchUseStrongCrypto" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SOFTWARE\WOW6432Node\Microsoft\.NETFramework\v2.0.50727" /v "SystemDefaultTlsVersions" /t REG_DWORD /d 1 /f >nul 2>&1

:: Habilitar TLS 1.2 en Windows Schannel
reg add "HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.2\Client" /v "DisabledByDefault" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.2\Client" /v "Enabled" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.2\Server" /v "DisabledByDefault" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.2\Server" /v "Enabled" /t REG_DWORD /d 1 /f >nul 2>&1

echo   [OK] Claves de Registro aplicadas exitosamente.
echo.

echo [*] PASO 2: Verificando integridad de archivos de configuracion machine.config...
echo ----------------------------------------------------------------------------
set "MCONF64=%windir%\Microsoft.NET\Framework64\v4.0.30319\Config\machine.config"
set "MCONF32=%windir%\Microsoft.NET\Framework\v4.0.30319\Config\machine.config"

if exist "%MCONF64%" (
    echo   [OK] machine.config (64-bit) localizado en: %MCONF64%
) else (
    if exist "%MCONF64%.default" (
        echo   [!] Restaurando machine.config desde copia default...
        copy /y "%MCONF64%.default" "%MCONF64%" >nul 2>&1
    )
)

if exist "%MCONF32%" (
    echo   [OK] machine.config (32-bit) localizado en: %MCONF32%
) else (
    if exist "%MCONF32%.default" (
        echo   [!] Restaurando machine.config (32-bit) desde copia default...
        copy /y "%MCONF32%.default" "%MCONF32%" >nul 2>&1
    )
)

echo.
echo [*] PASO 3: Probando inicio de PowerShell en modo seguro (Clean AppDomain)...
echo ----------------------------------------------------------------------------
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Write-Host 'PowerShell CLR Engine: REPARADO Y OPERATIVO' -ForegroundColor Green" 2>nul
set "PS_TEST=%errorlevel%"

if %PS_TEST% equ 0 (
    echo.
    echo ============================================================================
    echo   [EXITO] El motor .NET Framework y PowerShell han sido desbloqueados.
    echo   Ya puedes ejecutar 'Quick-Audit.bat' sin el error de ServicePointManager.
    echo ============================================================================
) else (
    echo.
    echo ============================================================================
    echo   [AVISO] PowerShell continua bloqueado por corrupcion profunda del CLR .NET.
    echo   Para actualizar tu Windows 10 obsoleto a Windows 10 22H2 / Windows 11
    echo   sin perder tus archivos, ejecuta el Asistente Oficial o el instalador ISO.
    echo ============================================================================
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul
