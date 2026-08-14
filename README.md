# Autodesk BIM Environment Manager (ABEM)

A declarative, reproducible workstation stabilization and diagnostics suite for **Autodesk Revit + AutoCAD + Dynamo + pyRevit**.

## Quick Start (Smoke Test)
1. Double-click `Quick-Audit.bat` to execute the non-destructive **Functional Smoke Test**.
2. Review the structured report generated at `reports/ABEM_SmokeTest_<timestamp>.json`.

## SSL/TLS & .NET Security Auto-Remediation
`Quick-Audit.bat` and `Deploy-BimEnvironment.ps1` include native pre-bootstrapping for `System.Net.ServicePointManager` via `modules/00_NetSecurityBootstrap.ps1`:
- Forces **TLS 1.2** (`[System.Net.SecurityProtocolType]3072`) and **TLS 1.3** (`12288`) for all web and local communication.
- Eliminates the legacy Windows PowerShell error: *"The request was aborted: Could not create SSL/TLS secure channel"*.
- Diagnoses and configures .NET Framework Strong Crypto (`SchUseStrongCrypto`) in 64-bit and 32-bit registry branches (`HKLM:\SOFTWARE\Microsoft\.NETFramework\v4.0.30319` y `WOW6432Node`).

## Safety Guarantee
In Smoke Test mode, ABEM executes strictly in **Read-Only / Discovery Mode** with zero modifications to system files, registry entries, or active services.
