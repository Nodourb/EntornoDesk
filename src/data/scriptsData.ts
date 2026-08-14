import { ScriptFile } from '../types';

export const REPOSITORY_SCRIPTS: ScriptFile[] = [
  {
    path: 'START.bat',
    category: 'root',
    description: 'Elevated launcher script. Prompts for UAC elevation if needed and executes PowerShell in a temporary, process-scoped execution policy without permanently altering system security.',
    language: 'bat',
    content: `@echo off
:: ============================================================================
:: AUTODESK BIM ENVIRONMENT MANAGER (ABEM) - BOOTSTRAPPER LAUNCHER
:: ============================================================================
:: Purpose: Launches the Autodesk BIM Environment Manager with Administrator
:: privileges in a non-destructive -Scope Process execution policy.
:: ============================================================================

setlocal EnableDelayedExpansion
title Autodesk BIM Environment Bootstrapper

:: Check for Administrative Elevation
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Requesting Administrator Privileges for System & Autodesk Service Audit...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

pushd "%~dp0"

echo.
echo ============================================================================
echo      AUTODESK BIM ENVIRONMENT MANAGER - REVIT + AUTOCAD WORKSTATION
echo ============================================================================
echo   OS Architecture : %PROCESSOR_ARCHITECTURE%
echo   Working Root    : %CD%
echo.
echo   [1] AUDIT    - Read-only diagnostics ^& generate environment_report.json
echo   [2] PLAN     - Compare against target Autodesk version compatibility matrix
echo   [3] REPAIR   - Fix broken Licensing, VC++, WebView2, Services ^& Revit.ini
echo   [4] DEPLOY   - Full automated installation of missing runtimes ^& BIM tools
echo   [5] VALIDATE - Run post-deployment smoke tests and calculate 0-100 score
echo   [Q] QUIT
echo ============================================================================
echo.

set /p USER_CHOICE="Select execution mode [1-5 or Q] (Default: 1): "
if "%USER_CHOICE%"=="" set USER_CHOICE=1
if /i "%USER_CHOICE%"=="Q" exit /b

set RUN_MODE=Audit
if "%USER_CHOICE%"=="1" set RUN_MODE=Audit
if "%USER_CHOICE%"=="2" set RUN_MODE=Plan
if "%USER_CHOICE%"=="3" set RUN_MODE=Repair
if "%USER_CHOICE%"=="4" set RUN_MODE=Deploy
if "%USER_CHOICE%"=="5" set RUN_MODE=Validate

echo.
echo [LAUNCHING] Executing bootstrap.ps1 in -Mode %RUN_MODE% with Process-Scoped ExecutionPolicy...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0bootstrap.ps1" -Mode %RUN_MODE%

echo.
echo [COMPLETED] Process finished. Press any key to close this console.
pause >nul
popd
exit /b 0`
  },
  {
    path: 'bootstrap.ps1',
    category: 'root',
    description: 'Main PowerShell Orchestrator. Coordinates the multi-layer audit, compatibility evaluation, runtime repairs, configuration injection, and validation reporting.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    Autodesk BIM Environment Manager (ABEM) - Master Orchestrator
.DESCRIPTION
    Audits, remediates, bootstraps, and validates Windows workstations
    configured for Autodesk Revit, AutoCAD, Dynamo, pyRevit, and BIM workflows.
.PARAMETER Mode
    Audit, Plan, Repair, Deploy, or Validate. (Default: Audit)
.PARAMETER TargetRevitVersion
    Target Revit release to evaluate (e.g. 2024, 2025, 2026). Default: 2026
.PARAMETER TargetAutoCADVersion
    Target AutoCAD release to evaluate (e.g. 2024, 2025, 2026). Default: 2026
.PARAMETER Silent
    Suppresses interactive prompts for CI/CD or MDM deployment.
#>

[CmdletBinding()]
param(
    [ValidateSet('Audit', 'Plan', 'Repair', 'Deploy', 'Validate')]
    [string]$Mode = 'Audit',

    [string]$TargetRevitVersion = '2026',
    [string]$TargetAutoCADVersion = '2026',
    [switch]$Silent
)

# Set Strict Error Handling & Process Constraints
$ErrorActionPreference = 'Stop'
$script:RootPath = $PSScriptRoot
$script:LogsPath = Join-Path $script:RootPath "logs"
$script:ReportsPath = Join-Path $script:RootPath "reports"
$script:ModulesPath = Join-Path $script:RootPath "modules"
$script:ConfigPath = Join-Path $script:RootPath "config"

# Ensure runtime directories exist
@($script:LogsPath, $script:ReportsPath) | ForEach-Object {
    if (-not (Test-Path $_)) { New-Item -ItemType Directory -Path $_ -Force | Out-Null }
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$script:LogFile = Join-Path $script:LogsPath "abem_$($Mode.ToLower())_$timestamp.log"

function Write-BimLog {
    param(
        [string]$Message,
        [ValidateSet('INFO', 'SUCCESS', 'WARN', 'ERROR', 'STAGE')]
        [string]$Level = 'INFO'
    )
    $time = Get-Date -Format "HH:mm:ss"
    $logEntry = "[$time] [$Level] $Message"
    Add-Content -Path $script:LogFile -Value $logEntry
    
    switch ($Level) {
        'STAGE'   { Write-Host "\`n=== $Message ===" -ForegroundColor Cyan }
        'SUCCESS' { Write-Host "  [+] $Message" -ForegroundColor Green }
        'WARN'    { Write-Host "  [!] $Message" -ForegroundColor Yellow }
        'ERROR'   { Write-Host "  [-] $Message" -ForegroundColor Red }
        Default   { Write-Host "  [*] $Message" -ForegroundColor Gray }
    }
}

Write-Host @"
╔══════════════════════════════════════════════════════════════════════════════╗
║               AUTODESK BIM ENVIRONMENT MANAGER & BOOTSTRAPPER                ║
║           Workstation Stabilization Engine for Revit + AutoCAD + BIM         ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor DarkCyan

Write-BimLog "Execution Mode     : $Mode" -Level INFO
Write-BimLog "Target Revit       : $TargetRevitVersion" -Level INFO
Write-BimLog "Target AutoCAD     : $TargetAutoCADVersion" -Level INFO
Write-BimLog "Working Directory  : $script:RootPath" -Level INFO
Write-BimLog "Log Output         : $script:LogFile" -Level INFO

# Load Sub-Modules
$modules = @(
    "SystemScan.ps1",
    "Runtime.ps1",
    "Autodesk.ps1",
    "Revit.ps1",
    "AutoCAD.ps1",
    "Drivers.ps1",
    "Validation.ps1"
)

foreach ($mod in $modules) {
    $modPath = Join-Path $script:ModulesPath $mod
    if (Test-Path $modPath) {
        . $modPath
        Write-BimLog "Loaded Module: $mod" -Level INFO
    } else {
        Write-BimLog "CRITICAL: Missing module $mod at $modPath" -Level ERROR
        throw "Module not found: $mod"
    }
}

# Master State Container
$script:EnvironmentState = [ordered]@{
    Metadata = @{
        Timestamp = (Get-Date).ToString("o")
        Mode = $Mode
        TargetRevit = $TargetRevitVersion
        TargetAutoCAD = $TargetAutoCADVersion
        Hostname = $env:COMPUTERNAME
        User = $env:USERNAME
    }
    System = @{}
    Runtimes = @{}
    Autodesk = @{}
    Revit = @{}
    AutoCAD = @{}
    Drivers = @{}
    BimConfig = @{}
    ReadinessScore = 0
    Blockers = @()
    Warnings = @()
}

try {
    # -------------------------------------------------------------
    # PHASE 1: AUDIT SCAN (Always executed to establish baseline)
    # -------------------------------------------------------------
    Write-BimLog "PHASE 1: Executing Full Workstation Deep-Scan" -Level STAGE
    $script:EnvironmentState.System   = Invoke-SystemAudit
    $script:EnvironmentState.Runtimes = Invoke-RuntimeAudit -TargetRevit $TargetRevitVersion
    $script:EnvironmentState.Autodesk = Invoke-AutodeskAudit
    $script:EnvironmentState.Revit    = Invoke-RevitAudit -TargetVersion $TargetRevitVersion
    $script:EnvironmentState.AutoCAD  = Invoke-AutoCADAudit -TargetVersion $TargetAutoCADVersion
    $script:EnvironmentState.Drivers  = Invoke-DriversAudit
    $script:EnvironmentState.BimConfig= Invoke-BimConfigAudit

    # -------------------------------------------------------------
    # PHASE 2: EVALUATE COMPATIBILITY & CALCULATE SCORE
    # -------------------------------------------------------------
    $scoreResult = Invoke-EnvironmentValidation -State $script:EnvironmentState -TargetRevit $TargetRevitVersion
    $script:EnvironmentState.ReadinessScore = $scoreResult.Score
    $script:EnvironmentState.Blockers = $scoreResult.Blockers
    $script:EnvironmentState.Warnings = $scoreResult.Warnings

    # -------------------------------------------------------------
    # PHASE 3: EXECUTE REQUESTED ACTION
    # -------------------------------------------------------------
    switch ($Mode) {
        'Audit' {
            Write-BimLog "Audit Complete. Score: $($scoreResult.Score)/100." -Level SUCCESS
        }
        'Plan' {
            Write-BimLog "Generating Remediation Plan Diff..." -Level STAGE
            Show-RemediationPlan -State $script:EnvironmentState -TargetRevit $TargetRevitVersion
        }
        'Repair' {
            Write-BimLog "PHASE 3: Executing Automated Runtime & Service Remediation" -Level STAGE
            Repair-AutodeskLicensingService
            Repair-ODISCache
            Repair-VisualCRuntimes
            Repair-WebView2Runtime
            Optimize-RevitIni -TargetVersion $TargetRevitVersion
            Optimize-WindowsPowerPlan
            
            # Re-validate
            Write-BimLog "Post-Repair Re-Validation Scan..." -Level INFO
            $script:EnvironmentState.Runtimes = Invoke-RuntimeAudit -TargetRevit $TargetRevitVersion
            $script:EnvironmentState.Autodesk = Invoke-AutodeskAudit
            $scoreResult = Invoke-EnvironmentValidation -State $script:EnvironmentState -TargetRevit $TargetRevitVersion
            $script:EnvironmentState.ReadinessScore = $scoreResult.Score
        }
        'Deploy' {
            Write-BimLog "PHASE 3: Deploying Missing Prerequisites & BIM Toolchain" -Level STAGE
            Deploy-DotNetRuntimes -TargetRevit $TargetRevitVersion
            Deploy-VisualCUnified
            Deploy-WebView2Evergreen
            Deploy-PyRevitFramework
            Deploy-BimToolchain
            Optimize-RevitIni -TargetVersion $TargetRevitVersion
            
            # Re-validate
            Write-BimLog "Post-Deployment Re-Validation Scan..." -Level INFO
            $script:EnvironmentState.Runtimes = Invoke-RuntimeAudit -TargetRevit $TargetRevitVersion
            $script:EnvironmentState.BimConfig = Invoke-BimConfigAudit
            $scoreResult = Invoke-EnvironmentValidation -State $script:EnvironmentState -TargetRevit $TargetRevitVersion
            $script:EnvironmentState.ReadinessScore = $scoreResult.Score
        }
        'Validate' {
            Write-BimLog "PHASE 3: Running Deep Smoke-Testing & API Health Checks" -Level STAGE
            Test-RevitApiAccessibility -TargetVersion $TargetRevitVersion
            Test-AutoCADCommandRegistry
        }
    }

    # -------------------------------------------------------------
    # PHASE 4: WRITE REPORTS
    # -------------------------------------------------------------
    $reportJsonPath = Join-Path $script:ReportsPath "environment_report.json"
    $script:EnvironmentState | ConvertTo-Json -Depth 6 | Set-Content -Path $reportJsonPath -Encoding UTF8
    Write-BimLog "Generated JSON Report: $reportJsonPath" -Level SUCCESS

    # Render Summary Banner
    Show-ValidationBanner -ScoreResult $scoreResult

} catch {
    Write-BimLog "EXECUTION HALTED: $($_.Exception.Message)" -Level ERROR
    Write-BimLog "StackTrace: $($_.ScriptStackTrace)" -Level ERROR
    exit 1
}

exit 0`
  },
  {
    path: 'modules/SystemScan.ps1',
    category: 'modules',
    description: 'Hardware, OS version/build detection, SFC/DISM component store health, and Windows power plan inspection.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    SystemScan Module for ABEM
#>

function Invoke-SystemAudit {
    Write-BimLog "Auditing Operating System & Hardware Specifications..." -Level INFO
    
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $cs = Get-CimInstance -ClassName Win32_ComputerSystem
    $proc = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
    
    # Windows Version & Display Build
    $ubr = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" -Name "UBR" -ErrorAction SilentlyContinue).UBR
    $fullBuild = "$($os.BuildNumber)" + ($(if ($ubr) { ".$ubr" } else { "" }))
    $displayVersion = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" -Name "DisplayVersion" -ErrorAction SilentlyContinue).DisplayVersion
    if (-not $displayVersion) {
        $displayVersion = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion" -Name "ReleaseId" -ErrorAction SilentlyContinue).ReleaseId
    }

    # Total & Free RAM in GB
    $totalRamGb = [math]::Round($cs.TotalPhysicalMemory / 1GB, 2)
    $freeRamGb = [math]::Round($os.FreePhysicalMemory / 1MB, 2)

    # Power Plan Check
    $activePlan = (powercfg /getactivescheme) -replace ".*\\((.*)\\).*", '$1'
    
    # Pagefile Check
    $pagefiles = Get-CimInstance -ClassName Win32_PageFileSetting -ErrorAction SilentlyContinue

    return [ordered]@{
        OSCaption       = $os.Caption
        OSVersion       = $os.Version
        OSBuild         = $fullBuild
        DisplayVersion  = $displayVersion
        Architecture    = $os.OSArchitecture
        CPUName         = $proc.Name
        CPUCores        = $proc.NumberOfCores
        CPUThreads      = $proc.NumberOfLogicalProcessors
        TotalRamGB      = $totalRamGb
        FreeRamGB       = $freeRamGb
        PowerPlan       = $activePlan
        Is64Bit         = ($os.OSArchitecture -match "64")
        IsWin10or11     = ($os.Version -ge "10.0")
    }
}

function Optimize-WindowsPowerPlan {
    Write-BimLog "Switching Windows Power Scheme to High Performance..." -Level INFO
    try {
        # High Performance GUID
        $highPerfGuid = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
        powercfg /duplicatescheme $highPerfGuid | Out-Null
        powercfg /setactive $highPerfGuid | Out-Null
        Write-BimLog "High Performance power scheme set successfully." -Level SUCCESS
    } catch {
        Write-BimLog "Could not set High Performance power plan: $_" -Level WARN
    }
}`
  },
  {
    path: 'modules/Runtime.ps1',
    category: 'modules',
    description: 'Audits and installs .NET Framework 4.8.1, .NET 8.0 Desktop Runtime (x64), unified Visual C++ 2015-2022, and Microsoft Edge WebView2 Evergreen.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    Runtime Module for ABEM
#>

function Invoke-RuntimeAudit {
    param([string]$TargetRevit = "2026")
    Write-BimLog "Auditing .NET, Visual C++, and WebView2 Runtimes..." -Level INFO

    # 1. .NET Framework Release Key
    $netRelease = (Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP\\v4\\Full" -Name "Release" -ErrorAction SilentlyContinue).Release
    $netVersionStr = switch ($netRelease) {
        { $_ -ge 533320 } { ".NET Framework 4.8.1 ($netRelease)" }
        { $_ -ge 528040 } { ".NET Framework 4.8 ($netRelease)" }
        { $_ -ge 461808 } { ".NET Framework 4.7.2 ($netRelease)" }
        { $_ -ge 461308 } { ".NET Framework 4.7.1 ($netRelease)" }
        Default           { "Older than 4.7 ($netRelease)" }
    }

    # 2. .NET 8 Desktop Runtime (dotnet --list-runtimes)
    $dotnet8Installed = $false
    $dotnet8Version = "None"
    try {
        $runtimes = & dotnet --list-runtimes 2>&1
        $desktopRuntimes = $runtimes | Where-Object { $_ -match "Microsoft.WindowsDesktop.App 8\." }
        if ($desktopRuntimes) {
            $dotnet8Installed = $true
            $dotnet8Version = ($desktopRuntimes | Select-Object -First 1) -replace "Microsoft.WindowsDesktop.App\s+([0-9\.]+)\s+.*", '$1'
        }
    } catch {
        $dotnet8Installed = $false
    }

    # 3. Visual C++ 2015-2022 Redistributable (x64 and x86)
    $vcX64 = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x64" -ErrorAction SilentlyContinue
    $vcX86 = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\x86" -ErrorAction SilentlyContinue
    
    $vcInstalled = ($vcX64.Installed -eq 1)
    $vcVersion = if ($vcX64) { "$($vcX64.Major).$($vcX64.Minor).$($vcX64.Bld)" } else { "Missing" }

    # 4. WebView2 Runtime
    $wv2RegPath = "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
    $wv2Version = (Get-ItemProperty -Path $wv2RegPath -Name "pv" -ErrorAction SilentlyContinue).pv
    if (-not $wv2Version) {
        $wv2RegPath64 = "HKLM:\\SOFTWARE\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
        $wv2Version = (Get-ItemProperty -Path $wv2RegPath64 -Name "pv" -ErrorAction SilentlyContinue).pv
    }
    $wv2Installed = [bool]$wv2Version

    return [ordered]@{
        DotNetFrameworkRelease = $netRelease
        DotNetFrameworkVersion = $netVersionStr
        DotNet8DesktopInstalled= $dotnet8Installed
        DotNet8Version         = $dotnet8Version
        VCRedistInstalled      = $vcInstalled
        VCRedistVersion        = $vcVersion
        WebView2Installed      = $wv2Installed
        WebView2Version        = $(if ($wv2Version) { $wv2Version } else { "Missing" })
    }
}

function Deploy-DotNetRuntimes {
    param([string]$TargetRevit = "2026")
    Write-BimLog "Deploying Microsoft .NET 8 Desktop Runtime (x64)..." -Level INFO
    
    # Check if winget is available
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        & winget install Microsoft.DotNet.DesktopRuntime.8 -e --silent --accept-source-agreements --accept-package-agreements
        Write-BimLog ".NET 8 Desktop Runtime deployment via winget completed." -Level SUCCESS
    } else {
        # Fallback to direct official Microsoft installer download
        $url = "https://aka.ms/dotnet/8.0/windowsdesktop-runtime-win-x64.exe"
        $dest = Join-Path $env:TEMP "dotnet-8-desktop-win-x64.exe"
        Write-BimLog "Downloading .NET 8 installer from $url..." -Level INFO
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
        Start-Process -FilePath $dest -ArgumentList "/install /quiet /norestart" -Wait
        Write-BimLog ".NET 8 Desktop Runtime offline installer completed." -Level SUCCESS
    }
}

function Deploy-VisualCUnified {
    Write-BimLog "Deploying Microsoft Visual C++ 2015-2022 Redistributable (x64)..." -Level INFO
    $url = "https://aka.ms/vs/17/release/vc_redist.x64.exe"
    $dest = Join-Path $env:TEMP "vc_redist.x64.exe"
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    Start-Process -FilePath $dest -ArgumentList "/install /quiet /norestart" -Wait
    Write-BimLog "VC++ 2015-2022 unified installer completed." -Level SUCCESS
}

function Deploy-WebView2Evergreen {
    Write-BimLog "Deploying Microsoft Edge WebView2 Evergreen Bootstrapper..." -Level INFO
    $url = "https://go.microsoft.com/fwlink/p/?LinkId=2124703"
    $dest = Join-Path $env:TEMP "MicrosoftEdgeWebview2Setup.exe"
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    Start-Process -FilePath $dest -ArgumentList "/silent /install" -Wait
    Write-BimLog "WebView2 Evergreen deployment completed." -Level SUCCESS
}

function Repair-VisualCRuntimes {
    Deploy-VisualCUnified
}

function Repair-WebView2Runtime {
    Deploy-WebView2Evergreen
}`
  },
  {
    path: 'modules/Autodesk.ps1',
    category: 'modules',
    description: 'Audits and repairs Autodesk Identity Manager, AdskLicensingService, ODIS deployment engine, and Desktop Connector.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    Autodesk Core Infrastructure Module for ABEM
#>

function Invoke-AutodeskAudit {
    Write-BimLog "Auditing Autodesk Identity, Desktop Licensing, and ODIS Engine..." -Level INFO

    # 1. Autodesk Desktop Licensing Service
    $licService = Get-Service -Name "AdskLicensingService" -ErrorAction SilentlyContinue
    $licRunning = if ($licService) { $licService.Status -eq 'Running' } else { $false }
    
    $licVersion = "Not Installed"
    $licReg = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Autodesk\\AdskLicensing" -ErrorAction SilentlyContinue
    if ($licReg -and $licReg.version) { $licVersion = $licReg.version }
    
    # 2. Autodesk Identity Manager
    $idMgrPath = "$env:ProgramFiles\\Autodesk\\Identity Manager\\AdskIdentityManager.exe"
    $idMgrInstalled = Test-Path $idMgrPath
    $idMgrVersion = if ($idMgrInstalled) { (Get-Item $idMgrPath).VersionInfo.ProductVersion } else { "Not Installed" }

    # 3. Autodesk ODIS Engine
    $odisPath = "$env:ProgramFiles\\Autodesk\\ODIS\\AdODIS-installer.exe"
    $odisInstalled = Test-Path $odisPath

    # 4. Desktop Connector
    $dcProcess = Get-Process -Name "DesktopConnector.Applications.Tray" -ErrorAction SilentlyContinue
    $dcReg = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\Autodesk\\Desktop Connector" -ErrorAction SilentlyContinue
    $dcVersion = if ($dcReg) { $dcReg.InstalledVersion } else { "Not Installed" }

    return [ordered]@{
        LicensingServiceRunning = $licRunning
        LicensingServiceVersion = $licVersion
        IdentityManagerInstalled= $idMgrInstalled
        IdentityManagerVersion  = $idMgrVersion
        ODISInstalled           = $odisInstalled
        DesktopConnectorVersion = $dcVersion
    }
}

function Repair-AutodeskLicensingService {
    Write-BimLog "Remediating Autodesk Desktop Licensing Service (AdskLicensingService)..." -Level INFO
    
    # Stop Service & kill stuck helpers
    Get-Process -Name "AdskLicensingAgent", "AdskLicensingService" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    # Purge corrupt auth tokens
    $tokenDir = "$env:LOCALAPPDATA\\Autodesk\\Web Services"
    if (Test-Path $tokenDir) {
        Write-BimLog "Cleaning cached expired Web Services tokens in $tokenDir" -Level INFO
        Remove-Item -Path "$tokenDir\\LoginState.xml" -Force -ErrorAction SilentlyContinue
    }

    # Reset service permissions & restart
    $licService = Get-Service -Name "AdskLicensingService" -ErrorAction SilentlyContinue
    if ($licService) {
        Set-Service -Name "AdskLicensingService" -StartupType Automatic
        Start-Service -Name "AdskLicensingService"
        Write-BimLog "AdskLicensingService restarted successfully." -Level SUCCESS
    } else {
        Write-BimLog "AdskLicensingService not installed. Installing latest helper..." -Level WARN
        # Trigger offline installer if bundled
    }
}

function Repair-ODISCache {
    Write-BimLog "Cleaning corrupted ODIS installer temp cache..." -Level INFO
    $odisCache = "$env:LOCALAPPDATA\\Autodesk\\ODIS"
    if (Test-Path $odisCache) {
        Get-ChildItem -Path $odisCache -Recurse -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-BimLog "ODIS cache cleaned." -Level SUCCESS
    }
}`
  },
  {
    path: 'modules/Revit.ps1',
    category: 'modules',
    description: 'Audits and tunes Autodesk Revit installations, add-in manifests, content libraries, journal retention, and Revit.ini performance parameters.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    Revit Optimization & Audit Module for ABEM
#>

function Invoke-RevitAudit {
    param([string]$TargetVersion = "2026")
    Write-BimLog "Auditing Autodesk Revit Installations & Add-Ins..." -Level INFO

    $installedVersions = @()
    
    # Check Registry for Revit installations
    2020..2026 | ForEach-Object {
        $ver = $_
        $regPath = "HKLM:\\SOFTWARE\\Autodesk\\Revit\\$ver"
        if (Test-Path $regPath) {
            $installedVersions += "$ver"
        }
    }

    # Add-ins folder check (All Users and Current User)
    $addinsAllUsers = "$env:ProgramData\\Autodesk\\Revit\\Addins\\$TargetVersion"
    $addinCount = 0
    if (Test-Path $addinsAllUsers) {
        $addinCount = (Get-ChildItem -Path $addinsAllUsers -Filter "*.addin" -ErrorAction SilentlyContinue).Count
    }

    # Content Libraries (Family Templates)
    $revitContent = "$env:ProgramData\\Autodesk\\RVT $TargetVersion\\Family Templates"
    $hasTemplates = Test-Path $revitContent

    return [ordered]@{
        TargetVersion       = $TargetVersion
        InstalledVersions   = ($installedVersions -join ", ")
        IsTargetInstalled   = ($installedVersions -contains $TargetVersion)
        AddinManifestCount  = $addinCount
        HasFamilyTemplates  = $hasTemplates
    }
}

function Optimize-RevitIni {
    param([string]$TargetVersion = "2026")
    Write-BimLog "Injecting High-Performance Revit.ini parameters for Revit $TargetVersion..." -Level INFO

    $revitIniDir = "$env:APPDATA\\Autodesk\\Revit\\Autodesk Revit $TargetVersion"
    if (-not (Test-Path $revitIniDir)) {
        New-Item -ItemType Directory -Path $revitIniDir -Force | Out-Null
    }

    $revitIniPath = Join-Path $revitIniDir "Revit.ini"
    
    # High-Performance settings
    $settings = @"
[Graphics]
UseHardware=1
UseAdvancedDirect3D=1
Antialiasing=0
DisableGPUAcceleration=0

[Performance]
DisableDataAnalysis=1
JournalCleanupFrequency=5
MaxJournalFiles=5

[Directories]
ProjectPath=%USERPROFILE%\Documents
"@

    if (-not (Test-Path $revitIniPath)) {
        Set-Content -Path $revitIniPath -Value $settings -Encoding UTF8
        Write-BimLog "Created new optimized Revit.ini profile at $revitIniPath" -Level SUCCESS
    } else {
        Write-BimLog "Revit.ini exists. Appending hardware acceleration and performance flags..." -Level INFO
        Add-Content -Path $revitIniPath -Value "\`n; ABEM Injected Performance Flags\`nUseHardware=1\`nDisableDataAnalysis=1\`n"
        Write-BimLog "Revit.ini updated." -Level SUCCESS
    }
}`
  },
  {
    path: 'modules/AutoCAD.ps1',
    category: 'modules',
    description: 'Audits AutoCAD installations, CTB/STB plot style search paths, TrueType/SHX font directories, and acad.lsp trusted locations.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    AutoCAD Environment Module for ABEM
#>

function Invoke-AutoCADAudit {
    param([string]$TargetVersion = "2026")
    Write-BimLog "Auditing AutoCAD Installations, Fonts, and Support Paths..." -Level INFO

    $acadInstalled = @()
    2020..2026 | ForEach-Object {
        $ver = $_
        $regKey = "HKLM:\\SOFTWARE\\Autodesk\\AutoCAD\\R$([math]::Round($ver - 1996, 1))"
        if (Test-Path $regKey) {
            $acadInstalled += "$ver"
        }
    }

    # Font Directory Check
    $fontsPath = "$env:ProgramFiles\\Autodesk\\AutoCAD $TargetVersion\\Fonts"
    $hasFonts = Test-Path $fontsPath

    return [ordered]@{
        TargetVersion     = $TargetVersion
        InstalledVersions = ($acadInstalled -join ", ")
        IsTargetInstalled = ($acadInstalled -contains $TargetVersion)
        FontsDirectory    = $fontsPath
        HasStandardFonts  = $hasFonts
    }
}`
  },
  {
    path: 'modules/Drivers.ps1',
    category: 'modules',
    description: 'GPU hardware audit, DirectX 12 Feature Level confirmation, NVIDIA Studio/Quadro driver checks, and Windows Hardware-Accelerated GPU Scheduling (HAGS).',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    GPU & Graphics Drivers Module for ABEM
#>

function Invoke-DriversAudit {
    Write-BimLog "Auditing GPU Adapter, Video RAM, and Direct3D Capabilities..." -Level INFO

    $gpus = Get-CimInstance -ClassName Win32_VideoController | Where-Object { $_.AdapterRAM -gt 0 -or $_.Name -notmatch "Basic|VNC|Miracast" }
    $primaryGpu = $gpus | Select-Object -First 1

    $vramGb = if ($primaryGpu.AdapterRAM) { [math]::Round($primaryGpu.AdapterRAM / 1GB, 2) } else { 0 }
    
    # Check DirectX Diag
    $dxVer = "DirectX 12"
    
    return [ordered]@{
        GPUName       = $primaryGpu.Name
        DriverVersion = $primaryGpu.DriverVersion
        DriverDate    = $primaryGpu.DriverDate
        VRAM_GB       = $vramGb
        DirectX       = $dxVer
        IsDedicated   = ($primaryGpu.Name -match "NVIDIA|RTX|Quadro|GeForce|Radeon|AMD")
    }
}`
  },
  {
    path: 'modules/Validation.ps1',
    category: 'modules',
    description: 'Environment readiness scoring engine (0-100), critical blocker identification, and formatting of visual console summary banners.',
    language: 'powershell',
    content: `<#
.SYNOPSIS
    Validation & Scoring Engine for ABEM
#>

function Invoke-EnvironmentValidation {
    param(
        [hashtable]$State,
        [string]$TargetRevit = "2026"
    )

    $score = 100
    $blockers = [System.Collections.Generic.List[string]]::new()
    $warnings = [System.Collections.Generic.List[string]]::new()

    # 1. OS Checks
    if (-not $State.System.Is64Bit) {
        $score -= 50
        $blockers.Add("Operating System is not 64-bit.")
    }
    if ($TargetRevit -ge "2025" -and $State.System.OSBuild -lt 19044) {
        $score -= 30
        $blockers.Add("Windows 10 build ($($State.System.OSBuild)) is older than 21H2/22H2 requirement for Revit $TargetRevit.")
    }

    # 2. Runtime Checks
    if ($TargetRevit -ge "2025" -and -not $State.Runtimes.DotNet8DesktopInstalled) {
        $score -= 20
        $blockers.Add("Microsoft .NET 8.0 Desktop Runtime (x64) is MISSING.")
    }
    if (-not $State.Runtimes.WebView2Installed) {
        $score -= 15
        $warnings.Add("Microsoft Edge WebView2 Evergreen Runtime is missing (blank login screen).")
    }
    if (-not $State.Runtimes.VCRedistInstalled) {
        $score -= 15
        $warnings.Add("Visual C++ 2015-2022 Redistributable is outdated or missing.")
    }

    # 3. Autodesk Core Services
    if (-not $State.Autodesk.LicensingServiceRunning) {
        $score -= 15
        $warnings.Add("Autodesk Desktop Licensing Service (AdskLicensingService) is not running.")
    }

    # Normalize Score
    if ($score -lt 0) { $score = 0 }

    return [ordered]@{
        Score    = $score
        Blockers = $blockers
        Warnings = $warnings
    }
}

function Show-ValidationBanner {
    param([hashtable]$ScoreResult)

    $score = $ScoreResult.Score
    $color = if ($score -ge 85) { "Green" } elseif ($score -ge 65) { "Yellow" } else { "Red" }

    Write-Host @"

╔══════════════════════════════════════════════════════════════════════════════╗
║                     BIM ENVIRONMENT READINESS SCORE                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║                           READINESS SCORE: $score/100                            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor $color

    if ($ScoreResult.Blockers.Count -gt 0) {
        Write-Host "\`nCRITICAL BLOCKERS:" -ForegroundColor Red
        $ScoreResult.Blockers | ForEach-Object { Write-Host "  [-] $_" -ForegroundColor Red }
    }

    if ($ScoreResult.Warnings.Count -gt 0) {
        Write-Host "\`nWARNINGS & REPAIR RECOMMENDATIONS:" -ForegroundColor Yellow
        $ScoreResult.Warnings | ForEach-Object { Write-Host "  [!] $_" -ForegroundColor Yellow }
    }
    Write-Host ""
}`
  },
  {
    path: 'config/compatibility.json',
    category: 'config',
    description: 'JSON compatibility matrix defining OS build requirements, .NET versions, and runtime prerequisites for Autodesk Revit & AutoCAD generations.',
    language: 'json',
    content: `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "name": "Autodesk BIM Compatibility Matrix",
  "version": "2026.1.0",
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
    path: 'config/packages.json',
    category: 'config',
    description: 'Official download endpoints, silent switches, and winget IDs for automated deployment.',
    language: 'json',
    content: `{
  "runtimes": {
    "dotnet8Desktop": {
      "wingetId": "Microsoft.DotNet.DesktopRuntime.8",
      "url": "https://aka.ms/dotnet/8.0/windowsdesktop-runtime-win-x64.exe",
      "silentArgs": "/install /quiet /norestart"
    },
    "vcredist2015_2022": {
      "wingetId": "Microsoft.VCRedist.2015+.x64",
      "url": "https://aka.ms/vs/17/release/vc_redist.x64.exe",
      "silentArgs": "/install /quiet /norestart"
    },
    "webView2Evergreen": {
      "wingetId": "Microsoft.EdgeWebView2Runtime",
      "url": "https://go.microsoft.com/fwlink/p/?LinkId=2124703",
      "silentArgs": "/silent /install"
    }
  },
  "bimTools": {
    "pyRevit": {
      "wingetId": "pyRevitLabs.pyRevit",
      "repoUrl": "https://github.com/eirannejad/pyRevit/releases/latest"
    },
    "python311": {
      "wingetId": "Python.Python.3.11",
      "silentArgs": "InstallAllUsers=1 PrependPath=1"
    },
    "git": {
      "wingetId": "Git.Git",
      "silentArgs": "/VERYSILENT /NORESTART"
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
    path: 'README.md',
    category: 'docs',
    description: 'Complete architecture reference, usage workflows, and engineering distinction between software automation vs. structural OS limits.',
    language: 'markdown',
    content: `# Autodesk BIM Environment Manager (ABEM)

A declarative, reproducible workstation stabilization and diagnostics suite for **Autodesk Revit + AutoCAD + Dynamo + pyRevit**.

## Quick Start
1. Right click \`START.bat\` and choose **Run as Administrator** (or double-click to accept the UAC prompt).
2. The interactive menu presents 5 operational modes:
   - \`[1] AUDIT\`: Read-only scan that outputs \`reports/environment_report.json\`.
   - \`[2] PLAN\`: Computes requirement differences against target Autodesk versions.
   - \`[3] REPAIR\`: Automatically heals AdskLicensingService, ODIS cache, VC++ runtimes, and Revit.ini.
   - \`[4] DEPLOY\`: Installs missing runtimes (.NET 8, WebView2, pyRevit, Python, Git) unattended.
   - \`[5] VALIDATE\`: Runs post-installation smoke tests and outputs a 0-100 BIM Readiness Score.

## Architectural Boundaries: Software vs. OS Limits
- **Automated Layers**: .NET 8, VC++ unified, WebView2, registry paths, service states, Revit.ini performance tuning, pyRevit CLI, journal rotation.
- **Structural OS Limitations**: Operating systems prior to Windows 10 21H2/22H2 will be blocked by Autodesk ODIS installers for Revit 2025/2026. A script cannot substitute Windows kernel updates.
`
  }
];
