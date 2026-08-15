<#
.SYNOPSIS
    crypt.ps1 - CLI Command Line Interface for CryptoCore Engine
.DESCRIPTION
    User-friendly CLI for single file and directory recursive cryptographic operations.
.EXAMPLE
    .\crypt.ps1 -Mode encrypt -Input "C:\BIM\Projects\model.rvt" -Output "C:\BIM\Projects\model.rvt.enc"
    .\crypt.ps1 -Mode decrypt -Input "C:\BIM\Projects\model.rvt.enc" -Output "C:\BIM\Projects\model.rvt"
    .\crypt.ps1 -Mode encrypt -Input "C:\BIM\Secrets" -Recursive
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet('encrypt', 'decrypt', 'benchmark', 'genkey')]
    [string]$Mode,

    [Parameter(Mandatory = $false, Position = 1)]
    [string]$InputPath,

    [Parameter(Mandatory = $false, Position = 2)]
    [string]$OutputPath,

    [Parameter(Mandatory = $false)]
    [string]$Password,

    [Parameter(Mandatory = $false)]
    [string]$KeyFile,

    [Parameter(Mandatory = $false)]
    [switch]$Recursive,

    [Parameter(Mandatory = $false)]
    [string]$ExtensionFilter = "*.*"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$enginePath = Join-Path $scriptDir "..\core\CryptoEngine.ps1"
$configPath = Join-Path $scriptDir "..\config\crypto.config.json"

if (-not (Test-Path $enginePath)) {
    # Fallback to local sibling path if run inside core/
    $enginePath = Join-Path $scriptDir "CryptoEngine.ps1"
}

# Mode: Generate master key
if ($Mode -eq 'genkey') {
    $keysDir = Join-Path $scriptDir "..\keys"
    if (-not (Test-Path $keysDir)) { New-Item -Path $keysDir -ItemType Directory -Force | Out-Null }
    
    $keyBytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($keyBytes)
    $keyB64 = [System.Convert]::ToBase64String($keyBytes)
    
    $targetKeyFile = if (-not [string]::IsNullOrEmpty($KeyFile)) { $KeyFile } else { Join-Path $keysDir "master.key" }
    [System.IO.File]::WriteAllText($targetKeyFile, $keyB64)
    
    Write-Host "[KEYGEN] Master key generada de 256 bits en: $targetKeyFile" -ForegroundColor Green
    return
}

if ($Mode -eq 'benchmark') {
    & $enginePath -Mode benchmark
    return
}

# Resolve Password if not supplied
$plainPassword = $Password
if ([string]::IsNullOrWhiteSpace($plainPassword) -and [string]::IsNullOrWhiteSpace($KeyFile)) {
    $secureInput = Read-Host "Ingrese contrasena de seguridad para CryptoCore" -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureInput)
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringUni($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

# Directory Batch Mode
if ($Recursive -and (Test-Path $InputPath) -and (Get-Item $InputPath).PSIsContainer) {
    Write-Host "[CryptoCore] Iniciando procesamiento recursivo en directorio: $InputPath" -ForegroundColor Cyan
    $files = Get-ChildItem -Path $InputPath -Recurse -File -Filter $ExtensionFilter
    
    $processed = 0
    foreach ($file in $files) {
        if ($Mode -eq 'encrypt' -and $file.Extension -eq '.enc') { continue }
        if ($Mode -eq 'decrypt' -and $file.Extension -ne '.enc') { continue }

        $targetOut = if ($Mode -eq 'encrypt') {
            "$($file.FullName).enc"
        } else {
            $file.FullName.Substring(0, $file.FullName.Length - 4)
        }

        try {
            & $enginePath -Mode $Mode -InputPath $file.FullName -OutputPath $targetOut -Password $plainPassword -KeyFile $KeyFile
            $processed++
        }
        catch {
            Write-Warning "Fallo al procesar $($file.FullName): $_"
        }
    }
    Write-Host "[CryptoCore] Operacion completada. $processed archivos procesados con exito." -ForegroundColor Green
    return
}

# Single File Mode
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    if ($Mode -eq 'encrypt') {
        $OutputPath = "$InputPath.enc"
    } elseif ($Mode -eq 'decrypt' -and $InputPath.EndsWith(".enc")) {
        $OutputPath = $InputPath.Substring(0, $InputPath.Length - 4)
    } else {
        $OutputPath = "$InputPath.dec"
    }
}

& $enginePath -Mode $Mode -InputPath $InputPath -OutputPath $OutputPath -Password $plainPassword -KeyFile $KeyFile
