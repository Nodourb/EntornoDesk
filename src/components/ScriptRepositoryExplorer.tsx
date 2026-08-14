import React, { useState } from 'react';
import { 
  FileCode, 
  Folder, 
  Copy, 
  Check, 
  Download, 
  Search, 
  Terminal, 
  Settings, 
  FileText, 
  Code2, 
  ChevronRight,
  Boxes,
  Sparkles
} from 'lucide-react';
import { REPOSITORY_SCRIPTS } from '../data/scriptsData';
import { ScriptFile } from '../types';

interface ScriptRepositoryExplorerProps {
  onDownloadZip: () => void;
  targetRevitVersion: string;
}

export const ScriptRepositoryExplorer: React.FC<ScriptRepositoryExplorerProps> = ({
  onDownloadZip,
  targetRevitVersion
}) => {
  const [selectedPath, setSelectedPath] = useState<string>('Quick-Audit.bat');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const selectedFile: ScriptFile = 
    REPOSITORY_SCRIPTS.find(f => f.path === selectedPath) || REPOSITORY_SCRIPTS[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = (file: ScriptFile) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'script.ps1';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredFiles = REPOSITORY_SCRIPTS.filter(f => 
    f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = {
    root: filteredFiles.filter(f => f.category === 'root'),
    modules: filteredFiles.filter(f => f.category === 'modules'),
    config: filteredFiles.filter(f => f.category === 'config'),
    docs: filteredFiles.filter(f => f.category === 'docs'),
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Download & Explanation */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Declarative BIM Repository Architecture
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              12 Production Files
            </span>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Every script is standalone, idempotent, and non-destructive. Includes UAC auto-elevation, process-scoped execution policy, and official Microsoft & Autodesk endpoints.
          </p>
        </div>

        <button
          onClick={onDownloadZip}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download All Files (.ZIP)</span>
        </button>
      </div>

      {/* Main IDE Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Left Column: File Tree */}
        <div className="lg:col-span-4 bg-slate-50 border-r border-slate-200 p-4 flex flex-col space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter repository scripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
            {/* Root Files */}
            {grouped.root.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 px-2">
                  <Folder className="w-3.5 h-3.5 text-blue-600" />
                  <span>Root Entry Points</span>
                </div>
                {grouped.root.map(file => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedPath(file.path)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                      selectedPath === file.path
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{file.path}</span>
                    <span className="text-[10px] uppercase font-sans text-slate-400 font-normal">{file.language}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Modules Files */}
            {grouped.modules.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 px-2">
                  <Folder className="w-3.5 h-3.5 text-indigo-600" />
                  <span>modules/</span>
                </div>
                {grouped.modules.map(file => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedPath(file.path)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                      selectedPath === file.path
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{file.path}</span>
                    <span className="text-[10px] uppercase font-sans text-slate-400 font-normal">{file.language}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Config Files */}
            {grouped.config.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 px-2">
                  <Folder className="w-3.5 h-3.5 text-amber-600" />
                  <span>config/</span>
                </div>
                {grouped.config.map(file => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedPath(file.path)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                      selectedPath === file.path
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{file.path}</span>
                    <span className="text-[10px] uppercase font-sans text-slate-400 font-normal">{file.language}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Docs */}
            {grouped.docs.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 px-2">
                  <Folder className="w-3.5 h-3.5 text-emerald-600" />
                  <span>docs/</span>
                </div>
                {grouped.docs.map(file => (
                  <button
                    key={file.path}
                    onClick={() => setSelectedPath(file.path)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                      selectedPath === file.path
                        ? 'bg-blue-50 text-blue-800 border border-blue-200 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{file.path}</span>
                    <span className="text-[10px] uppercase font-sans text-slate-400 font-normal">{file.language}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8 flex flex-col bg-white">
          {/* Header with path, copy, and download */}
          <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-600" />
                <span className="font-mono text-xs font-bold text-slate-800">{selectedFile.path}</span>
                <span className="text-[10px] font-mono uppercase bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                  {selectedFile.language}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{selectedFile.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>

              <button
                onClick={() => handleDownloadSingleFile(selectedFile)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-colors"
                title="Download single file"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Area with line numbers */}
          <div className="p-4 font-mono text-xs overflow-x-auto max-h-[600px] overflow-y-auto select-text leading-relaxed bg-slate-900 text-slate-200">
            <pre className="text-slate-200">
              <code>
                {selectedFile.content.split('\n').map((line, idx) => (
                  <div key={idx} className="flex hover:bg-slate-800/60 px-1 rounded">
                    <span className="w-10 text-right pr-4 text-slate-500 select-none flex-shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="flex-1 whitespace-pre">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
