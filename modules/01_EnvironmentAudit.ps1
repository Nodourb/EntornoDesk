<#
.SYNOPSIS
    01_EnvironmentAudit.ps1 - Read-Only Environment Deep-Scan Module
.DESCRIPTION
    Collects operating system, hardware, runtime, and Autodesk component status
    strictly without performing any write or modification operations.
#>

function Invoke-SystemAudit {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $cs = Get-CimInstance -ClassName Win32_ComputerSystem
    $sysDrive = Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object { $_.DeviceID -eq $env:SystemDrive }

    # UBR (Update Build Revision)
    $ubr = (Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion" -Name "UBR" -ErrorAction SilentlyContinue).UBR
    $fullBuild = "$($os.BuildNumber)" + ($(if ($ubr) { ".$ubr" } else { "" }))
    $displayVersion = (Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion" -Name "DisplayVersion" -ErrorAction SilentlyContinue).DisplayVersion

    $freeDiskGb = if ($sysDrive.FreeSpace) { [math]::Round($sysDrive.FreeSpace / 1GB, 2) } else { 0 }
    $totalDiskGb = if ($sysDrive.Size) { [math]::Round($sysDrive.Size / 1GB, 2) } else { 0 }

    return [ordered]@{
        OSCaption          = $os.Caption
        OSVersion          = $os.Version
        OSBuild            = $fullBuild
        DisplayVersion     = $(if ($displayVersion) { $displayVersion } else { "N/A" })
        Architecture       = $os.OSArchitecture
        Hostname           = $env:COMPUTERNAME
        CurrentUser        = $env:USERNAME
        PowerShellVersion  = $PSVersionTable.PSVersion.ToString()
        TotalDiskGB        = $totalDiskGb
        FreeDiskGB         = $freeDiskGb
        Is64Bit            = ($os.OSArchitecture -match "64")
        IsWin10or11        = ($os.Version -ge "10.0")
    }
}

function Invoke-HardwareAudit {
    $proc = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
    $cs = Get-CimInstance -ClassName Win32_ComputerSystem
    $os = Get-CimInstance -ClassName Win32_OperatingSystem

    $totalRamGb = [math]::Round($cs.TotalPhysicalMemory / 1GB, 2)
    $freeRamGb = [math]::Round($os.FreePhysicalMemory / 1MB, 2)

    $gpus = Get-CimInstance -ClassName Win32_VideoController | Where-Object { $_.AdapterRAM -gt 0 -or $_.Name -notmatch "Basic|VNC|Miracast" }
    $primaryGpu = $gpus | Select-Object -First 1

    $gpuName = if ($primaryGpu) { $primaryGpu.Name } else { "Standard Display Adapter" }
    $vramGb = if ($primaryGpu -and $primaryGpu.AdapterRAM) { [math]::Round($primaryGpu.AdapterRAM / 1GB, 2) } else { 0 }
    $driverVer = if ($primaryGpu) { $primaryGpu.DriverVersion } else { "N/A" }

    return [ordered]@{
        CPUName         = $proc.Name
        CPUCores        = $proc.NumberOfCores
        CPUThreads      = $proc.NumberOfLogicalProcessors
        TotalRamGB      = $totalRamGb
        FreeRamGB       = $freeRamGb
        GPUName         = $gpuName
        VRAM_GB         = $vramGb
        DriverVersion   = $driverVer
        IsDedicatedGpu  = ($gpuName -match "NVIDIA|RTX|Quadro|GeForce|Radeon|AMD")
    }
}

function Invoke-RuntimeAudit {
    param([string]$TargetRevit = "2026")

    # 1. .NET Framework Release Key
    $netRelease = (Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" -Name "Release" -ErrorAction SilentlyContinue).Release
    $netVersionStr = switch ($netRelease) {
        { $_ -ge 533320 } { ".NET Framework 4.8.1 ($netRelease)" }
        { $_ -ge 528040 } { ".NET Framework 4.8 ($netRelease)" }
        { $_ -ge 461808 } { ".NET Framework 4.7.2 ($netRelease)" }
        { $_ -ge 461308 } { ".NET Framework 4.7.1 ($netRelease)" }
        Default           { if ($netRelease) { "Older than 4.7 ($netRelease)" } else { "NOT_FOUND" } }
    }

    # 2. .NET 8 Desktop Runtime (dotnet --list-runtimes)
    $dotnet8Status = "NOT_FOUND"
    $dotnet8Version = "None"
    try {
        if (Get-Command dotnet -ErrorAction SilentlyContinue) {
            $runtimes = & dotnet --list-runtimes 2>&1
            $desktopRuntimes = $runtimes | Where-Object { $_ -match "Microsoft.WindowsDesktop.App 8\." }
            if ($desktopRuntimes) {
                $dotnet8Status = "FOUND"
                $dotnet8Version = ($desktopRuntimes | Select-Object -First 1) -replace "Microsoft.WindowsDesktop.App\s+([0-9\.]+)\s+.*", '$1'
            }
        }
    } catch {
        $dotnet8Status = "ERROR"
    }

    # 3. Visual C++ 2015-2022 Redistributable (x64 and x86)
    $vcX64 = Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64" -ErrorAction SilentlyContinue
    $vcStatus = if ($vcX64 -and $vcX64.Installed -eq 1) { "FOUND" } else { "NOT_FOUND" }
    $vcVersion = if ($vcX64) { "$($vcX64.Major).$($vcX64.Minor).$($vcX64.Bld)" } else { "None" }

    # 4. WebView2 Runtime
    $wv2RegPath = "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
    $wv2Version = (Get-ItemProperty -Path $wv2RegPath -Name "pv" -ErrorAction SilentlyContinue).pv
    if (-not $wv2Version) {
        $wv2RegPath64 = "HKLM:\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
        $wv2Version = (Get-ItemProperty -Path $wv2RegPath64 -Name "pv" -ErrorAction SilentlyContinue).pv
    }
    $wv2Status = if ($wv2Version) { "FOUND" } else { "NOT_FOUND" }

    # 5. Python 3 & Git
    $pythonStatus = if (Get-Command python -ErrorAction SilentlyContinue) { "FOUND" } else { "NOT_FOUND" }
    $gitStatus = if (Get-Command git -ErrorAction SilentlyContinue) { "FOUND" } else { "NOT_FOUND" }

    return [ordered]@{
        DotNetFrameworkRelease = $(if ($netRelease) { $netRelease } else { "None" })
        DotNetFrameworkVersion = $netVersionStr
        DotNet8DesktopStatus   = $dotnet8Status
        DotNet8Version         = $dotnet8Version
        VCRedistStatus         = $vcStatus
        VCRedistVersion        = $vcVersion
        WebView2Status         = $wv2Status
        WebView2Version        = $(if ($wv2Version) { $wv2Version } else { "None" })
        PythonStatus           = $pythonStatus
        GitStatus              = $gitStatus
    }
}

function Invoke-AutodeskAudit {
    param(
        [string]$TargetRevit = "2026",
        [string]$TargetAutoCAD = "2026"
    )

    # 1. Autodesk Desktop Licensing Service
    $licService = Get-Service -Name "AdskLicensingService" -ErrorAction SilentlyContinue
    $licStatus = if ($licService) { if ($licService.Status -eq 'Running') { "FOUND_RUNNING" } else { "FOUND_STOPPED" } } else { "NOT_FOUND" }

    # 2. Autodesk Identity Manager
    $idMgrPath = "$env:ProgramFiles\Autodesk\Identity Manager\AdskIdentityManager.exe"
    $idMgrStatus = if (Test-Path $idMgrPath) { "FOUND" } else { "NOT_FOUND" }

    # 3. Autodesk ODIS Engine
    $odisPath = "$env:ProgramFiles\Autodesk\ODIS\AdODIS-installer.exe"
    $odisStatus = if (Test-Path $odisPath) { "FOUND" } else { "NOT_FOUND" }

    # 4. Desktop Connector
    $dcReg = Get-ItemProperty -Path "HKLM:\SOFTWARE\Autodesk\Desktop Connector" -ErrorAction SilentlyContinue
    $dcStatus = if ($dcReg -and $dcReg.InstalledVersion) { "FOUND" } else { "NOT_FOUND" }

    # 5. Installed Revit Versions
    $installedRevit = @()
    2020..2026 | ForEach-Object {
        $ver = $_
        if (Test-Path "HKLM:\SOFTWARE\Autodesk\Revit\$ver") {
            $installedRevit += "$ver"
        }
    }

    # 6. Installed AutoCAD Versions
    $installedAutoCAD = @()
    2020..2026 | ForEach-Object {
        $ver = $_
        $acadKey = "HKLM:\SOFTWARE\Autodesk\AutoCAD\R$([math]::Round($ver - 1996, 1))"
        if (Test-Path $acadKey) {
            $installedAutoCAD += "$ver"
        }
    }

    return [ordered]@{
        LicensingServiceStatus   = $licStatus
        IdentityManagerStatus    = $idMgrStatus
        ODISStatus               = $odisStatus
        DesktopConnectorStatus   = $dcStatus
        RevitInstalledVersions   = if ($installedRevit.Count -gt 0) { $installedRevit -join ", " } else { "None Detected" }
        AutoCADInstalledVersions = if ($installedAutoCAD.Count -gt 0) { $installedAutoCAD -join ", " } else { "None Detected" }
    }
}
