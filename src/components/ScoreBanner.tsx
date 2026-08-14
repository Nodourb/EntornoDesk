import React from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  FileText, 
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { ReadinessScoreBreakdown, CategoryId } from '../types';

interface ScoreBannerProps {
  score: ReadinessScoreBreakdown;
  onExecuteRepair: () => void;
  onExecuteDeploy: () => void;
  onExportJson: () => void;
}

const CATEGORY_NAMES: Record<CategoryId, string> = {
  '00_SYSTEM': 'OS & System',
  '01_RUNTIME': '.NET & VC++ Runtimes',
  '02_AUTODESK': 'Licensing & Identity',
  '03_REVIT': 'Revit Engine',
  '04_AUTOCAD': 'AutoCAD Engine',
  '05_DRIVERS': 'GPU & Direct3D',
  '06_BIM_CONFIG': 'pyRevit & Toolchain',
};

export const ScoreBanner: React.FC<ScoreBannerProps> = ({
  score,
  onExecuteRepair,
  onExecuteDeploy,
  onExportJson
}) => {
  const getBadgeColor = () => {
    switch (score.statusLevel) {
      case 'EXCELLENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'READY':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'UNSTABLE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CRITICAL':
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const getScoreColor = () => {
    if (score.percentage >= 85) return 'text-emerald-600';
    if (score.percentage >= 65) return 'text-blue-600';
    if (score.percentage >= 45) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getBarGradient = () => {
    if (score.percentage >= 85) return 'from-emerald-500 to-teal-500';
    if (score.percentage >= 65) return 'from-blue-600 to-cyan-500';
    if (score.percentage >= 45) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-500';
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score.percentage / 100) * circumference;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Main Score Gauge */}
        <div className="lg:col-span-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b lg:border-b-0 lg:border-r border-slate-200 pb-5 lg:pb-0 lg:pr-6">
          <div className="relative flex-shrink-0 flex items-center justify-center w-28 h-28">
            {/* SVG Circular Gauge */}
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-100"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className={`transition-all duration-700 ease-out ${
                  score.percentage >= 85
                    ? 'stroke-emerald-600'
                    : score.percentage >= 65
                    ? 'stroke-blue-600'
                    : score.percentage >= 45
                    ? 'stroke-amber-500'
                    : 'stroke-rose-600'
                }`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-3xl font-extrabold tracking-tight ${getScoreColor()}`}>
                {score.totalScore}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider -mt-0.5">/ 100</span>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md border ${getBadgeColor()}`}>
                STATUS: {score.statusLevel}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              BIM Readiness Score
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Composite diagnostics auditing OS kernel build, .NET 8, AdskLicensing tokens, WebView2, and pyRevit.
            </p>
          </div>
        </div>

        {/* Category Breakdown & Progress */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Infrastructure Stability Breakdown
            </span>
            <span className="font-mono text-slate-500 font-semibold text-[11px]">
              {score.passedCount} Passed • {score.warningCount} Warn • {score.blockerCount} Blocker
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div 
              className={`h-full bg-gradient-to-r ${getBarGradient()} transition-all duration-500`} 
              style={{ width: `${score.percentage}%` }}
            />
          </div>

          {/* Mini Category Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {(Object.keys(score.categoryScores) as CategoryId[]).slice(0, 6).map(catId => {
              const cat = score.categoryScores[catId];
              const isGood = cat.percentage >= 80;
              const isMid = cat.percentage >= 50;
              return (
                <div key={catId} className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium truncate max-w-[85px]">{CATEGORY_NAMES[catId]}</span>
                  <span className={`font-mono font-bold ${isGood ? 'text-emerald-600' : isMid ? 'text-amber-600' : 'text-rose-600'}`}>
                    {cat.score}/{cat.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="lg:col-span-3 flex flex-col gap-2 justify-center">
          <button
            id="score-repair-btn"
            onClick={onExecuteRepair}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold shadow-sm transition-all"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Remediate Broken Runtimes</span>
          </button>

          <button
            id="score-deploy-btn"
            onClick={onExecuteDeploy}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>Deploy Full BIM Toolchain</span>
          </button>

          <button
            id="score-export-btn"
            onClick={onExportJson}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Export environment_report.json</span>
          </button>
        </div>
      </div>
    </div>
  );
};
