import React, { useState } from 'react';
import { 
  X, 
  Wrench, 
  AlertTriangle, 
  Terminal, 
  Copy, 
  Check, 
  ShieldAlert, 
  HelpCircle,
  ExternalLink,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface TroubleshooterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface IssueDef {
  id: string;
  title: string;
  category: string;
  symptom: string;
  rootCause: string;
  solutionSummary: string;
  powershellFix: string;
}

const COMMON_ISSUES: IssueDef[] = [
  {
    id: 'adsk_licensing_1053',
    title: 'AdskLicensingService Error 1053 / Service Failed to Start in a Timely Fashion',
    category: 'Licensing Subsystem',
    symptom: 'Autodesk products fail to launch with "The License manager is not functioning or is improperly installed. Autodesk Revit will now close."',
    rootCause: 'Zombie licensing helper agent holding port 52200, corrupted Web Services token cache in %LOCALAPPDATA%\\Autodesk\\Web Services, or altered service account permissions.',
    solutionSummary: 'Kill hung AdskLicensing agents, purge cached expired XML tokens, and reset service startup permissions.',
    powershellFix: `# 1. Kill hung processes
Get-Process -Name "AdskLicensingAgent", "AdskLicensingService" -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Delete corrupt login tokens
$tokenDir = "$env:LOCALAPPDATA\\Autodesk\\Web Services"
if (Test-Path $tokenDir) { Remove-Item -Path "$tokenDir\\LoginState.xml" -Force -ErrorAction SilentlyContinue }

# 3. Reset Service to Automatic and start
Set-Service -Name "AdskLicensingService" -StartupType Automatic
Start-Service -Name "AdskLicensingService"
Write-Host "[+] AdskLicensingService successfully healed and restarted." -ForegroundColor Green`
  },
  {
    id: 'error_1603_odis',
    title: 'Autodesk Install Error 1603 (Fatal Error During Installation) / ODIS Crash',
    category: 'ODIS Installer Engine',
    symptom: 'Revit or AutoCAD installer terminates abruptly with "Install error: 1603" or rolls back at 97%.',
    rootCause: 'Corrupt On-Demand Install Service (ODIS) database in %LOCALAPPDATA%\\Autodesk\\ODIS or blocked MSI temp privileges in Windows Temp.',
    solutionSummary: 'Purge ODIS cache folders, clear temp installer locks, and reinstall official AdODIS-installer.exe in unattended mode.',
    powershellFix: `# 1. Purge corrupt ODIS caches
$odisCache = "$env:LOCALAPPDATA\\Autodesk\\ODIS"
if (Test-Path $odisCache) { Remove-Item -Path $odisCache -Recurse -Force -ErrorAction SilentlyContinue }

# 2. Clean %TEMP% Autodesk installer locks
Get-ChildItem -Path $env:TEMP -Filter "*adsk*" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue

# 3. Silent re-run of ODIS installer
$odisExe = "$env:ProgramFiles\\Autodesk\\ODIS\\AdODIS-installer.exe"
if (Test-Path $odisExe) {
    Start-Process -FilePath $odisExe -ArgumentList "--mode unattended" -Wait
    Write-Host "[+] ODIS Service reinitialized." -ForegroundColor Green
}`
  },
  {
    id: 'webview2_blank_login',
    title: 'Blank White Screen on Autodesk Login / Autodesk Identity SSO Failure',
    category: 'Identity & Authentication',
    symptom: 'When launching Revit/AutoCAD or clicking "Sign In", a blank white rectangular window appears and freezes.',
    rootCause: 'Missing, corrupted, or disabled Microsoft Edge WebView2 Evergreen runtime required by Autodesk Identity Manager v1.12+.',
    solutionSummary: 'Deploy Microsoft Edge WebView2 Evergreen bootstrapper silently to system.',
    powershellFix: `$wv2Url = "https://go.microsoft.com/fwlink/p/?LinkId=2124703"
$wv2Dest = Join-Path $env:TEMP "MicrosoftEdgeWebview2Setup.exe"
Invoke-WebRequest -Uri $wv2Url -OutFile $wv2Dest -UseBasicParsing
Start-Process -FilePath $wv2Dest -ArgumentList "/silent /install" -Wait
Write-Host "[+] Microsoft Edge WebView2 Evergreen Runtime deployed." -ForegroundColor Green`
  },
  {
    id: 'pyrevit_ribbon_missing_2025_2026',
    title: 'pyRevit Ribbon Tab Missing in Revit 2025 / 2026 (.NET 8 Compatibility)',
    category: 'pyRevit Automation',
    symptom: 'pyRevit installed correctly but does not show up in the Revit 2025/2026 ribbon bar.',
    rootCause: 'Revit 2025/2026 transitioned from .NET Framework 4.8 to .NET 8.0 Desktop Runtime. Older pyRevit versions compiled for .NET 4.8 fail silently on load.',
    solutionSummary: 'Upgrade pyRevit to 4.8.16+, install .NET 8.0 Desktop Runtime x64, and run pyrevit attach --installed.',
    powershellFix: `# 1. Ensure .NET 8 Desktop Runtime is installed
winget install Microsoft.DotNet.DesktopRuntime.8 -e --silent

# 2. Update and Attach pyRevit
if (Get-Command pyrevit -ErrorAction SilentlyContinue) {
    pyrevit attach --installed
    pyrevit runtimes
    Write-Host "[+] pyRevit attached to .NET 8 Revit engines." -ForegroundColor Green
} else {
    winget install pyRevitLabs.pyRevit -e --silent
}`
  },
  {
    id: 'gpu_software_rendering_lag',
    title: 'Extreme Viewport Lag / Revit Falling Back to Software Rendering Emulation',
    category: 'GPU & Direct3D',
    symptom: 'Slow orbital rotation in 3D views, model stutter, or "Hardware acceleration disabled" notification in Revit.',
    rootCause: 'Windows routed Revit.exe to Intel/AMD integrated GPU instead of dedicated NVIDIA/AMD workstation card, or UseHardware=0 in Revit.ini.',
    solutionSummary: 'Force high performance GPU preference in Windows graphics registry and set UseHardware=1 in Revit.ini.',
    powershellFix: `# 1. Add Revit to High Performance Graphics preference in Windows Registry
$regKey = "HKCU:\\Software\\Microsoft\\DirectX\\UserGpuPreferences"
if (-not (Test-Path $regKey)) { New-Item -Path $regKey -Force | Out-Null }
Set-ItemProperty -Path $regKey -Name "C:\\Program Files\\Autodesk\\Revit 2026\\Revit.exe" -Value "GpuPreference=2;"

# 2. Force HardwareAcceleration in Revit.ini
$iniDir = "$env:APPDATA\\Autodesk\\Revit\\Autodesk Revit 2026"
if (Test-Path "$iniDir\\Revit.ini") {
    Add-Content -Path "$iniDir\\Revit.ini" -Value "\`n[Graphics]\`nUseHardware=1\`nDisableGPUAcceleration=0\`n"
}
Write-Host "[+] High Performance GPU routed to Revit." -ForegroundColor Green`
  }
];

export const TroubleshooterModal: React.FC<TroubleshooterModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedIssueId, setSelectedIssueId] = useState<string>(COMMON_ISSUES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentIssue = COMMON_ISSUES.find(i => i.id === selectedIssueId) || COMMON_ISSUES[0];

  const handleCopyFix = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Autodesk Revit & AutoCAD Rapid Troubleshooter
              </h2>
              <p className="text-xs text-slate-500">
                Executable remediation scripts for notorious Autodesk licensing, installer, and runtime bugs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left: Issue List */}
          <div className="lg:col-span-4 bg-slate-50 border-r border-slate-200 p-4 space-y-2 overflow-y-auto max-h-[70vh]">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block px-1 mb-2">
              Common Autodesk Failure Modes
            </span>

            {COMMON_ISSUES.map(issue => (
              <button
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className={`w-full text-left p-3 rounded-xl transition-all shadow-xs ${
                  selectedIssueId === issue.id
                    ? 'bg-rose-50 border border-rose-200 text-rose-950'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                  {issue.category}
                </span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5 line-clamp-2">
                  {issue.title}
                </span>
              </button>
            ))}
          </div>

          {/* Right: Issue Details & Code */}
          <div className="lg:col-span-8 p-6 overflow-y-auto max-h-[70vh] space-y-5 bg-white">
            <div>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {currentIssue.category}
              </span>
              <h3 className="text-base font-bold text-slate-800 mt-2">
                {currentIssue.title}
              </h3>
            </div>

            {/* Symptom & Root Cause */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Symptom</span>
                <p className="text-slate-700 leading-relaxed">{currentIssue.symptom}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Root Cause</span>
                <p className="text-slate-700 leading-relaxed">{currentIssue.rootCause}</p>
              </div>
            </div>

            {/* Solution Summary */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-emerald-900">Recommended Resolution</span>
                <p className="mt-0.5 text-emerald-800 leading-relaxed">{currentIssue.solutionSummary}</p>
              </div>
            </div>

            {/* Executable PowerShell Remediation */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>Automated PowerShell Fix Routine</span>
                </span>

                <button
                  onClick={() => handleCopyFix(currentIssue.id, currentIssue.powershellFix)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {copiedId === currentIssue.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Fix Code</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 font-mono text-xs text-emerald-400 overflow-x-auto select-text leading-relaxed max-h-[220px]">
                {currentIssue.powershellFix}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors"
          >
            Close Troubleshooter
          </button>
        </div>
      </div>
    </div>
  );
};
