import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ShieldAlert,
  Flame,
  Terminal,
  Zap,
  Copy,
  Check,
  Play,
  RotateCcw,
  Layers,
  Wand2,
  Cpu,
  ArrowRight,
  RefreshCw,
  Sliders,
  Settings,
  HelpCircle,
  FileCode,
  Radio,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { AI_AGENTS } from '../data/agentsData';
import { AgentId, ChatMessage, SystemProfile, AssistedPlan } from '../types';

interface AiVoiceChatbotProps {
  currentProfile: SystemProfile;
  targetRevitVersion: string;
  onNavigateToTab?: (tab: 'scanner' | 'matrix' | 'console' | 'repository' | 'configurator') => void;
  isFloating?: boolean;
  onCloseFloating?: () => void;
}

export function AiVoiceChatbot({
  currentProfile,
  targetRevitVersion,
  onNavigateToTab,
  isFloating = false,
  onCloseFloating,
}: AiVoiceChatbotProps) {
  // Selected Agent & Model
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>('orchestrator');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.7-flash');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      agentId: 'orchestrator',
      modelUsed: 'gemini-3.7-flash',
      text: `Hola, soy tu **BIM DevOps Orchestrator**. Estoy conectado al kernel de automatización de **Autodesk BIM Environment Manager (ABEM)**.\n\nPuedo ayudarte con reconocimiento de voz, generación de scripts PowerShell, diagnósticos de errores de registro (TLS / ServicePointManager) y orquestación para Revit ${targetRevitVersion}.\n\n¿Qué tarea o diagnóstico deseas automatizar hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Activar Security Sandbox (Desbloquear cmd/zonas)', actionType: 'RUN_CONSOLE', payload: 'SecuritySandbox-Engine' },
        { label: 'Diagnosticar Fallo ServicePointManager', actionType: 'RUN_CONSOLE', payload: 'Fix-NetSecurityPointManager' },
        { label: 'Preparar Upgrade Windows 11', actionType: 'RUN_CONSOLE', payload: 'Prepare-WindowsUpdate' },
        { label: 'Optimizar Revit.ini 2026', actionType: 'OPEN_TAB', payload: 'configurator' }
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Voice Recognition (Speech-to-Text)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Voice Playback (Text-to-Speech)
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Assisted Plan View
  const [activePlan, setActivePlan] = useState<AssistedPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);

  // Auto-scroll chat to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputMessage(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopAudioPlayback();
    };
  }, []);

  const currentAgent = AI_AGENTS.find(a => a.id === selectedAgentId) || AI_AGENTS[0];

  // Stop any active audio playback
  const stopAudioPlayback = () => {
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
      } catch {
        // ignore
      }
      currentAudioSourceRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  // Play audio using Gemini TTS or Web Speech Synthesis
  const playSpeech = async (text: string) => {
    stopAudioPlayback();
    setIsPlayingAudio(true);

    try {
      // Clean text for speech
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'bloque de código omitido')
        .replace(/[*#_`]/g, '')
        .substring(0, 300);

      // Attempt Gemini TTS API
      const response = await fetch('/api/ai/speech/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voice: selectedVoice,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audioBase64) {
          // Play raw audio from Gemini TTS
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
              sampleRate: data.sampleRate || 24000,
            });
          }

          const ctx = audioContextRef.current;
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }

          // Decode base64 to array buffer
          const binaryString = atob(data.audioBase64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Live audio PCM decoding (16-bit PCM little endian)
          const pcmData = new Int16Array(bytes.buffer);
          const audioBuffer = ctx.createBuffer(1, pcmData.length, data.sampleRate || 24000);
          const channelData = audioBuffer.getChannelData(0);
          for (let i = 0; i < pcmData.length; i++) {
            channelData[i] = pcmData[i] / 32768.0;
          }

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          source.onended = () => {
            setIsPlayingAudio(false);
            currentAudioSourceRef.current = null;
          };

          currentAudioSourceRef.current = source;
          source.start();
          return;
        }
      }

      // Fallback: Browser Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingAudio(false);
      }
    } catch (err) {
      console.warn('TTS playback error, falling back to Web Speech API:', err);
      if ('speechSynthesis' in window) {
        const cleanText = text.replace(/[*#_`]/g, '').substring(0, 250);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingAudio(false);
      }
    }
  };

  // Toggle Voice Input
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        stopAudioPlayback();
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Error starting speech recognition:', e);
        }
      }
    }
  };

  // Send message to Gemini AI Server
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputMessage).trim();
    if (!messageText || isLoading) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation history format for API
      const history = messages
        .filter(m => m.sender === 'user' || m.sender === 'assistant')
        .slice(-6)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history,
          agentId: selectedAgentId,
          model: selectedModel,
          contextData: {
            profileName: currentProfile.name,
            targetRevit: targetRevitVersion,
            osName: currentProfile.osName,
            osBuild: currentProfile.osBuild,
          },
          enableTools: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        agentId: selectedAgentId,
        modelUsed: selectedModel,
        text: data.text || 'Respuesta completada.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecutions: data.toolExecutions,
        suggestedActions: [
          { label: 'Ejecutar en Consola', actionType: 'RUN_CONSOLE', payload: 'Quick-Audit' },
          { label: 'Ver Repositorio', actionType: 'OPEN_TAB', payload: 'repository' }
        ]
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Auto-speak response if enabled
      if (autoSpeak && data.text) {
        playSpeech(data.text);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        agentId: selectedAgentId,
        modelUsed: selectedModel,
        text: `**Falla de conexión:** No se pudo procesar la respuesta con el modelo seleccionado.\n\n*Detalles:* ${err.message || 'Error de red'}\n\nVerifica que el dev server esté activo y que tu variable de entorno \`GEMINI_API_KEY\` esté configurada.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Assisted Operation Plan
  const handleGenerateAssistedPlan = async (operationType: string) => {
    setIsGeneratingPlan(true);
    try {
      const res = await fetch('/api/ai/assisted-operation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationType,
          parameters: {
            targetRevitVersion,
            workstation: currentProfile.name,
            osBuild: currentProfile.osBuild,
          },
        }),
      });

      if (res.ok) {
        const plan = await res.json();
        setActivePlan(plan);
      }
    } catch (err) {
      console.error('Error generating plan:', err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Copy code helper
  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Action button execution
  const handleExecuteAction = (actionType: string, payload: string) => {
    if (actionType === 'OPEN_TAB' && onNavigateToTab) {
      onNavigateToTab(payload as any);
    } else if (actionType === 'RUN_CONSOLE' && onNavigateToTab) {
      onNavigateToTab('console');
    } else if (actionType === 'EXECUTE_COMMAND') {
      handleSendMessage(`Ejecuta y automatiza la siguiente acción: ${payload}`);
    }
  };

  const getAgentIcon = (id: AgentId) => {
    switch (id) {
      case 'orchestrator':
        return <Bot className="w-4 h-4 text-blue-600" />;
      case 'diagnostics':
        return <ShieldAlert className="w-4 h-4 text-emerald-600" />;
      case 'win11_upgrade':
        return <Flame className="w-4 h-4 text-purple-600" />;
      case 'script_generator':
        return <Terminal className="w-4 h-4 text-amber-600" />;
      case 'workstation_optimizer':
        return <Zap className="w-4 h-4 text-cyan-600" />;
    }
  };

  return (
    <div
      id="ai-voice-chatbot-container"
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden ${
        isFloating
          ? 'fixed bottom-4 right-4 w-[420px] max-w-[calc(100vw-32px)] h-[620px] z-50 shadow-2xl border-slate-300'
          : 'w-full h-[780px]'
      }`}
    >
      {/* Top Header / Agent Selection Bar */}
      <div className="bg-slate-900 text-white p-3.5 flex flex-col gap-2.5 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono tracking-tight text-white">
                  ABEM AI VOICE & AGENTS
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Modelo: <span className="text-blue-300 font-mono">{selectedModel}</span> | Voz:{' '}
                <span className="text-indigo-300 font-mono">{selectedVoice}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto-Speak Toggle */}
            <button
              onClick={() => {
                setAutoSpeak(!autoSpeak);
                if (isPlayingAudio) stopAudioPlayback();
              }}
              title={autoSpeak ? 'Audio de voz activado' : 'Audio de voz desactivado'}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                autoSpeak ? 'bg-indigo-600/50 text-indigo-200' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Clear Chat */}
            <button
              onClick={() => {
                stopAudioPlayback();
                setMessages([
                  {
                    id: `welcome-${Date.now()}`,
                    sender: 'assistant',
                    agentId: selectedAgentId,
                    modelUsed: selectedModel,
                    text: `Conversación reiniciada con el agente **${currentAgent.name}**. ¿Qué tarea deseas abordar?`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              }}
              title="Reiniciar conversación"
              className="p-1.5 rounded-md text-slate-400 hover:text-white bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {isFloating && onCloseFloating && (
              <button
                onClick={onCloseFloating}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-md text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Agent Selector Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {AI_AGENTS.map(agent => {
            const isSelected = agent.id === selectedAgentId;
            return (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgentId(agent.id);
                  handleSendMessage(`Hola ${agent.name}, actívate como agente para la estación ${currentProfile.name}.`);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                }`}
              >
                {getAgentIcon(agent.id)}
                <span>{agent.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model & Voice Configuration Drawer */}
      <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">Modelo:</span>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="gemini-3.7-flash">Gemini 3.7 Flash (Recomendado)</option>
            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Razonamiento)</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Baja Latencia)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">Voz:</span>
          <select
            value={selectedVoice}
            onChange={e => setSelectedVoice(e.target.value)}
            className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="Kore">Kore (Femenina / Clara)</option>
            <option value="Puck">Puck (Masculina / Enérgica)</option>
            <option value="Zephyr">Zephyr (Neutral / Ejecutiva)</option>
            <option value="Fenrir">Fenrir (Masculina / Profunda)</option>
            <option value="Charon">Charon (Serena / Técnica)</option>
          </select>
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1 font-mono">
                {!isUser && (
                  <span className="font-semibold text-slate-600 flex items-center gap-1">
                    {msg.agentId && getAgentIcon(msg.agentId)}
                    {msg.agentId ? AI_AGENTS.find(a => a.id === msg.agentId)?.name : 'AI Engine'}
                  </span>
                )}
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                {/* Tool Calling Execution Cards */}
                {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
                    <span className="text-[10px] font-bold font-mono text-purple-700 block flex items-center gap-1">
                      <Terminal className="w-3 h-3" />
                      ACCIÓN AUTÓNOMA DE AGENTE (TOOL EXECUTION)
                    </span>
                    {msg.toolExecutions.map((tool, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 text-slate-200 rounded-lg p-2.5 text-[11px] font-mono space-y-1.5 border border-slate-800"
                      >
                        <div className="flex items-center justify-between text-purple-300 font-bold">
                          <span>{tool.toolName}()</span>
                          <span className="text-[9px] bg-purple-900/60 px-1.5 py-0.5 rounded text-purple-200">
                            AUTO-EXECUTED
                          </span>
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          Argumentos: {JSON.stringify(tool.args)}
                        </div>
                        <div className="text-emerald-400 text-[10px] bg-slate-950 p-1.5 rounded">
                          ✓ {tool.output?.message || tool.output?.findings || 'Completado con éxito.'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Quick Actions */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                    {msg.suggestedActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleExecuteAction(action.actionType, action.payload)}
                        className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-semibold border border-blue-200/80 flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-2.5 h-2.5" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Speech Playback Button for Assistant Messages */}
              {!isUser && (
                <div className="flex items-center gap-2 px-1">
                  <button
                    onClick={() => playSpeech(msg.text)}
                    className="text-[10px] text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Reproducir audio</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span className="font-mono">{currentAgent.name} razonando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="bg-slate-100/80 px-3 py-1.5 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
          Sugerencias:
        </span>
        {currentAgent.samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="px-2 py-0.5 rounded-full bg-white hover:bg-slate-200 border border-slate-300/80 text-[10px] text-slate-700 whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Voice / Mic Activity Visualizer Bar */}
      {isRecording && (
        <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-2 flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-spin" />
            <span className="font-bold">Escuchando comando de voz...</span>
          </div>
          <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded font-mono">
            Habla ahora en español
          </span>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Microphone Voice-to-Text Button */}
          <button
            type="button"
            onClick={toggleRecording}
            title={isRecording ? 'Detener grabación' : 'Hablar por micrófono (Speech-to-Text)'}
            className={`p-2.5 rounded-xl transition-all shadow-xs ${
              isRecording
                ? 'bg-red-600 text-white animate-bounce ring-4 ring-red-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-600" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            placeholder={`Pregunta a ${currentAgent.name} o habla por voz...`}
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
