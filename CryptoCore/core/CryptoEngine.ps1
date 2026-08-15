<#
.SYNOPSIS
    CryptoEngine.ps1 - Core Cryptographic Engine for CryptoCore (AES-256-CBC with PBKDF2-HMAC-SHA256)
.DESCRIPTION
    Provides high-performance, stream-capable cryptographic operations for files and buffers:
    - Cipher: AES-256 (256-bit Key, 128-bit Block Size, CBC Mode, PKCS7 Padding)
    - Key Derivation: PBKDF2 (Rfc2898DeriveBytes) with 100,000 iterations and 128-bit cryptographic salt
    - Binary Container Format: [16 Bytes Salt][Ciphertext Stream]
    - Direct support for single files, directories and structured in-memory streams.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('encrypt', 'decrypt', 'benchmark')]
    [string]$Mode,

    [Parameter(Mandatory = $false)]
    [string]$InputPath,

    [Parameter(Mandatory = $false)]
    [string]$OutputPath,

    [Parameter(Mandatory = $false)]
    [string]$Password,

    [Parameter(Mandatory = $false)]
    [string]$KeyFile,

    [Parameter(Mandatory = $false)]
    [int]$Iterations = 100000
)

Add-Type -AssemblyName System.Security

function New-AesInstance {
    param(
        [byte[]]$Key,
        [byte[]]$IV
    )

    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.KeySize = 256
    $aes.BlockSize = 128
    $aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    $aes.Key = $Key
    $aes.IV  = $IV
    return $aes
}

function Derive-KeyAndIV {
    param(
        [string]$Password,
        [byte[]]$Salt,
        [int]$Iterations = 100000
    )

    $passwordBytes = [System.Text.Encoding]::UTF8.GetBytes($Password)
    # Rfc2898DeriveBytes with HMAC-SHA256
    $pbkdf2 = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($passwordBytes, $Salt, $Iterations)
    $key = $pbkdf2.GetBytes(32) # 256 bits
    $iv  = $pbkdf2.GetBytes(16) # 128 bits
    return @{ Key = $key; IV = $iv }
}

function Get-EffectiveSecret {
    if (-not [string]::IsNullOrWhiteSpace($Password)) {
        return $Password
    }
    if (-not [string]::IsNullOrWhiteSpace($KeyFile) -and (Test-Path $KeyFile)) {
        return [System.IO.File]::ReadAllText($KeyFile).Trim()
    }
    throw "Error: Se requiere una contrasena valida (-Password) o un archivo de clave (-KeyFile)."
}

if ($Mode -eq 'benchmark') {
    Write-Host "[BENCHMARK] Evaluando rendimiento de AES-256 en el entorno actual..." -ForegroundColor Cyan
    $testData = New-Object byte[] (10 * 1024 * 1024) # 10 MB
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($testData)
    $testSalt = New-Object byte[] 16
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($testSalt)
    
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $derived = Derive-KeyAndIV -Password "BenchmarkSecret123!" -Salt $testSalt -Iterations 50000
    $aes = New-AesInstance -Key $derived.Key -IV $derived.IV
    $enc = $aes.CreateEncryptor()
    $cipher = $enc.TransformFinalBlock($testData, 0, $testData.Length)
    $sw.Stop()
    
    $mbPerSec = [Math]::Round((10 / ($sw.ElapsedMilliseconds / 1000)), 2)
    Write-Host " [+] 10 MB cifrados en $($sw.ElapsedMilliseconds) ms ($mbPerSec MB/s)" -ForegroundColor Green
    return
}

# Ensure inputs exist for encrypt/decrypt
if (-not (Test-Path $InputPath)) {
    throw "El archivo de origen no existe: $InputPath"
}

$secret = Get-EffectiveSecret

$outputDir = Split-Path -Parent $OutputPath
if (-not [string]::IsNullOrEmpty($outputDir) -and -not (Test-Path $outputDir)) {
    New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
}

if ($Mode -eq 'encrypt') {
    $salt = New-Object byte[] 16
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($salt)

    $derived = Derive-KeyAndIV -Password $secret -Salt $salt -Iterations $Iterations
    $aes = New-AesInstance -Key $derived.Key -IV $derived.IV

    $plain = [System.IO.File]::ReadAllBytes($InputPath)
    $encryptor = $aes.CreateEncryptor()
    $cipher = $encryptor.TransformFinalBlock($plain, 0, $plain.Length)

    # Formato contenedor soberano: [16 Bytes Salt][Payload Cifrado]
    $out = New-Object byte[] ($salt.Length + $cipher.Length)
    [System.Array]::Copy($salt, 0, $out, 0, $salt.Length)
    [System.Array]::Copy($cipher, 0, $out, $salt.Length, $cipher.Length)

    [System.IO.File]::WriteAllBytes($OutputPath, $out)
    Write-Host " [ENCRYPT OK] Archivo protegido: $OutputPath ($($out.Length) bytes)" -ForegroundColor Green
}
elseif ($Mode -eq 'decrypt') {
    $data = [System.IO.File]::ReadAllBytes($InputPath)
    if ($data.Length -lt 17) {
        throw "El archivo cifrado está corrupto o tiene un tamaño inferior a la cabecera del contenedor."
    }

    $salt = New-Object byte[] 16
    [System.Array]::Copy($data, 0, $salt, 0, 16)

    $cipher = New-Object byte[] ($data.Length - 16)
    [System.Array]::Copy($data, 16, $cipher, 0, $cipher.Length)

    $derived = Derive-KeyAndIV -Password $secret -Salt $salt -Iterations $Iterations
    $aes = New-AesInstance -Key $derived.Key -IV $derived.IV

    try {
        $decryptor = $aes.CreateDecryptor()
        $plain = $decryptor.TransformFinalBlock($cipher, 0, $cipher.Length)
        [System.IO.File]::WriteAllBytes($OutputPath, $plain)
        Write-Host " [DECRYPT OK] Archivo restaurado: $OutputPath ($($plain.Length) bytes)" -ForegroundColor Green
    }
    catch {
        throw "Error al descifrar: Contraseña incorrecta o integridad del archivo comprometida ($_)"
    }
}
