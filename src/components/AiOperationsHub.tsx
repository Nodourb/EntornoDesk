import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Terminal,
  ShieldCheck,
  Zap,
  Flame,
  FileCode,
  Layers,
  Wand2,
  Copy,
  Check,
  Cpu
} from 'lucide-react';
import { SystemProfile, AssistedPlan } from '../types';
import { AiVoiceChatbot } from './AiVoiceChatbot';

interface AiOperationsHubProps {
  currentProfile: SystemProfile;
  targetRevitVersion: string;
  onNavigateToTab: (tab: 'scanner' | 'matrix' | 'console' | 'repository' | 'configurator') => void;
}

export function AiOperationsHub({
  currentProfile,
  targetRevitVersion,
  onNavigateToTab,
}: AiOperationsHubProps) {
  const [activePlan, setActivePlan] = useState<AssistedPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [selectedOperation, setSelectedOperation] = useState<string>('win11_inplace');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const ASSISTED_OPERATIONS = [
    {
      id: 'win11_inplace',
      title: 'Pipeline Asistido Windows 11 In-Place Upgrade',
      category: 'Modernización de Sistema Operativo',
      icon: Flame,
      color: 'purple',
      badge: 'Zero Data Loss',
      description: 'Orquestación de bypasses MoSetup / LabConfig, validación DISM/SFC, sincronización de certificados raíz y montaje desatendido de ISO.',
      defaultCommand: '.\\Prepare-WindowsUpdate.bat',
      prompt: 'Orquestar preparación para actualización a Windows 11 24H2 sin pérdida de datos ni licencias'
    },
    {
      id: 'fix_servicepoint',
      title: 'Auto-Sanación ServicePointManager (TLS / CLR .NET)',
      category: 'Seguridad & Compatibilidad de Red',
      icon: ShieldCheck,
      color: 'emerald',
      badge: 'Auto-Repair',
      description: 'Remediación del error -65536 y activación de SchUseStrongCrypto / SystemDefaultTlsVersions en el Registro de Windows de 32 y 64 bits.',
      defaultCommand: '.\\Fix-NetSecurityPointManager.bat',
      prompt: 'Reparar el error System.Net.ServicePointManager y configurar TLS 1.2/1.3 en el Registro'
    },
    {
      id: 'fix_adsk_licensing',
      title: 'Remediación AdskLicensingService Error 1053',
      category: 'Subsistema de Licenciamiento Autodesk',
      icon: Zap,
      color: 'blue',
      badge: 'Critical Fix',
      description: 'Reinicio limpio, reparación de permisos en C:\\Program Files (x86)\\Common Files\\Autodesk Shared\\AdskLicensing y reinstalación ODIS.',
      defaultCommand: 'Restart-Service -Name "AdskLicensingService" -Force',
      prompt: 'Plan de diagnóstico y reparación completa para AdskLicensingService con error 1053'
    },
    {
      id: 'tune_revit_workstation',
      title: 'Optimización de Rendimiento Revit.ini & GPU',
      category: 'Aceleración Gráfica & Memoria',
      icon: Cpu,
      color: 'amber',
      badge: 'High Performance',
      description: 'Configuración de aceleración de hardware DirectX 12, optimización de caché de colaboración y ajuste de tamaño de memoria virtual.',
      defaultCommand: 'powershell.exe -File .\\modules\\05_BimEnvironmentConfigurator.ps1 -Action OptimizeIni',
      prompt: 'Optimizar Revit.ini para aceleración DirectX 12 y depurar archivos temporales'
    }
  ];

  const handleGeneratePlan = async (operationId: string) => {
    const op = ASSISTED_OPERATIONS.find(o => o.id === operationId);
    if (!op) return;

    setSelectedOperation(operationId);
    setIsGeneratingPlan(true);

    try {
      const response = await fetch('/api/ai/assisted-operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationType: op.prompt,
          parameters: {
            profileName: currentProfile.name,
            targetRevitVersion,
            osName: currentProfile.osName,
            osBuild: currentProfile.osBuild,
          },
        }),
      });

      if (response.ok) {
        const plan = await response.json();
        setActivePlan(plan);
      } else {
        // Fallback structured plan
        setActivePlan({
          planTitle: `Plan Asistido: ${op.title}`,
          operationCategory: op.category,
          estimatedTimeSeconds: 120,
          steps: [
            {
              order: 1,
              title: 'Verificación de privilegios y políticas UAC',
              description: 'Comprueba que el entorno se ejecute con permisos elevados de Administrador.',
              command: 'net session >nul 2>&1',
              isCritical: true,
            },
            {
              order: 2,
              title: 'Ejecución del script de remediación asistida',
              description: `Lanza el script automatizado para ${op.title}.`,
              command: op.defaultCommand,
              isCritical: true,
            },
            {
              order: 3,
              title: 'Auditoría posterior y validación de telemetría',
              description: 'Genera el informe de verificación final en la carpeta reports/.',
              command: '.\\Quick-Audit.bat',
              isCritical: false,
            },
          ],
        });
      }
    } catch (err) {
      console.error('Error generating assisted plan:', err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Introduction */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-300">
              CENTRO DE OPERACIONES ASISTIDAS & AGENTES DE IA
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Automatización Inteligente y Modelos Asistidos para Estaciones BIM
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Interactúa mediante voz profesional (Speech-to-Text & Text-to-Speech), selecciona agentes autónomos y genera planes de remediación ejecutables para Windows 10/11, Autodesk Revit {targetRevitVersion} y subsistemas de red.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateToTab('console')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>IR A CONSOLA POWERSHELL</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Voice Chatbot on Left, Assisted Operations Hub on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Voice Chatbot */}
        <div className="lg:col-span-7">
          <AiVoiceChatbot
            currentProfile={currentProfile}
            targetRevitVersion={targetRevitVersion}
            onNavigateToTab={onNavigateToTab}
            isFloating={false}
          />
        </div>

        {/* Right Column: Assisted Operations Catalog & Plan Generator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Modelos de Funcionamiento Asistido
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                1-CLICK PLANS
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Selecciona una operación crítica para que el agente genere un plan asistido paso a paso:
            </p>

            {/* Operation Cards */}
            <div className="space-y-2.5">
              {ASSISTED_OPERATIONS.map(op => {
                const IconComponent = op.icon;
                const isSelected = selectedOperation === op.id;
                return (
                  <div
                    key={op.id}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-400/30 shadow-xs'
                        : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/70'
                    }`}
                    onClick={() => handleGeneratePlan(op.id)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-white border border-slate-200 text-blue-600`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{op.title}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white text-slate-700 border border-slate-200">
                        {op.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug mb-2.5">
                      {op.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <code className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 truncate max-w-[200px]">
                        {op.defaultCommand}
                      </code>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGeneratePlan(op.id);
                        }}
                        disabled={isGeneratingPlan && selectedOperation === op.id}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        {isGeneratingPlan && selectedOperation === op.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        <span>Generar Plan</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Assisted Plan Execution View */}
          {activePlan && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block">
                    PLAN ASISTIDO GENERADO POR AGENTE
                  </span>
                  <h4 className="text-xs font-bold text-white mt-0.5">
                    {activePlan.planTitle}
                  </h4>
                </div>
                {activePlan.estimatedTimeSeconds && (
                  <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">
                    ~{activePlan.estimatedTimeSeconds} seg
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {activePlan.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-mono">
                          {step.order}
                        </span>
                        {step.title}
                      </span>
                      {step.isCritical && (
                        <span className="text-[9px] font-mono text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/50">
                          CRÍTICO
                        </span>
                      )}
                    </div>

                    {step.description && (
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {step.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between bg-black/40 rounded-lg p-2 font-mono text-[10px] text-blue-300">
                      <span className="truncate mr-2">{step.command}</span>
                      <button
                        onClick={() => handleCopy(`step-${idx}`, step.command)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Copiar comando"
                      >
                        {copiedId === `step-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => onNavigateToTab('console')}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>EJECUTAR ESTE PLAN EN CONSOLA POWERSHELL</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
