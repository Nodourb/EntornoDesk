<#
.SYNOPSIS
    03_RuntimeDeployment.ps1 - Runtime Prerequisite Discovery
.DESCRIPTION
    Identifies missing developer runtimes (.NET 8, VC++, WebView2) and creates
    deployment manifests without executing any installations during Smoke Test.
#>

function Invoke-RuntimeDeploymentDiscovery {
    param(
        [hashtable]$RuntimeState,
        [string]$TargetRevit = "2026"
    )

    $missingRuntimes = @()
    if ($RuntimeState.DotNet8DesktopStatus -ne "FOUND" -and $TargetRevit -ge "2025") {
        $missingRuntimes += ".NET 8.0 Desktop Runtime (x64)"
    }
    if ($RuntimeState.VCRedistStatus -ne "FOUND") {
        $missingRuntimes += "Microsoft Visual C++ 2015-2022 Unified Redistributable"
    }
    if ($RuntimeState.WebView2Status -ne "FOUND") {
        $missingRuntimes += "Microsoft Edge WebView2 Evergreen Runtime"
    }

    return [ordered]@{
        Module             = "03_RuntimeDeployment"
        Mode               = "DRY_RUN"
        MissingRuntimes    = $missingRuntimes
        PendingActions     = $missingRuntimes.Count
        ModificationsCount = 0
    }
}
