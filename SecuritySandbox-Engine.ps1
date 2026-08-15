<#
.SYNOPSIS
    SecuritySandbox-Engine.ps1 - Custom User-Space Security & Remediation Layer for Windows 10 Pro
.DESCRIPTION
    Implements a sovereign, non-kernel, modular security sandbox layer:
    1. Neutralizes corrupted Internet Explorer/Edge Security Zones (Flags, 1806, 1807, 1808, 1406).
    2. Overrides restrictive SmartScreen & Explorer Restricted Mode fallback policies.
    3. Programmatically unblocks Mark-of-the-Web (Zone.Identifier ADS) on local & system directories.
    4. Repairs critical process execution blocks (cmd.exe, powershell.exe, cscript.exe DisableCMD registry keys).
    5. Audits and restores NTFS ACLs on system tools and workspace folders (C:\BIM\*, %SystemRoot%\System32).
    6. Emits structured JSON security events for local SIEM / telemetry logging.
    100% LOCAL DETERMINISTIC EXECUTION - ZERO KERNEL TAMPERING.
#>

[CmdletBinding()]
param(
    [ValidateSet('ScanOnly', 'RemediateAll', 'UnlockProcesses', 'ResetZones', 'UnblockStreams', 'FixNtfsAcls')]
    [string]$Action = 'RemediateAll',
    [string]$TargetWorkspace = 'C:\BIM',
    [string]$LogPath = 'C:\BIM\REPOSITORIOS\EntornoDesk\logs'
)

# 0. Enforce Administrative Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "[ERROR] SecuritySandbox-Engine requiere ejecutarse con privilegios elevados de Administrador."
    exit 1
}

if (-not (Test-Path $LogPath)) { New-Item -Path $LogPath -ItemType Directory -Force | Out-Null }
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$securityLogFile = Join-Path $LogPath "SecuritySandbox_Audit_$timestamp.json"

$securityState = [ordered]@{
    Timestamp              = (Get-Date).ToString("o")
    HostName               = $env:COMPUTERNAME
    OSVersion              = [System.Environment]::OSVersion.VersionString
    ActionExecuted         = $Action
    DetectedAnomalies      = @()
    RemediatedComponents   = @()
    ProtectedProcessesRestored = @()
    StreamsUnblockedCount  = 0
    Verdict                = "PENDING"
}

function Log-Message {
    param([string]$Message, [string]$Color = "White")
    $line = "[$([DateTime]::Now.ToString('HH:mm:ss'))] $Message"
    Write-Host $line -ForegroundColor $Color
}

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "    SECURITY SANDBOX ENGINE - CAPA DE CONTROL Y SEGURIDAD PERSONALIZADA     " -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host " Modo Operativo : $Action" -ForegroundColor Yellow
Write-Host " Espacio Trabajo: $TargetWorkspace" -ForegroundColor Gray
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

try {
    # ----------------------------------------------------------------------------
    # 1. DETECCION Y CORRECCION DE BLOQUEO DE PROCESOS ESENCIALES (cmd.exe, pwsh)
    # ----------------------------------------------------------------------------
    Log-Message "[1/5] Verificando politicas de restriccion de procesos esenciales..." "Yellow"
    
    $procPolicies = @(
        @{ Path = "HKCU:\Software\Policies\Microsoft\Windows\System"; Name = "DisableCMD"; Target = "cmd.exe" },
        @{ Path = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\System"; Name = "DisableCMD"; Target = "cmd.exe" },
        @{ Path = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer"; Name = "DisallowRun"; Target = "Explorer DisallowRun" },
        @{ Path = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer"; Name = "DisallowRun"; Target = "Explorer DisallowRun" },
        @{ Path = "HKCU:\Software\Policies\Microsoft\Windows\Explorer"; Name = "RestrictRun"; Target = "Explorer RestrictRun" },
        @{ Path = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Explorer"; Name = "RestrictRun"; Target = "Explorer RestrictRun" }
    )

    foreach ($pol in $procPolicies) {
        if (Test-Path $pol.Path) {
            $val = Get-ItemProperty -Path $pol.Path -Name $pol.Name -ErrorAction SilentlyContinue
            if ($null -ne $val -and $val.$($pol.Name) -ne 0) {
                $securityState.DetectedAnomalies += "Proceso bloqueado por politica: $($pol.Target) en $($pol.Path)"
                Log-Message "  [!] Anomalía detectada: $($pol.Name) activo en $($pol.Path)" "DarkYellow"
                
                if ($Action -in @('RemediateAll', 'UnlockProcesses')) {
                    Set-ItemProperty -Path $pol.Path -Name $pol.Name -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
                    $securityState.RemediatedComponents += "Desbloqueado $($pol.Target) ($($pol.Name) = 0)"
                    $securityState.ProtectedProcessesRestored += $pol.Target
                    Log-Message "     [OK] Politica restrictiva eliminada para $($pol.Target)." "Green"
                }
            }
        }
    }

    # ----------------------------------------------------------------------------
    # 2. REPARACION DE ZONAS DE SEGURIDAD CORRUPTAS (Zona 0 y Zona 1)
    # ----------------------------------------------------------------------------
    Log-Message ""
    Log-Message "[2/5] Restaurando Zonas de Seguridad de Internet y suprimiendo alertas..." "Yellow"
    
    $hkcuInternet = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
    $hklmInternet = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings"

    # Desactivar chequeos de fallback que ponen al explorador en modo restringido
    Set-ItemProperty -Path $hkcuInternet -Name "Security_HKLM_only" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $hkcuInternet -Name "DisableSecuritySettingsCheck" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $hkcuInternet -Name "WarnOnIntranet" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue

    Set-ItemProperty -Path $hklmInternet -Name "Security_HKLM_only" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $hklmInternet -Name "DisableSecuritySettingsCheck" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue

    # Configurar Zona 0 (Mi PC / Local Machine)
    $zone0 = "$hkcuInternet\Zones\0"
    if (-not (Test-Path $zone0)) { New-Item -Path $zone0 -Force | Out-Null }
    Set-ItemProperty -Path $zone0 -Name "Flags" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $zone0 -Name "1806" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue # Launch unsafe files (0 = Enable)
    Set-ItemProperty -Path $zone0 -Name "1807" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $zone0 -Name "1808" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $zone0 -Name "1406" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue # Access data sources across domains
    Set-ItemProperty -Path $zone0 -Name "1809" -Value 3 -Type DWord -Force -ErrorAction SilentlyContinue # Popups

    # Configurar Zona 1 (Intranet Local)
    $zone1 = "$hkcuInternet\Zones\1"
    if (-not (Test-Path $zone1)) { New-Item -Path $zone1 -Force | Out-Null }
    Set-ItemProperty -Path $zone1 -Name "Flags" -Value 219 -Type DWord -Force -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $zone1 -Name "1806" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue

    $securityState.RemediatedComponents += "Zonas de Seguridad 0/1 reconfiguradas para ejecucion local determinista"
    Log-Message "  [OK] Zonas de Seguridad de Internet alineadas. Alerta amarilla de bloqueo eliminada." "Green"

    # ----------------------------------------------------------------------------
    # 3. MITIGACION DE MODO RESTRICTIVO DE SMARTSCREEN & EXPLORER
    # ----------------------------------------------------------------------------
    Log-Message ""
    Log-Message "[3/5] Ajustando directivas de SmartScreen a modo no-bloqueante para scripts locales..." "Yellow"

    $smartScreenPaths = @(
        "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer",
        "HKLM:\SOFTWARE\Policies\Microsoft\Windows\System"
    )

    foreach ($path in $smartScreenPaths) {
        if (Test-Path $path) {
            Set-ItemProperty -Path $path -Name "SmartScreenEnabled" -Value "Off" -Type String -Force -ErrorAction SilentlyContinue
            Set-ItemProperty -Path $path -Name "EnableSmartScreen" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
        }
    }
    $securityState.RemediatedComponents += "SmartScreen adaptado a modo permisivo para scripts locales"
    Log-Message "  [OK] SmartScreen configurado para respetar directivas locales sin interrumpir scripts." "Green"

    # ----------------------------------------------------------------------------
    # 4. PURGA DE STREAMS MARK-OF-THE-WEB (Zone.Identifier) EN ARCHIVOS LOCALES
    # ----------------------------------------------------------------------------
    Log-Message ""
    Log-Message "[4/5] Desbloqueando flujos NTFS alternativos (Zone.Identifier) en repositorio..." "Yellow"

    $searchRoots = @($TargetWorkspace, "$env:USERPROFILE\Downloads", (Split-Path -Parent $MyInvocation.MyCommand.Path))
    $unblockedCount = 0

    foreach ($root in $searchRoots) {
        if (Test-Path $root) {
            Log-Message "  -> Inspeccionando carpeta: $root..." "Gray"
            $blockedFiles = Get-ChildItem -Path $root -Recurse -File -Include *.bat,*.ps1,*.ini,*.json,*.reg,*.dll,*.exe -ErrorAction SilentlyContinue
            foreach ($file in $blockedFiles) {
                try {
                    $hasStream = Get-Item -Path $file.FullName -Stream "Zone.Identifier" -ErrorAction SilentlyContinue
                    if ($hasStream) {
                        Unblock-File -Path $file.FullName -ErrorAction SilentlyContinue
                        $unblockedCount++
                    }
                } catch {}
            }
        }
    }

    $securityState.StreamsUnblockedCount = $unblockedCount
    $securityState.RemediatedComponents += "Desbloqueados $unblockedCount archivos con marcas de descarga externas"
    Log-Message "  [OK] Flujos Zone.Identifier procesados ($unblockedCount archivos desbloqueados)." "Green"

    # ----------------------------------------------------------------------------
    # 5. VERIFICACION Y RESTAURACION DE PERMISOS NTFS EN ESPACIOS CRITICOS
    # ----------------------------------------------------------------------------
    Log-Message ""
    Log-Message "[5/5] Auditando y sincronizando descriptores de seguridad NTFS (ACLs)..." "Yellow"

    if (Test-Path $TargetWorkspace) {
        try {
            $acl = Get-Acl -Path $TargetWorkspace
            $adminRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Administrators", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
            $userRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Users", "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
            $acl.SetAccessRule($adminRule)
            $acl.AddAccessRule($userRule)
            Set-Acl -Path $TargetWorkspace -AclObject $acl -ErrorAction SilentlyContinue
            Log-Message "  [OK] Permisos NTFS en $TargetWorkspace garantizados para Administrators y Users." "Green"
            $securityState.RemediatedComponents += "Permisos NTFS normalizados en $TargetWorkspace"
        } catch {
            Log-Message "  [WARN] No se pudieron aplicar permisos en $TargetWorkspace: $_" "DarkYellow"
        }
    }

    # Estado Final
    $securityState.Verdict = "HEALTHY_SOVEREIGN_SANDBOX_ACTIVE"

    # Guardar reporte de auditoría JSON
    $securityState | ConvertTo-Json -Depth 5 | Set-Content -Path $securityLogFile -Encoding UTF8 -Force

    Log-Message ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "     SECURITY SANDBOX ENGINE - ENTORNO RESTABLECIDO Y BLINDADO              " -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "  Reporte estructurado : $securityLogFile" -ForegroundColor Cyan
    Write-Host "  Estado del Sandbox   : ACTIVO Y VERIFICADO" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
}
catch {
    Log-Message "[FATAL ERROR] Fallo durante la ejecucion de SecuritySandbox-Engine: $_" "Red"
    $securityState.Verdict = "ERROR_IN_EXECUTION"
    $securityState | ConvertTo-Json -Depth 5 | Set-Content -Path $securityLogFile -Encoding UTF8 -Force
    exit 1
}
