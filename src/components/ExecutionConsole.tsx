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
  Maximize2,
  Minimize2
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
  const [currentMode, setCurrentMode] = useState<ExecutionMode>('AUDIT');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  const initialBanner = () => {
    const time = new Date().toLocaleTimeString();
    return [
      { id: '1', time, level: 'STAGE' as const, message: 'AUTODESK BIM ENVIRONMENT MANAGER (ABEM) - PowerShell Orchestrator' },
      { id: '2', time, level: 'INFO' as const, message: `Host Node: ${currentProfile.name} | Target: Revit ${targetRevitVersion}` },
      { id: '3', time, level: 'INFO' as const, message: 'ExecutionPolicy: Process-Scoped Bypass. Standalone non-destructive execution ready.' },
      { id: '4', time, level: 'INFO' as const, message: 'Ready. Choose an execution mode below [AUDIT | PLAN | REPAIR | DEPLOY | VALIDATE].' }
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
    addLog('INFO', `Loading sub-modules from .\\modules\\ ...`);

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
        addLog('SUCCESS', `=== [COMPLETED] Execution Mode ${mode} Finished with Exit Code 0 ===`);
        if (onExecutionComplete) onExecutionComplete(mode);
      }
    }, 450);
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
    const reportData = {
      timestamp: new Date().toISOString(),
      hostname: "WORKSTATION-BIM-01",
      profile: currentProfile.name,
      targetRevit: targetRevitVersion,
      os: currentProfile.osName,
      build: currentProfile.osBuild,
      items: currentProfile.items,
      logs: logs.map(l => `[${l.time}] [${l.level}] ${l.message}`)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `environment_report_${targetRevitVersion}.json`;
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
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
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
        <span>Log sink: .\logs\abem_{currentMode.toLowerCase()}_2026.log</span>
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
  
  if (mode === 'AUDIT') {
    return [
      { level: 'INFO', message: `SystemScan.ps1: Querying WMI Win32_OperatingSystem on ${profile.osName}...` },
      { level: isOldWin ? 'WARN' : 'SUCCESS', message: `OS Build detected: ${profile.osBuild}. ${isOldWin ? 'Notice: Older than 19045.' : 'Verified compatible.'}` },
      { level: 'INFO', message: `Runtime.ps1: Checking .NET Framework, .NET 8, and Visual C++ Unified Runtimes...` },
      { level: 'INFO', message: `Autodesk.ps1: Testing AdskLicensingService status on port 52200...` },
      { level: 'INFO', message: `Revit.ps1: Inspecting Revit ${targetRevit} Add-ins directory and Revit.ini...` },
      { level: 'INFO', message: `Drivers.ps1: Direct3D 12 Feature Level query...` },
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
