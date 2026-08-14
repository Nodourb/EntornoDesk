import React from 'react';
import { 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  Sliders, 
  Wrench, 
  Sparkles,
  ShieldCheck,
  Monitor
} from 'lucide-react';
import { SYSTEM_PRESETS } from '../data/presets';
import { SystemProfile } from '../types';

interface NavbarProps {
  currentProfile: SystemProfile;
  onSelectProfile: (profile: SystemProfile) => void;
  targetRevitVersion: string;
  onSelectTargetRevit: (version: string) => void;
  targetAutoCADVersion: string;
  onSelectTargetAutoCAD: (version: string) => void;
  onDownloadZip: () => void;
  onOpenTroubleshooter: () => void;
  activeTab: 'scanner' | 'matrix' | 'console' | 'repository' | 'configurator';
  onSelectTab: (tab: 'scanner' | 'matrix' | 'console' | 'repository' | 'configurator') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProfile,
  onSelectProfile,
  targetRevitVersion,
  onSelectTargetRevit,
  targetAutoCADVersion,
  onSelectTargetAutoCAD,
  onDownloadZip,
  onOpenTroubleshooter,
  activeTab,
  onSelectTab
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyElevationCmd = () => {
    const cmd = `powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File .\\bootstrap.ps1 -Mode Audit' -Verb RunAs"`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="bg-[#0f172a] border-b border-slate-700/50 sticky top-0 z-40 text-slate-300 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-white/10">
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-white tracking-tight text-base">
                  BIM_ENV_MANAGER
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold font-mono rounded bg-slate-800 text-blue-300 border border-slate-700">
                  v2.4-PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                Infrastructure Diagnostic & Deployment Suite
              </p>
            </div>
          </div>

          {/* Controls & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Target Revit Selector */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
              <span className="text-slate-400 mr-2 font-medium">Revit Target:</span>
              <select
                id="target-revit-select"
                value={targetRevitVersion}
                onChange={(e) => onSelectTargetRevit(e.target.value)}
                className="bg-transparent text-blue-400 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="2026" className="bg-slate-900 text-white">2026 (.NET 8)</option>
                <option value="2025" className="bg-slate-900 text-white">2025 (.NET 8)</option>
                <option value="2024" className="bg-slate-900 text-white">2024 (.NET 7/4.8)</option>
                <option value="2023" className="bg-slate-900 text-white">2023 (ODIS)</option>
                <option value="2022" className="bg-slate-900 text-white">2022</option>
                <option value="2021" className="bg-slate-900 text-white">2021</option>
              </select>
            </div>

            {/* Profile Switcher */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-md px-2.5 py-1 text-xs">
              <Monitor className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <span className="text-slate-400 mr-2 font-medium">Machine State:</span>
              <select
                id="profile-select"
                value={currentProfile.id}
                onChange={(e) => {
                  const found = SYSTEM_PRESETS.find(p => p.id === e.target.value);
                  if (found) onSelectProfile(found);
                }}
                className="bg-transparent text-amber-300 font-semibold focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
              >
                {SYSTEM_PRESETS.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white truncate">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Elevation Copy Command */}
            <button
              id="copy-elevation-btn"
              onClick={handleCopyElevationCmd}
              title="Copy Elevated PowerShell launcher command"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy START'}</span>
            </button>

            {/* Troubleshooter Button */}
            <button
              id="troubleshooter-btn"
              onClick={onOpenTroubleshooter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition-colors"
            >
              <Wrench className="w-3.5 h-3.5 text-rose-400" />
              <span>Autodesk Fixes</span>
            </button>

            {/* Download ZIP */}
            <button
              id="download-zip-btn"
              onClick={onDownloadZip}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Suite (.ZIP)</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-700/50 pt-1.5 pb-0 overflow-x-auto text-xs font-medium">
          <button
            id="tab-scanner"
            onClick={() => onSelectTab('scanner')}
            className={`py-2 px-3.5 rounded-t-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'scanner'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>System Audit</span>
          </button>

          <button
            id="tab-matrix"
            onClick={() => onSelectTab('matrix')}
            className={`py-2 px-3.5 rounded-t-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Compatibility Matrix</span>
          </button>

          <button
            id="tab-console"
            onClick={() => onSelectTab('console')}
            className={`py-2 px-3.5 rounded-t-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'console'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>PowerShell Engine</span>
          </button>

          <button
            id="tab-repository"
            onClick={() => onSelectTab('repository')}
            className={`py-2 px-3.5 rounded-t-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'repository'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Scripts & Manifests</span>
          </button>

          <button
            id="tab-configurator"
            onClick={() => onSelectTab('configurator')}
            className={`py-2 px-3.5 rounded-t-md transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'configurator'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>BIM Configurator</span>
          </button>
        </div>
      </div>
    </header>
  );
};
