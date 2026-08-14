<#
.SYNOPSIS
    04_AutodeskFrameworkRepair.ps1 - Autodesk Framework Diagnostic Discovery
.DESCRIPTION
    Checks health of AdskLicensingService and ODIS engine. Does not stop services
    or delete cache files during Smoke Test.
#>

function Invoke-AutodeskRepairDiscovery {
    param(
        [hashtable]$AutodeskState
    )

    $licensingHealth = if ($AutodeskState.LicensingServiceStatus -eq "FOUND_RUNNING") { "HEALTHY" } else { "DEGRADED" }
    
    return [ordered]@{
        Module             = "04_AutodeskFrameworkRepair"
        Mode               = "DRY_RUN"
        LicensingHealth    = $licensingHealth
        ODISStatus         = $AutodeskState.ODISStatus
        ModificationsCount = 0
    }
}
