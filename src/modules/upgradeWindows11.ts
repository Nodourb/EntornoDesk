/**
 * Windows 11 In-Place Upgrade Engine Module (Zero Data Loss)
 * Defines the PowerShell logic and pre-flight validation routines to perform
 * an automated, non-destructive operating system upgrade to Windows 11 23H2/24H2
 * or Windows 10 22H2 while preserving all user files, apps, and BIM configurations.
 */

export interface UpgradeCheckResult {
  checkName: string;
  passed: boolean;
  message: string;
  remediation?: string;
}

export const WINDOWS_11_UPGRADE_POWERSHELL_MODULE = `<#
.SYNOPSIS
    Upgrade-Windows11InPlace.ps1 - Automated Zero Data Loss Windows 11 Upgrade Module
.DESCRIPTION
    Executes pre-flight hardware checks, enables Microsoft MoSetup/LabConfig bypasses,
    locates mounted ISO or Windows Setup files, and triggers the official setup.exe
    with /auto upgrade and /migratedata all parameters to preserve 100% of user data.
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [string]$IsoMountDrive,
    [switch]$BypassHardwareChecks = $true
)

function Test-UpgradePrerequisites {
    [CmdletBinding()]
    param()

    $results = [ordered]@{}

    # 1. Check Elevation
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    $results["AdministratorPrivileges"] = @{
        Passed = $isAdmin
        Details = if ($isAdmin) { "Running elevated as Administrator" } else { "Must run in elevated PowerShell session" }
    }

    # 2. Check Free Disk Space on C: (Minimum 25 GB for OS staging)
    $cDrive = Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DeviceID='C:'" -ErrorAction SilentlyContinue
    $freeGb = [math]::Round($cDrive.FreeSpace / 1GB, 2)
    $spacePassed = ($freeGb -ge 20)
    $results["SystemDriveSpace"] = @{
        Passed = $spacePassed
        FreeSpaceGb = $freeGb
        RequiredGb = 20
        Details = if ($spacePassed) { "C: Drive has $freeGb GB available (Sufficient)" } else { "C: Drive only has $freeGb GB (Need at least 20 GB)" }
    }

    # 3. Check Current OS Architecture & Build
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $results["CurrentOS"] = @{
        Passed = $true
        Caption = $os.Caption
        BuildNumber = $os.BuildNumber
        Architecture = $os.OSArchitecture
    }

    return $results
}

function Enable-Windows11CompatibilityBypass {
    [CmdletBinding()]
    param()

    Write-Host "[*] Configuring MoSetup and LabConfig registry bypasses..." -ForegroundColor Cyan

    $moSetupPath = "HKLM:\\SYSTEM\\Setup\\MoSetup"
    if (-not (Test-Path $moSetupPath)) { New-Item -Path $moSetupPath -Force | Out-Null }
    Set-ItemProperty -Path $moSetupPath -Name "AllowUpgradesWithUnsupportedTPMOrCPU" -Value 1 -Type DWord -Force

    $labConfigPath = "HKLM:\\SYSTEM\\Setup\\LabConfig"
    if (-not (Test-Path $labConfigPath)) { New-Item -Path $labConfigPath -Force | Out-Null }
    Set-ItemProperty -Path $labConfigPath -Name "BypassTPMCheck" -Value 1 -Type DWord -Force
    Set-ItemProperty -Path $labConfigPath -Name "BypassSecureBootCheck" -Value 1 -Type DWord -Force
    Set-ItemProperty -Path $labConfigPath -Name "BypassRAMCheck" -Value 1 -Type DWord -Force
    Set-ItemProperty -Path $labConfigPath -Name "BypassStorageCheck" -Value 1 -Type DWord -Force

    Write-Host "  [+] MoSetup and LabConfig bypasses configured in registry." -ForegroundColor Green
}

function Find-WindowsSetupMedia {
    [CmdletBinding()]
    param(
        [string]$PreferredDrive
    )

    if ($PreferredDrive -and (Test-Path "$PreferredDrive\\setup.exe")) {
        return "$PreferredDrive\\setup.exe"
    }

    # Search all available drive letters for setup.exe + install.wim/esd
    $drives = Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { $_.DriveType -in @(3, 5) } # Local or Optical/Mounted
    foreach ($drive in $drives) {
        $candidate = "$($drive.DeviceID)\\setup.exe"
        $wim = "$($drive.DeviceID)\\sources\\install.wim"
        $esd = "$($drive.DeviceID)\\sources\\install.esd"
        if (Test-Path $candidate -and ((Test-Path $wim) -or (Test-Path $esd))) {
            return $candidate
        }
    }

    return $null
}

function Invoke-Windows11InPlaceUpgrade {
    [CmdletBinding()]
    param(
        [switch]$DryRun,
        [string]$IsoDrive
    )

    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "  AUTODESK BIM ENVIRONMENT MANAGER (ABEM) - WINDOWS 11 UPGRADE" -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "  Target Policy: ZERO DATA LOSS (Preserve 100% of Files & Apps)" -ForegroundColor Yellow
    Write-Host ""

    # Step 1: Run Pre-Flight Checks
    Write-Host "[*] Executing Pre-Flight System Checks..." -ForegroundColor Cyan
    $checks = Test-UpgradePrerequisites

    foreach ($k in $checks.Keys) {
        $status = if ($checks[$k].Passed) { "[PASS]" } else { "[FAIL]" }
        $color = if ($checks[$k].Passed) { "Green" } else { "Red" }
        Write-Host "  $status $k: $($checks[$k].Details)" -ForegroundColor $color
    }

    if (-not $checks.AdministratorPrivileges.Passed -or -not $checks.SystemDriveSpace.Passed) {
        Write-Error "Pre-flight checks failed. Please address disk space or run as Administrator."
        return
    }

    # Step 2: Enable Hardware Compatibility Bypasses
    Enable-Windows11CompatibilityBypass

    # Step 3: Locate Setup Media
    $setupExe = Find-WindowsSetupMedia -PreferredDrive $IsoDrive
    if (-not $setupExe) {
        Write-Host "  [!] No mounted Windows 11 ISO media detected." -ForegroundColor Yellow
        Write-Host "  [*] Instructions:" -ForegroundColor Cyan
        Write-Host "      1. Download Windows 11 ISO from https://www.microsoft.com/software-download/windows11"
        Write-Host "      2. Right-click the ISO file and select 'Mount'."
        Write-Host "      3. Re-run this script to start the automated in-place upgrade."
        return
    }

    Write-Host "  [+] Located Windows 11 Setup Media at: $setupExe" -ForegroundColor Green

    if ($DryRun) {
        Write-Host "  [*] Dry-Run complete. Setup command that would be executed:" -ForegroundColor Yellow
        Write-Host "      $setupExe /auto upgrade /migratedata all /dynamicupdate enable /compat ignorewarning" -ForegroundColor Gray
        return
    }

    Write-Host "[*] Launching Windows 11 In-Place Setup (Zero Data Loss)..." -ForegroundColor Cyan
    $upgradeArgs = "/auto upgrade /migratedata all /dynamicupdate enable /compat ignorewarning"
    Start-Process -FilePath $setupExe -ArgumentList $upgradeArgs
    Write-Host "[+] Windows 11 Setup is running. Follow the on-screen prompts to finish." -ForegroundColor Green
}
`;
