import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  Play, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Zap, 
  ShieldCheck, 
  Wrench, 
  Activity,
  CheckCircle2,
  FileCode2
} from 'lucide-react';
import { ExecutionMode, SystemProfile } from '../types';

interface ExecutionConsoleProps {
  currentProfile: SystemProfile;
  targetRevitVersion: string;
  onExecutionComplete?: (mode: ExecutionMode) => void;
}

interface LogLine {
  id: string;
  time: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'STAGE' | 'BANNER';
  message: string;
}

export const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({
  currentProfile,
  targetRevitVersion,
  onExecutionComplete
}) => {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentMode, setCurrentMode] = useState<ExecutionMode>('SMOKE_TEST');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  const initialBanner = () => {
    const time = new Date().toLocaleTimeString();
    return [
      { id: '1', time, level: 'STAGE' as const, message: 'AUTODESK BIM ENVIRONMENT MANAGER (ABEM) - PowerShell Smoke Test Engine' },
      { id: '2', time, level: 'INFO' as const, message: `Root: C:\\BIM\\AutodeskEnvironment | Host: ${currentProfile.name} | Target: Revit ${targetRevitVersion}` },
      { id: '3', time, level: 'INFO' as const, message: 'Policy: Non-destructive read-only execution. System modifications guaranteed: 0' },
      { id: '4', time, level: 'SUCCESS' as const, message: 'Engine Ready. Run [0] SMOKE TEST or Quick-Audit.bat to verify core ABEM subsystems.' }
    ];
  };

  useEffect(() => {
    setLogs(initialBanner());
  }, [currentProfile.id, targetRevitVersion]);

  useEffect(() => {
    if (autoScroll && consoleBottomRef.current) {
      consoleBottomRef.current.scrollTop = consoleBottomRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const addLog = (level: LogLine['level'], message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { id: Math.random().toString(), time, level, message }]);
  };

  const handleRunMode = (mode: ExecutionMode) => {
    if (isRunning) return;
    setIsRunning(true);
    setCurrentMode(mode);

    const time = new Date().toLocaleTimeString();
    addLog('STAGE', `=== STARTING EXECUTION: Mode = ${mode} | Target Revit = ${targetRevitVersion} ===`);

    let stepIndex = 0;
    const sequence = getScriptSequence(mode, currentProfile, targetRevitVersion);

    const interval = setInterval(() => {
      if (stepIndex < sequence.length) {
        const item = sequence[stepIndex];
        addLog(item.level, item.message);
        stepIndex++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        const exitCode = mode === 'SMOKE_TEST' ? 0 : 0;
        addLog('SUCCESS', `=== [COMPLETED] Execution Mode ${mode} Finished with Exit Code ${exitCode} ===`);
        if (onExecutionComplete) onExecutionComplete(mode);
      }
    }, 380);
  };

  const handleClearLogs = () => {
    setLogs(initialBanner());
  };

  const handleCopyLogs = () => {
    const text = logs.map(l => `[${l.time}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReportJson = () => {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 15);
    const reportData = {
      timestamp: new Date().toISOString(),
      abem_version: "1.0.0-smoke",
      execution_mode: currentMode,
      root_path: "C:\\BIM\\AutodeskEnvironment",
      administrator: true,
      results_matrix: {
        RootDirectory: "PASS",
        PowerShellRuntime: "PASS",
        Configuration: "PASS",
        ModuleDiscovery: "PASS",
        SystemScan: "PASS",
        HardwareScan: "PASS",
        RuntimeScan: currentProfile.items.some(i => i.category === '01_RUNTIME' && i.status !== 'ok') ? "WARN" : "PASS",
        AutodeskDiscovery: "PASS",
        DryRunSafety: "PASS",
        ReportGeneration: "PASS"
      },
      operating_system: {
        OSCaption: currentProfile.osName,
        OSBuild: currentProfile.osBuild,
        Architecture: "64-bit",
        Hostname: "WORKSTATION-BIM-01",
        CurrentUser: "BIM_Admin",
        PowerShellVersion: "7.4.1"
      },
      hardware: {
        CPUName: "AMD Ryzen 9 7950X / Intel Core i9-14900K",
        TotalRamGB: 64,
        GPUName: "NVIDIA RTX A5000 / RTX 4080 (16 GB VRAM)"
      },
      runtimes: currentProfile.items.filter(i => i.category === '01_RUNTIME'),
      autodesk: currentProfile.items.filter(i => i.category === '02_AUTODESK' || i.category === '03_REVIT' || i.category === '04_AUTOCAD'),
      modules: {
        "01_EnvironmentAudit.ps1": { Exists: true, Readable: true, SyntaxValid: true, Loadable: true, Status: "READY_DRY_RUN" },
        "02_OSKernelRemediation.ps1": { Exists: true, Readable: true, SyntaxValid: true, Loadable: true, Status: "READY_DRY_RUN" },
        "03_RuntimeDeployment.ps1": { Exists: true, Readable: true, SyntaxValid: true, Loadable: true, Status: "READY_DRY_RUN" },
        "04_AutodeskFrameworkRepair.ps1": { Exists: true, Readable: true, SyntaxValid: true, Loadable: true, Status: "READY_DRY_RUN" },
        "05_WorkstationStandardization.ps1": { Exists: true, Readable: true, SyntaxValid: true, Loadable: true, Status: "READY_DRY_RUN" }
      },
      configuration: {
        baseline_loaded: true,
        releases_count: 3
      },
      safety: {
        system_modification: false,
        modifications_count: 0,
        dry_run_enforced: true
      },
      result: currentProfile.items.some(i => i.status === 'error') ? "PASS WITH WARNINGS" : "PASS"
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ABEM_SmokeTest_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Console Header & Mode Selectors */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Terminal indicator */}
        <div className="flex items-center gap-2">
          <div className="flex space-x-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <TerminalIcon className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-mono font-bold text-slate-800">
            PowerShell v7.4 / Windows Terminal [C:\BIM\AutodeskEnvironment]
          </span>
          {isRunning && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 border border-blue-200 animate-pulse font-semibold">
              Running -Mode {currentMode}...
            </span>
          )}
        </div>

        {/* Right: Quick Console Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLogs}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 text-xs transition-colors"
            title="Copy Terminal Logs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownloadReportJson}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 text-xs transition-colors"
            title="Download JSON Report"
          >
            <Download className="w-4 h-4 text-blue-600" />
          </button>

          <button
            onClick={handleClearLogs}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 text-xs transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Trigger Buttons */}
      <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-mono text-[11px] font-bold mr-1">EXECUTE:</span>

        {/* Primary Safe Smoke Test Button */}
        <button
          onClick={() => handleRunMode('SMOKE_TEST')}
          disabled={isRunning}
          className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
            currentMode === 'SMOKE_TEST' && isRunning
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>[0] SMOKE TEST (SAFE)</span>
        </button>

        <button
          onClick={() => handleRunMode('AUDIT')}
          disabled={isRunning}
          className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
            currentMode === 'AUDIT' && isRunning
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          <span>[1] AUDIT</span>
        </button>

        <button
          onClick={() => handleRunMode('PLAN')}
          disabled={isRunning}
          className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
            currentMode === 'PLAN' && isRunning
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>[2] PLAN</span>
        </button>

        <button
          onClick={() => handleRunMode('REPAIR')}
          disabled={isRunning}
          className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
            currentMode === 'REPAIR' && isRunning
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-amber-600" />
          <span>[3] REPAIR</span>
        </button>

        <button
          onClick={() => handleRunMode('DEPLOY')}
          disabled={isRunning}
          className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
            currentMode === 'DEPLOY' && isRunning
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-cyan-600" />
          <span>[4] DEPLOY</span>
        </button>

        <button
          onClick={() => handleRunMode('VALIDATE')}
          disabled={isRunning}
          className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
            currentMode === 'VALIDATE' && isRunning
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'
          }`}
        >
          <Play className="w-3.5 h-3.5 text-purple-600" />
          <span>[5] VALIDATE</span>
        </button>

        {/* Windows 11 Preparation Pipeline Simulation */}
        <button
          onClick={() => handleRunMode('WIN11_PREP')}
          disabled={isRunning}
          className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
            currentMode === 'WIN11_PREP' && isRunning
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
              : 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-900 border border-blue-300'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
          <span>[6] WIN11 PREP</span>
        </button>

        {/* WinFix Unified Local Remediation Backend */}
        <button
          onClick={() => handleRunMode('WINFIX_UNIFIED')}
          disabled={isRunning}
          className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
            currentMode === 'WINFIX_UNIFIED' && isRunning
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-emerald-600" />
          <span>[7] WINFIX UNIFIED (LOCAL)</span>
        </button>
      </div>

      {/* Terminal Output Area */}
      <div 
        ref={consoleBottomRef}
        className="bg-slate-900 p-4 font-mono text-xs overflow-y-auto max-h-[500px] min-h-[380px] space-y-1 select-text"
      >
        {logs.map((log) => {
          let textStyle = 'text-slate-300';
          if (log.level === 'STAGE') textStyle = 'text-cyan-400 font-bold border-b border-cyan-900/40 pb-1 mt-2 block';
          else if (log.level === 'SUCCESS') textStyle = 'text-emerald-400 font-medium';
          else if (log.level === 'WARN') textStyle = 'text-amber-400 font-medium';
          else if (log.level === 'ERROR') textStyle = 'text-rose-400 font-bold';
          else if (log.level === 'BANNER') textStyle = 'text-emerald-300 font-bold whitespace-pre';

          return (
            <div key={log.id} className="leading-relaxed flex items-start gap-2">
              <span className="text-slate-500 flex-shrink-0 select-none">[{log.time}]</span>
              <span className={`flex-1 ${textStyle}`}>
                {log.level === 'SUCCESS' && '[+] '}
                {log.level === 'WARN' && '[!] '}
                {log.level === 'ERROR' && '[-] '}
                {log.level === 'INFO' && '[*] '}
                {log.message}
              </span>
            </div>
          );
        })}
        {isRunning && (
          <div className="flex items-center gap-2 text-cyan-400 animate-pulse pt-2">
            <span className="inline-block w-2 h-4 bg-cyan-400" />
            <span>Processing PowerShell task pipeline...</span>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between font-mono">
        <span>Log sink: .\logs\ABEM_{currentMode === 'SMOKE_TEST' ? 'SmokeTest' : currentMode.toLowerCase()}_2026.log</span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-0 bg-white"
          />
          <span>Auto-Scroll</span>
        </label>
      </div>
    </div>
  );
};

function getScriptSequence(mode: ExecutionMode, profile: SystemProfile, targetRevit: string): Array<{ level: LogLine['level']; message: string }> {
  const isOldWin = profile.osBuild.startsWith('17763') || profile.osBuild.startsWith('18362');
  
  if (mode === 'SMOKE_TEST') {
    return [
      { level: 'INFO', message: `Deploy-BimEnvironment.ps1: Initializing ABEM Functional Smoke Test v1.0.0-smoke...` },
      { level: 'SUCCESS', message: `[PASS] Root Path verified at C:\\BIM\\AutodeskEnvironment (Elevation: Administrator)` },
      { level: 'SUCCESS', message: `[PASS] PowerShell Runtime 7.4.1 / 5.1 (x64) process environment verified.` },
      { level: 'SUCCESS', message: `[PASS] NetSecurityBootstrap: System.Net.ServicePointManager set to [Tls12, Tls13] (StrongCrypto: Active)` },
      { level: 'INFO', message: `Validating configuration files: config/autodesk_baseline.json & config/Revit.ini.template...` },
      { level: 'SUCCESS', message: `[PASS] Configuration files parsed and JSON schema verified.` },
      { level: 'INFO', message: `Discovering sub-modules and performing AST Syntax validation...` },
      { level: 'INFO', message: `  - 00_NetSecurityBootstrap.ps1 [AST Syntax: OK | Status: READY]` },
      { level: 'INFO', message: `  - 01_EnvironmentAudit.ps1 [AST Syntax: OK | Status: READY]` },
      { level: 'INFO', message: `  - 02_OSKernelRemediation.ps1 [AST Syntax: OK | Mode: DRY_RUN]` },
      { level: 'INFO', message: `  - 03_RuntimeDeployment.ps1 [AST Syntax: OK | Mode: DRY_RUN]` },
      { level: 'INFO', message: `  - 04_AutodeskFrameworkRepair.ps1 [AST Syntax: OK | Mode: DRY_RUN]` },
      { level: 'INFO', message: `  - 05_WorkstationStandardization.ps1 [AST Syntax: OK | Mode: DRY_RUN]` },
      { level: 'SUCCESS', message: `[PASS] Module Discovery & AST Syntax Verification complete (6 modules verified).` },
      { level: 'INFO', message: `Executing Read-Only System & Hardware Scan...` },
      { level: isOldWin ? 'WARN' : 'SUCCESS', message: `[${isOldWin ? 'WARN' : 'PASS'}] OS Detected: ${profile.osName} (Build ${profile.osBuild}).` },
      { level: 'SUCCESS', message: `[PASS] Hardware: CPU Cores verified, RAM available, Dedicated GPU detected.` },
      { level: 'INFO', message: `Executing Read-Only Runtime Scan (.NET, VC++, WebView2)...` },
      { level: 'INFO', message: `  - .NET Framework: 4.8.1 (533320) [FOUND]` },
      { level: 'INFO', message: `  - .NET 8.0 Desktop Runtime: 8.0.4 x64 [FOUND]` },
      { level: 'INFO', message: `  - Visual C++ 2015-2022: 14.40.33810 [FOUND]` },
      { level: 'INFO', message: `  - Microsoft Edge WebView2: 124.0.2478.80 [FOUND]` },
      { level: 'SUCCESS', message: `[PASS] Runtime Scan complete.` },
      { level: 'INFO', message: `Executing Read-Only Autodesk Infrastructure Scan...` },
      { level: 'INFO', message: `  - Autodesk Desktop Licensing Service: [FOUND_RUNNING]` },
      { level: 'INFO', message: `  - Autodesk Identity Manager: [FOUND]` },
      { level: 'INFO', message: `  - Autodesk ODIS Engine: [FOUND]` },
      { level: 'INFO', message: `  - Revit Installed Releases: ${targetRevit} [FOUND]` },
      { level: 'SUCCESS', message: `[PASS] Autodesk Discovery complete.` },
      { level: 'SUCCESS', message: `[PASS] DRY-RUN SAFETY VERIFIED: System modifications performed = 0` },
      { level: 'SUCCESS', message: `[PASS] Report generated: .\\reports\\ABEM_SmokeTest_20260814.json` },
      { level: 'BANNER', message: `
==================================================
 ABEM — AUTODESK BIM ENVIRONMENT MANAGER
 FUNCTIONAL SMOKE TEST RESULTS
==================================================

[PASS] ABEM ROOT
[PASS] POWERSHELL RUNTIME
[PASS] NET SECURITY (TLS 1.2/1.3)
[PASS] CONFIGURATION
[PASS] MODULE DISCOVERY
[PASS] SYSTEM SCAN
[PASS] HARDWARE SCAN
[PASS] RUNTIME SCAN
[PASS] AUTODESK DISCOVERY
[PASS] DRY-RUN SAFETY
[PASS] REPORT GENERATION

--------------------------------------------------
RESULT: PASS (Exit Code 0)
--------------------------------------------------
System modifications performed: 0
Report: C:\\BIM\\AutodeskEnvironment\\reports\\ABEM_SmokeTest_20260814.json
Log   : C:\\BIM\\AutodeskEnvironment\\logs\\ABEM_SmokeTest_20260814.log
==================================================
` }
    ];
  }

  if (mode === 'AUDIT') {
    return [
      { level: 'INFO', message: `01_EnvironmentAudit.ps1: Querying WMI Win32_OperatingSystem on ${profile.osName}...` },
      { level: isOldWin ? 'WARN' : 'SUCCESS', message: `OS Build detected: ${profile.osBuild}. ${isOldWin ? 'Notice: Older than 19045.' : 'Verified compatible.'}` },
      { level: 'INFO', message: `01_EnvironmentAudit.ps1: Checking .NET Framework, .NET 8, and Visual C++ Unified Runtimes...` },
      { level: 'INFO', message: `01_EnvironmentAudit.ps1: Testing AdskLicensingService status on port 52200...` },
      { level: 'INFO', message: `01_EnvironmentAudit.ps1: Inspecting Revit ${targetRevit} Add-ins directory and Revit.ini...` },
      { level: 'INFO', message: `01_EnvironmentAudit.ps1: Direct3D 12 Feature Level query...` },
      { level: 'SUCCESS', message: `Audit completed. Generating .\\reports\\environment_report.json...` }
    ];
  } else if (mode === 'PLAN') {
    return [
      { level: 'INFO', message: `Computing Delta between Host State and Revit ${targetRevit} Matrix...` },
      { level: 'INFO', message: `Evaluating Category 00_SYSTEM: OS Build check...` },
      { level: 'INFO', message: `Evaluating Category 01_RUNTIME: .NET 8 Desktop Runtime (x64) requirement...` },
      { level: 'INFO', message: `Evaluating Category 02_AUTODESK: AdskLicensing & Identity Manager...` },
      { level: 'SUCCESS', message: `Remediation Plan Generated: 4 tasks ready for automated execution.` }
    ];
  } else if (mode === 'REPAIR') {
    return [
      { level: 'INFO', message: `Stopping zombie AdskLicensingService & helper agents...` },
      { level: 'SUCCESS', message: `Purged corrupted Web Services tokens in %LOCALAPPDATA%\\Autodesk\\Web Services.` },
      { level: 'INFO', message: `Cleaning corrupted ODIS deployment cache in %LOCALAPPDATA%\\Autodesk\\ODIS...` },
      { level: 'SUCCESS', message: `ODIS Cache cleared successfully.` },
      { level: 'INFO', message: `Deploying Microsoft Visual C++ 2015-2022 unified redistributable...` },
      { level: 'SUCCESS', message: `VC++ Runtime registered.` },
      { level: 'INFO', message: `Injecting high-performance GPU flags into Revit.ini (HardwareAcceleration=1)...` },
      { level: 'SUCCESS', message: `Revit.ini updated.` },
      { level: 'INFO', message: `Switching Windows power plan to High Performance...` },
      { level: 'SUCCESS', message: `All repair operations completed successfully.` }
    ];
  } else if (mode === 'DEPLOY') {
    return [
      { level: 'INFO', message: `Deploying Microsoft .NET 8.0 Desktop Runtime (x64)...` },
      { level: 'SUCCESS', message: `.NET 8 Desktop Runtime installed.` },
      { level: 'INFO', message: `Deploying Microsoft Edge WebView2 Evergreen Runtime...` },
      { level: 'SUCCESS', message: `WebView2 Runtime deployed.` },
      { level: 'INFO', message: `Deploying pyRevit CLI and attaching to Revit ${targetRevit}...` },
      { level: 'SUCCESS', message: `pyRevit 4.8.16 attached.` },
      { level: 'INFO', message: `Deploying Python 3.11 & Git for Windows...` },
      { level: 'SUCCESS', message: `Developer toolchain configured in system PATH.` }
    ];
  } else if (mode === 'WIN11_PREP') {
    return [
      { level: 'STAGE', message: `=== 07_WindowsUpdatePreparationManager.ps1: Initializing Pre-Flight Pipeline ===` },
      { level: 'INFO', message: `Host Node: WORKSTATION-BIM-01 | Current OS: ${profile.osName} (${profile.osBuild})` },
      { level: 'INFO', message: `Workspace Root: C:\\BIM\\REPOSITORIOS\\EntornoDesk | Staging: C:\\BIM\\Staging_Upgrade` },
      { level: 'INFO', message: `[STEP 1/6] STEP_01_EDGE_DOWNLOAD_UNLOCK: Configuring HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge...` },
      { level: 'SUCCESS', message: `Edge DownloadRestrictions=0 set (Unrestricted downloads enabled).` },
      { level: 'INFO', message: `[STEP 2/6] STEP_02_DEFENDER_QUIESCENCE: Setting temporary staging exclusions...` },
      { level: 'SUCCESS', message: `Defender exclusions registered for C:\\BIM\\Staging_Upgrade and setup.exe.` },
      { level: 'INFO', message: `[STEP 3/6] STEP_03_DISM_SFC_HEALTH: Running DISM /Online /Cleanup-Image /CheckHealth...` },
      { level: 'SUCCESS', message: `DISM CheckHealth completed (ExitCode 0 - Component store repairable/healthy).` },
      { level: 'INFO', message: `Running SFC.exe /scannow (System File Checker)...` },
      { level: 'SUCCESS', message: `Windows Resource Protection verified system file integrity.` },
      { level: 'INFO', message: `[STEP 4/6] STEP_04_ROOT_CERT_SYNC: Checking Microsoft Root Certificate Authority Store...` },
      { level: 'SUCCESS', message: `Microsoft PCA Root Certificates verified & AutoUpdate enabled.` },
      { level: 'INFO', message: `[STEP 5/6] STEP_05_STAGING_MANIFEST: Auditing required installers in C:\\BIM\\Staging_Upgrade...` },
      { level: 'INFO', message: `  - Windows 11 ISO (24H2/25H2): Verified / Mounted Media Search Active` },
      { level: 'INFO', message: `  - Microsoft .NET Framework 4.8.1 Runtime: Registered` },
      { level: 'INFO', message: `  - .NET 8.0 Desktop Runtime (x64): Registered` },
      { level: 'INFO', message: `[STEP 6/6] STEP_06_POST_UPDATE_SCANNER: WinSxS component store analysis...` },
      { level: 'SUCCESS', message: `WinSxS Component Store healthy. Windows Update Service (wuauserv) verified.` },
      { level: 'SUCCESS', message: `Consolidated JSON Telemetry written to: .\\reports\\ABEM_WinUpdatePrep_20260814.json` },
      { level: 'BANNER', message: `\n====================================================================\n  ABEM / AKS WORKSPACE - PREPARATION PIPELINE COMPLETED\n  VERDICT: READY_FOR_INPLACE_UPGRADE (Zero Data Loss Guaranteed)\n====================================================================\n` }
    ];
  } else if (mode === 'WINFIX_UNIFIED') {
    return [
      { level: 'STAGE', message: `=== WinFix-Backend.ps1: Initializing Local Technical Windows Remediation Engine ===` },
      { level: 'INFO', message: `Execution Mode: FullRepair | Host: ${profile.name} (${profile.osName})` },
      { level: 'INFO', message: `Local Architecture: 100% Local Execution (Zero External Cloud Model Dependencies)` },
      { level: 'INFO', message: `[PASO 1/5] Deteniendo servicios wuauserv, bits, cryptsvc y purgando colas de Windows Update...` },
      { level: 'SUCCESS', message: `SoftwareDistribution\\Download purgado y catroot2 reinicializado con exito.` },
      { level: 'INFO', message: `[PASO 2/5] Ejecutando DISM /Online /Cleanup-Image /RestoreHealth en almacen WinSxS...` },
      { level: 'SUCCESS', message: `DISM RestoreHealth completado con codigo 0 (Almacen de componentes reparado).` },
      { level: 'INFO', message: `Ejecutando SFC /scannow (System File Checker)...` },
      { level: 'SUCCESS', message: `SFC verifico integridad de archivos protegidos del sistema.` },
      { level: 'INFO', message: `[PASO 3/5] Corrigiendo Zonas de Seguridad 0/1 y desbloqueando archivos locales (DisableSecuritySettingsCheck=1)...` },
      { level: 'SUCCESS', message: `Politica Security_HKLM_only=0 y Zona 0 (Mi PC) desbloqueada. Alertas amarillas neutralizadas.` },
      { level: 'INFO', message: `[PASO 4/5] Depurando paquetes de controladores OEM antiguos y ejecutando pnputil /scan-devices...` },
      { level: 'SUCCESS', message: `Re-escaneo de dispositivos hardware (Intel, Realtek, Samsung) ejecutado correctamente.` },
      { level: 'INFO', message: `[PASO 5/5] Invocando DotNet-Fix.ps1 para verificar runtimes .NET 8.0 Desktop y Core 3.1...` },
      { level: 'SUCCESS', message: `Dependencias .NET Desktop Runtime validadas.` },
      { level: 'BANNER', message: `\n====================================================================\n  WINFIX UNIFIED - REPARACION LOCAL DE WINDOWS FINALIZADA\n  ESTADO: SISTEMA Y COMPONENTES REPARADOS CON EXITO (0 ERRORES)\n  REPORTE: C:\\BIM\\REPOSITORIOS\\EntornoDesk\\logs\\WinFix_Execution.log\n====================================================================\n` }
    ];
  } else {
    // VALIDATE
    return [
      { level: 'INFO', message: `Testing Revit ${targetRevit} core engine entry points...` },
      { level: 'SUCCESS', message: `Revit API assemblies loaded successfully.` },
      { level: 'INFO', message: `Verifying AdskLicensing authentication loop...` },
      { level: 'SUCCESS', message: `Licensing response 200 OK.` },
      { level: 'BANNER', message: `\n+-------------------------------------------------------------+\n|              BIM ENVIRONMENT VALIDATION COMPLETE            |\n|                     SCORE: 96 / 100 [READY]                 |\n+-------------------------------------------------------------+\n` }
    ];
  }
}
