# ABEM Architectural Boundaries & Structural Limits

This document outlines the four engineering levels defined by the **Autodesk BIM Environment Manager (ABEM)**:

## Level A — Software Toolchains (100% Automatable)
- .NET 8.0 Desktop Runtime (x64)
- Visual C++ 2015-2022 Unified Redistributable
- Microsoft Edge WebView2 Evergreen
- Python 3.11, pyRevit, Git

## Level B — Configuration & Parameters (100% Automatable)
- Revit.ini GPU acceleration flags (`UseHardware=1`)
- Journal rotation limits (`MaxJournalFiles=5`)
- Telemetry opt-out (`DisableDataAnalysis=1`)
- AutoCAD CTB and SHX support paths

## Level C — Hardware Diagnostics (Diagnosable)
- Dedicated GPU vs Integrated GPU selection
- Direct3D 12 Feature Level compliance
- High Performance Windows power schemes

## Level D — OS Kernel (Hard Frontier)
- Autodesk ODIS blocks Windows 10 builds older than 19044/19045 for Revit 2025/2026.
- A script cannot substitute an in-place Windows Feature Update.
