import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  HelpCircle, 
  Copy, 
  Check, 
  Wrench, 
  Search, 
  Filter, 
  ShieldAlert,
  HardDrive,
  Cpu,
  Boxes,
  Compass,
  FileCode2,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { AuditItem, CategoryId, ComponentStatus } from '../types';

interface SystemScannerProps {
  items: AuditItem[];
  onFixItem: (itemId: string) => void;
  onFixAllFixable: () => void;
}

const CATEGORY_META: Record<CategoryId, { name: string; icon: React.FC<{ className?: string }>; desc: string }> = {
  '00_SYSTEM': { name: '00_SYSTEM', icon: Cpu, desc: 'OS Build, Architecture, Integrity & Power Plan' },
  '01_RUNTIME': { name: '01_RUNTIME', icon: Boxes, desc: '.NET 8, .NET 4.8.1, VC++ Unified & WebView2' },
  '02_AUTODESK': { name: '02_AUTODESK', icon: ShieldAlert, desc: 'AdskLicensingService, Identity Manager & ODIS' },
  '03_REVIT': { name: '03_REVIT', icon: Compass, desc: 'Revit Installations, Add-in Manifests & Revit.ini' },
  '04_AUTOCAD': { name: '04_AUTOCAD', icon: HardDrive, desc: 'AutoCAD Engines, CTB Plotters & Support Paths' },
  '05_DRIVERS': { name: '05_DRIVERS', icon: Cpu, desc: 'Dedicated GPU, Studio Drivers & Direct3D 12' },
  '06_BIM_CONFIG': { name: '06_BIM_CONFIG', icon: FileCode2, desc: 'pyRevit Framework, Python 3.11 & Git Toolchain' },
};

export const SystemScanner: React.FC<SystemScannerProps> = ({
  items,
  onFixItem,
  onFixAllFixable
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ComponentStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCmd = (id: string, cmd?: string) => {
    if (!cmd) return;
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.currentValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ComponentStatus) => {
    switch (status) {
      case 'ok':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> OK
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Degraded / Warn
          </span>
        );
      case 'error':
      case 'missing':
      case 'unsupported':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> Blocker / Missing
          </span>
        );
    }
  };

  const fixableCount = items.filter(i => (i.status !== 'ok' && !i.isStructuralOsLimitation)).length;

  return (
    <div className="space-y-6">
      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search runtime, registry key, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CategoryId | 'ALL')}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All 7 Layers</option>
              {(Object.keys(CATEGORY_META) as CategoryId[]).map(catId => (
                <option key={catId} value={catId}>
                  {CATEGORY_META[catId].name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ComponentStatus | 'ALL')}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="error">Errors & Blockers</option>
              <option value="warning">Warnings</option>
              <option value="ok">Passed (OK)</option>
            </select>
          </div>

          {/* Quick Fix All Button */}
          {fixableCount > 0 && (
            <button
              onClick={onFixAllFixable}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Remediate All ({fixableCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Layer Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ALL LAYERS</div>
          <div className="text-xs font-bold text-slate-800 mt-0.5">{items.length} Elements</div>
        </button>

        {(Object.keys(CATEGORY_META) as CategoryId[]).map(catId => {
          const cat = CATEGORY_META[catId];
          const catItems = items.filter(i => i.category === catId);
          const hasError = catItems.some(i => i.status === 'error' || i.status === 'missing');
          const hasWarn = catItems.some(i => i.status === 'warning');
          const Icon = cat.icon;

          return (
            <button
              key={catId}
              onClick={() => setSelectedCategory(catId)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedCategory === catId
                  ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 truncate">{cat.name}</span>
                <Icon className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-bold text-slate-800">{catItems.length} items</span>
                {hasError && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                {!hasError && hasWarn && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                {!hasError && !hasWarn && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">No components match your search and filter criteria.</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className={`bg-white border rounded-xl p-4 sm:p-5 transition-all shadow-sm ${
                item.status === 'ok'
                  ? 'border-slate-200 hover:border-slate-300'
                  : item.status === 'warning'
                  ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                  : 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Header info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                      {item.name}
                    </h3>
                    {getStatusBadge(item.status)}
                    {item.isStructuralOsLimitation && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-50 text-purple-700 border border-purple-200">
                        Structural OS Limitation
                      </span>
                    )}
                  </div>

                  {/* Values comparison grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Detected Host State</span>
                      <span className={`font-mono font-medium ${item.status === 'ok' ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {item.currentValue}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Requirement</span>
                      <span className="font-mono font-medium text-blue-700">
                        {item.requiredValue}
                      </span>
                    </div>
                  </div>

                  {/* Details and recommendation */}
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {item.details}
                  </p>

                  {item.recommendation && (
                    <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>{item.recommendation}</span>
                    </div>
                  )}
                </div>

                {/* Remediation Action Controls */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2 flex-shrink-0 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                  {item.status !== 'ok' && !item.isStructuralOsLimitation && (
                    <button
                      onClick={() => onFixItem(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Simulate Fix</span>
                    </button>
                  )}

                  {item.remediationCommand && (
                    <button
                      onClick={() => handleCopyCmd(item.id, item.remediationCommand)}
                      title="Copy PowerShell Command"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Terminal className="w-3.5 h-3.5 text-blue-600" />
                          <span>Copy PS1 Cmd</span>
                        </>
                      )}
                    </button>
                  )}

                  {item.isStructuralOsLimitation && (
                    <span className="text-[11px] text-purple-700 italic text-right max-w-[160px] font-medium">
                      Requires Windows Update (Cannot bypass kernel requirement)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
