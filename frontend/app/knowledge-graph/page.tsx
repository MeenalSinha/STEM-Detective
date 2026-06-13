'use client'

import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/lib/api'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { KnowledgeGraph, KnowledgeNode } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import ReactFlow, {
  Node, Edge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, ReactFlowProvider,
  Panel, NodeProps, Handle, Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Network, X, Zap, BookOpen, ChevronDown, Filter } from 'lucide-react'

const SUBJECT_COLORS: Record<string, string> = {
  biology: '#22a066',
  chemistry: '#a855f7',
  physics: '#3b82f6',
  mathematics: '#f59e0b',
  engineering: '#ef4444',
  environmental: '#10b981',
  general: '#8a5c06',
}

/* ─── Custom Node Component ─────────────────────────────────────────── */
function ConceptNode({ data }: NodeProps) {
  const color = SUBJECT_COLORS[data.subject] || '#8a5c06'
  const mastery = data.mastery_level || 0
  const size = 32 + mastery * 20  // grows with mastery

  return (
    <div className="relative flex flex-col items-center" style={{ width: size + 16 }}>
      <Handle type="target" position={Position.Top} style={{ background: color, border: 'none', width: 6, height: 6 }} />
      <motion.div
        className="rounded-full flex items-center justify-center cursor-pointer"
        style={{
          width: size,
          height: size,
          background: `${color}22`,
          border: `2px solid ${color}`,
          boxShadow: data.selected ? `0 0 16px ${color}80` : `0 0 6px ${color}30`,
        }}
        whileHover={{ scale: 1.15, boxShadow: `0 0 20px ${color}80` }}
        animate={{
          boxShadow: mastery > 0.8
            ? [`0 0 8px ${color}40`, `0 0 18px ${color}70`, `0 0 8px ${color}40`]
            : `0 0 6px ${color}30`,
        }}
        transition={{ duration: 2, repeat: mastery > 0.8 ? Infinity : 0 }}
      >
        <span style={{ fontSize: size * 0.4, lineHeight: 1 }}>{data.emoji || '🔬'}</span>
      </motion.div>
      <div
        className="text-center mt-1 px-1 rounded"
        style={{ maxWidth: 90 }}
      >
        <p className="text-[9px] font-semibold leading-tight" style={{ color }}>
          {data.label}
        </p>
        {mastery > 0 && (
          <div
            className="mx-auto mt-0.5 rounded-full h-1 w-8"
            style={{ background: `${color}30` }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${mastery * 100}%`, background: color }}
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: color, border: 'none', width: 6, height: 6 }} />
    </div>
  )
}

const nodeTypes = { concept: ConceptNode }

/* ─── Subject emojis ────────────────────────────────────────────────── */
const SUBJECT_EMOJIS: Record<string, string> = {
  biology: '🦠', chemistry: '⚗️', physics: '⚛️',
  mathematics: '📐', engineering: '⚙️', environmental: '🌿', general: '🔍',
}

/* ─── Transform API data to React Flow ─────────────────────────────── */
function buildFlowData(graphData: KnowledgeGraph | undefined) {
  if (!graphData?.nodes?.length) return { nodes: [], edges: [] }

  // Group by subject & layout in clusters
  const subjectGroups: Record<string, KnowledgeNode[]> = {}
  graphData.nodes.forEach(n => {
    const s = n.subject || 'general'
    subjectGroups[s] = [...(subjectGroups[s] || []), n]
  })

  const subjects = Object.keys(subjectGroups)
  const CX = 600, CY = 400, R = 320
  const positions: Record<string, { x: number; y: number }> = {}

  subjects.forEach((sub, si) => {
    const angle = (si / subjects.length) * Math.PI * 2 - Math.PI / 2
    const gcx = CX + Math.cos(angle) * R
    const gcy = CY + Math.sin(angle) * R
    subjectGroups[sub].forEach((n, ni) => {
      const spread = 80
      const a2 = (ni / (subjectGroups[sub].length || 1)) * Math.PI * 2
      positions[n.id] = {
        x: gcx + Math.cos(a2) * spread * 0.6,
        y: gcy + Math.sin(a2) * spread * 0.6,
      }
    })
  })

  const nodes: Node[] = graphData.nodes.map(n => ({
    id: n.id,
    type: 'concept',
    position: positions[n.id] || { x: Math.random() * 800, y: Math.random() * 600 },
    data: {
      label: n.concept,
      subject: n.subject || 'general',
      mastery_level: n.mastery_level,
      times_encountered: n.times_encountered,
      emoji: SUBJECT_EMOJIS[n.subject || 'general'] || '🔬',
    },
  }))

  const edges: Edge[] = graphData.edges.map(e => {
    const srcNode = graphData.nodes.find(n => n.id === e.source)
    const color = SUBJECT_COLORS[srcNode?.subject || 'general'] || '#8a5c06'
    return {
      id: `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      animated: (srcNode?.mastery_level || 0) > 0.5,
      style: { stroke: `${color}60`, strokeWidth: 1.5 },
      label: e.relationship_type,
      labelStyle: { fill: '#5a3d1a', fontSize: 9 },
      labelBgStyle: { fill: '#1a1008', fillOpacity: 0.8 },
    }
  })

  return { nodes, edges }
}

/* ─── Node Detail Panel ─────────────────────────────────────────────── */
function NodeDetailPanel({ node, onClose }: { node: Node; onClose: () => void }) {
  const color = SUBJECT_COLORS[node.data.subject] || '#8a5c06'
  const mastery = node.data.mastery_level || 0
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute top-4 right-4 z-10 w-64 evidence-card p-5 shadow-[0_4px_15px_rgba(0,0,0,0.8)] border-[#4a3520] bg-[#1a120c]"
    >
      <button onClick={onClose} className="absolute top-3 right-3 text-[#a39171] hover:text-red-500">
        <X size={13} />
      </button>
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${color}20`, border: `2px solid ${color}` }}
        >
          {node.data.emoji}
        </div>
        <div>
          <p className="font-detective text-[#f5e6d3] font-bold text-sm tracking-wider uppercase">{node.data.label}</p>
          <p className="text-[10px] mt-0.5 capitalize font-mono tracking-widest" style={{ color }}>{node.data.subject}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-secondary">Mastery</span>
            <span style={{ color }} className="font-bold">{Math.round(mastery * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-bg-overlay overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${mastery * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <p className="text-text-dim text-[10px] mt-0.5">
            {mastery < 0.3 ? 'Novice' : mastery < 0.6 ? 'Practitioner' : mastery < 0.85 ? 'Expert' : '🏆 Master'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-black/50 border border-[#3b2b1d] rounded p-2 text-center shadow-inner">
            <p className="text-[#a39171] font-mono text-[9px] uppercase tracking-widest mb-1">Encountered</p>
            <p className="text-[#f5e6d3] font-detective font-bold text-base">{node.data.times_encountered}×</p>
          </div>
          <div className="bg-black/50 border border-[#3b2b1d] rounded p-2 text-center shadow-inner">
            <p className="text-[#a39171] font-mono text-[9px] uppercase tracking-widest mb-1">XP Value</p>
            <p className="text-amber-glow font-mono font-bold text-sm">{Math.round(mastery * 500)}</p>
          </div>
        </div>

        <div className="bg-[#1b1109] rounded p-2.5 border border-[#3b2b1d] shadow-[inset_0_0_8px_rgba(0,0,0,0.5)]">
          <p className="text-[#a39171] font-mono text-[9px] uppercase tracking-widest flex items-center gap-1.5"><BookOpen size={10} className="text-amber-glow" />Keep investigating to increase mastery.</p>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Stats sidebar ─────────────────────────────────────────────────── */
function GraphStats({ graphData }: { graphData?: KnowledgeGraph }) {
  if (!graphData) return null
  const subjects = [...new Set(graphData.nodes.map(n => n.subject || 'general'))]
  const avgMastery = graphData.nodes.length
    ? graphData.nodes.reduce((s, n) => s + (n.mastery_level || 0), 0) / graphData.nodes.length
    : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 text-center">
        <div className="evidence-card p-3 border-[#4a3520]">
          <p className="text-[#f5e6d3] font-detective font-bold text-2xl">{graphData.nodes.length}</p>
          <p className="text-[#a39171] font-mono text-[10px] uppercase tracking-widest mt-1">Concepts</p>
        </div>
        <div className="evidence-card p-3 border-[#4a3520]">
          <p className="text-[#f5e6d3] font-detective font-bold text-2xl">{graphData.edges.length}</p>
          <p className="text-[#a39171] font-mono text-[10px] uppercase tracking-widest mt-1">Connections</p>
        </div>
        <div className="evidence-card p-3 border-amber-glow/40 bg-amber-glow/5">
          <p className="text-amber-light font-detective font-bold text-2xl">{Math.round(avgMastery * 100)}%</p>
          <p className="text-amber-glow font-mono text-[10px] uppercase tracking-widest mt-1">Avg. Mastery</p>
        </div>
      </div>

      <div className="bg-[#1b1109] p-4 rounded border border-[#3b2b1d] shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
        <p className="font-detective text-[#f5e6d3] font-bold uppercase tracking-widest mb-4 border-b border-[#3b2b1d] pb-2 text-sm">By Department</p>
        <div className="space-y-4">
          {subjects.map(sub => {
            const nodes = graphData.nodes.filter(n => (n.subject || 'general') === sub)
            const avg = nodes.reduce((s, n) => s + (n.mastery_level || 0), 0) / nodes.length
            const color = SUBJECT_COLORS[sub] || '#8a5c06'
            return (
              <div key={sub} className="flex items-center gap-3">
                <span className="text-lg w-5">{SUBJECT_EMOJIS[sub]}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-[9px] mb-1 font-mono font-bold uppercase tracking-widest">
                    <span className="text-[#a39171]">{sub}</span>
                    <span style={{ color }}>{nodes.length} nodes</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-overlay">
                    <div className="h-full rounded-full" style={{ width: `${avg * 100}%`, background: color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
function KnowledgeGraphInner() {
  const { data, isLoading } = useQuery<{ data: KnowledgeGraph }>({
    queryKey: ['knowledge-graph'],
    queryFn: () => usersApi.getKnowledgeGraph(),
  })

  const graphData = data?.data

  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const { nodes: rawNodes, edges: rawEdges } = useMemo(
    () => buildFlowData(graphData),
    [graphData]
  )

  const filteredNodes = useMemo(() =>
    filterSubject === 'all' ? rawNodes : rawNodes.filter(n => n.data.subject === filterSubject),
    [rawNodes, filterSubject]
  )

  const filteredEdges = useMemo(() => {
    const ids = new Set(filteredNodes.map(n => n.id))
    return rawEdges.filter(e => ids.has(e.source) && ids.has(e.target))
  }, [rawEdges, filteredNodes])

  const [nodes, setNodes, onNodesChange] = useNodesState(filteredNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(filteredEdges)

  useEffect(() => { setNodes(filteredNodes) }, [filteredNodes, setNodes])
  useEffect(() => { setEdges(filteredEdges) }, [filteredEdges, setEdges])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const subjects = useMemo(
    () => [...new Set((graphData?.nodes || []).map(n => n.subject || 'general'))],
    [graphData]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 rounded-full border-2 border-t-transparent mx-auto mb-4"
            style={{ borderColor: '#8a5c0640', borderTopColor: '#c8860a' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-text-muted text-sm">Loading knowledge graph...</p>
        </div>
      </div>
    )
  }

  if (!graphData?.nodes?.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-sm">
          <Network size={48} className="text-[#4a3520] mx-auto mb-4" />
          <h2 className="font-detective text-2xl font-bold text-[#f5e6d3] mb-2 uppercase tracking-widest">Database Empty</h2>
          <p className="text-[#a39171] font-mono text-xs leading-relaxed uppercase tracking-widest">Solve mysteries to build your personal knowledge graph. Each concept you learn becomes a tracked node.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        className="bg-bg-primary"
        minZoom={0.3}
        maxZoom={2}
      >
        <Background color="#c8860a" gap={32} size={1.5} opacity={0.1} />
        <Controls className="bg-black/80 border border-[#3b2b1d] rounded shadow-card" />
        <MiniMap
          nodeColor={n => SUBJECT_COLORS[n.data?.subject] || '#8a5c06'}
          className="bg-black/80 border border-[#3b2b1d] rounded shadow-card"
          maskColor="rgba(17,10,5,0.85)"
        />

        {/* Corkboard overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-20 mix-blend-multiply pointer-events-none" />

        {/* Filter panel */}
        <Panel position="top-left">
          <div className="flex items-center gap-2 flex-wrap bg-[#1b1109] p-2 rounded border border-[#3b2b1d] shadow-[0_4px_10px_rgba(0,0,0,0.5)] max-w-xl">
            <button
              onClick={() => setFilterSubject('all')}
              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-all ${filterSubject === 'all' ? 'bg-amber-glow text-black border-amber-glow' : 'bg-transparent text-[#a39171] border-[#3b2b1d] hover:border-amber-dim'}`}
            >
              🌐 All Depts
            </button>
            {subjects.map(sub => (
              <button
                key={sub}
                onClick={() => setFilterSubject(sub)}
                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-all ${filterSubject === sub ? 'border-opacity-50 text-white' : 'bg-transparent text-[#a39171] border-[#3b2b1d] hover:border-amber-dim'}`}
                style={filterSubject === sub ? {
                  background: `${SUBJECT_COLORS[sub]}40`,
                  borderColor: `${SUBJECT_COLORS[sub]}80`,
                  color: SUBJECT_COLORS[sub],
                  boxShadow: `0 0 10px ${SUBJECT_COLORS[sub]}40`
                } : {}}
              >
                {SUBJECT_EMOJIS[sub]} {sub}
              </button>
            ))}
          </div>
        </Panel>
      </ReactFlow>

      {/* Selected node detail */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function KnowledgeGraphPage() {
  const { data, isLoading } = useQuery<{ data: KnowledgeGraph }>({
    queryKey: ['knowledge-graph'],
    queryFn: () => usersApi.getKnowledgeGraph(),
  })

  return (
    <div className="flex flex-col h-screen p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 border-b border-[#3b2b1d] pb-4">
        <div>
          <h1 className="font-detective text-4xl font-bold text-[#f5e6d3] flex items-center gap-3 uppercase tracking-widest">
            <Network size={32} className="text-amber-glow" />Knowledge Graph
          </h1>
          <p className="text-[#a39171] font-mono text-[10px] mt-2 uppercase tracking-widest bg-[#1b1109] inline-block px-3 py-1 border border-[#3b2b1d] rounded-sm">Your personal STEM concept map — powered by every investigation</p>
        </div>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* Sidebar stats */}
        <div className="w-56 flex-shrink-0 overflow-y-auto">
          <GraphStats graphData={data?.data} />
        </div>

        {/* Graph canvas */}
        <div className="flex-1 corkboard-panel overflow-hidden relative shadow-[0_8px_30px_rgba(0,0,0,0.8)] border-[6px] border-[#221508]">
          <ReactFlowProvider>
            <KnowledgeGraphInner />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  )
}
