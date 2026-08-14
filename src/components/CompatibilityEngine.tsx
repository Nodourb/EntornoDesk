import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ArrowRight,
  Boxes,
  Cpu,
  HardDrive,
  Sparkles,
  Zap
} from 'lucide-react';
import { COMPATIBILITY_RULES } from '../data/compatibilityMatrix';

interface CompatibilityEngineProps {
  selectedTargetVersion: string;
  onSelectTargetVersion: (ver: string) => void;
}

export const CompatibilityEngine: React.FC<CompatibilityEngineProps> = ({
  selectedTargetVersion,
  onSelectTargetVersion
}) => {
  const currentRule = COMPATIBILITY_RULES[selectedTargetVersion] || COMPATIBILITY_RULES['2026'];

  return (
    <div className="space-y-8">
      {/* Structural Boundary Conceptual Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                Architectural Matrix: Automation Scope vs. Structural OS Limits
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Foundational Principle
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              A script can turn an older Windows installation into an ordered, updated, and reproducible BIM workstation, but <strong className="text-slate-800 font-semibold">cannot magically transform an obsolete Windows build into a modern one</strong>. Here is how ABEM categorizes the 4 engineering levels:
            </p>
          </div>
        </div>

        {/* 4 Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Level A */}
          <div className="bg-slate-50 border border-emerald-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                LEVEL A — SOFTWARE
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">100% Automatable</span>
            </div>
            <h4 className="text-sm font-bold text-slate-800">Runtimes & Toolchains</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              .NET 8 Desktop Runtime, Visual C++ 2015-2022 unified redistributables, Microsoft Edge WebView2, Python 3.11, pyRevit, Git.
            </p>
            <div className="text-[11px] text-emerald-700 font-mono font-semibold pt-1">
              [+] Handled via silent offline/winget installers
            </div>
          </div>

          {/* Level B */}
          <div className="bg-slate-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                LEVEL B — CONFIG
              </span>
              <span className="text-[10px] text-blue-700 font-bold">100% Automatable</span>
            </div>
            <h4 className="text-sm font-bold text-slate-800">Registry & Parameters</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Revit.ini hardware acceleration, journal rotation limits, AdskLicensing token cache cleaning, AutoCAD CTB/SHX support paths.
            </p>
            <div className="text-[11px] text-blue-700 font-mono font-semibold pt-1">
              [+] Handled via declarative PowerShell writes
            </div>
          </div>

          {/* Level C */}
          <div className="bg-slate-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                LEVEL C — HARDWARE
              </span>
              <span className="text-[10px] text-amber-700 font-bold">Diagnosable</span>
            </div>
            <h4 className="text-sm font-bold text-slate-800">GPU & Direct3D</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct3D 12 Feature Level detection, forcing high-performance dedicated GPU in Windows graphics settings, power scheme tuning.
            </p>
            <div className="text-[11px] text-amber-700 font-mono font-semibold pt-1">
              [!] Configured via powercfg & registry flags
            </div>
          </div>

          {/* Level D */}
          <div className="bg-slate-50 border border-rose-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                LEVEL D — OS KERNEL
              </span>
              <span className="text-[10px] text-rose-700 font-bold">Hard Frontier</span>
            </div>
            <h4 className="text-sm font-bold text-slate-800">OS Build Minimums</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Autodesk ODIS installer strictly blocks Windows builds older than 19044/19045 for Revit 2025/2026. Cannot be bypassed safely by scripts.
            </p>
            <div className="text-[11px] text-rose-700 font-mono font-semibold pt-1">
              [-] Requires in-place Windows Update upgrade
            </div>
          </div>
        </div>
      </div>

      {/* Target Version Requirements Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Target Autodesk Release Compatibility Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Select target generation to inspect exact runtime dependencies and deployment rules.
            </p>
          </div>

          {/* Version Selector Tabs */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1">
            {['2026', '2025', '2024', '2023', '2022', '2021'].map(ver => (
              <button
                key={ver}
                onClick={() => onSelectTargetVersion(ver)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedTargetVersion === ver
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ver}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Version Spotlight */}
        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
                R{selectedTargetVersion.slice(2)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Autodesk Revit & AutoCAD {selectedTargetVersion} Specification
                </h4>
                <p className="text-xs text-slate-500">{currentRule.notes}</p>
              </div>
            </div>
          </div>

          {/* Requirement Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1 shadow-sm">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Minimum Windows OS</span>
              <p className="text-slate-800 font-bold">{currentRule.minWindowsName}</p>
              <span className="text-[11px] text-blue-600 font-mono font-semibold">Build: {currentRule.minWindowsBuild}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1 shadow-sm">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Required .NET Runtimes</span>
              <ul className="text-slate-800 space-y-0.5">
                {currentRule.requiredDotNet.map((net, i) => (
                  <li key={i} className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {net}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1 shadow-sm">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Visual C++ & WebView2</span>
              <p className="text-slate-800 font-medium">{currentRule.requiredVC.join(', ')}</p>
              <p className="text-blue-600 text-[11px] font-medium">
                WebView2: {currentRule.requiresWebView2 ? 'Mandatory for Identity SSO' : 'Optional'}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1 shadow-sm">
              <span className="text-slate-400 text-[10px] font-bold uppercase">AdskLicensing & Desktop Connector</span>
              <p className="text-slate-800 font-medium">Licensing: {currentRule.minAdskLicensing}</p>
              <p className="text-slate-500 text-[11px]">Desktop Connector: {currentRule.minDesktopConnector}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1 shadow-sm">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Hardware & VRAM Target</span>
              <p className="text-slate-800 font-medium">RAM: {currentRule.minRamGb} GB (Min)</p>
              <p className="text-slate-500 text-[11px]">GPU VRAM: {currentRule.recommendedGpuVramGb} GB Recommended</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1 shadow-sm">
              <span className="text-slate-400 text-[10px] font-bold uppercase">DirectX & Viewport Engine</span>
              <p className="text-slate-800 font-medium">{currentRule.directXFeatureLevel}</p>
              <p className="text-slate-400 text-[10px]">Shading & Realistic viewport rendering</p>
            </div>
          </div>
        </div>

        {/* Full Comparative Table across 2021-2026 */}
        <div className="mt-6 overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Revit / CAD</th>
                <th className="py-2.5 px-3">Min Windows Build</th>
                <th className="py-2.5 px-3">.NET Runtimes</th>
                <th className="py-2.5 px-3">WebView2</th>
                <th className="py-2.5 px-3">DirectX Feature Level</th>
                <th className="py-2.5 px-3">ODIS Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono bg-white">
              {Object.keys(COMPATIBILITY_RULES).map(ver => {
                const r = COMPATIBILITY_RULES[ver];
                const isCurrent = ver === selectedTargetVersion;
                return (
                  <tr
                    key={ver}
                    onClick={() => onSelectTargetVersion(ver)}
                    className={`cursor-pointer transition-colors ${
                      isCurrent ? 'bg-blue-50/70 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-800 font-sans flex items-center gap-1.5">
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                      {ver}
                    </td>
                    <td className="py-2.5 px-3">{r.minWindowsBuild}</td>
                    <td className="py-2.5 px-3">{r.requiredDotNet.join(' + ')}</td>
                    <td className="py-2.5 px-3">{r.requiresWebView2 ? 'Yes (Mandatory)' : 'No'}</td>
                    <td className="py-2.5 px-3">{r.directXFeatureLevel}</td>
                    <td className="py-2.5 px-3">{parseInt(ver) >= 2022 ? 'Yes' : 'Classic Setup'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
