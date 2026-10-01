'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { labApi, casesApi } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { FlaskConical, Microscope, Atom, Leaf, Play, CheckCircle2, Zap, ChevronDown, BarChart2 } from 'lucide-react'

/* ─── Lab Module Data ──────────────────────────────────────────────── */
const LAB_MODULES = [
  { key: 'chemistry', label: 'Chemistry Lab', Icon: FlaskConical, color: '#a855f7', emoji: '⚗️', desc: 'pH testing, compound analysis, reaction simulations' },
  { key: 'biology', label: 'Biology Lab', Icon: Microscope, color: '#22a066', emoji: '🔬', desc: 'Microscope viewer, DNA analysis, ecosystem analysis' },
  { key: 'physics', label: 'Physics Lab', Icon: Atom, color: '#3b82f6', emoji: '⚛️', desc: 'Force simulations, motion analysis, energy calculations' },
  { key: 'environmental', label: 'Environmental Lab', Icon: Leaf, color: '#22a066', emoji: '🌿', desc: 'Pollution testing, weather analysis, ecosystem monitoring' },
]

const EXPERIMENTS: Record<string, { id: string; name: string; params: Record<string, { type: string; label: string; default: unknown; options?: string[] }> }[]> = {
  chemistry: [
    { id: 'ph_test', name: 'pH Test', params: { substance: { type: 'select', label: 'Substance', default: 'river_water_contaminated', options: ['river_water_contaminated', 'river_water_clean', 'acid_rain', 'industrial_runoff', 'water', 'vinegar', 'baking_soda'] } } },
    { id: 'compound_analysis', name: 'Compound Analysis', params: { compound: { type: 'text', label: 'Sample Name', default: 'water sample' }, check_for: { type: 'text', label: 'Check for (comma separated)', default: 'sulfur,lead' } } },
    { id: 'reaction_sim', name: 'Reaction Simulation', params: { reactant_a: { type: 'text', label: 'Reactant A', default: 'HCl' }, reactant_b: { type: 'text', label: 'Reactant B', default: 'NaOH' } } },
  ],
  biology: [
    { id: 'microscope', name: 'Microscope Analysis', params: { sample: { type: 'select', label: 'Sample', default: 'river_water', options: ['river_water', 'healthy_water', 'leaf', 'diseased_leaf', 'blood', 'bacteria_culture'] }, magnification: { type: 'number', label: 'Magnification', default: 400 } } },
    { id: 'dna_analysis', name: 'DNA Analysis', params: { sample: { type: 'text', label: 'Sample Name', default: 'organism tissue' } } },
    { id: 'ecosystem', name: 'Ecosystem Monitor', params: { ecosystem: { type: 'select', label: 'Ecosystem', default: 'river', options: ['river', 'forest', 'ocean', 'grassland'] } } },
  ],
  physics: [
    { id: 'orbital_mechanics', name: 'Orbital Mechanics', params: { altitude_km: { type: 'number', label: 'Altitude (km)', default: 400 }, drag_increase: { type: 'number', label: 'Drag Factor', default: 2.5 } } },
    { id: 'force_analysis', name: 'Force Analysis', params: { mass_kg: { type: 'number', label: 'Mass (kg)', default: 10 }, force_n: { type: 'number', label: 'Applied Force (N)', default: 50 }, friction_coefficient: { type: 'number', label: 'Friction Coefficient', default: 0.3 } } },
    { id: 'energy_calc', name: 'Energy Calculator', params: { mass_kg: { type: 'number', label: 'Mass (kg)', default: 5 }, velocity_ms: { type: 'number', label: 'Velocity (m/s)', default: 10 } } },
  ],
  environmental: [
    { id: 'pollution_spread', name: 'Pollution Spread', params: { pollutant: { type: 'select', label: 'Pollutant', default: 'heavy_metals', options: ['heavy_metals', 'chemicals', 'biological', 'radiation'] }, hours: { type: 'number', label: 'Hours to Simulate', default: 24 } } },
    { id: 'water_quality', name: 'Water Quality Test', params: { samples: { type: 'text', label: 'Sample locations (comma separated)', default: 'upstream,downstream' } } },
    { id: 'air_quality', name: 'Air Quality Analysis', params: { location: { type: 'select', label: 'Location', default: 'industrial', options: ['industrial', 'residential', 'forest', 'ocean'] } } },
  ],
}

/* ─── Chemistry Beaker Animation ───────────────────────────────────── */
function BeakerAnimation({ color, isRunning }: { color: string; isRunning: boolean }) {
  return (
    <div className="relative w-24 h-32 mx-auto">
      {/* Beaker shape */}
      <svg viewBox="0 0 80 100" className="w-full h-full">
        {/* Liquid */}
        <clipPath id="beaker-clip">
          <path d="M 10 30 L 10 85 Q 10 95 20 95 L 60 95 Q 70 95 70 85 L 70 30 Z" />
        </clipPath>
        <rect x="0" y={isRunning ? "40" : "55"} width="80" height="60"
          fill={`${color}60`}
          clipPath="url(#beaker-clip)"
          style={{ transition: 'y 1s ease' }}
        />
        {/* Bubbles when running */}
        {isRunning && [1, 2, 3].map((b) => (
          <motion.circle
            key={b}
            cx={20 + b * 15}
            cy={80}
            r={3}
            fill={`${color}90`}
            animate={{ cy: [80, 45], opacity: [0.8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: b * 0.4, ease: 'easeOut' }}
          />
        ))}
        {/* Beaker outline */}
        <path d="M 10 10 L 10 85 Q 10 95 20 95 L 60 95 Q 70 95 70 85 L 70 10" fill="none" stroke={color} strokeWidth="2" />
        <line x1="5" y1="10" x2="75" y2="10" stroke={color} strokeWidth="2" />
        {/* Graduation marks */}
        <line x1="10" y1="40" x2="18" y2="40" stroke={color} strokeWidth="1" opacity="0.5" />
        <line x1="10" y1="60" x2="18" y2="60" stroke={color} strokeWidth="1" opacity="0.5" />
        <line x1="10" y1="80" x2="18" y2="80" stroke={color} strokeWidth="1" opacity="0.5" />
      </svg>
      {isRunning && (
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-lg"
          animate={{ y: [-4, -12, -4], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          💨
        </motion.div>
      )}
    </div>
  )
}

/* ─── Microscope Animation ──────────────────────────────────────────── */
function MicroscopeView({ isRunning, color }: { isRunning: boolean; color: string }) {
  return (
    <div className="w-32 h-32 mx-auto rounded-full border-4 overflow-hidden relative" style={{ borderColor: color }}>
      <div className="absolute inset-0 bg-[#0a1a0a]">
        {isRunning ? (
          <>
            {/* Animated cells */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border"
                style={{
                  width: 12 + (i % 3) * 8,
                  height: 12 + (i % 3) * 8,
                  borderColor: `${color}80`,
                  background: `${color}15`,
                  left: `${(i * 20) % 90}%`,
                  top: `${(i * 17 + 10) % 85}%`,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
            {/* Scan line */}
            <motion.div
              className="absolute inset-x-0 h-0.5 opacity-30"
              style={{ background: color }}
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-[10px] text-text-muted text-center">Place sample<br />to observe</p>
          </div>
        )}
      </div>
      {/* Crosshairs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 inset-x-0 h-px bg-white/10" />
        <div className="absolute left-1/2 inset-y-0 w-px bg-white/10" />
      </div>
    </div>
  )
}

/* ─── Physics Oscilloscope ──────────────────────────────────────────── */
function Oscilloscope({ isRunning, color }: { isRunning: boolean; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const tRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const W = canvas.width, H = canvas.height
      ctx.fillStyle = '#0a0f1a'
      ctx.fillRect(0, 0, W, H)

      if (isRunning) {
        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        for (let x = 0; x < W; x++) {
          const t = tRef.current + x * 0.05
          const y = H / 2 + Math.sin(t) * (H / 3) * Math.sin(t * 0.3)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        tRef.current += 0.05

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'
        ctx.lineWidth = 0.5
        for (let gx = 0; gx < W; gx += W / 8) {
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke()
        }
        for (let gy = 0; gy < H; gy += H / 4) {
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
        }
      } else {
        ctx.strokeStyle = `${color}40`
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke()
      }
      frameRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frameRef.current)
  }, [isRunning, color])

  return <canvas ref={canvasRef} width={240} height={100} className="w-full rounded border border-border" />
}

/* ─── Environmental Pollution Map ───────────────────────────────────── */
function PollutionMap({ isRunning, color }: { isRunning: boolean; color: string }) {
  const zones = [
    { id: 'A', label: 'Upstream', x: '15%', y: '30%' },
    { id: 'B', label: 'Factory', x: '45%', y: '20%' },
    { id: 'C', label: 'River', x: '50%', y: '55%' },
    { id: 'D', label: 'Downstream', x: '75%', y: '65%' },
    { id: 'E', label: 'Town', x: '80%', y: '30%' },
  ]
  return (
    <div className="relative w-full h-32 bg-bg-primary rounded border border-border overflow-hidden">
      {/* River line */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 128" preserveAspectRatio="none">
        <path d="M 40 60 Q 120 40 200 70 Q 280 100 360 80" fill="none" stroke="#3b82f680" strokeWidth="12" />
        <path d="M 40 60 Q 120 40 200 70 Q 280 100 360 80" fill="none" stroke="#3b82f640" strokeWidth="20" />
      </svg>
      {zones.map((z) => (
        <div key={z.id} className="absolute flex flex-col items-center" style={{ left: z.x, top: z.y, transform: 'translate(-50%,-50%)' }}>
          <motion.div
            className="w-4 h-4 rounded-full border-2"
            style={{ borderColor: color, background: isRunning && (z.id === 'C' || z.id === 'D') ? `${color}60` : 'transparent' }}
            animate={isRunning && (z.id === 'C' || z.id === 'D') ? { scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-[9px] text-text-muted mt-0.5 whitespace-nowrap">{z.label}</span>
        </div>
      ))}
      {isRunning && (
        <motion.div
          className="absolute w-3 h-3 rounded-full"
          style={{ background: `${color}80`, left: '45%', top: '20%' }}
          animate={{ x: [0, 60, 120], y: [0, 20, 40], opacity: [1, 0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  )
}

/* ─── Result Chart ─────────────────────────────────────────────────── */
function ResultVisualization({ results }: { results: Record<string, unknown> }) {
  const chartData = results.chart_data as { type: string; data_points?: { x: number; y: number }[]; value?: number; min?: number; max?: number } | undefined
  if (!chartData) return null

  if (chartData.type === 'gauge' && chartData.value !== undefined) {
    const pct = ((chartData.value - (chartData.min || 0)) / ((chartData.max || 14) - (chartData.min || 0))) * 100
    const isAcidic = chartData.value < 7
    const isNeutral = Math.abs(chartData.value - 7) < 0.5
    return (
      <div className="mt-4 p-4 evidence-card">
        <p className="font-detective text-[#f5e6d3] font-bold uppercase tracking-widest mb-3 border-b border-[#3b2b1d] pb-2 text-sm">pH Meter</p>
        <div className="relative h-6 rounded-sm overflow-hidden mb-2 border border-[#3b2b1d] shadow-inner" style={{ background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 30%, #22c55e 50%, #3b82f6 70%, #8b5cf6 100%)' }}>
          <motion.div
            className="absolute top-0 bottom-0 w-1.5 bg-black border-x border-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            initial={{ left: '0%' }}
            animate={{ left: `${pct}%` }}
            transition={{ duration: 1, type: 'spring' }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-[#a39171] font-mono uppercase tracking-widest font-bold mb-3"><span>0 Acid</span><span>7 Neutral</span><span>14 Base</span></div>
        <p className="text-center text-4xl font-black font-detective drop-shadow-md" style={{ color: isNeutral ? '#22c55e' : isAcidic ? '#ef4444' : '#3b82f6' }}>
          pH {chartData.value}
        </p>
        <p className="text-center text-[10px] font-mono uppercase tracking-widest mt-2 px-2 py-1 bg-black border border-[#3b2b1d] rounded inline-block mx-auto w-full" style={{ color: isAcidic ? '#ef4444' : isNeutral ? '#22c55e' : '#3b82f6' }}>{isAcidic ? '⚠️ Highly acidic — dangerous!' : isNeutral ? '✅ Neutral — safe' : '🔵 Basic/alkaline'}</p>
      </div>
    )
  }

  if ((chartData.type === 'line' || chartData.type === 'area') && chartData.data_points) {
    const pts = chartData.data_points
    const maxY = Math.max(...pts.map(p => p.y)) || 1
    const W = 400, H = 120, pad = 24
    return (
      <div className="mt-4 p-4 evidence-card">
        <p className="font-detective text-[#f5e6d3] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-[#3b2b1d] pb-2 text-sm"><BarChart2 size={14} className="text-amber-glow" />Simulation Results</p>
        <svg width="100%" viewBox={`0 0 ${W} ${H + pad * 2}`}>
          {/* Area fill */}
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8860a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#c8860a" stopOpacity="0" />
            </linearGradient>
          </defs>
          {pts.length > 1 && (
            <>
              <polygon
                points={[
                  `${pad},${pad + H}`,
                  ...pts.map((p, i) => `${pad + (i / (pts.length - 1)) * (W - pad * 2)},${pad + H - (p.y / maxY) * H}`),
                  `${pad + (W - pad * 2)},${pad + H}`,
                ].join(' ')}
                fill="url(#chartGrad)"
              />
              <polyline
                points={pts.map((p, i) => `${pad + (i / (pts.length - 1)) * (W - pad * 2)},${pad + H - (p.y / maxY) * H}`).join(' ')}
                fill="none" stroke="#c8860a" strokeWidth="2"
              />
            </>
          )}
          {pts.map((p, i) => (
            <circle key={i} cx={pad + (i / (pts.length - 1)) * (W - pad * 2)} cy={pad + H - (p.y / maxY) * H} r="3" fill="#c8860a" />
          ))}
        </svg>
      </div>
    )
  }
  return null
}

/* ─── Main Lab Page ─────────────────────────────────────────────────── */
export default function LabPage() {
  const searchParams = useSearchParams()
  const caseId = searchParams.get('case')
  const moduleParam = searchParams.get('module') || 'chemistry'

  const [activeModule, setActiveModule] = useState(moduleParam)
  const [activeExperiment, setActiveExperiment] = useState(EXPERIMENTS[moduleParam][0].id)
  const [params, setParams] = useState<Record<string, unknown>>({})
  const [hypothesis, setHypothesis] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const { data: casesRes } = useQuery({
    queryKey: ['cases', 'active'],
    queryFn: () => casesApi.list('active'),
    enabled: !caseId,
  })

  const activeCases = casesRes?.data || []
  const selectedCaseId = caseId || activeCases[0]?.id

  const experiments = EXPERIMENTS[activeModule] || []
  const currentExp = experiments.find(e => e.id === activeExperiment)
  const activeModuleData = LAB_MODULES.find(m => m.key === activeModule)!

  const runMutation = useMutation({
    mutationFn: () => labApi.runExperiment({
      case_id: selectedCaseId || '00000000-0000-0000-0000-000000000000',
      lab_type: activeModule,
      hypothesis,
      parameters: { experiment_type: activeExperiment, ...params },
    }),
    onMutate: () => { setIsAnimating(true); setResult(null) },
    onSuccess: (res) => { setResult(res.data.results); setIsAnimating(false); toast.success(`Experiment complete! +${res.data.xp_earned} XP`) },
    onError: () => { setIsAnimating(false); toast.error('Experiment failed. Check your inputs.') },
  })

  // Animation runs for at least 2 seconds for visual effect
  const handleRun = () => {
    runMutation.mutate()
    setTimeout(() => { if (!runMutation.isPending) setIsAnimating(false) }, 3000)
  }

  return (
    <div className="p-6">
      <div className="mb-8 border-b border-[#3b2b1d] pb-6">
        <h1 className="font-detective text-4xl font-bold text-[#f5e6d3] uppercase tracking-widest flex items-center gap-3"><Microscope className="text-amber-glow" size={32} /> STEM Crime Lab</h1>
        <p className="text-[#a39171] font-mono text-xs mt-3 uppercase tracking-widest bg-[#1b1109] inline-block px-4 py-1 border border-[#3b2b1d] rounded-sm">Perform virtual experiments to investigate mysteries</p>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Module selector */}
        <div className="col-span-3 space-y-3">
          {LAB_MODULES.map((m) => (
            <button
              key={m.key}
              onClick={() => { setActiveModule(m.key); setActiveExperiment(EXPERIMENTS[m.key][0].id); setResult(null); setIsAnimating(false) }}
              className={`w-full evidence-card p-4 text-left transition-all ${activeModule === m.key ? 'border-amber-glow shadow-[0_0_15px_rgba(200,134,10,0.3)] bg-[#3d270c]' : 'hover:border-amber-dim opacity-70 hover:opacity-100'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded shadow-inner flex items-center justify-center flex-shrink-0 text-xl" style={{ background: `${m.color}20`, border: `1px solid ${m.color}60` }}>
                  {m.emoji}
                </div>
                <p className="font-detective text-[#f5e6d3] font-bold text-sm tracking-wider uppercase">{m.label}</p>
              </div>
              <p className="text-[#a39171] font-mono text-[9px] uppercase tracking-widest leading-relaxed line-clamp-2">{m.desc}</p>
            </button>
          ))}
        </div>

        {/* Experiment area */}
        <div className="col-span-9 space-y-4">
          {/* Experiment picker */}
          <div className="flex gap-2 flex-wrap mb-2">
            {experiments.map(exp => (
              <button
                key={exp.id}
                onClick={() => { setActiveExperiment(exp.id); setResult(null) }}
                className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest border transition-all ${activeExperiment === exp.id ? 'bg-amber-glow text-black border-amber-glow shadow-[0_0_10px_rgba(200,134,10,0.5)]' : 'bg-[#1b1109] text-[#a39171] border-[#3b2b1d] hover:border-amber-dim'}`}
              >
                {exp.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Setup panel */}
            <div className="corkboard-panel p-6 shadow-[0_8px_30px_rgba(0,0,0,0.8)] min-h-[400px]">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-60 mix-blend-multiply pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-5 border-b border-[#3b2b1d] pb-3">
                  <span className="text-2xl drop-shadow-[0_0_8px_rgba(200,134,10,0.5)]">{activeModuleData.emoji}</span>
                  <h2 className="font-detective text-xl font-bold text-[#f5e6d3] uppercase tracking-widest">{currentExp?.name}</h2>
                </div>

                <div className="mb-6 p-4 bg-black rounded border-2 shadow-inner flex items-center justify-center" style={{ minHeight: 160, borderColor: `${activeModuleData.color}40` }}>
                  {activeModule === 'chemistry' && <BeakerAnimation color={activeModuleData.color} isRunning={isAnimating} />}
                  {activeModule === 'biology' && <MicroscopeView isRunning={isAnimating} color={activeModuleData.color} />}
                  {activeModule === 'physics' && <Oscilloscope isRunning={isAnimating} color={activeModuleData.color} />}
                  {activeModule === 'environmental' && <PollutionMap isRunning={isAnimating} color={activeModuleData.color} />}
                </div>

                <div className="space-y-4 mb-5">
                  {currentExp && Object.entries(currentExp.params).map(([key, cfg]) => (
                    <div key={key} className="bg-[#1b1109] p-3 rounded border border-[#3b2b1d]">
                      <label className="block text-[#a39171] font-mono text-[9px] uppercase tracking-widest font-bold mb-2">{cfg.label}</label>
                      {cfg.type === 'select' ? (
                        <div className="relative">
                          <select className="input font-detective text-sm uppercase appearance-none pr-8 bg-[#110a05] border-[#4a3520]" value={(params[key] as string) || String(cfg.default)} onChange={e => setParams(p => ({ ...p, [key]: e.target.value }))}>
                            {(cfg.options || []).map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-glow pointer-events-none" />
                        </div>
                      ) : (
                        <input type={cfg.type === 'number' ? 'number' : 'text'} className="input font-detective text-sm uppercase bg-[#110a05] border-[#4a3520]" defaultValue={String(cfg.default)} onChange={e => setParams(p => ({ ...p, [key]: cfg.type === 'number' ? Number(e.target.value) : e.target.value }))} />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mb-6 bg-[#1b1109] p-3 rounded border border-[#3b2b1d]">
                  <label className="block text-[#a39171] font-mono text-[9px] uppercase tracking-widest font-bold mb-2">Your Hypothesis</label>
                  <input className="input font-detective text-sm bg-[#110a05] border-[#4a3520]" placeholder="What do you expect to find?" value={hypothesis} onChange={e => setHypothesis(e.target.value)} />
                </div>

                <button
                  onClick={handleRun}
                  disabled={runMutation.isPending}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 text-sm font-bold tracking-widest"
                  style={{ background: isAnimating ? undefined : `linear-gradient(135deg, ${activeModuleData.color}40, rgba(200,134,10,0.2))` }}
                >
                  {isAnimating ? (
                    <><span className="w-4 h-4 border-2 border-amber-glow/30 border-t-amber-glow rounded-full animate-spin" />Running Analysis...</>
                  ) : (
                    <><Play size={15} />Initiate Sequence</>
                  )}
                </button>
              </div>
            </div>

            {/* Results panel */}
            <div className="evidence-card p-6 border-[#4a3520] bg-[#1a120c]">
              <h3 className="font-detective text-[#f5e6d3] font-bold uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-[#3b2b1d] pb-3">
                <BarChart2 size={18} className="text-amber-glow" />Analysis Readout
              </h3>

              <AnimatePresence mode="wait">
                {!result && !isAnimating && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-[350px] text-center border-2 border-dashed border-[#3b2b1d] rounded">
                    <div className="w-16 h-16 rounded-full bg-black border border-[#4a3520] flex items-center justify-center mb-4 text-3xl shadow-inner drop-shadow-[0_0_8px_rgba(200,134,10,0.2)]">{activeModuleData.emoji}</div>
                    <p className="font-detective text-[#a39171] uppercase tracking-widest text-sm max-w-[200px] leading-relaxed">Configure sequence parameters and initiate to generate readout.</p>
                  </motion.div>
                )}

                {isAnimating && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-[350px] text-center border-2 border-dashed border-[#3b2b1d] rounded bg-black/20">
                    <motion.div
                      className="w-20 h-20 rounded-full border-4 border-t-transparent mb-6 shadow-[0_0_15px_rgba(200,134,10,0.5)]"
                      style={{ borderColor: `${activeModuleData.color}30`, borderTopColor: activeModuleData.color }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="font-detective text-[#f5e6d3] font-bold uppercase tracking-widest text-lg mb-2">Executing {currentExp?.name}</p>
                    <p className="text-amber-glow font-mono text-[10px] uppercase tracking-widest animate-pulse">Computing telemetry data...</p>
                  </motion.div>
                )}

                {result && !isAnimating && (
                  <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-glow bg-amber-glow/10 border border-amber-glow/30 px-4 py-2 rounded">
                      <CheckCircle2 size={18} />
                      <span className="font-detective font-bold tracking-widest uppercase">Analysis Complete</span>
                      {runMutation.data?.data?.xp_earned && (
                        <span className="ml-auto flex items-center gap-1.5 text-black bg-amber-glow px-2 py-1 rounded-sm text-[10px] font-mono font-bold tracking-widest uppercase shadow-[0_0_8px_rgba(200,134,10,0.8)]">
                          <Zap size={10} />+{runMutation.data.data.xp_earned} XP
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(result).filter(([k]) => k !== 'chart_data' && typeof result[k] !== 'object').map(([k, v]) => (
                        <div key={k} className="bg-black rounded p-3 border border-[#3b2b1d] shadow-inner">
                          <p className="text-[#a39171] font-mono text-[9px] uppercase tracking-widest mb-1">{k.replace(/_/g, ' ')}</p>
                          <p className="text-[#f5e6d3] font-detective text-base font-bold uppercase tracking-wider">{String(v)}</p>
                        </div>
                      ))}
                    </div>

                    <ResultVisualization results={result} />

                    {runMutation.data?.data && (
                      <div className="space-y-3 mt-6">
                        <div className="evidence-card p-4 bg-[#2a1e12] border-[#4a3520]">
                          <p className="font-detective text-[#f5e6d3] font-bold uppercase tracking-widest text-sm mb-2 border-b border-[#3b2b1d] pb-2">Conclusion</p>
                          <p className="text-[#d4b58e] font-mono text-xs leading-relaxed uppercase tracking-wider">{runMutation.data.data.conclusion}</p>
                        </div>
                        <div className="evidence-card p-4 bg-amber-glow/10 border-amber-glow/40">
                          <p className="font-detective text-amber-light font-bold uppercase tracking-widest text-sm mb-2 border-b border-amber-glow/20 pb-2 flex items-center gap-2"><Zap size={14} /> AI Assessment</p>
                          <p className="text-amber-glow font-mono text-xs leading-relaxed uppercase tracking-wider">{runMutation.data.data.feedback}</p>
                        </div>
                        {runMutation.data.data.stem_concepts_reinforced?.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {runMutation.data.data.stem_concepts_reinforced.map((c: string, i: number) => (
                              <span key={i} className="bg-black text-[#a39171] border border-[#4a3520] font-mono text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded shadow-inner">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
