export type ExecutionMode = 'SMOKE_TEST' | 'AUDIT' | 'PLAN' | 'REPAIR' | 'DEPLOY' | 'VALIDATE' | 'WIN11_PREP' | 'WINFIX_UNIFIED' | 'SECURITY_SANDBOX';

export type ComponentStatus = 'ok' | 'warning' | 'error' | 'missing' | 'unsupported';

export type CategoryId = '00_SYSTEM' | '01_RUNTIME' | '02_AUTODESK' | '03_REVIT' | '04_AUTOCAD' | '05_DRIVERS' | '06_BIM_CONFIG';

export interface AuditItem {
  id: string;
  name: string;
  category: CategoryId;
  currentValue: string;
  requiredValue: string;
  status: ComponentStatus;
  details: string;
  recommendation?: string;
  remediationCommand?: string;
  isStructuralOsLimitation?: boolean;
}

export interface SystemProfile {
  id: string;
  name: string;
  description: string;
  iconName: string;
  osName: string;
  osBuild: string;
  items: AuditItem[];
}

export interface CompatibilityRule {
  revitVersion: string;
  autocadVersion: string;
  minWindowsBuild: string;
  minWindowsName: string;
  requiredDotNet: string[];
  requiredVC: string[];
  requiresWebView2: boolean;
  minDesktopConnector: string;
  minAdskLicensing: string;
  minRamGb: number;
  recommendedGpuVramGb: number;
  directXFeatureLevel: string;
  notes: string;
}

export interface ScriptFile {
  path: string;
  category: 'root' | 'modules' | 'config' | 'docs';
  description: string;
  content: string;
  language: 'powershell' | 'bat' | 'json' | 'ini' | 'markdown' | 'yaml' | 'xml';
}

export interface ReadinessScoreBreakdown {
  totalScore: number;
  maxScore: number;
  percentage: number;
  statusLevel: 'EXCELLENT' | 'READY' | 'UNSTABLE' | 'CRITICAL';
  categoryScores: Record<CategoryId, { score: number; max: number; percentage: number }>;
  blockerCount: number;
  warningCount: number;
  passedCount: number;
}

export type AgentId = 'orchestrator' | 'diagnostics' | 'win11_upgrade' | 'script_generator' | 'workstation_optimizer';

export interface AgentInfo {
  id: AgentId;
  name: string;
  role: string;
  icon: string;
  color: string;
  description: string;
  samplePrompts: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  agentId?: AgentId;
  modelUsed?: string;
  toolExecutions?: Array<{
    toolName: string;
    args: any;
    output: any;
  }>;
  audioBase64?: string;
  suggestedActions?: Array<{
    label: string;
    actionType: 'EXECUTE_COMMAND' | 'COPY_SCRIPT' | 'RUN_CONSOLE' | 'OPEN_TAB';
    payload: string;
  }>;
}

export interface AssistedPlanStep {
  order: number;
  title: string;
  description?: string;
  command: string;
  isCritical?: boolean;
  suggestedAction?: string;
}

export interface AssistedPlan {
  planTitle: string;
  operationCategory?: string;
  targetArchitecture?: string;
  estimatedTimeSeconds?: number;
  steps: AssistedPlanStep[];
}

