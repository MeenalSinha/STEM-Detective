'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { evidenceApi, casesApi } from '@/lib/api'
import { Evidence, Case, SUBJECT_COLORS } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Pin, Plus, X, Zap, Eye, AlertCircle, ChevronDown, FileText,
  Image, FlaskConical, Users, Lightbulb, Search, Filter
} from 'lucide-react'

const EVIDENCE_TYPES = [
  { id: 'photo', label: 'Photo', icon: Image, color: '#3b82f6' },
  { id: 'data', label: 'Data', icon: FileText, color: '#f59e0b' },
  { id: 'witness', label: 'Witness', icon: Users, color: '#22a066' },
  { id: 'lab_result', label: 'Lab Result', icon: FlaskConical, color: '#a855f7' },
  { id: 'clue', label: 'Clue', icon: Eye, color: '#c8860a' },
]

// Random rotations for cards to look like they're pinned on a corkboard
const ROTATIONS = [-2.5, 1.5, -1, 2, -1.8, 1.2, -2, 1.8, -0.5, 2.2]

function EvidenceCard({ evidence, index, onAnalyze }: { evidence: Evidence; index: number; onAnalyze: (e: Evidence) => void }) {
  const rotation = ROTATIONS[index % ROTATIONS.length]
  const typeData = EVIDENCE_TYPES.find(t => t.id === evidence.evidence_type) || EVIDENCE_TYPES[4]
  const TypeIcon = typeData.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, rotate: rotation }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
      className="relative cursor-pointer select-none"
      style={{ transformOrigin: 'top center' }}
    >
      {/* Pin */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-5 h-5 rounded-full shadow-crimson flex items-center justify-center"
        style={{ background: evidence.is_key_evidence ? '#c42e2e' : '#8a5c06' }}
      >
        <Pin size={10} className="text-white" style={{ transform: 'rotate(45deg)' }} />
      </div>

      {/* Card body - paper texture */}
      <div
        className="relative w-44 bg-[#f5e6c8] rounded p-3 shadow-[0_4px_16px_rgba(0,0,0,0.5)] overflow-hidden"
        onClick={() => onAnalyze(evidence)}
      >
        {/* Aged paper texture overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")' }} />

        {/* Type badge */}
        <div className="flex items-center gap-1 mb-2">
          <TypeIcon size={10} style={{ color: typeData.color }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: typeData.color }}>{evidence.evidence_type}</span>
          {evidence.is_key_evidence && (
            <span className="ml-auto text-[8px] font-black uppercase text-crimson-DEFAULT tracking-wider">KEY!</span>
          )}
        </div>

        <p className="text-[#2d1a0a] font-bold text-xs leading-tight mb-1.5">{evidence.title}</p>
        <p className="text-[#4a3520] text-[10px] leading-tight line-clamp-3">{evidence.description}</p>

        {/* Relevance bar */}
        <div className="mt-2 pt-1.5 border-t border-[#c8a87a]/40">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[8px] text-[#7a5c3a] uppercase tracking-wider">Relevance</span>
            <span className="text-[8px] font-bold text-[#2d1a0a]">{Math.round(evidence.relevance_score * 100)}%</span>
          </div>
          <div className="h-0.5 bg-[#c8a87a]/30 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${evidence.relevance_score * 100}%`, background: typeData.color }} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function AddEvidenceModal({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', description: '', evidence_type: 'clue' })
  const addMutation = useMutation({
    mutationFn: () => evidenceApi.add({ case_id: caseId, ...form }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evidence', caseId] }); toast.success('Evidence pinned to board!'); onClose() },
    onError: () => toast.error('Failed to add evidence'),
  })

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="display-text text-lg font-bold text-text-primary flex items-center gap-2"><Pin size={16} className="text-crimson-light" />Pin New Evidence</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-1.5">Evidence Title *</label>
            <input className="input" placeholder="e.g. Water Sample pH Reading" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-1.5">Description *</label>
            <textarea className="input resize-none" rows={3} placeholder="What did you find? What does it mean?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-1.5">Evidence Type</label>
            <div className="grid grid-cols-3 gap-2">
              {EVIDENCE_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setForm(f => ({ ...f, evidence_type: t.id }))}
                  className={`p-2 rounded border text-xs flex flex-col items-center gap-1 transition-all ${form.evidence_type === t.id ? 'border-amber-glow/50 bg-amber-glow/10' : 'border-border bg-bg-tertiary hover:border-amber-dim'}`}
                >
                  <t.icon size={14} style={{ color: form.evidence_type === t.id ? t.color : undefined }} />
                  <span className={form.evidence_type === t.id ? 'text-amber-light' : 'text-text-muted'}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => addMutation.mutate()} disabled={!form.title || !form.description || addMutation.isPending} className="btn-primary flex-1 disabled:opacity-50">
            {addMutation.isPending ? 'Pinning...' : 'Pin to Board'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function AnalysisPanel({ evidence, onClose }: { evidence: Evidence; onClose: () => void }) {
  const [interpretation, setInterpretation] = useState('')
  const [analysisResult, setAnalysisResult] = useState<{ analysis: string; detective_feedback: string; follow_up_suggestions: string[] } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const res = await evidenceApi.analyze(evidence.id, evidence.case_id, interpretation)
      setAnalysisResult(res.data.analysis)
      toast.success('AI analysis complete!')
    } catch { toast.error('Analysis failed') }
    finally { setLoading(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="w-80 flex-shrink-0 card p-5 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold text-sm">AI Analysis</h3>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={14} /></button>
      </div>

      <div className="evidence-card mb-4">
        <div className="pin" />
        <p className="text-text-primary font-bold text-sm mt-1">{evidence.title}</p>
        <p className="text-text-muted text-xs mt-1 leading-relaxed">{evidence.description}</p>
        {evidence.is_key_evidence && (
          <div className="mt-2 flex items-center gap-1">
            <AlertCircle size={10} className="text-crimson-light" />
            <span className="text-crimson-light text-[10px] font-semibold">KEY EVIDENCE</span>
          </div>
        )}
      </div>

      {evidence.ai_analysis && !analysisResult && (
        <div className="mb-4 p-3 bg-bg-primary rounded border border-border">
          <p className="section-title mb-1">Previous Analysis</p>
          <p className="text-text-secondary text-xs leading-relaxed">{evidence.ai_analysis}</p>
        </div>
      )}

      {analysisResult ? (
        <div className="space-y-3">
          <div className="p-3 bg-bg-primary rounded border border-amber-glow/20">
            <p className="section-title mb-1 text-amber-glow">Detective Analysis</p>
            <p className="text-text-secondary text-xs leading-relaxed">{analysisResult.analysis}</p>
          </div>
          <div className="p-3 bg-bg-primary rounded border border-border">
            <p className="section-title mb-1 text-amber-glow flex items-center gap-1"><Lightbulb size={10} />Detective Feedback</p>
            <p className="text-text-primary text-xs leading-relaxed">{analysisResult.detective_feedback}</p>
          </div>
          {analysisResult.follow_up_suggestions?.length > 0 && (
            <div className="p-3 bg-bg-primary rounded border border-border">
              <p className="section-title mb-2">Next Steps</p>
              <ul className="space-y-1">
                {analysisResult.follow_up_suggestions.map((s, i) => (
                  <li key={i} className="text-text-muted text-xs flex items-start gap-1.5">
                    <span className="text-amber-glow mt-0.5">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-text-secondary text-xs mb-1.5">Your Interpretation (optional)</label>
            <textarea
              className="input resize-none text-xs"
              rows={3}
              placeholder="What do you think this evidence means?"
              value={interpretation}
              onChange={e => setInterpretation(e.target.value)}
            />
          </div>
          <button onClick={handleAnalyze} disabled={loading} className="btn-primary w-full text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><span className="w-3.5 h-3.5 border-2 border-bg-primary/50 border-t-bg-primary rounded-full animate-spin" />Analyzing...</> : <><Zap size={13} />Run AI Analysis</>}
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default function EvidencePage() {
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data: casesRes } = useQuery({ queryKey: ['cases'], queryFn: () => casesApi.list() })
  const cases: Case[] = casesRes?.data || []

  const activeCaseId = selectedCase || cases.find(c => c.status === 'active')?.id || ''

  const { data: evidenceRes, isLoading } = useQuery({
    queryKey: ['evidence', activeCaseId],
    queryFn: () => evidenceApi.getForCase(activeCaseId),
    enabled: !!activeCaseId,
  })

  const allEvidence: Evidence[] = evidenceRes?.data || []
  const filtered = allEvidence.filter(e =>
    (typeFilter === 'all' || e.evidence_type === typeFilter) &&
    (search === '' || e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase()))
  )

  const activeCase = cases.find(c => c.id === activeCaseId)
  const subjectColor = activeCase ? (SUBJECT_COLORS[activeCase.subject] || '#8a5c06') : '#8a5c06'

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="display-text text-2xl font-bold text-text-primary flex items-center gap-2">
              <Pin size={20} className="text-crimson-light" />Evidence Board
            </h1>
            <p className="text-text-muted text-sm mt-0.5">{allEvidence.length} pieces of evidence collected</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Case selector */}
            {cases.length > 0 && (
              <div className="relative">
                <select
                  value={activeCaseId}
                  onChange={e => setSelectedCase(e.target.value)}
                  className="input text-sm pr-8 appearance-none"
                >
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            )}
            {activeCaseId && (
              <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
                <Plus size={14} />Pin Evidence
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input className="input pl-9 text-sm" placeholder="Search evidence..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-text-muted" />
            {['all', ...EVIDENCE_TYPES.map(t => t.id)].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all border ${typeFilter === t ? 'bg-amber-glow/20 text-amber-light border-amber-glow/40' : 'bg-bg-secondary text-text-muted border-border hover:border-amber-dim'}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Corkboard area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main board */}
        <div
          className="flex-1 overflow-auto relative"
          style={{
            background: 'radial-gradient(ellipse at center, #2d1c0a 0%, #1a1008 100%)',
            backgroundImage: `
              radial-gradient(ellipse at center, #2d1c0a 0%, #1a1008 100%),
              repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(200,134,10,0.05) 39px, rgba(200,134,10,0.05) 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(200,134,10,0.05) 39px, rgba(200,134,10,0.05) 40px)
            `,
          }}
        >
          {/* Board title */}
          {activeCase && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="px-4 py-1.5 rounded border border-amber-glow/30 bg-bg-primary/80 backdrop-blur-sm">
                <p className="text-center text-xs text-text-muted">
                  Case: <span className="font-semibold" style={{ color: subjectColor }}>{activeCase.title}</span>
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-amber-glow/30 border-t-amber-glow rounded-full animate-spin" />
            </div>
          ) : !activeCaseId ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Pin size={40} className="text-text-muted mb-4" />
              <p className="display-text text-text-primary text-xl font-bold mb-2">No Case Selected</p>
              <p className="text-text-muted text-sm">Start a mystery to collect and analyze evidence.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 rounded-full bg-bg-secondary border border-border flex items-center justify-center mb-4">
                <Pin size={32} className="text-text-muted" />
              </div>
              <p className="display-text text-text-primary text-xl font-bold mb-2">Empty Evidence Board</p>
              <p className="text-text-muted text-sm mb-5">
                {search || typeFilter !== 'all' ? 'No evidence matches your filters.' : 'Investigate your case to collect evidence.'}
              </p>
              {!search && typeFilter === 'all' && (
                <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
                  <Plus size={15} />Pin First Evidence
                </button>
              )}
            </div>
          ) : (
            <div className="p-16 pt-20">
              {/* Masonry-style pinboard grid */}
              <div className="columns-3 sm:columns-4 lg:columns-5 xl:columns-6 gap-6 space-y-6">
                <AnimatePresence>
                  {filtered.map((e, i) => (
                    <div key={e.id} className="break-inside-avoid mb-6 inline-block w-full">
                      <EvidenceCard
                        evidence={e}
                        index={i}
                        onAnalyze={ev => setSelectedEvidence(ev)}
                      />
                    </div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Key evidence highlight */}
              {filtered.some(e => e.is_key_evidence) && (
                <div className="mt-10 pt-8 border-t border-amber-glow/20">
                  <p className="section-title mb-4 text-crimson-light">🔴 KEY EVIDENCE</p>
                  <div className="flex flex-wrap gap-6">
                    {filtered.filter(e => e.is_key_evidence).map((e, i) => (
                      <EvidenceCard key={`key-${e.id}`} evidence={e} index={i} onAnalyze={ev => setSelectedEvidence(ev)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analysis sidebar */}
        <AnimatePresence>
          {selectedEvidence && (
            <AnalysisPanel
              key={selectedEvidence.id}
              evidence={selectedEvidence}
              onClose={() => setSelectedEvidence(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAdd && activeCaseId && (
          <AddEvidenceModal caseId={activeCaseId} onClose={() => setShowAdd(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
