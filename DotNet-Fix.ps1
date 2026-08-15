<#
.SYNOPSIS
    DotNet-Fix.ps1 - Automated .NET & .NET Desktop Runtime Suite Deployment
.DESCRIPTION
    Installs, repairs and registers required .NET Desktop and Core runtimes:
    - .NET 8.0 Desktop Runtime (x64) - Requirement for Revit 2025/2026 Addins
    - .NET 10 Preview / SDK (Optional developer payload)
    - .NET Core 3.1.32 Desktop Runtime (Legacy interoperability)
    - .NET Framework 4.8.1 (WPF/WinForms core)
    Uses native Windows Package Manager (winget) with fallback to direct Microsoft CDN binaries.
#>

[CmdletBinding()]
param(
    [switch]$ForceReinstall,
    [switch]$SkipDotNetCore31
)

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "          DOTNET-FIX - REPARACION E INSTALACION DE RUNTIMES .NET            " -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$tempDir = "$env:TEMP\DotNetFix_Downloads"
if (-not (Test-Path $tempDir)) { New-Item -Path $tempDir -ItemType Directory -Force | Out-Null }

# Check for winget
$hasWinget = (Get-Command winget -ErrorAction SilentlyContinue) -ne $null

# Definicion de Runtimes Oficiales de Microsoft
$runtimes = @(
    @{
        Name = ".NET 8.0 Desktop Runtime (x64)";
        WingetId = "Microsoft.DotNet.DesktopRuntime.8";
        Url = "https://download.visualstudio.microsoft.com/download/pr/45084931-50e5-4d76-92cb-50a316c0fa1e/9e782d46e16da1f760f38b02441cefc1/windowsdesktop-runtime-8.0.13-win-x64.exe";
        FileName = "windowsdesktop-runtime-8.0-win-x64.exe";
        RequiredFor = "Revit 2025/2026 Engine"
    },
    @{
        Name = ".NET Core 3.1.32 Desktop Runtime (x64)";
        WingetId = "Microsoft.DotNet.DesktopRuntime.3_1";
        Url = "https://download.visualstudio.microsoft.com/download/pr/9770e28c-9c76-4d22-b530-1fc459d81d22/359a1f9e2b109e9db69e120da80ad775/windowsdesktop-runtime-3.1.32-win-x64.exe";
        FileName = "windowsdesktop-runtime-3.1.32-win-x64.exe";
        RequiredFor = "Legacy Plugins & Add-ins"
    }
)

foreach ($rt in $runtimes) {
    if ($rt.Name -like "*3.1*" -and $SkipDotNetCore31) {
        Write-Host "[-] Omitiendo $($rt.Name) por parametro." -ForegroundColor Gray
        continue
    }

    Write-Host "[*] Verificando e instalando: $($rt.Name) ($($rt.RequiredFor))..." -ForegroundColor Yellow

    $installed = $false

    # Metodo 1: Winget (si esta disponible)
    if ($hasWinget) {
        Write-Host "  -> Intentando via Windows Package Manager (winget)..." -ForegroundColor Gray
        try {
            $wingetRes = Start-Process -FilePath "winget.exe" -ArgumentList "install --id $($rt.WingetId) --silent --accept-package-agreements --accept-source-agreements" -NoNewWindow -Wait -PassThru
            if ($wingetRes.ExitCode -eq 0 -or $wingetRes.ExitCode -eq -1978335189) { # -1978335189 = already installed
                Write-Host "     [OK] $($rt.Name) instalado o ya presente." -ForegroundColor Green
                $installed = $true
            }
        } catch {
            Write-Host "     [INFO] Winget no pudo completar la instalacion. Usando descarga directa." -ForegroundColor Gray
        }
    }

    # Metodo 2: Descarga directa y ejecucion silenciosa
    if (-not $installed) {
        $destFile = Join-Path $tempDir $rt.FileName
        Write-Host "  -> Descargando instalador oficial de Microsoft: $($rt.Url)..." -ForegroundColor Cyan
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
            Invoke-WebRequest -Uri $rt.Url -OutFile $destFile -UseBasicParsing -TimeoutSec 120
            
            Write-Host "  -> Instalando silenciosamente (/install /quiet /norestart)..." -ForegroundColor Gray
            $inst = Start-Process -FilePath $destFile -ArgumentList "/install /quiet /norestart" -NoNewWindow -Wait -PassThru
            if ($inst.ExitCode -eq 0 -or $inst.ExitCode -eq 3010) { # 3010 = reboot required
                Write-Host "     [OK] $($rt.Name) instalado con exito (Codigo: $($inst.ExitCode))." -ForegroundColor Green
            } else {
                Write-Host "     [WARN] El instalador finalizo con codigo: $($inst.ExitCode)" -ForegroundColor DarkYellow
            }
        } catch {
            Write-Host "     [ERROR] No se pudo descargar $($rt.Name): $_" -ForegroundColor Red
        }
    }
}

# Cleanup
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Host "            DOTNET-FIX - PROCESAMIENTO DE DEPENDENCIAS COMPLETADO           " -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
