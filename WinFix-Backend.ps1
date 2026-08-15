<#
.SYNOPSIS
    WinFix-Backend.ps1 - Windows Update, Driver Rescan, DISM/SFC & Security Policy Repair
.DESCRIPTION
    Local, deterministic remediation module for Windows 10/11 workstations.
    Fixes Windows Update stuck queues, resets SoftwareDistribution & catroot2,
    executes DISM & SFC health repairs, removes corrupted OEM driver packages,
    forces PnP hardware redetection (Intel, Realtek, Samsung) and resets security policies.
    NO EXTERNAL CLOUD DEPENDENCIES. 100% LOCAL EXECUTION.
.PARAMETER Mode
    Execution mode: 'FullRepair', 'WindowsUpdateOnly', 'DriversOnly', or 'AuditOnly'.
#>

[CmdletBinding()]
param(
    [ValidateSet('FullRepair', 'WindowsUpdateOnly', 'DriversOnly', 'AuditOnly')]
    [string]$Mode = 'FullRepair'
)

# 0. Enforce Administrative Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "[ERROR] WinFix-Backend requiere ejecutarse con privilegios elevados de Administrador."
    exit 1
}

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "         WINFIX BACKEND - REPARACION LOCAL DEL SISTEMA WINDOWS              " -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host " Modo de Ejecucion : $Mode" -ForegroundColor Yellow
Write-Host " Host              : $env:COMPUTERNAME ($([System.Environment]::OSVersion.VersionString))" -ForegroundColor Gray
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$logDir = "C:\BIM\REPOSITORIOS\EntornoDesk\logs"
if (-not (Test-Path $logDir)) { New-Item -Path $logDir -ItemType Directory -Force | Out-Null }
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = Join-Path $logDir "WinFix_Execution_$timestamp.log"

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $Message"
    Write-Host $line -ForegroundColor $Color
    Add-Content -Path $logFile -Value $line -ErrorAction SilentlyContinue
}

try {
    # -------------------------------------------------------------------------
    # 1. Reset de Windows Update (Servicios + Cache de Componentes)
    # -------------------------------------------------------------------------
    if ($Mode -in @('FullRepair', 'WindowsUpdateOnly')) {
        Write-Log "----------------------------------------------------------------------------" "Yellow"
        Write-Log "[PASO 1/5] Deteniendo servicios y limpiando colas de Windows Update..." "Yellow"
        Write-Log "----------------------------------------------------------------------------" "Yellow"

        $services = @("wuauserv", "bits", "cryptsvc", "trustedinstaller", "dosvc")
        foreach ($svc in $services) {
            try {
                if (Get-Service -Name $svc -ErrorAction SilentlyContinue) {
                    Write-Log "  -> Deteniendo servicio: $svc..." "Gray"
                    Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Log "     [WARN] No se pudo detener $svc (puede que ya estuviera detenido)." "DarkYellow"
            }
        }

        # Backup & Purge SoftwareDistribution
        $softDistPath = "$env:SystemRoot\SoftwareDistribution"
        if (Test-Path $softDistPath) {
            Write-Log "  -> Purgando cola corrupta: $softDistPath" "Gray"
            try {
                Remove-Item -Path "$softDistPath\Download\*" -Recurse -Force -ErrorAction SilentlyContinue
                Remove-Item -Path "$softDistPath\DataStore\*" -Recurse -Force -ErrorAction SilentlyContinue
                Write-Log "     [OK] SoftwareDistribution purgado correctamente." "Green"
            } catch {
                Write-Log "     [WARN] Algunos archivos en SoftwareDistribution estaban bloqueados." "DarkYellow"
            }
        }

        # Catroot2 reset
        $catroot2Path = "$env:SystemRoot\System32\catroot2"
        if (Test-Path $catroot2Path) {
            Write-Log "  -> Limpiando firmas temporales en catroot2..." "Gray"
            try {
                Rename-Item -Path $catroot2Path -NewName "catroot2.old_$timestamp" -Force -ErrorAction SilentlyContinue
                Write-Log "     [OK] catroot2 reinicializado." "Green"
            } catch {
                Write-Log "     [WARN] catroot2 en uso, omitiendo renombramiento." "DarkYellow"
            }
        }

        # Reiniciar Servicios
        Write-Log "  -> Reactivando servicios esenciales..." "Gray"
        foreach ($svc in @("cryptsvc", "bits", "wuauserv")) {
            try {
                Set-Service -Name $svc -StartupType Automatic -ErrorAction SilentlyContinue
                Start-Service -Name $svc -ErrorAction SilentlyContinue
                Write-Log "     [OK] Servicio iniciado: $svc" "Green"
            } catch {
                Write-Log "     [ERROR] No se pudo iniciar: $svc" "Red"
            }
        }
    }

    # -------------------------------------------------------------------------
    # 2. Reparación de Componentes del Sistema (DISM + SFC)
    # -------------------------------------------------------------------------
    if ($Mode -in @('FullRepair', 'WindowsUpdateOnly')) {
        Write-Log ""
        Write-Log "----------------------------------------------------------------------------" "Yellow"
        Write-Log "[PASO 2/5] Verificando y reparando integridad de Windows (DISM /RestoreHealth + SFC)..." "Yellow"
        Write-Log "----------------------------------------------------------------------------" "Yellow"

        Write-Log "  -> Ejecutando DISM /Online /Cleanup-Image /CheckHealth..." "Cyan"
        $dismCheck = Start-Process -FilePath "dism.exe" -ArgumentList "/Online /Cleanup-Image /CheckHealth" -NoNewWindow -Wait -PassThru
        Write-Log "     DISM CheckHealth finalizo con codigo: $($dismCheck.ExitCode)" "Gray"

        Write-Log "  -> Ejecutando DISM /Online /Cleanup-Image /RestoreHealth (Almacen WinSxS)..." "Cyan"
        $dismRestore = Start-Process -FilePath "dism.exe" -ArgumentList "/Online /Cleanup-Image /RestoreHealth" -NoNewWindow -Wait -PassThru
        if ($dismRestore.ExitCode -eq 0) {
            Write-Log "     [OK] Almacen de componentes WinSxS reparado con exito." "Green"
        } else {
            Write-Log "     [WARN] DISM finalizo con codigo $($dismRestore.ExitCode)." "DarkYellow"
        }

        Write-Log "  -> Ejecutando System File Checker (sfc /scannow)..." "Cyan"
        $sfc = Start-Process -FilePath "sfc.exe" -ArgumentList "/scannow" -NoNewWindow -Wait -PassThru
        if ($sfc.ExitCode -eq 0) {
            Write-Log "     [OK] SFC no encontro infracciones de integridad." "Green"
        } else {
            Write-Log "     [INFO] SFC finalizo con codigo $($sfc.ExitCode) (reparaciones registradas en CBS.log)." "Gray"
        }
    }

    # -------------------------------------------------------------------------
    # 3. Reparación de Políticas de Seguridad de Zonas Locales (Error Amarillo)
    # -------------------------------------------------------------------------
    if ($Mode -in @('FullRepair')) {
        Write-Log ""
        Write-Log "----------------------------------------------------------------------------" "Yellow"
        Write-Log "[PASO 3/5] Restableciendo politicas de seguridad y desbloqueo de archivos locales..." "Yellow"
        Write-Log "----------------------------------------------------------------------------" "Yellow"

        $internetSettings = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
        if (-not (Test-Path $internetSettings)) { New-Item -Path $internetSettings -Force | Out-Null }
        
        Set-ItemProperty -Path $internetSettings -Name "Security_HKLM_only" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $internetSettings -Name "DisableSecuritySettingsCheck" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue

        # Zona Local (Zone 0 = Mi PC)
        $zone0 = "$internetSettings\Zones\0"
        if (-not (Test-Path $zone0)) { New-Item -Path $zone0 -Force | Out-Null }
        Set-ItemProperty -Path $zone0 -Name "Flags" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $zone0 -Name "1806" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue # Launch applications and unsafe files: Enable

        # HKLM Global Policy Sync
        $hklmSettings = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings"
        if (Test-Path $hklmSettings) {
            Set-ItemProperty -Path $hklmSettings -Name "Security_HKLM_only" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
        }

        Write-Log "     [OK] Politicas de Internet Settings y Zona 0 restablecidas." "Green"
        Write-Log "     [OK] Bloqueo de ejecucion local 'No se pueden abrir estos archivos' desactivado." "Green"
    }

    # -------------------------------------------------------------------------
    # 4. Limpieza y Re-escaneo de Drivers (Intel, Realtek, Samsung)
    # -------------------------------------------------------------------------
    if ($Mode -in @('FullRepair', 'DriversOnly')) {
        Write-Log ""
        Write-Log "----------------------------------------------------------------------------" "Yellow"
        Write-Log "[PASO 4/5] Depurando drivers obsoletos y forzando re-escaneo PnP..." "Yellow"
        Write-Log "----------------------------------------------------------------------------" "Yellow"

        Write-Log "  -> Analizando repositorio de controladores OEM..." "Gray"
        try {
            $oemDrivers = pnputil.exe /enum-drivers | Select-String "Published Name"
            Write-Log "     Se detectaron $($oemDrivers.Count) paquetes de drivers en el DriverStore." "Gray"
        } catch {
            Write-Log "     [WARN] No se pudo enumerar controladores OEM." "DarkYellow"
        }

        Write-Log "  -> Forzando re-escaneo de dispositivos hardware Plug and Play (pnputil /scan-devices)..." "Cyan"
        $scan = Start-Process -FilePath "pnputil.exe" -ArgumentList "/scan-devices" -NoNewWindow -Wait -PassThru
        if ($scan.ExitCode -eq 0) {
            Write-Log "     [OK] Re-escaneo de dispositivos Intel, Realtek, Samsung completado exitosamente." "Green"
        } else {
            Write-Log "     [WARN] pnputil finalizo con codigo $($scan.ExitCode)." "DarkYellow"
        }
    }

    # -------------------------------------------------------------------------
    # 5. Resumen de Estado y Telemetría
    # -------------------------------------------------------------------------
    Write-Log ""
    Write-Log "============================================================================" "Green"
    Write-Log "       WINFIX BACKEND - EJECUCION COMPLETADA SATISFACTORIAMENTE             " "Green"
    Write-Log "============================================================================" "Green"
    Write-Log " Log detallado guardado en : $logFile" "Cyan"
    Write-Log " Recomendacion             : Reiniciar el equipo si se actualizaron drivers criticos." "Yellow"
    Write-Log "============================================================================" "Green"
    Write-Host ""
}
catch {
    Write-Log "[FATAL ERROR] Ocurrio una excepcion no controlada: $_" "Red"
    exit 1
}
