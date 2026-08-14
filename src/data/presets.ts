import { SystemProfile } from '../types';

export const SYSTEM_PRESETS: SystemProfile[] = [
  {
    id: 'legacy-win10-degraded',
    name: 'Legacy Windows 10 (Build 17763 / 1809) - Degraded Environment',
    description: 'Older workstation with outdated OS build, missing .NET 8, corrupt Autodesk Licensing service, and old GPU driver.',
    iconName: 'AlertTriangle',
    osName: 'Windows 10 Pro 64-bit (1809)',
    osBuild: '17763.107',
    items: [
      {
        id: 'sys_os_build',
        name: 'Windows OS Version & Build',
        category: '00_SYSTEM',
        currentValue: 'Win 10 v1809 (Build 17763)',
        requiredValue: 'Win 10 v22H2 (19045+) or Win 11',
        status: 'error',
        details: 'Structural OS limitation: Revit 2025/2026 ODIS installer blocks execution on Windows 10 builds older than 19044/19045.',
        recommendation: 'Perform in-place Windows Update upgrade to 22H2 or Windows 11. Scripts can automate prerequisite runtimes but cannot bypass kernel/ODIS build check.',
        remediationCommand: 'winget upgrade --id Microsoft.WindowsUpdateAssistant',
        isStructuralOsLimitation: true
      },
      {
        id: 'sys_integrity',
        name: 'System File Integrity (SFC / DISM)',
        category: '00_SYSTEM',
        currentValue: 'Component Store Corrupted',
        requiredValue: 'Health: Healthy',
        status: 'warning',
        details: 'CBS log shows pending corrupt servicing packages that cause MSI Error 1603 during Autodesk installations.',
        recommendation: 'Run automated DISM RestoreHealth and SFC /scannow repair pass.',
        remediationCommand: 'DISM.exe /Online /Cleanup-image /Restorehealth; sfc /scannow'
      },
      {
        id: 'sys_power_plan',
        name: 'Windows Power Plan',
        category: '00_SYSTEM',
        currentValue: 'Balanced (CPU Throttling Active)',
        requiredValue: 'High Performance / Ultimate',
        status: 'warning',
        details: 'Balanced plan causes single-thread frequency throttling during Revit regeneration and Dynamo execution.',
        recommendation: 'Activate High Performance power scheme via powercfg.',
        remediationCommand: 'powercfg -duplicatescheme 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c; powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
      },
      {
        id: 'rt_dotnet_framework',
        name: '.NET Framework 4.8.1',
        category: '01_RUNTIME',
        currentValue: '.NET Framework 4.7.2 (Release 461808)',
        requiredValue: '.NET Framework 4.8.1 (Release 533320+)',
        status: 'error',
        details: 'Revit 2024-2026 and core API add-ins require .NET Framework 4.8+.',
        recommendation: 'Install .NET 4.8.1 offline installer silently.',
        remediationCommand: 'winget install Microsoft.DotNet.Framework.DeveloperPack_4_8_1 -e --silent'
      },
      {
        id: 'rt_dotnet8_desktop',
        name: '.NET 8.0 Desktop Runtime (x64)',
        category: '01_RUNTIME',
        currentValue: 'Not Installed',
        requiredValue: 'v8.0.8+ (x64)',
        status: 'missing',
        details: 'MANDATORY for Revit 2025/2026 core engine, Dynamo 3.0+, and pyRevit 4.8.16+ (.NET 8 engine).',
        recommendation: 'Deploy Microsoft .NET Desktop Runtime 8.0.x x64.',
        remediationCommand: 'winget install Microsoft.DotNet.DesktopRuntime.8 -e --silent'
      },
      {
        id: 'rt_vcredist',
        name: 'Visual C++ 2015-2022 Redistributable (x64)',
        category: '01_RUNTIME',
        currentValue: 'v14.28.29913 (Outdated 2019 build)',
        requiredValue: 'v14.40.33810+ (Unified 2015-2022)',
        status: 'warning',
        details: 'Older VC++ runtimes cause random CTD (Crash to Desktop) during AutoCAD DXF imports and Revit IFC exports.',
        recommendation: 'Update to the unified Microsoft Visual C++ 2015-2022 Redistributable.',
        remediationCommand: 'winget install Microsoft.VCRedist.2015+.x64 -e --silent'
      },
      {
        id: 'rt_webview2',
        name: 'Microsoft Edge WebView2 Evergreen Runtime',
        category: '01_RUNTIME',
        currentValue: 'Missing / Disabled',
        requiredValue: 'Evergreen Runtime Installed',
        status: 'error',
        details: 'Autodesk Identity login dialog renders as blank white screen without WebView2.',
        recommendation: 'Deploy Evergreen WebView2 Bootstrapper.',
        remediationCommand: 'winget install Microsoft.EdgeWebView2Runtime -e --silent'
      },
      {
        id: 'adsk_licensing_service',
        name: 'Autodesk Desktop Licensing Service (AdskLicensing)',
        category: '02_AUTODESK',
        currentValue: 'Service Stopped / Error 1053',
        requiredValue: 'Running (v14.2.0.10911+)',
        status: 'error',
        details: 'Known Autodesk bug: AdskLicensingService fails to start if user profile permissions are altered or token cache is locked.',
        recommendation: 'Stop service, purge AdskLicensing token cache in %LOCALAPPDATA%\\Autodesk, and reinstall latest AdskLicensing-installer.exe.',
        remediationCommand: 'Stop-Service AdskLicensingService -Force; & "C:\\Program Files (x86)\\Common Files\\Autodesk Shared\\AdskLicensing\\uninstall.exe" --silent'
      },
      {
        id: 'adsk_identity',
        name: 'Autodesk Identity Manager',
        category: '02_AUTODESK',
        currentValue: 'v1.0.0 (Corrupted)',
        requiredValue: 'v1.12.0+ Installed',
        status: 'warning',
        details: 'Required for single sign-on (SSO) and Autodesk Construction Cloud / BIM 360 cloud worksharing.',
        recommendation: 'Update Autodesk Identity Manager to latest build.',
        remediationCommand: 'winget install Autodesk.IdentityManager -e --silent'
      },
      {
        id: 'adsk_odis',
        name: 'Autodesk ODIS Deployment Engine',
        category: '02_AUTODESK',
        currentValue: 'Corrupted Cache (AdskUpdateHelper)',
        requiredValue: 'Healthy ODIS 2.x',
        status: 'error',
        details: 'Broken ODIS cache causes silent installer exits and Error code 1603.',
        recommendation: 'Clean %TEMP% and %LOCALAPPDATA%\\Autodesk\\ODIS cache and reinstall AdODIS-installer.exe.',
        remediationCommand: 'Remove-Item -Recurse -Force "$env:LOCALAPPDATA\\Autodesk\\ODIS\\*"; & "$env:ProgramFiles\\Autodesk\\ODIS\\AdODIS-installer.exe" --mode unattended'
      },
      {
        id: 'revit_install',
        name: 'Autodesk Revit Status',
        category: '03_REVIT',
        currentValue: 'Revit 2021 Installed / 2026 Missing',
        requiredValue: 'Revit 2026 with Latest Hotfix',
        status: 'warning',
        details: 'Revit 2021 is functional but target deployment is Revit 2026.',
        recommendation: 'Prepare unattended deployment payload or run ODIS custom install.',
        remediationCommand: '.\\modules\\Revit.ps1 -Action Deploy -TargetVersion 2026'
      },
      {
        id: 'revit_ini_tuning',
        name: 'Revit.ini Performance Configuration',
        category: '03_REVIT',
        currentValue: 'Default Unoptimized (DisableDataAnalysis=0)',
        requiredValue: 'Optimized (HardwareAcceleration=1, JournalRetention=5)',
        status: 'warning',
        details: 'Revit telemetry overhead and default journal retention cause slow boot times and disk clutter.',
        recommendation: 'Inject optimized Revit.ini profile with GPU hardware acceleration and journal cleanup thresholds.',
        remediationCommand: '.\\modules\\Revit.ps1 -Action TuneIni'
      },
      {
        id: 'autocad_install',
        name: 'AutoCAD Environment & Support Paths',
        category: '04_AUTOCAD',
        currentValue: 'AutoCAD 2021 Installed',
        requiredValue: 'AutoCAD 2026 Ready',
        status: 'ok',
        details: 'Support paths intact; CTB/STB standard directories mapped.',
        recommendation: 'Backup current acad.cuix and standard font directories before upgrade.',
        remediationCommand: '.\\modules\\AutoCAD.ps1 -Action BackupProfiles'
      },
      {
        id: 'drv_gpu_detection',
        name: 'Dedicated GPU & Direct3D Feature Level',
        category: '05_DRIVERS',
        currentValue: 'NVIDIA Quadro P2000 (Driver 472.12 - 2021)',
        requiredValue: 'Studio Driver 550.x+ (D3D 12 FL 12_1)',
        status: 'warning',
        details: 'GPU driver is 3+ years old. Missing modern Direct3D 12 shader fixes required for Revit 2025/2026 realistic viewport view.',
        recommendation: 'Update to NVIDIA Production Branch / Studio Driver.',
        remediationCommand: 'winget install Nvidia.GeForceExperience -e'
      },
      {
        id: 'bim_pyrevit',
        name: 'pyRevit CLI & Extension Framework',
        category: '06_BIM_CONFIG',
        currentValue: 'Missing / Not Configured',
        requiredValue: 'pyRevit 4.8.16+ CLI configured for .NET 8',
        status: 'missing',
        details: 'BIM automation engine pyRevit is not installed in the user profile.',
        recommendation: 'Deploy pyRevit via silent installer and attach to target Revit versions.',
        remediationCommand: 'winget install pyRevitLabs.pyRevit -e --silent; pyrevit attach --installed'
      },
      {
        id: 'bim_python_git',
        name: 'Python 3.11 & Git Developer Toolchain',
        category: '06_BIM_CONFIG',
        currentValue: 'Python Missing | Git Missing',
        requiredValue: 'Python 3.11+ & Git x64 in PATH',
        status: 'missing',
        details: 'Essential for Dynamo CPython3 scripts, Revit batch journals, and version-controlled BIM standards.',
        recommendation: 'Install Python 3.11 (with PATH enabled) and Git for Windows.',
        remediationCommand: 'winget install Python.Python.3.11 Git.Git -e --silent'
      }
    ]
  },
  {
    id: 'modernized-ready-rig',
    name: 'Modernized Windows 11 BIM Workstation - Optimized',
    description: 'Fully stabilized and audited machine with .NET 8, healthy Licensing, optimized Revit.ini, and pyRevit configured.',
    iconName: 'CheckCircle2',
    osName: 'Windows 11 Pro 64-bit (23H2)',
    osBuild: '22631.3880',
    items: [
      {
        id: 'sys_os_build',
        name: 'Windows OS Version & Build',
        category: '00_SYSTEM',
        currentValue: 'Windows 11 Pro 23H2 (Build 22631)',
        requiredValue: 'Win 10 22H2 or Win 11',
        status: 'ok',
        details: 'Fully compatible with all Revit / AutoCAD releases from 2020 through 2026.',
        recommendation: 'OS is fully up-to-date.'
      },
      {
        id: 'sys_integrity',
        name: 'System File Integrity (SFC / DISM)',
        category: '00_SYSTEM',
        currentValue: 'Health: Healthy (0 Errors)',
        requiredValue: 'Health: Healthy',
        status: 'ok',
        details: 'CBS servicing logs clear. No component store corruptions.',
        recommendation: 'None required.'
      },
      {
        id: 'sys_power_plan',
        name: 'Windows Power Plan',
        category: '00_SYSTEM',
        currentValue: 'Ultimate Performance (Active)',
        requiredValue: 'High / Ultimate Performance',
        status: 'ok',
        details: 'CPU cores unparked and operating at maximum boost clock.',
        recommendation: 'Optimal for BIM tasks.'
      },
      {
        id: 'rt_dotnet_framework',
        name: '.NET Framework 4.8.1',
        category: '01_RUNTIME',
        currentValue: '.NET Framework 4.8.1 (Release 533320)',
        requiredValue: '.NET Framework 4.8.1',
        status: 'ok',
        details: 'Native Windows 11 component verified.',
        recommendation: 'None required.'
      },
      {
        id: 'rt_dotnet8_desktop',
        name: '.NET 8.0 Desktop Runtime (x64)',
        category: '01_RUNTIME',
        currentValue: 'v8.0.8 (x64) Installed',
        requiredValue: 'v8.0.x (x64)',
        status: 'ok',
        details: 'Ready for Revit 2025/2026, Dynamo 3.2, and pyRevit .NET 8 runner.',
        recommendation: 'None required.'
      },
      {
        id: 'rt_vcredist',
        name: 'Visual C++ 2015-2022 Redistributable (x64)',
        category: '01_RUNTIME',
        currentValue: 'v14.40.33810 (Latest)',
        requiredValue: 'v14.40+',
        status: 'ok',
        details: 'x86 and x64 unified runtimes active.',
        recommendation: 'None required.'
      },
      {
        id: 'rt_webview2',
        name: 'Microsoft Edge WebView2 Evergreen Runtime',
        category: '01_RUNTIME',
        currentValue: 'v128.0.2739.42 (Active)',
        requiredValue: 'Evergreen Runtime Installed',
        status: 'ok',
        details: 'Autodesk Identity authentication subsystem functioning normally.',
        recommendation: 'None required.'
      },
      {
        id: 'adsk_licensing_service',
        name: 'Autodesk Desktop Licensing Service (AdskLicensing)',
        category: '02_AUTODESK',
        currentValue: 'Running (v14.2.0.10911)',
        requiredValue: 'Running (v14.2.0.10911+)',
        status: 'ok',
        details: 'Service healthy, tokens validating smoothly, ports 52200-52205 listening.',
        recommendation: 'None required.'
      },
      {
        id: 'adsk_identity',
        name: 'Autodesk Identity Manager',
        category: '02_AUTODESK',
        currentValue: 'v1.12.0 Installed',
        requiredValue: 'v1.12.0+',
        status: 'ok',
        details: 'ACC and BIM 360 SSO connectivity established.',
        recommendation: 'None required.'
      },
      {
        id: 'adsk_odis',
        name: 'Autodesk ODIS Deployment Engine',
        category: '02_AUTODESK',
        currentValue: 'Healthy (v2.8.0.14)',
        requiredValue: 'Healthy ODIS 2.x',
        status: 'ok',
        details: 'Installer service verified with clean temp repository.',
        recommendation: 'None required.'
      },
      {
        id: 'revit_install',
        name: 'Autodesk Revit Status',
        category: '03_REVIT',
        currentValue: 'Revit 2026.0.1 Hotfix Installed',
        requiredValue: 'Revit 2026 Installed',
        status: 'ok',
        details: 'Imperial and Metric content libraries mounted, template paths registered.',
        recommendation: 'None required.'
      },
      {
        id: 'revit_ini_tuning',
        name: 'Revit.ini Performance Configuration',
        category: '03_REVIT',
        currentValue: 'Optimized (HardwareAcceleration=1, GPU Force)',
        requiredValue: 'Optimized Profile',
        status: 'ok',
        details: 'Hardware acceleration forced on NVIDIA RTX A4000; journal rolling limit configured.',
        recommendation: 'None required.'
      },
      {
        id: 'autocad_install',
        name: 'AutoCAD Environment & Support Paths',
        category: '04_AUTOCAD',
        currentValue: 'AutoCAD 2026 Installed',
        requiredValue: 'AutoCAD 2026 Installed',
        status: 'ok',
        details: 'CTB plot styles, SHX fonts, and enterprise tool palettes linked to central repository.',
        recommendation: 'None required.'
      },
      {
        id: 'drv_gpu_detection',
        name: 'Dedicated GPU & Direct3D Feature Level',
        category: '05_DRIVERS',
        currentValue: 'NVIDIA RTX A4000 16GB (Driver 552.22 Studio)',
        requiredValue: 'DirectX 12 FL 12_1',
        status: 'ok',
        details: 'Certified Autodesk workstation driver active with Hardware Accelerated GPU Scheduling enabled.',
        recommendation: 'None required.'
      },
      {
        id: 'bim_pyrevit',
        name: 'pyRevit CLI & Extension Framework',
        category: '06_BIM_CONFIG',
        currentValue: 'pyRevit 4.8.16 Attached (.NET 8 Engine)',
        requiredValue: 'pyRevit 4.8.16+ Attached',
        status: 'ok',
        details: 'Custom company tab and telemetry hooks loaded smoothly in Revit ribbon.',
        recommendation: 'None required.'
      },
      {
        id: 'bim_python_git',
        name: 'Python 3.11 & Git Developer Toolchain',
        category: '06_BIM_CONFIG',
        currentValue: 'Python 3.11.9 | Git 2.45.2',
        requiredValue: 'Python 3.11+ | Git x64',
        status: 'ok',
        details: 'BIM automation toolchain and VSCode Revit API snippets enabled.',
        recommendation: 'None required.'
      }
    ]
  },
  {
    id: 'corrupted-licensing-runtime-rig',
    name: 'Windows 10 Workstation - Broken Runtimes & Licensing Loop',
    description: 'OS is compatible (22H2) but has broken Autodesk Licensing, missing .NET 8, and corrupt VC++ redistributable cache.',
    iconName: 'Wrench',
    osName: 'Windows 10 Pro 64-bit (22H2)',
    osBuild: '19045.4529',
    items: [
      {
        id: 'sys_os_build',
        name: 'Windows OS Version & Build',
        category: '00_SYSTEM',
        currentValue: 'Win 10 v22H2 (Build 19045)',
        requiredValue: 'Win 10 22H2 or Win 11',
        status: 'ok',
        details: 'Windows build is fully supported for Revit/AutoCAD 2026.',
        recommendation: 'OS kernel is ready.'
      },
      {
        id: 'sys_integrity',
        name: 'System File Integrity (SFC / DISM)',
        category: '00_SYSTEM',
        currentValue: 'Pending System Repair',
        requiredValue: 'Health: Healthy',
        status: 'warning',
        details: 'Corrupt registry transactional logs causing installer rollback.',
        recommendation: 'Run SFC scan.',
        remediationCommand: 'sfc /scannow'
      },
      {
        id: 'sys_power_plan',
        name: 'Windows Power Plan',
        category: '00_SYSTEM',
        currentValue: 'Power Saver',
        requiredValue: 'High Performance',
        status: 'error',
        details: 'Power Saver caps CPU at 60% frequency, severely crippling Revit model generation.',
        recommendation: 'Switch to High Performance scheme.',
        remediationCommand: 'powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
      },
      {
        id: 'rt_dotnet_framework',
        name: '.NET Framework 4.8.1',
        category: '01_RUNTIME',
        currentValue: '.NET Framework 4.8 (Release 528040)',
        requiredValue: '.NET Framework 4.8.1',
        status: 'ok',
        details: 'Compatible with Revit 2024-2026.',
        recommendation: 'None required.'
      },
      {
        id: 'rt_dotnet8_desktop',
        name: '.NET 8.0 Desktop Runtime (x64)',
        category: '01_RUNTIME',
        currentValue: 'Missing',
        requiredValue: 'v8.0.x (x64)',
        status: 'missing',
        details: 'Required for Revit 2025/2026 launch.',
        recommendation: 'Deploy .NET 8 Desktop Runtime.',
        remediationCommand: 'winget install Microsoft.DotNet.DesktopRuntime.8 -e --silent'
      },
      {
        id: 'rt_vcredist',
        name: 'Visual C++ 2015-2022 Redistributable (x64)',
        category: '01_RUNTIME',
        currentValue: 'Corrupted MsiExec Registration',
        requiredValue: 'v14.40+ Unified',
        status: 'error',
        details: 'Duplicate mismatched VC++ packages causing dll loading crashes in acad.exe.',
        recommendation: 'Perform VC++ unregister and deploy official unified package.',
        remediationCommand: '.\\modules\\Runtime.ps1 -RepairVCRedist'
      },
      {
        id: 'rt_webview2',
        name: 'Microsoft Edge WebView2 Evergreen Runtime',
        category: '01_RUNTIME',
        currentValue: 'Corrupted binary in System32',
        requiredValue: 'Evergreen Runtime',
        status: 'error',
        details: 'White screen on Autodesk login and ACC model browser.',
        recommendation: 'Reinstall WebView2 via Evergreen standalone installer.',
        remediationCommand: 'winget install Microsoft.EdgeWebView2Runtime -e --silent'
      },
      {
        id: 'adsk_licensing_service',
        name: 'Autodesk Desktop Licensing Service (AdskLicensing)',
        category: '02_AUTODESK',
        currentValue: 'Crash Loop / Port Conflict (52200)',
        requiredValue: 'Running (v14.2.0.10911+)',
        status: 'error',
        details: 'AdskLicensingService in zombie state with corrupted token directory.',
        recommendation: 'Execute automated AdskLicensing Reset Routine.',
        remediationCommand: '.\\modules\\Autodesk.ps1 -Action RepairLicensing'
      },
      {
        id: 'adsk_identity',
        name: 'Autodesk Identity Manager',
        category: '02_AUTODESK',
        currentValue: 'v1.4.0 (Outdated)',
        requiredValue: 'v1.12.0+',
        status: 'warning',
        details: 'Intermittent authentication failures.',
        recommendation: 'Update to v1.12.0.',
        remediationCommand: 'winget install Autodesk.IdentityManager -e --silent'
      },
      {
        id: 'adsk_odis',
        name: 'Autodesk ODIS Deployment Engine',
        category: '02_AUTODESK',
        currentValue: 'Corrupted Cache',
        requiredValue: 'Healthy ODIS 2.x',
        status: 'error',
        details: 'Locks installer process with exit code 1603.',
        recommendation: 'Purge ODIS cache directory and reinstall helper.',
        remediationCommand: '.\\modules\\Autodesk.ps1 -Action RepairODIS'
      },
      {
        id: 'revit_install',
        name: 'Autodesk Revit Status',
        category: '03_REVIT',
        currentValue: 'Revit 2024 Installed (Missing Hotfixes)',
        requiredValue: 'Revit 2026 Target',
        status: 'warning',
        details: 'Revit 2024.2 update missing.',
        recommendation: 'Update Revit or deploy 2026.',
        remediationCommand: '.\\modules\\Revit.ps1 -Action Deploy -TargetVersion 2026'
      },
      {
        id: 'revit_ini_tuning',
        name: 'Revit.ini Performance Configuration',
        category: '03_REVIT',
        currentValue: 'HardwareAcceleration=0 (Disabled)',
        requiredValue: 'HardwareAcceleration=1 (Enabled)',
        status: 'error',
        details: 'Software rendering mode active! Viewport framerates degraded 10x.',
        recommendation: 'Force GPU hardware acceleration in Revit.ini.',
        remediationCommand: '.\\modules\\Revit.ps1 -Action TuneIni'
      },
      {
        id: 'autocad_install',
        name: 'AutoCAD Environment & Support Paths',
        category: '04_AUTOCAD',
        currentValue: 'AutoCAD 2024 Installed',
        requiredValue: 'AutoCAD 2026 Ready',
        status: 'ok',
        details: 'Support paths intact.',
        recommendation: 'Ready.'
      },
      {
        id: 'drv_gpu_detection',
        name: 'Dedicated GPU & Direct3D Feature Level',
        category: '05_DRIVERS',
        currentValue: 'NVIDIA GeForce RTX 3070 (Driver 516.94)',
        requiredValue: 'Studio Driver 550.x+',
        status: 'warning',
        details: 'Outdated Game Ready driver; recommend Studio Driver for BIM stability.',
        recommendation: 'Update graphics driver.',
        remediationCommand: 'winget install Nvidia.GeForceExperience -e'
      },
      {
        id: 'bim_pyrevit',
        name: 'pyRevit CLI & Extension Framework',
        category: '06_BIM_CONFIG',
        currentValue: 'pyRevit 4.8.8 (Old Python 2.7 engine)',
        requiredValue: 'pyRevit 4.8.16+ (.NET 8 compatible)',
        status: 'warning',
        details: 'Old pyRevit release will crash on Revit 2025/2026 launch.',
        recommendation: 'Upgrade to pyRevit 4.8.16+ and attach.',
        remediationCommand: 'winget install pyRevitLabs.pyRevit -e --silent; pyrevit attach --installed'
      },
      {
        id: 'bim_python_git',
        name: 'Python 3.11 & Git Developer Toolchain',
        category: '06_BIM_CONFIG',
        currentValue: 'Git Installed | Python Missing',
        requiredValue: 'Python 3.11+ & Git',
        status: 'warning',
        details: 'Python runtime missing in system PATH.',
        recommendation: 'Install Python 3.11 with Add to PATH flag.',
        remediationCommand: 'winget install Python.Python.3.11 -e --silent'
      }
    ]
  }
];
