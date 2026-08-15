import { AgentInfo } from '../types';

export const AI_AGENTS: AgentInfo[] = [
  {
    id: 'orchestrator',
    name: 'BIM DevOps Orchestrator',
    role: 'Orquestación de Infraestructura & Workstations',
    icon: 'Bot',
    color: 'blue',
    description: 'Coordina despliegues completos de Autodesk, secuencias de scripts PowerShell y políticas de estaciones de trabajo.',
    samplePrompts: [
      'Orquestar la preparación completa de una estación para Revit 2026',
      '¿Cuál es la secuencia de instalación recomendada para ODIS y librerías C++?',
      'Generar un plan de despliegue para 15 estaciones de trabajo en red'
    ]
  },
  {
    id: 'diagnostics',
    name: 'Self-Healing & Diagnostics Agent',
    role: 'Auto-Sanación & Resolución de Errores',
    icon: 'ShieldAlert',
    color: 'emerald',
    description: 'Diagnostica códigos de error como AdskLicensingService 1053, fallo CLR ServicePointManager (-65536) y corrupción de WinSxS.',
    samplePrompts: [
      '¿Cómo reparo el error System.Net.ServicePointManager en PowerShell?',
      'El servicio AdskLicensingService no inicia con error 1053. ¿Qué hago?',
      'Verificar la integridad del almacén de componentes DISM y SFC'
    ]
  },
  {
    id: 'win11_upgrade',
    name: 'Windows 11 In-Place Upgrade Agent',
    role: 'Modernización de SO (Zero Data Loss)',
    icon: 'Flame',
    color: 'purple',
    description: 'Aplica bypasses seguros MoSetup / LabConfig, desbloquea descargas ISO en Edge y garantiza migración sin pérdida de datos.',
    samplePrompts: [
      '¿Cómo actualizo a Windows 11 24H2 sin perder mis licencias ni datos?',
      'Configurar bypass para TPM 2.0 y CPU no soportada en el Registro',
      'Desbloquear descargas bloqueadas en Microsoft Edge y exclusiones de Defender'
    ]
  },
  {
    id: 'script_generator',
    name: 'PowerShell Scripting Engine',
    role: 'Sintetizador Automatizado de Scripts',
    icon: 'Terminal',
    color: 'amber',
    description: 'Genera código PowerShell 5.1/7 y scripts .BAT con elevación UAC, manejo de excepciones y telemetría estructurada.',
    samplePrompts: [
      'Generar un script PowerShell para limpiar la caché de colaboración de Revit',
      'Crear un lanzador .BAT con elevación de privilegios UAC y control de errores',
      'Escribir un módulo para instalar automáticamente .NET Desktop Runtime 8.0'
    ]
  },
  {
    id: 'workstation_optimizer',
    name: 'Revit & CAD Optimizer',
    role: 'Optimización de GPU, RAM & Revit.ini',
    icon: 'Zap',
    color: 'cyan',
    description: 'Maximiza el rendimiento ajustando parámetros de hardware acceleration, memoria virtual y optimizaciones de Revit.ini.',
    samplePrompts: [
      'Optimizar Revit.ini para aceleración gráfica por hardware DirectX 12',
      '¿Cómo configurar la memoria virtual y plan de energía para Revit 2026?',
      'Desactivar renderizado innecesario en vistas 3D de Revit'
    ]
  }
];
