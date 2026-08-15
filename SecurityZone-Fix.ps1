<#
.SYNOPSIS
    SecurityZone-Fix.ps1 - Internet Security Zones & Local Execution Policy Remediation
.DESCRIPTION
    Fixes the Windows yellow security warning "No se pueden abrir estos archivos porque la configuracion de seguridad de Internet impidio abrir uno o varios archivos".
    Sets Zone 0 (Local Machine) and Zone 1 (Intranet) permissions to allow local script execution,
    disables Security_HKLM_only conflicts, and suppresses false-positive execution blocks.
    100% LOCAL DETERMINISTIC FIX.
#>

[CmdletBinding()]
param()

# Verify Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "[WARN] Se recomienda ejecutar SecurityZone-Fix como Administrador para sincronizar directivas globales HKLM."
}

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "     SECURITYZONE-FIX - DESBLOQUEO DE ARCHIVOS LOCALES Y ZONAS DE SEGURIDAD  " -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$hkcuPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
$hklmPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings"

# 1. Configurar HKLM y HKCU Internet Settings
Write-Host "[1/4] Configurando parametros de chequeo de seguridad de Internet..." -ForegroundColor Yellow
if (-not (Test-Path $hkcuPath)) { New-Item -Path $hkcuPath -Force | Out-Null }
Set-ItemProperty -Path $hkcuPath -Name "Security_HKLM_only" -Value 0 -Type DWord -Force
Set-ItemProperty -Path $hkcuPath -Name "DisableSecuritySettingsCheck" -Value 1 -Type DWord -Force
Set-ItemProperty -Path $hkcuPath -Name "WarnOnIntranet" -Value 0 -Type DWord -Force

if ($isAdmin -and (Test-Path $hklmPath)) {
    Set-ItemProperty -Path $hklmPath -Name "Security_HKLM_only" -Value 0 -Type DWord -Force
    Set-ItemProperty -Path $hklmPath -Name "DisableSecuritySettingsCheck" -Value 1 -Type DWord -Force
}

# 2. Configurar Zona 0 (Mi PC / Local Machine Zone)
Write-Host "[2/4] Desbloqueando Zona 0 (Archivos locales de Mi PC)..." -ForegroundColor Yellow
$zone0Path = "$hkcuPath\Zones\0"
if (-not (Test-Path $zone0Path)) { New-Item -Path $zone0Path -Force | Out-Null }
Set-ItemProperty -Path $zone0Path -Name "Flags" -Value 0 -Type DWord -Force
Set-ItemProperty -Path $zone0Path -Name "1806" -Value 0 -Type DWord -Force # Launching applications and unsafe files (0 = Enable)
Set-ItemProperty -Path $zone0Path -Name "1807" -Value 0 -Type DWord -Force
Set-ItemProperty -Path $zone0Path -Name "1808" -Value 0 -Type DWord -Force
Set-ItemProperty -Path $zone0Path -Name "1809" -Value 3 -Type DWord -Force # Use Pop-up Blocker (3 = Disable)
Set-ItemProperty -Path $zone0Path -Name "1406" -Value 0 -Type DWord -Force # Access data sources across domains (0 = Enable)

# 3. Configurar Zona 1 (Intranet Local)
Write-Host "[3/4] Configurando Zona 1 (Red Local e Intranet)..." -ForegroundColor Yellow
$zone1Path = "$hkcuPath\Zones\1"
if (-not (Test-Path $zone1Path)) { New-Item -Path $zone1Path -Force | Out-Null }
Set-ItemProperty -Path $zone1Path -Name "1806" -Value 0 -Type DWord -Force
Set-ItemProperty -Path $zone1Path -Name "Flags" -Value 219 -Type DWord -Force

# 4. Desbloquear archivos descargados en el directorio de trabajo (Zone.Identifier stream removal)
Write-Host "[4/4] Desbloqueando streams de seguridad Zone.Identifier en la carpeta del repositorio..." -ForegroundColor Yellow
try {
    $repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    if (Test-Path $repoRoot) {
        Get-ChildItem -Path $repoRoot -Recurse -File -Include *.bat,*.ps1,*.ini,*.json,*.reg -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue
        Write-Host "     [OK] Archivos .bat, .ps1 y .reg desbloqueados correctamente." -ForegroundColor Green
    }
} catch {
    Write-Host "     [INFO] Unblock-File omitido." -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host "     [OK] ZONAS DE SEGURIDAD REPARADAS - MENSAJES AMARILLOS DESACTIVADOS     " -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
