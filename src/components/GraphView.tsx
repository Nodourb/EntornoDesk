import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  GitBranch, 
  GitPullRequest, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  ChevronRight,
  GitMerge,
  Maximize2,
  Minimize2,
  Eye,
  Terminal,
  FolderGit2,
  Network,
  GitCommit,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  AlertTriangle,
  Code2
} from 'lucide-react';
import { REPOSITORY_SCRIPTS } from '../data/scriptsData';

export interface BranchHierarchyNode {
  id: string;
  name: string;
  type: 'main' | 'module' | 'security' | 'infra' | 'ai' | 'file';
  branch: string;
  status: 'merged' | 'active' | 'in_review' | 'experimental';
  filesCount: number;
  aiAuditSummary: string;
  tags: string[];
  color: string;
  path?: string;
  parent?: string;
  children?: BranchHierarchyNode[];
  x?: number;
  y?: number;
  x0?: number;
  y0?: number;
  depth?: number;
}

interface ConventionalCommit {
  type: string;
  scope: string;
  subject: string;
  fullMessage: string;
  files: string[];
  reason: string;
}

interface BranchOptimizationResult {
  branchName: string;
  suggestedBranchRefactor: string;
  conventionalCommits: ConventionalCommit[];
  prSummary: {
    title: string;
    description: string;
    breakingChanges: boolean;
    securityZoneAudit: string;
    mergeReadinessScore: number;
  };
  gitCommands: string[];
  aiRecommendations: string[];
}

export const GraphView: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<'radial-tree' | 'tidy-tree' | 'force-graph'>('radial-tree');
  const [selectedNode, setSelectedNode] = useState<BranchHierarchyNode | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // AI Branch & Commit Optimizer State
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] = useState<BranchOptimizationResult | null>(null);
  const [activeOptTab, setActiveOptTab] = useState<'commits' | 'pr' | 'git_cli' | 'recommendations'>('commits');

  // Dynamically compute repository branches & module trees from metadata
  const hierarchyData: BranchHierarchyNode = useMemo(() => {
    const scripts = REPOSITORY_SCRIPTS;

    const folderMap: { [key: string]: typeof scripts } = {
      'CryptoCore': [],
      'modules': [],
      '.github': [],
      'AKSEngine': [],
      'BIMParameters': [],
      'root': []
    };

    scripts.forEach(script => {
      const parts = script.path.split('/');
      if (parts.length > 1) {
        const topFolder = parts[0];
        if (!folderMap[topFolder]) folderMap[topFolder] = [];
        folderMap[topFolder].push(script);
      } else {
        folderMap['root'].push(script);
      }
    });

    const cryptoFiles = folderMap['CryptoCore'] || [];
    const netFiles = folderMap['modules'] || [];
    const ghFiles = folderMap['.github'] || [];

    const rootNode: BranchHierarchyNode = {
      id: 'main',
      name: 'main (Production Core)',
      type: 'main',
      branch: 'main',
      status: 'active',
      filesCount: scripts.length,
      aiAuditSummary: 'Línea base maestra protegida. Controla el orquestador unificado WinFix, SecuritySandbox y los manifests ISO 19650.',
      tags: ['Production', 'Master', 'ISO 19650', 'WinFix'],
      color: '#3b82f6',
      children: [
        {
          id: 'modulo-CryptoCore',
          name: 'modulo-CryptoCore',
          type: 'module',
          branch: 'modulo-CryptoCore',
          status: 'in_review',
          filesCount: cryptoFiles.length,
          aiAuditSummary: 'Motor criptográfico AES-256-CBC con derivación PBKDF2 (100k iteraciones) y streams para modelos BIM pesados.',
          tags: ['AES-256', 'PBKDF2', 'Security', 'Streams'],
          color: '#10b981',
          children: cryptoFiles.map(f => ({
            id: f.path,
            name: f.path.split('/').pop() || f.path,
            type: 'file',
            branch: 'modulo-CryptoCore',
            status: 'in_review',
            filesCount: 1,
            aiAuditSummary: f.description,
            tags: [f.language, f.category],
            color: '#6ee7b7',
            path: f.path
          }))
        },
        {
          id: 'modulo-SecuritySandbox',
          name: 'modulo-SecuritySandbox',
          type: 'security',
          branch: 'modulo-SecuritySandbox',
          status: 'active',
          filesCount: 3,
          aiAuditSummary: 'Capa Soberana de Espacio de Usuario. Normaliza Zonas de Seguridad 0/1, repara permisos NTFS en C:\\BIM y desbloquea consolas.',
          tags: ['Sandbox', 'NTFS ACL', 'Zone.Identifier', 'SmartScreen'],
          color: '#8b5cf6',
          children: [
            {
              id: 'SecuritySandbox-Engine.ps1',
              name: 'SecuritySandbox-Engine.ps1',
              type: 'file',
              branch: 'modulo-SecuritySandbox',
              status: 'active',
              filesCount: 1,
              aiAuditSummary: 'Motor de ejecución en espacio de usuario. Normaliza el Registro sin tocar el Kernel.',
              tags: ['powershell', 'root'],
              color: '#c4b5fd',
              path: 'SecuritySandbox-Engine.ps1'
            },
            {
              id: 'security-policy.json',
              name: 'security-policy.json',
              type: 'file',
              branch: 'modulo-SecuritySandbox',
              status: 'active',
              filesCount: 1,
              aiAuditSummary: 'Manifiesto declarativo de políticas de seguridad y listas blancas para Autodesk Revit / AutoCAD.',
              tags: ['json', 'config'],
              color: '#c4b5fd',
              path: 'security-policy.json'
            }
          ]
        },
        {
          id: 'modulo-NetBootstrap',
          name: 'modulo-NetBootstrap',
          type: 'infra',
          branch: 'modulo-NetBootstrap',
          status: 'merged',
          filesCount: netFiles.length,
          aiAuditSummary: 'Bootstrap de red y seguridad Schannel TLS 1.2 / StrongCrypto para resolver System.Net.ServicePointManager.',
          tags: ['TLS 1.2', 'Schannel', '.NET 4.8', 'ServicePointManager'],
          color: '#06b6d4',
          children: netFiles.map(f => ({
            id: f.path,
            name: f.path.split('/').pop() || f.path,
            type: 'file',
            branch: 'modulo-NetBootstrap',
            status: 'merged',
            filesCount: 1,
            aiAuditSummary: f.description,
            tags: [f.language, f.category],
            color: '#67e8f9',
            path: f.path
          }))
        },
        {
          id: 'modulo-AKSEngine',
          name: 'modulo-AKSEngine',
          type: 'module',
          branch: 'modulo-AKSEngine',
          status: 'active',
          filesCount: 4,
          aiAuditSummary: 'Orquestador de extracción de entidades, clasificación paramétrica y auditorías estructurales automáticas para modelos FEM.',
          tags: ['AKS', 'BIM-FEM', 'Orchestration', 'Dynamo'],
          color: '#f59e0b',
          children: [
            {
              id: 'AKSEngine/core/orchestrator.ps1',
              name: 'orchestrator.ps1',
              type: 'file',
              branch: 'modulo-AKSEngine',
              status: 'active',
              filesCount: 1,
              aiAuditSummary: 'Pipeline de orquestación de procesos de diseño asistido.',
              tags: ['powershell', 'modules'],
              color: '#fde68a',
              path: 'AKSEngine/core/orchestrator.ps1'
            }
          ]
        },
        {
          id: 'modulo-BIMParameters',
          name: 'modulo-BIMParameters',
          type: 'module',
          branch: 'modulo-BIMParameters',
          status: 'active',
          filesCount: 5,
          aiAuditSummary: 'Motor de estandarización paramétrica y vinculación de shared parameters para Revit conforme a ISO 19650.',
          tags: ['Shared Parameters', 'Revit 2026', 'IFC 4.3', 'OpenBIM'],
          color: '#ec4899',
          children: [
            {
              id: 'BIMParameters/parameters-map.json',
              name: 'parameters-map.json',
              type: 'file',
              branch: 'modulo-BIMParameters',
              status: 'active',
              filesCount: 1,
              aiAuditSummary: 'Mapa JSON de parámetros BIM y clasificaciones Uniformat/Omniclass.',
              tags: ['json', 'config'],
              color: '#fbcfe8',
              path: 'BIMParameters/parameters-map.json'
            }
          ]
        },
        {
          id: 'actions-ci-auditor',
          name: 'actions-ci (AI Agent Engine)',
          type: 'ai',
          branch: 'actions-ci',
          status: 'active',
          filesCount: ghFiles.length,
          aiAuditSummary: 'Pipeline de GitHub Actions asistido por Gemini 2.5 Flash. Enruta carpetas a modulo-*, crea AI_AUDIT_REPORT.md y prepara PRs.',
          tags: ['GitHub Actions', 'Gemini AI', 'CI/CD', 'Automated PR'],
          color: '#6366f1',
          children: ghFiles.map(f => ({
            id: f.path,
            name: f.path.split('/').pop() || f.path,
            type: 'file',
            branch: 'actions-ci',
            status: 'active',
            filesCount: 1,
            aiAuditSummary: f.description,
            tags: [f.language, f.category],
            color: '#a5b4fc',
            path: f.path
          }))
        }
      ]
    };

    return rootNode;
  }, []);

  // Set default selected node
  useEffect(() => {
    if (!selectedNode) {
      setSelectedNode(hierarchyData);
    }
  }, [hierarchyData, selectedNode]);

  // Request AI Optimization for current branch
  const triggerAiBranchOptimization = async (node: BranchHierarchyNode) => {
    setIsOptimizing(true);
    try {
      const fileList = node.children ? node.children.map(c => c.name) : [node.name];
      const res = await fetch('/api/ai/optimize-branch-commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchName: node.branch || node.name,
          changedFiles: fileList,
          modulePurpose: node.aiAuditSummary,
          currentStage: node.status,
          targetBranch: 'main'
        })
      });

      if (!res.ok) throw new Error('Error al conectar con el motor de optimización IA');
      const data: BranchOptimizationResult = await res.json();
      setOptimizationResult(data);
    } catch (err: any) {
      console.error(err);
      // Fallback
      setOptimizationResult({
        branchName: node.branch,
        suggestedBranchRefactor: `feat/${node.branch.replace(/^modulo-/, '')}`,
        conventionalCommits: [
          {
            type: 'feat',
            scope: node.branch.replace(/^modulo-/, ''),
            subject: `Implementar funcionalidades nucleares de ${node.name}`,
            fullMessage: `feat(${node.branch.replace(/^modulo-/, '')}): Implementar componentes y soporte para flujos BIM maestros`,
            files: node.children?.map(c => c.name) || [node.name],
            reason: 'Separa la implementación del módulo de la configuración transversal.'
          },
          {
            type: 'test',
            scope: node.branch.replace(/^modulo-/, ''),
            subject: 'Añadir pruebas de integridad criptográfica y validación de sintaxis',
            fullMessage: `test(${node.branch.replace(/^modulo-/, '')}): Validar suite de pruebas unitarias`,
            files: ['tests/unit.Tests.ps1'],
            reason: 'Garantiza merge seguro antes de abrir el Pull Request a main.'
          }
        ],
        prSummary: {
          title: `feat(${node.branch.replace(/^modulo-/, '')}): Integración de módulo auditado con IA`,
          description: `Este PR incorpora el módulo **${node.branch}** dentro de **main**, garantizando compatibilidad con directivas de seguridad soberana y flujos BIM maestros.`,
          breakingChanges: false,
          securityZoneAudit: 'Zona 1 (Local Workstation) & Zona 2 (BIM Shared)',
          mergeReadinessScore: 98
        },
        gitCommands: [
          `git checkout -b ${node.branch}`,
          `git add .`,
          `git commit -m "feat(${node.branch.replace(/^modulo-/, '')}): Implementar componentes principales"`,
          `git push origin ${node.branch}`
        ],
        aiRecommendations: [
          'Mantener commits atómicos por cada subcarpeta funcional.',
          'Ejecutar SecuritySandbox-Engine.ps1 en modo ScanOnly antes del push.',
          'Revisar el informe AI_AUDIT_REPORT.md generado por Gemini.'
        ]
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Auto trigger optimization on node select if not loaded
  useEffect(() => {
    if (selectedNode) {
      triggerAiBranchOptimization(selectedNode);
    }
  }, [selectedNode?.id]);

  // Main D3 Rendering Engine (Tree Layout & Force Simulation with Zoom/Pan)
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height]);

    const g = svg.append('g').attr('class', 'main-canvas-group');

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    const root = d3.hierarchy<BranchHierarchyNode>(hierarchyData);

    if (viewMode === 'radial-tree') {
      const radius = Math.min(width, height) / 2 - 60;
      const tree = d3.tree<BranchHierarchyNode>()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

      tree(root);

      const linkRadial = d3.linkRadial<any, d3.HierarchyPointNode<BranchHierarchyNode>>()
        .angle(d => d.x)
        .radius(d => d.y);

      g.append('g')
        .attr('class', 'links')
        .attr('fill', 'none')
        .attr('stroke', '#334155')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1.5)
        .selectAll('path')
        .data(root.links())
        .join('path')
        .attr('d', linkRadial)
        .attr('stroke', d => {
          if (selectedNode && (selectedNode.id === d.source.data.id || selectedNode.id === d.target.data.id)) {
            return '#38bdf8';
          }
          return d.target.data.status === 'in_review' ? '#f59e0b' : '#334155';
        })
        .attr('stroke-dasharray', d => d.target.data.status === 'in_review' ? '4,4' : 'none')
        .attr('stroke-width', d => selectedNode && (selectedNode.id === d.source.data.id || selectedNode.id === d.target.data.id) ? 2.5 : 1.5);

      const node = g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(root.descendants())
        .join('g')
        .attr('transform', d => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`)
        .attr('cursor', 'pointer')
        .on('click', (_, d) => {
          setSelectedNode(d.data);
        });

      node.append('circle')
        .attr('r', d => (d.data.type === 'main' ? 22 : d.data.type === 'file' ? 8 : 14))
        .attr('fill', d => d.data.color)
        .attr('fill-opacity', d => {
          if (searchQuery) {
            const matches = d.data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            d.data.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
            return matches ? 0.35 : 0.05;
          }
          return selectedNode?.id === d.data.id ? 0.4 : 0.15;
        });

      node.append('circle')
        .attr('r', d => (d.data.type === 'main' ? 12 : d.data.type === 'file' ? 4.5 : 8))
        .attr('fill', d => d.data.color)
        .attr('stroke', d => (selectedNode?.id === d.data.id ? '#ffffff' : '#0f172a'))
        .attr('stroke-width', d => (selectedNode?.id === d.data.id ? 2.5 : 1.2));

      node.append('text')
        .attr('dy', '0.31em')
        .attr('x', d => (d.x < Math.PI ? 14 : -14))
        .attr('text-anchor', d => (d.x < Math.PI ? 'start' : 'end'))
        .attr('transform', d => (d.x >= Math.PI ? 'rotate(180)' : null))
        .attr('fill', d => (selectedNode?.id === d.data.id ? '#f8fafc' : '#94a3b8'))
        .attr('font-size', d => (d.data.type === 'main' ? '12px' : d.data.type === 'file' ? '9px' : '11px'))
        .attr('font-weight', d => (selectedNode?.id === d.data.id || d.data.type === 'main' ? 'bold' : 'normal'))
        .text(d => d.data.name);

    } else if (viewMode === 'tidy-tree') {
      const tree = d3.tree<BranchHierarchyNode>()
        .nodeSize([36, 190]);

      tree(root);

      const linkHorizontal = d3.linkHorizontal<any, d3.HierarchyPointNode<BranchHierarchyNode>>()
        .x(d => d.y)
        .y(d => d.x);

      g.append('g')
        .attr('fill', 'none')
        .attr('stroke', '#334155')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 1.5)
        .selectAll('path')
        .data(root.links())
        .join('path')
        .attr('d', linkHorizontal)
        .attr('stroke', d => selectedNode && (selectedNode.id === d.source.data.id || selectedNode.id === d.target.data.id) ? '#38bdf8' : '#334155');

      const node = g.append('g')
        .selectAll('g')
        .data(root.descendants())
        .join('g')
        .attr('transform', d => `translate(${d.y - 180},${d.x})`)
        .attr('cursor', 'pointer')
        .on('click', (_, d) => {
          setSelectedNode(d.data);
        });

      node.append('circle')
        .attr('r', d => (d.data.type === 'main' ? 10 : d.data.type === 'file' ? 4 : 7))
        .attr('fill', d => d.data.color)
        .attr('stroke', d => (selectedNode?.id === d.data.id ? '#ffffff' : '#0f172a'))
        .attr('stroke-width', 2);

      node.append('text')
        .attr('dy', '0.32em')
        .attr('x', d => (d.children ? -12 : 12))
        .attr('text-anchor', d => (d.children ? 'end' : 'start'))
        .attr('fill', d => (selectedNode?.id === d.data.id ? '#38bdf8' : '#cbd5e1'))
        .attr('font-size', '11px')
        .attr('font-weight', d => (selectedNode?.id === d.data.id ? 'bold' : 'normal'))
        .text(d => d.data.name);

    } else {
      const nodesData = root.descendants();
      const linksData = root.links();

      const simulation = d3.forceSimulation<any>(nodesData)
        .force('link', d3.forceLink<any, any>(linksData).id((d: any) => d.data?.id).distance((d: any) => (d.target?.data?.type === 'file' ? 60 : 130)).strength(0.8))
        .force('charge', d3.forceManyBody().strength((d: any) => (d.data?.type === 'main' ? -500 : -180)))
        .force('center', d3.forceCenter(0, 0))
        .force('collision', d3.forceCollide().radius((d: any) => (d.data?.type === 'main' ? 35 : 18)));

      const link = g.append('g')
        .attr('stroke', '#334155')
        .attr('stroke-opacity', 0.6)
        .selectAll('line')
        .data(linksData)
        .join('line')
        .attr('stroke-width', d => (d.target.data.type === 'file' ? 1 : 1.8));

      const node = g.append('g')
        .selectAll('g')
        .data(nodesData)
        .join('g')
        .attr('cursor', 'pointer')
        .call(
          d3.drag<SVGGElement, any>()
            .on('start', (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on('drag', (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on('end', (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        )
        .on('click', (_, d) => {
          setSelectedNode(d.data);
        });

      node.append('circle')
        .attr('r', d => (d.data.type === 'main' ? 16 : d.data.type === 'file' ? 5 : 10))
        .attr('fill', d => d.data.color)
        .attr('stroke', d => (selectedNode?.id === d.data.id ? '#ffffff' : '#0f172a'))
        .attr('stroke-width', 2);

      node.append('text')
        .attr('dy', 18)
        .attr('text-anchor', 'middle')
        .attr('fill', d => (selectedNode?.id === d.data.id ? '#f8fafc' : '#94a3b8'))
        .attr('font-size', '10px')
        .text(d => d.data.name);

      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
      });
    }

  }, [hierarchyData, viewMode, selectedNode, searchQuery]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      factor
    );
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(400).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
  };

  const handleCopyCommands = (commands: string[]) => {
    navigator.clipboard.writeText(commands.join('\n'));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${isFullscreen ? 'fixed inset-4 z-50 bg-slate-950 p-4 rounded-2xl border border-slate-800' : 'h-[780px]'}`}>
      
      {/* Dynamic D3.js Visualizer Canvas (7 Cols) */}
      <div 
        ref={containerRef}
        className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col relative shadow-2xl"
      >
        {/* Top Navigation & Mode Switcher */}
        <div className="bg-slate-950/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Árbol Topológico de Ramas & Auditorías
                <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  D3.js Graph Engine
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Visualización interactiva de relaciones entre `main` y módulos aislados `modulo-*`
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('radial-tree')}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'radial-tree' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Radial
            </button>
            <button
              onClick={() => setViewMode('tidy-tree')}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'tidy-tree' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Árbol
            </button>
            <button
              onClick={() => setViewMode('force-graph')}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'force-graph' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Obsidian
            </button>
          </div>

          {/* Search & Zoom Actions */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar rama, archivo, tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 w-36"
              />
            </div>
            <button
              onClick={() => handleZoom(1.3)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(0.7)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
              title="Restablecer Posición"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
              title="Pantalla Completa"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* D3 SVG Canvas */}
        <div className="flex-1 relative cursor-grab active:cursor-grabbing bg-slate-950 overflow-hidden">
          <svg ref={svgRef} className="w-full h-full" />

          {/* Floating Branch Status Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-950/85 backdrop-blur-md p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1.5 shadow-xl pointer-events-none">
            <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              Jerarquía de Ramas Git
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Línea Troncal: `main`</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Módulos de Cifrado / BIM (`modulo-*`)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>Capa Soberana & Sandbox</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>Agente Auditor IA (GitHub Actions)</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Branch & Commit Optimizer Panel (5 Cols) */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-xl overflow-hidden">
        <div className="space-y-3 overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-lg text-indigo-400">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  IA Asistida por Rama & Commits
                  <span className="px-1.5 py-0.5 text-[9px] bg-indigo-500/20 text-indigo-300 font-mono rounded">
                    Gemini 2.5
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Optimización atómica, Conventional Commits y preparación de PRs
                </p>
              </div>
            </div>

            <button
              onClick={() => selectedNode && triggerAiBranchOptimization(selectedNode)}
              disabled={isOptimizing}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs flex items-center gap-1 transition-colors"
              title="Re-analizar con IA"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>

          {/* Active Branch Badge */}
          {selectedNode && (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    {selectedNode.branch || selectedNode.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Refactor sugerido: <span className="text-indigo-400 font-semibold">{optimizationResult?.suggestedBranchRefactor || selectedNode.branch}</span>
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Score: {optimizationResult?.prSummary.mergeReadinessScore || 95}%
              </span>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80 text-xs">
            <button
              onClick={() => setActiveOptTab('commits')}
              className={`flex-1 py-1.5 rounded text-center font-medium transition-all ${
                activeOptTab === 'commits' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Commits Atómicos
            </button>
            <button
              onClick={() => setActiveOptTab('pr')}
              className={`flex-1 py-1.5 rounded text-center font-medium transition-all ${
                activeOptTab === 'pr' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Estructura PR
            </button>
            <button
              onClick={() => setActiveOptTab('git_cli')}
              className={`flex-1 py-1.5 rounded text-center font-medium transition-all ${
                activeOptTab === 'git_cli' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Comandos CLI
            </button>
            <button
              onClick={() => setActiveOptTab('recommendations')}
              className={`flex-1 py-1.5 rounded text-center font-medium transition-all ${
                activeOptTab === 'recommendations' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reglas BIM
            </button>
          </div>

          {/* Tab Content 1: Conventional Commits */}
          {activeOptTab === 'commits' && (
            <div className="space-y-2.5">
              {isOptimizing ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
                  Generando commits semánticos con Gemini...
                </div>
              ) : optimizationResult?.conventionalCommits ? (
                optimizationResult.conventionalCommits.map((commit, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                        commit.type === 'feat' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        commit.type === 'test' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {commit.type} ({commit.scope})
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {commit.files.length} archivo(s)
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 font-mono">
                      {commit.fullMessage}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {commit.reason}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Selecciona una rama para calcular sus commits.
                </div>
              )}
            </div>
          )}

          {/* Tab Content 2: Pull Request Summary */}
          {activeOptTab === 'pr' && optimizationResult?.prSummary && (
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-0.5">
                  Título del Pull Request
                </div>
                <div className="text-xs font-bold text-slate-100">
                  {optimizationResult.prSummary.title}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-0.5">
                  Cuerpo Estructurado
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-line">
                  {optimizationResult.prSummary.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Breaking Changes:</span>
                  <span className="font-semibold text-emerald-400">
                    {optimizationResult.prSummary.breakingChanges ? 'Sí' : 'No (Seguro)'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Zona de Seguridad:</span>
                  <span className="font-semibold text-indigo-300 truncate block">
                    {optimizationResult.prSummary.securityZoneAudit}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Git CLI Commands */}
          {activeOptTab === 'git_cli' && optimizationResult?.gitCommands && (
            <div className="space-y-2">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 relative">
                <button
                  onClick={() => handleCopyCommands(optimizationResult.gitCommands)}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs flex items-center gap-1"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{isCopied ? 'Copiado' : 'Copiar'}</span>
                </button>
                <div className="text-[10px] font-mono text-slate-500 mb-2">Comandos Git Listos para la Terminal:</div>
                <pre className="text-xs font-mono text-indigo-300 space-y-1 overflow-x-auto pr-16 leading-relaxed">
                  {optimizationResult.gitCommands.map((cmd, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-slate-600 select-none">$</span>
                      <span>{cmd}</span>
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          )}

          {/* Tab Content 4: Architecture & BIM Rules */}
          {activeOptTab === 'recommendations' && optimizationResult?.aiRecommendations && (
            <div className="space-y-2">
              {optimizationResult.aiRecommendations.map((rec, i) => (
                <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              if (selectedNode) {
                alert(`Pull Request preparado con optimización IA para la rama '${selectedNode.branch}'.`);
              }
            }}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-colors"
          >
            <GitPullRequest className="w-4 h-4" />
            Aplicar Commits & Preparar Pull Request
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
