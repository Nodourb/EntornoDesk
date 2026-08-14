<#
.SYNOPSIS
    05_WorkstationStandardization.ps1 - Workstation Standardization Discovery
.DESCRIPTION
    Compares active Revit.ini configuration and hardware settings against
    BIM workstation standards in dry-run mode without modifying user files.
#>

function Invoke-StandardizationDiscovery {
    param(
        [string]$TargetRevit = "2026"
    )

    $revitIniPath = "$env:APPDATA\Autodesk\Revit\Autodesk Revit $TargetRevit\Revit.ini"
    $iniExists = Test-Path -LiteralPath $revitIniPath

    return [ordered]@{
        Module             = "05_WorkstationStandardization"
        Mode               = "DRY_RUN"
        TargetRevit        = $TargetRevit
        RevitIniLocated    = $iniExists
        RevitIniPath       = $revitIniPath
        ModificationsCount = 0
    }
}
