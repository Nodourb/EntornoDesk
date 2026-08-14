import React, { useState } from 'react';
import { 
  Settings, 
  Cpu, 
  Folder, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Sliders,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface BimConfiguratorProps {
  targetRevitVersion: string;
}

export const BimConfigurator: React.FC<BimConfiguratorProps> = ({
  targetRevitVersion
}) => {
  // Revit.ini states
  const [useHardware, setUseHardware] = useState(true);
  const [disableDataAnalysis, setDisableDataAnalysis] = useState(true);
  const [journalFilesLimit, setJournalFilesLimit] = useState(5);
  const [projectPath, setProjectPath] = useState('%USERPROFILE%\\Documents\\RevitProjects');
  const [sharedParametersPath, setSharedParametersPath] = useState('N:\\BIM_STANDARDS\\Revit\\SharedParameters.txt');
  
  // pyRevit states
  const [pyrevitEngine, setPyrevitEngine] = useState('net8');
  const [customExtensionRepo, setCustomExtensionRepo] = useState('https://github.com/company/BIM-Custom-Extension.git');
  
  // AutoCAD states
  const [ctbPath, setCtbPath] = useState('N:\\BIM_STANDARDS\\AutoCAD\\PlotStyles');
  const [fontsPath, setFontsPath] = useState('N:\\BIM_STANDARDS\\AutoCAD\\Fonts');

  const [copiedIni, setCopiedIni] = useState(false);
  const [copiedPs, setCopiedPs] = useState(false);

  const generatedIni = `[Graphics]
UseHardware=${useHardware ? '1' : '0'}
UseAdvancedDirect3D=1
Antialiasing=0
DisableGPUAcceleration=0
AllowUncertifiedHardware=1

[Performance]
DisableDataAnalysis=${disableDataAnalysis ? '1' : '0'}
JournalCleanupFrequency=${journalFilesLimit}
MaxJournalFiles=${journalFilesLimit}

[Messages]
SuppressHelpMessage=1

[Directories]
ProjectPath=${projectPath}
FamilyTemplatePath=C:\\ProgramData\\Autodesk\\RVT ${targetRevitVersion}\\Family Templates\\English
SharedParameters=${sharedParametersPath}
`;

  const generatedPowershellSetup = `# ==============================================================================
# ABEM Automated BIM Standardization & Configuration Script for Revit ${targetRevitVersion}
# ==============================================================================

Write-Host "Configuring Revit ${targetRevitVersion} performance parameters..." -ForegroundColor Cyan

# 1. Inject Optimized Revit.ini
$revitAppData = "$env:APPDATA\\Autodesk\\Revit\\Autodesk Revit ${targetRevitVersion}"
if (-not (Test-Path $revitAppData)) { New-Item -ItemType Directory -Path $revitAppData -Force | Out-Null }
$iniPath = Join-Path $revitAppData "Revit.ini"
@'
${generatedIni}
'@ | Set-Content -Path $iniPath -Encoding UTF8

Write-Host "[+] Revit.ini performance flags written to $iniPath" -ForegroundColor Green

# 2. Configure pyRevit Framework
Write-Host "Configuring pyRevit for .NET 8 / Revit ${targetRevitVersion}..." -ForegroundColor Cyan
if (Get-Command pyrevit -ErrorAction SilentlyContinue) {
    pyrevit configs logs none
    pyrevit attach --installed
    Write-Host "[+] pyRevit attached to all installed Revit engines." -ForegroundColor Green
}

# 3. Clean Legacy Journals Older than 30 Days
$journalsDir = "$env:LOCALAPPDATA\\Autodesk\\Revit\\Autodesk Revit ${targetRevitVersion}\\Journals"
if (Test-Path $journalsDir) {
    Get-ChildItem -Path $journalsDir -Filter "journal.*.txt" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force
    Write-Host "[+] Cleaned stale journal files in $journalsDir" -ForegroundColor Green
}
`;

  const handleCopyIni = () => {
    navigator.clipboard.writeText(generatedIni);
    setCopiedIni(true);
    setTimeout(() => setCopiedIni(false), 2000);
  };

  const handleCopyPs = () => {
    navigator.clipboard.writeText(generatedPowershellSetup);
    setCopiedPs(true);
    setTimeout(() => setCopiedPs(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              BIM Workstation Standards & Revit.ini Tuning Generator
            </h2>
            <p className="text-xs text-slate-500">
              Declare parameters for Revit {targetRevitVersion}, pyRevit environments, and shared network assets.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Form Controls (Left) & Live Generated Code (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Revit.ini Parameters Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Revit.ini Performance & Telemetry</span>
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                <div>
                  <span className="font-semibold text-slate-800 block">Force GPU Hardware Acceleration</span>
                  <span className="text-slate-500 text-[11px]">Sets UseHardware=1 & enables advanced Direct3D shader pipeline.</span>
                </div>
                <input
                  type="checkbox"
                  checked={useHardware}
                  onChange={(e) => setUseHardware(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 w-4 h-4 bg-white border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                <div>
                  <span className="font-semibold text-slate-800 block">Disable Data Analytics Telemetry</span>
                  <span className="text-slate-500 text-[11px]">Sets DisableDataAnalysis=1 to prevent Revit cloud telemetry lag.</span>
                </div>
                <input
                  type="checkbox"
                  checked={disableDataAnalysis}
                  onChange={(e) => setDisableDataAnalysis(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0 w-4 h-4 bg-white border-slate-300"
                />
              </label>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-semibold text-slate-800 block">Maximum Journal Files Retained</span>
                <p className="text-slate-500 text-[11px]">Restricts journal generation to prevent gigabytes of clutter.</p>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={journalFilesLimit}
                  onChange={(e) => setJournalFilesLimit(parseInt(e.target.value) || 5)}
                  className="bg-white border border-slate-300 text-slate-800 text-xs px-2.5 py-1 rounded-lg w-24 focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-semibold text-slate-800 block">Default Project Path</span>
                <input
                  type="text"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 font-mono text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-semibold text-slate-800 block">Central Shared Parameters File Path</span>
                <input
                  type="text"
                  value={sharedParametersPath}
                  onChange={(e) => setSharedParametersPath(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 font-mono text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-blue-500 shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Output Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Generated Revit.ini */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Revit.ini Preview for Revit {targetRevitVersion}</span>
              </span>
              <button
                onClick={handleCopyIni}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors"
              >
                {copiedIni ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedIni ? 'Copied' : 'Copy INI'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-900 font-mono text-xs text-slate-200 overflow-x-auto select-text leading-relaxed max-h-[220px]">
              {generatedIni}
            </pre>
          </div>

          {/* Generated Automated PowerShell Injector */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Automated PowerShell Injection Script</span>
              </span>
              <button
                onClick={handleCopyPs}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors"
              >
                {copiedPs ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedPs ? 'Copied' : 'Copy PS1 Script'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-900 font-mono text-xs text-emerald-400 overflow-x-auto select-text leading-relaxed max-h-[260px]">
              {generatedPowershellSetup}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
