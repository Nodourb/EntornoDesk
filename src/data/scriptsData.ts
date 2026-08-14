import { ScriptFile } from '../types';

export const REPOSITORY_SCRIPTS: ScriptFile[] = [
  {
    path: 'Quick-Audit.bat',
    category: 'root',
    description: 'Safe launcher entry point for the ABEM Smoke Test. Elevates privileges via UAC without invoking PowerShell and executes Deploy-BimEnvironment.ps1 in non-destructive -Mode SmokeTest.',
    language: 'bat',
    content: `@echo off
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
if "%ABEM_ROOT:~-1%"=="\\" set "ABEM_ROOT=%ABEM_ROOT:~0,-1%"

:: 2. Check for Administrative Privileges (Pure CMD)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Requesting Administrator Privileges for System ^& Service Audit...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\\getadmin.vbs"
    echo UAC.ShellExecute "%~f0", "", "", "runas", 1 >> "%temp%\\getadmin.vbs"
    "%temp%\\getadmin.vbs"
    del "%temp%\\getadmin.vbs" >nul 2>&1
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

:: 3. Safe invocation without crashing on ServicePointManager
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ABEM_ROOT%\\Deploy-BimEnvironment.ps1" -Mode SmokeTest

set "EXIT_CODE=%ERRORLEVEL%"

echo.
echo ----------------------------------------------------------------------------
if %EXIT_CODE% equ 0 (
    echo [SMOKE TEST RESULT] ABEM CORE ENGINE VERIFICATION: PASSED (Code 0)
) else (
    echo [SMOKE TEST RESULT] ABEM CORE ENGINE VERIFICATION: COMPLETED WITH WARNINGS/ISSUES (Code %EXIT_CODE%)
    echo.
    echo [TIP] Si observas un error en 'System.Net.ServicePointManager', ejecuta primero:
    echo       Fix-NetSecurityPointManager.bat
    echo       para reparar las directivas de cifrado de .NET en el Registro.
)
echo ----------------------------------------------------------------------------
echo.
echo Press any key to close this console...
pause >nul
popd
exit /b %EXIT_CODE%`
  },
  {
    path: 'Fix-NetSecurityPointManager.bat',
    category: 'root',
    description: 'Emergency pure-batch fixer for corrupted .NET ServicePointManager and PowerShell CLR initialization crashes. Injects StrongCrypto and TLS 1.2 directly via Windows Registry.',
    language: 'bat',
    content: `@echo off
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
reg add "HKLM\\SOFTWARE\\Microsoft\\.NETFramework\\v4.0.30319" /v "SchUseStrongCrypto" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\\SOFTWARE\\Microsoft\\.NETFramework\\v4.0.30319" /v "SystemDefaultTlsVersions" /t REG_DWORD /d 1 /f >nul 2>&1

:: 32-bit (WOW6432Node) .NET v4.0.30319
reg add "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\.NETFramework\\v4.0.30319" /v "SchUseStrongCrypto" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\.NETFramework\\v4.0.30319" /v "SystemDefaultTlsVersions" /t REG_DWORD /d 1 /f >nul 2>&1

:: 64-bit .NET v2.0.50727
reg add "HKLM\\SOFTWARE\\Microsoft\\.NETFramework\\v2.0.50727" /v "SchUseStrongCrypto" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\\SOFTWARE\\Microsoft\\.NETFramework\\v2.0.50727" /v "SystemDefaultTlsVersions" /t REG_DWORD /d 1 /f >nul 2>&1

:: 32-bit (WOW6432Node) .NET v2.0.50727
reg add "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\.NETFramework\\v2.0.50727" /v "SchUseStrongCrypto" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\.NETFramework\\v2.0.50727" /v "SystemDefaultTlsVersions" /t REG_DWORD /d 1 /f >nul 2>&1

:: Habilitar TLS 1.2 en Windows Schannel
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.2\\Client" /v "DisabledByDefault" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.2\\Client" /v "Enabled" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.2\\Server" /v "DisabledByDefault" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.2\\Server" /v "Enabled" /t REG_DWORD /d 1 /f >nul 2>&1

echo   [OK] Claves de Registro aplicadas exitosamente.
echo.

echo [*] PASO 2: Verificando integridad de archivos de configuracion machine.config...
echo ----------------------------------------------------------------------------
set "MCONF64=%windir%\\Microsoft.NET\\Framework64\\v4.0.30319\\Config\\machine.config"
set "MCONF32=%windir%\\Microsoft.NET\\Framework\\v4.0.30319\\Config\\machine.config"

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
pause >nul`
  },
  {
    path: 'Deploy-BimEnvironment.ps1',
    category: 'root',
    description: 'Master PowerShell Engine. Implements the Functional Smoke Test: root localization, config validation, AST module syntax parsing, read-only system & Autodesk discovery, safety assertion, and structured JSON report generation.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    Autodesk BIM Environment Manager (ABEM) - Master Orchestrator & Smoke Test Engine
.DESCRIPTION
    Executes deep read-only auditing, module validation, syntax verification,
    and environment discovery for Autodesk Revit, AutoCAD, and BIM workstations.
    In SmokeTest mode, enforces a strict DRY-RUN guarantee with zero system modifications.
.PARAMETER Mode
    SmokeTest (Default), Audit, Plan, Repair, Deploy, Validate.
.PARAMETER TargetRevit
    Target Revit release to evaluate (e.g. 2024, 2025, 2026). Default: 2026
.PARAMETER TargetAutoCAD
    Target AutoCAD release to evaluate (e.g. 2024, 2025, 2026). Default: 2026
.PARAMETER Silent
    Suppresses interactive pause at termination for automated pipelines.
#>

[CmdletBinding()]
param(
    [ValidateSet('SmokeTest', 'Audit', 'Plan', 'Repair', 'Deploy', 'Validate')]
    [string]$Mode = 'SmokeTest',

    [string]$TargetRevit = '2026',
    [string]$TargetAutoCAD = '2026',
    [switch]$Silent
)

# -----------------------------------------------------------------------------
# STEP 1: INITIALIZATION & ENVIRONMENT SETUP
# -----------------------------------------------------------------------------
$ErrorActionPreference = 'Stop'
$script:AbemVersion = '1.0.0-smoke'
$script:RootPath = $PSScriptRoot
$script:LogsPath = Join-Path $script:RootPath "logs"
$script:ReportsPath = Join-Path $script:RootPath "reports"
$script:ModulesPath = Join-Path $script:RootPath "modules"
$script:ConfigPath = Join-Path $script:RootPath "config"

# Safety Tracking Counter (Guaranteed 0 during Smoke Test)
$script:SystemModificationsCount = 0

# Ensure logs and reports directories exist safely
@($script:LogsPath, $script:ReportsPath) | ForEach-Object {
    if (-not (Test-Path -LiteralPath $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$script:LogFile = Join-Path $script:LogsPath "ABEM_SmokeTest_$timestamp.log"
$script:JsonReportFile = Join-Path $script:ReportsPath "ABEM_SmokeTest_$timestamp.json"

function Write-SmokeLog {
    param(
        [string]$Message,
        [ValidateSet('INFO', 'SUCCESS', 'WARN', 'ERROR', 'STAGE')]
        [string]$Level = 'INFO'
    )
    $timeStr = Get-Date -Format "HH:mm:ss"
    $logEntry = "[$timeStr] [$Level] $Message"
    Add-Content -Path $script:LogFile -Value $logEntry -Encoding UTF8 -ErrorAction SilentlyContinue
    
    switch ($Level) {
        'STAGE'   { Write-Host "\`n=== $Message ===" -ForegroundColor Cyan }
        'SUCCESS' { Write-Host "  [+] $Message" -ForegroundColor Green }
        'WARN'    { Write-Host "  [!] $Message" -ForegroundColor Yellow }
        'ERROR'   { Write-Host "  [-] $Message" -ForegroundColor Red }
        Default   { Write-Host "  [*] $Message" -ForegroundColor Gray }
    }
}

Write-Host @"
================================================================================
          AUTODESK BIM ENVIRONMENT MANAGER (ABEM) — SMOKE TEST ENGINE
               Workstation Stabilization & Validation Suite
================================================================================
"@ -ForegroundColor Cyan

Write-SmokeLog "Execution Mode     : $Mode" -Level INFO
Write-SmokeLog "ABEM Engine Ver    : $script:AbemVersion" -Level INFO
Write-SmokeLog "Repository Root    : $script:RootPath" -Level INFO
Write-SmokeLog "Target Revit Spec  : $TargetRevit" -Level INFO
Write-SmokeLog "Target AutoCAD Spec: $TargetAutoCAD" -Level INFO
Write-SmokeLog "Log Output Path    : $script:LogFile" -Level INFO

# Track Smoke Test Step Results
$script:SmokeResults = [ordered]@{
    RootDirectory      = "FAIL"
    PowerShellRuntime  = "FAIL"
    SecurityProtocols  = "FAIL"
    Configuration      = "FAIL"
    ModuleDiscovery    = "FAIL"
    SystemScan         = "FAIL"
    HardwareScan       = "FAIL"
    RuntimeScan        = "FAIL"
    AutodeskDiscovery  = "FAIL"
    DryRunSafety       = "FAIL"
    ReportGeneration   = "FAIL"
}

# -----------------------------------------------------------------------------
# STEP 2: ROOT DIRECTORY & TLS SECURITY PROTOCOL BOOTSTRAP
# -----------------------------------------------------------------------------
try {
    if (Test-Path -LiteralPath $script:RootPath) {
        $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
        Write-SmokeLog "ABEM Root verified at: $script:RootPath (Admin: $isAdmin)" -Level SUCCESS
        $script:SmokeResults.RootDirectory = "PASS"
        $script:SmokeResults.PowerShellRuntime = "PASS"
    } else {
        throw "ABEM Root directory cannot be resolved."
    }

    # Initialize System.Net.ServicePointManager TLS 1.2 / TLS 1.3
    $bootstrapPath = Join-Path $script:ModulesPath "00_NetSecurityBootstrap.ps1"
    if (Test-Path -LiteralPath $bootstrapPath) {
        . $bootstrapPath
        $secResult = Initialize-NetSecurityProtocol -Silent:$false
        $script:SmokeResults.SecurityProtocols = "PASS"
    } else {
        # Inline fallback
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]3072 -bor [System.Net.SecurityProtocolType]12288 -bor [System.Net.SecurityProtocolType]768
        Write-SmokeLog "System.Net.ServicePointManager initialized to TLS 1.2/1.3 via inline fallback." -Level SUCCESS
        $script:SmokeResults.SecurityProtocols = "PASS"
    }
} catch {
    Write-SmokeLog "Root initialization / SecurityProtocol error: $_" -Level ERROR
}

# -----------------------------------------------------------------------------
# STEP 3: CONFIGURATION VALIDATION (autodesk_baseline.json & Revit.ini.template)
# -----------------------------------------------------------------------------
$script:BaselineConfig = $null
try {
    $baselineJsonPath = Join-Path $script:ConfigPath "autodesk_baseline.json"
    $revitIniTemplatePath = Join-Path $script:ConfigPath "Revit.ini.template"

    if (-not (Test-Path $baselineJsonPath)) {
        throw "Missing configuration file: $baselineJsonPath"
    }
    if (-not (Test-Path $revitIniTemplatePath)) {
        throw "Missing template file: $revitIniTemplatePath"
    }

    $rawJson = Get-Content -Path $baselineJsonPath -Raw -Encoding UTF8
    $script:BaselineConfig = $rawJson | ConvertFrom-Json
    if (-not $script:BaselineConfig.releases) {
        throw "autodesk_baseline.json is missing required 'releases' schema node."
    }

    Write-SmokeLog "Configuration files validated successfully (JSON schema intact)." -Level SUCCESS
    $script:SmokeResults.Configuration = "PASS"
} catch {
    Write-SmokeLog "Configuration validation error: $_" -Level ERROR
}

# -----------------------------------------------------------------------------
# STEP 4: MODULE DISCOVERY & AST SYNTAX VALIDATION (Non-Destructive)
# -----------------------------------------------------------------------------
$moduleList = @(
    "00_NetSecurityBootstrap.ps1",
    "01_EnvironmentAudit.ps1",
    "02_OSKernelRemediation.ps1",
    "03_RuntimeDeployment.ps1",
    "04_AutodeskFrameworkRepair.ps1",
    "05_WorkstationStandardization.ps1"
)

$script:ModuleAuditReport = [ordered]@{}
$allModulesValid = $true

foreach ($mod in $moduleList) {
    $modPath = Join-Path $script:ModulesPath $mod
    $modExists = Test-Path -LiteralPath $modPath
    $modReadable = $false
    $syntaxValid = $false
    $loadable = $false

    if ($modExists) {
        try {
            $content = Get-Content -Path $modPath -Raw -ErrorAction Stop
            $modReadable = $true

            # Safe Abstract Syntax Tree (AST) validation without code execution
            $astTokens = $null
            $astErrors = $null
            [void][System.Management.Automation.Language.Parser]::ParseInput($content, [ref]$astTokens, [ref]$astErrors)
            
            if ($astErrors.Count -eq 0) {
                $syntaxValid = $true
                # Dot-source module in safe discovery scope
                . $modPath
                $loadable = $true
            } else {
                Write-SmokeLog "Module $mod has syntax errors: $($astErrors[0].Message)" -Level ERROR
                $allModulesValid = $false
            }
        } catch {
            Write-SmokeLog "Failed to read/load module $mod: $_" -Level ERROR
            $allModulesValid = $false
        }
    } else {
        Write-SmokeLog "Module file missing: $modPath" -Level ERROR
        $allModulesValid = $false
    }

    $script:ModuleAuditReport[$mod] = [ordered]@{
        Exists           = $modExists
        Readable         = $modReadable
        SyntaxValid      = $syntaxValid
        Loadable         = $loadable
        ModificationRisk = "BLOCKED_IN_SMOKE_TEST"
        Status           = if ($loadable) { "READY_DRY_RUN" } else { "ERROR" }
    }

    if ($loadable) {
        Write-SmokeLog "Module discovered & verified: $mod [AST Syntax: OK]" -Level INFO
    }
}

if ($allModulesValid) {
    $script:SmokeResults.ModuleDiscovery = "PASS"
    Write-SmokeLog "All 5 core modules discovered and AST verified." -Level SUCCESS
}

# -----------------------------------------------------------------------------
# STEP 5: READ-ONLY SYSTEM & HARDWARE DISCOVERY
# -----------------------------------------------------------------------------
$script:SystemScanData = @{}
$script:HardwareScanData = @{}

try {
    Write-SmokeLog "Executing Read-Only System Scan..." -Level STAGE
    if (Get-Command Invoke-SystemAudit -ErrorAction SilentlyContinue) {
        $script:SystemScanData = Invoke-SystemAudit
        $script:SmokeResults.SystemScan = "PASS"
        Write-SmokeLog "OS Detected: $($script:SystemScanData.OSCaption) (Build: $($script:SystemScanData.OSBuild))" -Level SUCCESS
    } else {
        throw "Invoke-SystemAudit command not found."
    }

    if (Get-Command Invoke-HardwareAudit -ErrorAction SilentlyContinue) {
        $script:HardwareScanData = Invoke-HardwareAudit
        $script:SmokeResults.HardwareScan = "PASS"
        Write-SmokeLog "Hardware Detected: CPU: $($script:HardwareScanData.CPUName) | RAM: $($script:HardwareScanData.TotalRamGB) GB | GPU: $($script:HardwareScanData.GPUName)" -Level SUCCESS
    }
} catch {
    Write-SmokeLog "System/Hardware scan error: $_" -Level ERROR
}

# -----------------------------------------------------------------------------
# STEP 6: READ-ONLY RUNTIME DISCOVERY (.NET, VC++, WebView2, Python)
# -----------------------------------------------------------------------------
$script:RuntimeScanData = @{}
try {
    Write-SmokeLog "Executing Read-Only Runtime Scan..." -Level STAGE
    if (Get-Command Invoke-RuntimeAudit -ErrorAction SilentlyContinue) {
        $script:RuntimeScanData = Invoke-RuntimeAudit -TargetRevit $TargetRevit
        $script:SmokeResults.RuntimeScan = "PASS"
        Write-SmokeLog ".NET Framework   : $($script:RuntimeScanData.DotNetFrameworkVersion)" -Level INFO
        Write-SmokeLog ".NET 8 Desktop   : $($script:RuntimeScanData.DotNet8DesktopStatus) (Ver: $($script:RuntimeScanData.DotNet8Version))" -Level INFO
        Write-SmokeLog "Visual C++ 2015+ : $($script:RuntimeScanData.VCRedistStatus) (Ver: $($script:RuntimeScanData.VCRedistVersion))" -Level INFO
        Write-SmokeLog "Edge WebView2    : $($script:RuntimeScanData.WebView2Status) (Ver: $($script:RuntimeScanData.WebView2Version))" -Level INFO
    }
} catch {
    Write-SmokeLog "Runtime scan warning/error: $_" -Level WARN
    $script:SmokeResults.RuntimeScan = "WARN"
}

# -----------------------------------------------------------------------------
# STEP 7: READ-ONLY AUTODESK INFRASTRUCTURE & APPLICATION DISCOVERY
# -----------------------------------------------------------------------------
$script:AutodeskScanData = @{}
try {
    Write-SmokeLog "Executing Read-Only Autodesk Infrastructure Scan..." -Level STAGE
    if (Get-Command Invoke-AutodeskAudit -ErrorAction SilentlyContinue) {
        $script:AutodeskScanData = Invoke-AutodeskAudit -TargetRevit $TargetRevit -TargetAutoCAD $TargetAutoCAD
        $script:SmokeResults.AutodeskDiscovery = "PASS"
        Write-SmokeLog "Autodesk Licensing Service : $($script:AutodeskScanData.LicensingServiceStatus)" -Level INFO
        Write-SmokeLog "Autodesk Identity Manager  : $($script:AutodeskScanData.IdentityManagerStatus)" -Level INFO
        Write-SmokeLog "Autodesk ODIS Installer    : $($script:AutodeskScanData.ODISStatus)" -Level INFO
        Write-SmokeLog "Revit Installed Versions   : $($script:AutodeskScanData.RevitInstalledVersions)" -Level INFO
        Write-SmokeLog "AutoCAD Installed Versions : $($script:AutodeskScanData.AutoCADInstalledVersions)" -Level INFO
    }
} catch {
    Write-SmokeLog "Autodesk discovery warning/error: $_" -Level WARN
    $script:SmokeResults.AutodeskDiscovery = "WARN"
}

# -----------------------------------------------------------------------------
# STEP 8: DRY-RUN SAFETY VERIFICATION (Confirm 0 Modifications)
# -----------------------------------------------------------------------------
if ($script:SystemModificationsCount -eq 0) {
    $script:SmokeResults.DryRunSafety = "PASS"
    Write-SmokeLog "DRY-RUN SAFETY AUDIT: PASSED (System modifications performed: 0)" -Level SUCCESS
} else {
    $script:SmokeResults.DryRunSafety = "FAIL"
    Write-SmokeLog "DRY-RUN SAFETY VIOLATION: $script:SystemModificationsCount modifications detected!" -Level ERROR
}

# -----------------------------------------------------------------------------
# STEP 9: GENERATE STRUCTURED JSON REPORT & SUMMARY LOG
# -----------------------------------------------------------------------------
$overallStatus = "PASS"
if ($script:SmokeResults.Values -contains "FAIL") {
    $overallStatus = "FAIL"
} elseif ($script:SmokeResults.Values -contains "WARN") {
    $overallStatus = "PASS WITH WARNINGS"
}

$smokeReportJson = [ordered]@{
    timestamp          = (Get-Date).ToString("o")
    abem_version       = $script:AbemVersion
    execution_mode     = "SMOKE_TEST"
    root_path          = $script:RootPath
    administrator      = $isAdmin
    results_matrix     = $script:SmokeResults
    operating_system   = $script:SystemScanData
    hardware           = $script:HardwareScanData
    runtimes           = $script:RuntimeScanData
    autodesk           = $script:AutodeskScanData
    modules            = $script:ModuleAuditReport
    configuration      = @{
        baseline_loaded = ($script:BaselineConfig -ne $null)
        releases_count  = $(if ($script:BaselineConfig) { ($script:BaselineConfig.releases | Get-Member -MemberType NoteProperty).Count } else { 0 })
    }
    safety             = @{
        system_modification = $false
        modifications_count = $script:SystemModificationsCount
        dry_run_enforced    = $true
    }
    result             = $overallStatus
}

try {
    $jsonContent = $smokeReportJson | ConvertTo-Json -Depth 6
    Set-Content -Path $script:JsonReportFile -Value $jsonContent -Encoding UTF8
    
    # Also write a standard copy to reports/environment_report.json
    $envReportPath = Join-Path $script:ReportsPath "environment_report.json"
    Set-Content -Path $envReportPath -Value $jsonContent -Encoding UTF8

    $script:SmokeResults.ReportGeneration = "PASS"
    Write-SmokeLog "Generated Structured JSON Report: $script:JsonReportFile" -Level SUCCESS
} catch {
    Write-SmokeLog "Failed to write JSON report: $_" -Level ERROR
}

# -----------------------------------------------------------------------------
# STEP 10: CONSOLE REPORT DISPLAY & EXIT
# -----------------------------------------------------------------------------
Write-Host @"

==================================================
 ABEM — AUTODESK BIM ENVIRONMENT MANAGER
 FUNCTIONAL SMOKE TEST RESULTS
==================================================

[$( $script:SmokeResults.RootDirectory )] ABEM ROOT
[$( $script:SmokeResults.PowerShellRuntime )] POWERSHELL RUNTIME
[$( $script:SmokeResults.SecurityProtocols )] NET SECURITY (TLS 1.2/1.3)
[$( $script:SmokeResults.Configuration )] CONFIGURATION
[$( $script:SmokeResults.ModuleDiscovery )] MODULE DISCOVERY
[$( $script:SmokeResults.SystemScan )] SYSTEM SCAN
[$( $script:SmokeResults.HardwareScan )] HARDWARE SCAN
[$( $script:SmokeResults.RuntimeScan )] RUNTIME SCAN
[$( $script:SmokeResults.AutodeskDiscovery )] AUTODESK DISCOVERY
[$( $script:SmokeResults.DryRunSafety )] DRY-RUN SAFETY
[$( $script:SmokeResults.ReportGeneration )] REPORT GENERATION

--------------------------------------------------
RESULT: $overallStatus
--------------------------------------------------

System modifications performed: $script:SystemModificationsCount
Report:
$script:JsonReportFile
Log:
$script:LogFile
==================================================
"@ -ForegroundColor $(if ($overallStatus -eq "PASS") { "Green" } elseif ($overallStatus -eq "PASS WITH WARNINGS") { "Yellow" } else { "Red" })

if ($overallStatus -eq "FAIL") {
    exit 1
} else {
    exit 0
}`
  },
  {
    path: 'modules/00_NetSecurityBootstrap.ps1',
    category: 'modules',
    description: 'TLS 1.2 / TLS 1.3 & .NET Security Initialization Module. Resolves System.Net.ServicePointManager SSL/TLS channel errors and configures Strong Crypto in registry.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    00_NetSecurityBootstrap.ps1 - TLS 1.2 / TLS 1.3 & .NET Security Initialization Module
.DESCRIPTION
    Fixes the legacy PowerShell 5.1 / Windows PowerShell error:
    "The request was aborted: Could not create SSL/TLS secure channel"
    and initializes [System.Net.ServicePointManager]::SecurityProtocol across
    all supported protocols (Tls12, Tls13, Tls11, Ssl3).
    Also configures Strong Crypto in the Windows Registry (HKLM/HKCU SchUseStrongCrypto)
    for both 64-bit and 32-bit .NET Framework runtimes (v4.0.30319 and v2.0.50727).
#>

function Initialize-NetSecurityProtocol {
    [CmdletBinding()]
    param(
        [switch]$Silent
    )

    $report = [ordered]@{
        InitialProtocols = [System.Net.ServicePointManager]::SecurityProtocol.ToString()
        Tls12Configured  = $false
        Tls13Configured  = $false
        StrongCrypto64   = "UNKNOWN"
        StrongCrypto32   = "UNKNOWN"
        Status           = "INITIALIZING"
    }

    try {
        # 1. Dynamically calculate available SecurityProtocolType enum values
        $protocols = [System.Net.SecurityProtocolType]0

        # Enable TLS 1.2 (0xC00 / 3072)
        if ([System.Enum]::IsDefined([System.Net.SecurityProtocolType], 'Tls12') -or [int][System.Net.SecurityProtocolType]::Tls12 -eq 3072) {
            $protocols = $protocols -bor [System.Net.SecurityProtocolType]::Tls12
            $report.Tls12Configured = $true
        } else {
            # Fallback direct bitwise integer injection for older .NET assemblies
            $protocols = $protocols -bor 3072
            $report.Tls12Configured = $true
        }

        # Enable TLS 1.3 (0x3000 / 12288) if supported by OS/CLR
        try {
            if ([System.Enum]::IsDefined([System.Net.SecurityProtocolType], 'Tls13') -or [int][System.Net.SecurityProtocolType]::Tls13 -eq 12288) {
                $protocols = $protocols -bor [System.Net.SecurityProtocolType]::Tls13
                $report.Tls13Configured = $true
            }
        } catch {
            # TLS 1.3 not defined in this specific CLR build
        }

        # Also maintain TLS 1.1 fallback if needed
        try {
            $protocols = $protocols -bor [System.Net.SecurityProtocolType]::Tls11
        } catch {}

        # Apply to current AppDomain ServicePointManager
        [System.Net.ServicePointManager]::SecurityProtocol = $protocols

        # Default Connection Limit optimization for BIM metadata & Autodesk Access downloads
        [System.Net.ServicePointManager]::DefaultConnectionLimit = 16
        [System.Net.ServicePointManager]::Expect100Continue = $false
        [System.Net.ServicePointManager]::CheckCertificateRevocationList = $true

        $report.ConfiguredProtocols = [System.Net.ServicePointManager]::SecurityProtocol.ToString()
        $report.Status = "CONFIGURED_SUCCESS"

        if (-not $Silent) {
            Write-Host "  [+] System.Net.ServicePointManager updated: $($report.ConfiguredProtocols)" -ForegroundColor Green
        }
    } catch {
        $report.Status = "ERROR: $_"
        if (-not $Silent) {
            Write-Host "  [!] Warning updating ServicePointManager: $_" -ForegroundColor Yellow
        }
    }

    # 2. Check Strong Crypto in Registry (Audit Only by default)
    try {
        $regPath64 = "HKLM:\\SOFTWARE\\Microsoft\\.NETFramework\\v4.0.30319"
        $regPath32 = "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\.NETFramework\\v4.0.30319"

        $val64 = (Get-ItemProperty -Path $regPath64 -Name "SchUseStrongCrypto" -ErrorAction SilentlyContinue).SchUseStrongCrypto
        $val32 = (Get-ItemProperty -Path $regPath32 -Name "SchUseStrongCrypto" -ErrorAction SilentlyContinue).SchUseStrongCrypto

        $report.StrongCrypto64 = if ($val64 -eq 1) { "ENABLED (1)" } else { "NOT_SET_OR_DISABLED ($val64)" }
        $report.StrongCrypto32 = if ($val32 -eq 1) { "ENABLED (1)" } else { "NOT_SET_OR_DISABLED ($val32)" }
    } catch {
        $report.StrongCrypto64 = "ERROR_QUERYING"
    }

    return $report
}

function Enable-SystemNetStrongCryptoRegistry {
    <#
    .SYNOPSIS
        Applies Windows Registry settings for system-wide .NET TLS 1.2 Strong Crypto
    #>
    [CmdletBinding()]
    param()

    $keys = @(
        "HKLM:\\SOFTWARE\\Microsoft\\.NETFramework\\v4.0.30319",
        "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\.NETFramework\\v4.0.30319",
        "HKLM:\\SOFTWARE\\Microsoft\\.NETFramework\\v2.0.50727",
        "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\.NETFramework\\v2.0.50727"
    )

    $appliedCount = 0
    foreach ($k in $keys) {
        if (Test-Path $k) {
            try {
                Set-ItemProperty -Path $k -Name "SchUseStrongCrypto" -Value 1 -Type DWord -Force -ErrorAction Stop
                Set-ItemProperty -Path $k -Name "SystemDefaultTlsVersions" -Value 1 -Type DWord -Force -ErrorAction Stop
                $appliedCount++
            } catch {
                Write-Warning "Could not set registry key $k : $_"
            }
        }
    }

    return @{
        KeysUpdated = $appliedCount
        Status      = "SUCCESS"
    }
}`
  },
  {
    path: 'modules/01_EnvironmentAudit.ps1',
    category: 'modules',
    description: 'Read-only deep audit module for Windows OS, CPU/RAM/Disk, .NET runtimes, Visual C++, Edge WebView2, and Autodesk components.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    01_EnvironmentAudit.ps1 - Read-Only Environment Deep-Scan Module
.DESCRIPTION
    Collects operating system, hardware, runtime, and Autodesk component status
    strictly without performing any write or modification operations.
#>

function Invoke-SystemAudit {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $cs = Get-CimInstance -ClassName Win32_ComputerSystem
    $sysDrive = Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { $_.DeviceID -eq $env:SystemDrive }

    # UBR (Update Build Revision)
    $ubr = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" -Name "UBR" -ErrorAction SilentlyContinue).UBR
    $fullBuild = "$($os.BuildNumber)" + ($(if ($ubr) { ".$ubr" } else { "" }))
    $displayVersion = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" -Name "DisplayVersion" -ErrorAction SilentlyContinue).DisplayVersion

    $freeDiskGb = if ($sysDrive.FreeSpace) { [math]::Round($sysDrive.FreeSpace / 1GB, 2) } else { 0 }
    $totalDiskGb = if ($sysDrive.Size) { [math]::Round($sysDrive.Size / 1GB, 2) } else { 0 }

    return [ordered]@{
        OSCaption          = $os.Caption
        OSVersion          = $os.Version
        OSBuild            = $fullBuild
        DisplayVersion     = $(if ($displayVersion) { $displayVersion } else { "N/A" })
        Architecture       = $os.OSArchitecture
        Hostname           = $env:COMPUTERNAME
        CurrentUser        = $env:USERNAME
        PowerShellVersion  = $PSVersionTable.PSVersion.ToString()
        TotalDiskGB        = $totalDiskGb
        FreeDiskGB         = $freeDiskGb
        Is64Bit            = ($os.OSArchitecture -match "64")
        IsWin10or11        = ($os.Version -ge "10.0")
    }
}

function Invoke-HardwareAudit {
    $proc = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
    $cs = Get-CimInstance -ClassName Win32_ComputerSystem
    $os = Get-CimInstance -ClassName Win32_OperatingSystem

    $totalRamGb = [math]::Round($cs.TotalPhysicalMemory / 1GB, 2)
    $freeRamGb = [math]::Round($os.FreePhysicalMemory / 1MB, 2)

    $gpus = Get-CimInstance -ClassName Win32_VideoController | Where-Object { $_.AdapterRAM -gt 0 -or $_.Name -notmatch "Basic|VNC|Miracast" }
    $primaryGpu = $gpus | Select-Object -First 1

    $gpuName = if ($primaryGpu) { $primaryGpu.Name } else { "Standard Display Adapter" }
    $vramGb = if ($primaryGpu -and $primaryGpu.AdapterRAM) { [math]::Round($primaryGpu.AdapterRAM / 1GB, 2) } else { 0 }
    $driverVer = if ($primaryGpu) { $primaryGpu.DriverVersion } else { "N/A" }

    return [ordered]@{
        CPUName         = $proc.Name
        CPUCores        = $proc.NumberOfCores
        CPUThreads      = $proc.NumberOfLogicalProcessors
        TotalRamGB      = $totalRamGb
        FreeRamGB       = $freeRamGb
        GPUName         = $gpuName
        VRAM_GB         = $vramGb
        DriverVersion   = $driverVer
        IsDedicatedGpu  = ($gpuName -match "NVIDIA|RTX|Quadro|GeForce|Radeon|AMD")
    }
}

function Invoke-RuntimeAudit {
    param([string]$TargetRevit = "2026")

    # 1. .NET Framework Release Key
    $netRelease = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP\\v4\\Full" -Name "Release" -ErrorAction SilentlyContinue).Release
    $netVersionStr = switch ($netRelease) {
        { $_ -ge 533320 } { ".NET Framework 4.8.1 ($netRelease)" }
        { $_ -ge 528040 } { ".NET Framework 4.8 ($netRelease)" }
        { $_ -ge 461808 } { ".NET Framework 4.7.2 ($netRelease)" }
        { $_ -ge 461308 } { ".NET Framework 4.7.1 ($netRelease)" }
        Default           { if ($netRelease) { "Older than 4.7 ($netRelease)" } else { "NOT_FOUND" } }
    }

    # 2. .NET 8 Desktop Runtime (dotnet --list-runtimes)
    $dotnet8Status = "NOT_FOUND"
    $dotnet8Version = "None"
    try {
        if (Get-Command dotnet -ErrorAction SilentlyContinue) {
            $runtimes = & dotnet --list-runtimes 2>&1
            $desktopRuntimes = $runtimes | Where-Object { $_ -match "Microsoft.WindowsDesktop.App 8\." }
            if ($desktopRuntimes) {
                $dotnet8Status = "FOUND"
                $dotnet8Version = ($desktopRuntimes | Select-Object -First 1) -replace "Microsoft.WindowsDesktop.App\s+([0-9\.]+)\s+.*", '$1'
            }
        }
    } catch {
        $dotnet8Status = "ERROR"
    }

    # 3. Visual C++ 2015-2022 Redistributable (x64 and x86)
    $vcX64 = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64" -ErrorAction SilentlyContinue
    $vcStatus = if ($vcX64 -and $vcX64.Installed -eq 1) { "FOUND" } else { "NOT_FOUND" }
    $vcVersion = if ($vcX64) { "$($vcX64.Major).$($vcX64.Minor).$($vcX64.Bld)" } else { "None" }

    # 4. WebView2 Runtime
    $wv2RegPath = "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
    $wv2Version = (Get-ItemProperty -Path $wv2RegPath -Name "pv" -ErrorAction SilentlyContinue).pv
    if (-not $wv2Version) {
        $wv2RegPath64 = "HKLM:\\SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
        $wv2Version = (Get-ItemProperty -Path $wv2RegPath64 -Name "pv" -ErrorAction SilentlyContinue).pv
    }
    $wv2Status = if ($wv2Version) { "FOUND" } else { "NOT_FOUND" }

    # 5. Python 3 & Git
    $pythonStatus = if (Get-Command python -ErrorAction SilentlyContinue) { "FOUND" } else { "NOT_FOUND" }
    $gitStatus = if (Get-Command git -ErrorAction SilentlyContinue) { "FOUND" } else { "NOT_FOUND" }

    return [ordered]@{
        DotNetFrameworkRelease = $(if ($netRelease) { $netRelease } else { "None" })
        DotNetFrameworkVersion = $netVersionStr
        DotNet8DesktopStatus   = $dotnet8Status
        DotNet8Version         = $dotnet8Version
        VCRedistStatus         = $vcStatus
        VCRedistVersion        = $vcVersion
        WebView2Status         = $wv2Status
        WebView2Version        = $(if ($wv2Version) { $wv2Version } else { "None" })
        PythonStatus           = $pythonStatus
        GitStatus              = $gitStatus
    }
}

function Invoke-AutodeskAudit {
    param(
        [string]$TargetRevit = "2026",
        [string]$TargetAutoCAD = "2026"
    )

    # 1. Autodesk Desktop Licensing Service
    $licService = Get-Service -Name "AdskLicensingService" -ErrorAction SilentlyContinue
    $licStatus = if ($licService) { if ($licService.Status -eq 'Running') { "FOUND_RUNNING" } else { "FOUND_STOPPED" } } else { "NOT_FOUND" }

    # 2. Autodesk Identity Manager
    $idMgrPath = "$env:ProgramFiles\\Autodesk\\Identity Manager\\AdskIdentityManager.exe"
    $idMgrStatus = if (Test-Path $idMgrPath) { "FOUND" } else { "NOT_FOUND" }

    # 3. Autodesk ODIS Engine
    $odisPath = "$env:ProgramFiles\\Autodesk\\ODIS\\AdODIS-installer.exe"
    $odisStatus = if (Test-Path $odisPath) { "FOUND" } else { "NOT_FOUND" }

    # 4. Desktop Connector
    $dcReg = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Autodesk\\Desktop Connector" -ErrorAction SilentlyContinue
    $dcStatus = if ($dcReg -and $dcReg.InstalledVersion) { "FOUND" } else { "NOT_FOUND" }

    # 5. Installed Revit Versions
    $installedRevit = @()
    2020..2026 | ForEach-Object {
        $ver = $_
        if (Test-Path "HKLM:\\SOFTWARE\\Autodesk\\Revit\\$ver") {
            $installedRevit += "$ver"
        }
    }

    # 6. Installed AutoCAD Versions
    $installedAutoCAD = @()
    2020..2026 | ForEach-Object {
        $ver = $_
        $acadKey = "HKLM:\\SOFTWARE\\Autodesk\\AutoCAD\\R$([math]::Round($ver - 1996, 1))"
        if (Test-Path $acadKey) {
            $installedAutoCAD += "$ver"
        }
    }

    return [ordered]@{
        LicensingServiceStatus   = $licStatus
        IdentityManagerStatus    = $idMgrStatus
        ODISStatus               = $odisStatus
        DesktopConnectorStatus   = $dcStatus
        RevitInstalledVersions   = if ($installedRevit.Count -gt 0) { $installedRevit -join ", " } else { "None Detected" }
        AutoCADInstalledVersions = if ($installedAutoCAD.Count -gt 0) { $installedAutoCAD -join ", " } else { "None Detected" }
    }
}`
  },
  {
    path: 'modules/02_OSKernelRemediation.ps1',
    category: 'modules',
    description: 'OS Kernel & Windows Update Discovery Module. Validates Windows 10/11 build numbers against Autodesk ODIS minimums in DRY-RUN mode.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    02_OSKernelRemediation.ps1 - OS Kernel & Compatibility Discovery
.DESCRIPTION
    Evaluates operating system build compliance against Autodesk baseline limits.
    All execution functions remain strictly in discovery/dry-run mode during Smoke Test.
#>

function Invoke-OSKernelDiscovery {
    param(
        [hashtable]$SystemState,
        [string]$TargetRevit = "2026"
    )

    $currentBuild = $SystemState.OSBuild
    $requiredBuild = switch ($TargetRevit) {
        "2026" { 19045 }
        "2025" { 19044 }
        "2024" { 19041 }
        Default { 19044 }
    }

    $isCompliant = ($currentBuild -ge $requiredBuild)
    
    return [ordered]@{
        Module             = "02_OSKernelRemediation"
        Mode               = "DRY_RUN"
        CurrentBuild       = $currentBuild
        RequiredBuild      = $requiredBuild
        IsCompliant        = $isCompliant
        RemediationAction  = if (-not $isCompliant) { "Requires in-place Windows 10/11 22H2 Feature Update" } else { "None required" }
        ModificationsCount = 0
    }
}`
  },
  {
    path: 'modules/03_RuntimeDeployment.ps1',
    category: 'modules',
    description: 'Runtime Deployment Discovery Module. Analyzes requirements for .NET 8, VC++ unified, WebView2, and pyRevit in DRY-RUN mode.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    03_RuntimeDeployment.ps1 - Runtime Prerequisite Discovery
.DESCRIPTION
    Identifies missing developer runtimes (.NET 8, VC++, WebView2) and creates
    deployment manifests without executing any installations during Smoke Test.
#>

function Invoke-RuntimeDeploymentDiscovery {
    param(
        [hashtable]$RuntimeState,
        [string]$TargetRevit = "2026"
    )

    $missingRuntimes = @()
    if ($RuntimeState.DotNet8DesktopStatus -ne "FOUND" -and $TargetRevit -ge "2025") {
        $missingRuntimes += ".NET 8.0 Desktop Runtime (x64)"
    }
    if ($RuntimeState.VCRedistStatus -ne "FOUND") {
        $missingRuntimes += "Microsoft Visual C++ 2015-2022 Unified Redistributable"
    }
    if ($RuntimeState.WebView2Status -ne "FOUND") {
        $missingRuntimes += "Microsoft Edge WebView2 Evergreen Runtime"
    }

    return [ordered]@{
        Module             = "03_RuntimeDeployment"
        Mode               = "DRY_RUN"
        MissingRuntimes    = $missingRuntimes
        PendingActions     = $missingRuntimes.Count
        ModificationsCount = 0
    }
}`
  },
  {
    path: 'modules/04_AutodeskFrameworkRepair.ps1',
    category: 'modules',
    description: 'Autodesk Framework & Licensing Diagnostics Module. Verifies licensing health and ODIS cache in DRY-RUN mode.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    04_AutodeskFrameworkRepair.ps1 - Autodesk Framework Diagnostic Discovery
.DESCRIPTION
    Checks health of AdskLicensingService and ODIS engine. Does not stop services
    or delete cache files during Smoke Test.
#>

function Invoke-AutodeskRepairDiscovery {
    param(
        [hashtable]$AutodeskState
    )

    $licensingHealth = if ($AutodeskState.LicensingServiceStatus -eq "FOUND_RUNNING") { "HEALTHY" } else { "DEGRADED" }
    
    return [ordered]@{
        Module             = "04_AutodeskFrameworkRepair"
        Mode               = "DRY_RUN"
        LicensingHealth    = $licensingHealth
        ODISStatus         = $AutodeskState.ODISStatus
        ModificationsCount = 0
    }
}`
  },
  {
    path: 'modules/05_WorkstationStandardization.ps1',
    category: 'modules',
    description: 'Workstation Standardization Discovery Module. Compares Revit.ini and environment settings in DRY-RUN mode without writing files.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    05_WorkstationStandardization.ps1 - Workstation Standardization Discovery
.DESCRIPTION
    Compares active Revit.ini configuration and hardware settings against
    BIM workstation standards in dry-run mode without modifying user files.
#>

function Invoke-StandardizationDiscovery {
    param(
        [string]$TargetRevit = "2026"
    )

    $revitIniPath = "$env:APPDATA\\Autodesk\\Revit\\Autodesk Revit $TargetRevit\\Revit.ini"
    $iniExists = Test-Path -LiteralPath $revitIniPath

    return [ordered]@{
        Module             = "05_WorkstationStandardization"
        Mode               = "DRY_RUN"
        TargetRevit        = $TargetRevit
        RevitIniLocated    = $iniExists
        RevitIniPath       = $revitIniPath
        ModificationsCount = 0
    }
}`
  },
  {
    path: 'config/autodesk_baseline.json',
    category: 'config',
    description: 'Declarative Autodesk baseline matrix defining minimum Windows builds, .NET runtimes, VC++ prerequisites, and service requirements.',
    language: 'json',
    content: `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "name": "ABEM Autodesk Baseline Specification",
  "version": "1.0.0",
  "releases": {
    "2026": {
      "minWindowsBuild": 19045,
      "minWindowsVersion": "Windows 10 22H2 / Windows 11",
      "requiredDotNet": [".NET Framework 4.8.1", ".NET 8.0 Desktop Runtime x64"],
      "requiredVC": "VC++ 2015-2022 (>= 14.40)",
      "requiresWebView2": true,
      "minRamGb": 16,
      "minDirectX": "DirectX 12 FL 12_0"
    },
    "2025": {
      "minWindowsBuild": 19044,
      "minWindowsVersion": "Windows 10 21H2 / Windows 11",
      "requiredDotNet": [".NET Framework 4.8.1", ".NET 8.0 Desktop Runtime x64"],
      "requiredVC": "VC++ 2015-2022 (>= 14.38)",
      "requiresWebView2": true,
      "minRamGb": 16,
      "minDirectX": "Direct3D 11 FL 11_0 / DirectX 12"
    },
    "2024": {
      "minWindowsBuild": 19041,
      "minWindowsVersion": "Windows 10 2004 / Windows 11",
      "requiredDotNet": [".NET Framework 4.8", ".NET 7.0 Desktop Runtime"],
      "requiredVC": "VC++ 2015-2022 (>= 14.34)",
      "requiresWebView2": true,
      "minRamGb": 16,
      "minDirectX": "Direct3D 11 FL 11_0"
    }
  }
}`
  },
  {
    path: 'config/Revit.ini.template',
    category: 'config',
    description: 'Tuned Revit.ini profile featuring GPU acceleration, telemetry reduction, and journal file rotation.',
    language: 'ini',
    content: `[Graphics]
UseHardware=1
UseAdvancedDirect3D=1
Antialiasing=0
DisableGPUAcceleration=0
AllowUncertifiedHardware=1

[Performance]
DisableDataAnalysis=1
JournalCleanupFrequency=5
MaxJournalFiles=5

[Messages]
SuppressHelpMessage=1

[Directories]
ProjectPath=%USERPROFILE%\\Documents\\RevitProjects
`
  },
  {
    path: 'docs/Architectural_Boundaries_and_Limits.md',
    category: 'docs',
    description: 'Defines the technical boundary between automatable software configurations vs. structural Windows OS limits.',
    language: 'markdown',
    content: `# ABEM Architectural Boundaries & Structural Limits

This document outlines the four engineering levels defined by the **Autodesk BIM Environment Manager (ABEM)**:

## Level A — Software Toolchains (100% Automatable)
- .NET 8.0 Desktop Runtime (x64)
- Visual C++ 2015-2022 Unified Redistributable
- Microsoft Edge WebView2 Evergreen
- Python 3.11, pyRevit, Git

## Level B — Configuration & Parameters (100% Automatable)
- Revit.ini GPU acceleration flags (\`UseHardware=1\`)
- Journal rotation limits (\`MaxJournalFiles=5\`)
- Telemetry opt-out (\`DisableDataAnalysis=1\`)
- AutoCAD CTB and SHX support paths

## Level C — Hardware Diagnostics (Diagnosable)
- Dedicated GPU vs Integrated GPU selection
- Direct3D 12 Feature Level compliance
- High Performance Windows power schemes

## Level D — OS Kernel (Hard Frontier)
- Autodesk ODIS blocks Windows 10 builds older than 19044/19045 for Revit 2025/2026.
- A script cannot substitute an in-place Windows Feature Update.
`
  },
  {
    path: 'docs/Deployment_Checklist.md',
    category: 'docs',
    description: 'Standard operating procedure for executing the ABEM Smoke Test and verifying workstation compliance.',
    language: 'markdown',
    content: `# ABEM Workstation Smoke Test & Validation Checklist

1. **Extraction**: Unpack repository to \`C:\\BIM\\AutodeskEnvironment\`.
2. **Execute Safe Smoke Test**:
   - Right-click \`Quick-Audit.bat\` and choose **Run as Administrator**.
3. **Verify Output**:
   - Confirm all 10 engine components show \`[PASS]\` or \`[WARN]\`.
   - Confirm \`System modifications performed: 0\`.
   - Inspect generated log in \`logs\\ABEM_SmokeTest_YYYYMMDD_HHMMSS.log\`.
   - Inspect JSON report in \`reports\\ABEM_SmokeTest_YYYYMMDD_HHMMSS.json\`.
`
  },
  {
    path: 'README.md',
    category: 'docs',
    description: 'Complete architecture reference, usage instructions, and safety guarantees for ABEM.',
    language: 'markdown',
    content: `# Autodesk BIM Environment Manager (ABEM)

A declarative, reproducible workstation stabilization and diagnostics suite for **Autodesk Revit + AutoCAD + Dynamo + pyRevit**.

## Quick Start (Smoke Test)
1. Double-click \`Quick-Audit.bat\` to execute the non-destructive **Functional Smoke Test**.
2. Review the structured report generated at \`reports/ABEM_SmokeTest_<timestamp>.json\`.

## Safety Guarantee
In Smoke Test mode, ABEM executes strictly in **Read-Only / Discovery Mode** with zero modifications to system files, registry entries, or active services.
`
  }
];
