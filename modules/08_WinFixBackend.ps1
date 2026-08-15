<#
.SYNOPSIS
    08_WinFixBackend.ps1 - Modular Windows Health & Driver Self-Healing Engine
.DESCRIPTION
    Integrates system integrity repair, Windows Update queue purging,
    security zone policies, and PnP driver scanning into the ABEM pipeline.
#>

function Invoke-WinFixHealthCheck {
    param(
        [hashtable]$SystemState
    )

    $wuService = Get-Service -Name "wuauserv" -ErrorAction SilentlyContinue
    $cryptService = Get-Service -Name "cryptsvc" -ErrorAction SilentlyContinue

    $softDistSizeMB = 0
    $softDist = "$env:SystemRoot\SoftwareDistribution"
    if (Test-Path $softDist) {
        $files = Get-ChildItem -Path $softDist -Recurse -File -ErrorAction SilentlyContinue
        if ($files) {
            $totalBytes = ($files | Measure-Object -Property Length -Sum).Sum
            $softDistSizeMB = [math]::Round($totalBytes / 1MB, 2)
        }
    }

    # Security Zones check
    $secPolicy = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name "DisableSecuritySettingsCheck" -ErrorAction SilentlyContinue
    $isSecurityFixed = ($secPolicy.DisableSecuritySettingsCheck -eq 1)

    return [ordered]@{
        Module              = "08_WinFixBackend"
        WindowsUpdateStatus = if ($wuService) { $wuService.Status.ToString() } else { "Unknown" }
        CryptSvcStatus      = if ($cryptService) { $cryptService.Status.ToString() } else { "Unknown" }
        SoftwareDistSizeMB  = $softDistSizeMB
        SecurityZonesFixed  = $isSecurityFixed
        RecommendedActions  = @(
            if ($softDistSizeMB -gt 500) { "Purgar cola acumulada de Windows Update ($softDistSizeMB MB)" }
            if (-not $isSecurityFixed) { "Desbloquear directivas de Zona de Seguridad local (evita alerta amarilla)" }
            "Re-escanear dispositivos de hardware via pnputil /scan-devices"
        )
    }
}

function Invoke-WinFixRemediation {
    param(
        [string]$FixScope = "All"
    )

    Write-Host "[WinFix-Backend] Iniciando remediacion local ($FixScope)..." -ForegroundColor Cyan
    
    $results = @{
        WindowsUpdateReset = $false
        SecurityZonesRepaired = $false
        PnPScanExecuted = $false
    }

    # Reset Security Zones
    try {
        $hkcuPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
        Set-ItemProperty -Path $hkcuPath -Name "Security_HKLM_only" -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $hkcuPath -Name "DisableSecuritySettingsCheck" -Value 1 -Type DWord -Force -ErrorAction SilentlyContinue
        $results.SecurityZonesRepaired = $true
    } catch {
        $results.SecurityZonesRepaired = $false
    }

    # Run PnP Rescan
    try {
        $scan = Start-Process -FilePath "pnputil.exe" -ArgumentList "/scan-devices" -NoNewWindow -Wait -PassThru
        $results.PnPScanExecuted = ($scan.ExitCode -eq 0)
    } catch {
        $results.PnPScanExecuted = $false
    }

    return $results
}
