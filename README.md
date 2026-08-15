# Autodesk BIM Environment Manager (ABEM)

A declarative, reproducible workstation stabilization, diagnostics, and AI-orchestrated suite for **Autodesk Revit + AutoCAD + Dynamo + pyRevit**.

---

## 🎙️ Speech-to-Voice & AI Orchestration: Guía de Activación de Funciones

La plataforma incluye un subsistema bidireccional de voz e inteligencia artificial (**Speech-to-Text / Audio Transcription** + **Text-to-Speech / Síntesis Neuronal Gemini** + **Ejecución de Herramientas Autónomas**).

A continuación se detalla la lista de activación de funciones, comandos de voz reconocidos, endpoints y modos de operación:

### 1. Requisitos y Configuración Previa
- **Permisos del Navegador**: Permitir acceso al micrófono (`navigator.mediaDevices.getUserMedia` o `webkitSpeechRecognition`).
- **Variable de Entorno para Gemini TTS / STT Neuronal**:
  - Configurar `GEMINI_API_KEY` en el entorno o Settings.
  - *Fallback Automático*: Si no hay API key presente, el sistema conmuta instantáneamente al motor nativo del navegador (**Web Speech API / SpeechSynthesis** y **Web Speech Recognition**).

---

### 2. Métodos de Activación de Voz (Speech-to-Text / Input)

| Mecanismo de Activación | Acción / Interfaz | Descripción Técnica |
| :--- | :--- | :--- |
| **Pulsar Botón de Micrófono** | Clic en el icono de micrófono en el panel de IA (`AiVoiceChatbot`) | Inicia la escucha continua vía Web Speech API (`es-ES`) con streaming de resultados intermedios. |
| **Comando por Teclado** | Pulsar `Enter` en el campo de texto | Transmite la instrucción transcrita directamente al orquestador. |
| **Transcripción Multimodal** | Endpoint `/api/ai/speech/transcribe` | Envía audio base64 comprimido (`audio/webm` o `audio/wav`) a Gemini 3.7 Flash para transcripción de alta precisión. |

---

### 3. Síntesis y Respuestas de Voz (Text-to-Speech / Output)

| Parámetro | Opciones / Voces | Descripción |
| :--- | :--- | :--- |
| **Modelo TTS Principal** | `gemini-3.1-flash-tts-preview` | Genera audio PCM WAV nativo de 24 kHz decodificado en tiempo real mediante `AudioContext`. |
| **Voces Neuronales Disponibles** | • `Kore` (Femenina, Profesional y Clara)<br>• `Puck` (Masculina Enérgica)<br>• `Zephyr` (Neutral Ejecutiva)<br>• `Fenrir` (Profunda y Técnica)<br>• `Charon` (Serena / Autoritaria) | Seleccionable en el menú desplegable de voz de la interfaz. |
| **Auto-Speak Toggle** | Interruptor `Auto-Lectura de Voz` | Reproduce automáticamente la respuesta del agente al recibir el mensaje. |
| **Fallback Web Speech** | `window.speechSynthesis` | Activo si se opera sin conexión o con fallback de baja latencia. |

---

### 4. Lista de Comandos de Voz y Frases de Activación

Los agentes de IA reconocen comandos en lenguaje natural y ejecutan acciones autónomas (*Function Calling*):

#### 🔧 A. Auto-Sanación y Reparación del Sistema
- *"Ejecuta el diagnóstico de ServicePointManager"* → Invoca `fixTlsServicePointManager` y genera el script de registro para `.NET SchUseStrongCrypto`.
- *"Repara las zonas de seguridad y quita la advertencia amarilla"* → Desencadena las directivas de `SecurityZone-Fix.ps1` (`Zone 0 / Mi PC`).
- *"Limpia la cola de Windows Update"* → Ejecuta el plan de purga para `SoftwareDistribution` y reinicialización de `catroot2`.
- *"Ejecuta WinFix Unified"* → Lanza la suite de remediación local sin dependencias en la nube.

#### 🚀 B. Preparación y Actualización de Windows 11 (Zero Data Loss)
- *"Prepara la estación para actualizar a Windows 11"* → Invoca `stageWindows11Upgrade` y configura bypasses MoSetup/LabConfig.
- *"Comprueba la compatibilidad de hardware"* → Ejecuta `runDiagnosticCheck(checkType: 'OS_COMPATIBILITY')`.
- *"Revisa el espacio en disco y el arranque UEFI"* → Valida particiones GPT y firmas de certificados raíz.

#### 🏗️ C. Orquestación y Automatización BIM
- *"Genera un script para optimizar Revit 2026"* → Invoca `generatePowerShellScript(taskName: 'OptimizeRevitIni')`.
- *"Limpia las cachés de colaboración de Revit"* → Prepara la purga segura de `CollaborationCache` y `PacCache`.
- *"Re-escanea los drivers de hardware"* → Ejecuta `pnputil /scan-devices` para Intel, Realtek y Samsung.

---

### 5. Catálogo de Agentes Autónomos por Especialidad

1. **BIM DevOps Orchestrator** (`orchestrator`):
   - Coordinación integral de despliegues, ODIS, runtimes y secuencias de scripts.
2. **Self-Healing & Diagnostics Agent** (`diagnostics`):
   - Diagnósticos de errores de servicio (AdskLicensingService 1053, CLR TLS -65536, DISM / RestoreHealth).
3. **Windows 11 In-Place Upgrade Agent** (`win11_upgrade`):
   - Modernización de SO con preservación de 100% de datos, configuraciones y software.
4. **PowerShell Automation Architect** (`script_generator`):
   - Síntesis de scripts modulares PowerShell 5.1/7 y batch files con auto-elevación UAC.
5. **Revit & CAD Workstation Optimizer** (`workstation_optimizer`):
   - Ajuste de `Revit.ini`, memoria virtual de paginación y afinidad de GPU DirectX.

---

## ⚡ Quick Start (Modo Local)
1. **Lanzar Reparación Rápida del Sistema**:
   - Doble clic en `WinFix-Unified.bat` para el backend unificado de auto-sanación.
2. **Auditoría No Destructiva**:
   - Doble clic en `Quick-Audit.bat` para el Smoke Test de compatibilidad.
3. **Revisar Reportes**:
   - Inspeccionar la telemetría en `reports/` y logs en `logs/`.

