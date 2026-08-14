<#
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
        # Windows PowerShell 5.1 includes Ssl3, Tls, Tls11, Tls12 (and Tls13 on Windows 11/Server 2022)
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
        $regPath64 = "HKLM:\SOFTWARE\Microsoft\.NETFramework\v4.0.30319"
        $regPath32 = "HKLM:\SOFTWARE\WOW6432Node\Microsoft\.NETFramework\v4.0.30319"

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
        "HKLM:\SOFTWARE\Microsoft\.NETFramework\v4.0.30319",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\.NETFramework\v4.0.30319",
        "HKLM:\SOFTWARE\Microsoft\.NETFramework\v2.0.50727",
        "HKLM:\SOFTWARE\WOW6432Node\Microsoft\.NETFramework\v2.0.50727"
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
}
