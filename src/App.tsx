import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { ScoreBanner } from './components/ScoreBanner';
import { SystemScanner } from './components/SystemScanner';
import { CompatibilityEngine } from './components/CompatibilityEngine';
import { ExecutionConsole } from './components/ExecutionConsole';
import { ScriptRepositoryExplorer } from './components/ScriptRepositoryExplorer';
import { BimConfigurator } from './components/BimConfigurator';
import { TroubleshooterModal } from './components/TroubleshooterModal';
import { SYSTEM_PRESETS } from './data/presets';
import { SystemProfile, ExecutionMode } from './types';
import { calculateReadinessScore } from './utils/scoring';
import { generateAndDownloadZip } from './utils/zipGenerator';

export default function App() {
  const [currentProfile, setCurrentProfile] = useState<SystemProfile>(SYSTEM_PRESETS[0]);
  const [targetRevitVersion, setTargetRevitVersion] = useState<string>('2026');
  const [targetAutoCADVersion, setTargetAutoCADVersion] = useState<string>('2026');
  const [activeTab, setActiveTab] = useState<'scanner' | 'matrix' | 'console' | 'repository' | 'configurator'>('scanner');
  const [isTroubleshooterOpen, setIsTroubleshooterOpen] = useState<boolean>(false);

  // Dynamic audit items for the current active profile
  const [profileItems, setProfileItems] = useState(currentProfile.items);

  // When user switches profile, update items
  const handleSelectProfile = (newProfile: SystemProfile) => {
    setCurrentProfile(newProfile);
    setProfileItems(newProfile.items);
  };

  // Calculate dynamic readiness score
  const readinessScore = useMemo(() => {
    return calculateReadinessScore(profileItems);
  }, [profileItems]);

  // Fix individual item in live state
  const handleFixItem = (itemId: string) => {
    setProfileItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          status: 'ok',
          currentValue: item.requiredValue,
          recommendation: undefined
        };
      }
      return item;
    }));
  };

  // Fix all software/config fixable items
  const handleFixAllFixable = () => {
    setProfileItems(prev => prev.map(item => {
      if (!item.isStructuralOsLimitation) {
        return {
          ...item,
          status: 'ok',
          currentValue: item.requiredValue,
          recommendation: undefined
        };
      }
      return item;
    }));

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  // Execute Repair mode from banner
  const handleExecuteRepair = () => {
    setActiveTab('console');
  };

  // Execute Deploy mode from banner
  const handleExecuteDeploy = () => {
    setActiveTab('console');
  };

  // Export JSON Report
  const handleExportJson = () => {
    const report = {
      timestamp: new Date().toISOString(),
      profile: currentProfile.name,
      targetRevit: targetRevitVersion,
      targetAutoCAD: targetAutoCADVersion,
      readinessScore: readinessScore.totalScore,
      statusLevel: readinessScore.statusLevel,
      items: profileItems
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Autodesk_BIM_Environment_Report_${targetRevitVersion}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download complete ZIP
  const handleDownloadZip = () => {
    generateAndDownloadZip(targetRevitVersion);
  };

  // When a console run completes
  const handleExecutionComplete = (mode: ExecutionMode) => {
    if (mode === 'REPAIR' || mode === 'DEPLOY') {
      handleFixAllFixable();
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Header Navigation */}
      <Navbar
        currentProfile={currentProfile}
        onSelectProfile={handleSelectProfile}
        targetRevitVersion={targetRevitVersion}
        onSelectTargetRevit={setTargetRevitVersion}
        targetAutoCADVersion={targetAutoCADVersion}
        onSelectTargetAutoCAD={setTargetAutoCADVersion}
        onDownloadZip={handleDownloadZip}
        onOpenTroubleshooter={() => setIsTroubleshooterOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Sub-Header / Workspace Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-slate-700">Environment_Auditor</span>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 font-semibold">
              TARGET: REVIT_{targetRevitVersion}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('scanner')}
              className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 border border-slate-300 transition-colors"
            >
              AUDIT ONLY
            </button>
            <button
              onClick={handleExecuteDeploy}
              className="px-3 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 rounded-md text-white shadow-sm transition-colors"
            >
              RUN FULL DEPLOY
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Score Banner */}
        <ScoreBanner
          score={readinessScore}
          onExecuteRepair={handleExecuteRepair}
          onExecuteDeploy={handleExecuteDeploy}
          onExportJson={handleExportJson}
        />

        {/* Tab 1: Workstation Audit & Health */}
        {activeTab === 'scanner' && (
          <SystemScanner
            items={profileItems}
            onFixItem={handleFixItem}
            onFixAllFixable={handleFixAllFixable}
          />
        )}

        {/* Tab 2: Compatibility Matrix & OS Boundary */}
        {activeTab === 'matrix' && (
          <CompatibilityEngine
            selectedTargetVersion={targetRevitVersion}
            onSelectTargetVersion={setTargetRevitVersion}
          />
        )}

        {/* Tab 3: Interactive PowerShell Console */}
        {activeTab === 'console' && (
          <ExecutionConsole
            currentProfile={currentProfile}
            targetRevitVersion={targetRevitVersion}
            onExecutionComplete={handleExecutionComplete}
          />
        )}

        {/* Tab 4: Repository Code Explorer */}
        {activeTab === 'repository' && (
          <ScriptRepositoryExplorer
            onDownloadZip={handleDownloadZip}
            targetRevitVersion={targetRevitVersion}
          />
        )}

        {/* Tab 5: BIM & Revit.ini Configurator */}
        {activeTab === 'configurator' && (
          <BimConfigurator
            targetRevitVersion={targetRevitVersion}
          />
        )}
      </main>

      {/* Professional Polish Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 py-3 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 uppercase tracking-wider font-semibold">
          <div className="flex items-center gap-2">
            <span>Connected to: <strong className="text-slate-700 font-mono">PC-ENGINEERING-04</strong></span>
            <span className="text-slate-300">•</span>
            <span>Kernel Scope: <strong className="text-slate-700 font-mono">BIM-BOOTSTRAPPER-LOCAL</strong></span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px]">
            <span>PowerShell v7.4+</span>
            <span>•</span>
            <span>.NET 8.0 Desktop</span>
            <span>•</span>
            <span>ODIS 2.x</span>
          </div>
        </div>
      </footer>

      {/* Troubleshooter Modal */}
      <TroubleshooterModal
        isOpen={isTroubleshooterOpen}
        onClose={() => setIsTroubleshooterOpen(false)}
      />
    </div>
  );
}
