'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { casesApi } from '@/lib/api'
import { Case, Subject, Difficulty, GradeLevel, SUBJECT_COLORS, DIFFICULTY_COLORS } from '@/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, Search, Clock, CheckCircle2, XCircle, Zap, FolderOpen } from 'lucide-react'

const SUBJECTS: Subject[] = ['biology', 'chemistry', 'physics', 'mathematics', 'engineering', 'environmental']
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert']
const GRADES: GradeLevel[] = ['elementary', 'middle', 'high', 'college']

const getSubjectImage = (subject: string) => {
  switch (subject) {
    case 'physics': return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop"
    case 'environmental': return "https://images.unsplash.com/photo-1611273426858-450d8ce80f26?q=80&w=200&auto=format&fit=crop"
    case 'chemistry': return "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=200&auto=format&fit=crop"
    case 'biology': return "https://images.unsplash.com/photo-1530026405186-ed1f4966c798?q=80&w=200&auto=format&fit=crop"
    default: return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
  }
}

function CaseCard({ c, index }: { c: Case, index: number }) {
  const color = SUBJECT_COLORS[c.subject] || '#8a5c06'
  const diffColor = DIFFICULTY_COLORS[c.difficulty] || '#8a5c06'
  const rot = (index % 7) - 3 // Deterministic pseudo-random rotation
  
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <Link href={`/cases/${c.id}`} className="polaroid-card block w-full group relative" style={{ transform: `rotate(${rot}deg)` }}>
        <div className="pin bg-[#e53935] shadow-[0_4px_4px_rgba(0,0,0,0.5)] w-3 h-3 rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2 z-10">
           <div className="w-1 h-1 bg-white/50 rounded-full absolute top-0.5 left-0.5" />
        </div>
        
        {c.status === 'completed' && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 rotate-[-15deg] border-4 border-green-700 text-green-700 font-detective font-bold text-2xl p-1 px-3 uppercase tracking-widest opacity-80 mix-blend-multiply">
             SOLVED
           </div>
        )}

        {c.status === 'abandoned' && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 rotate-[15deg] border-4 border-red-700 text-red-700 font-detective font-bold text-2xl p-1 px-3 uppercase tracking-widest opacity-80 mix-blend-multiply">
             COLD
           </div>
        )}

        <div className="h-32 bg-[#1a1a1a] mb-3 flex items-center justify-center overflow-hidden border border-gray-300">
           <img src={getSubjectImage(c.subject)} className="opacity-80 object-cover w-full h-full sepia-[0.3] group-hover:scale-105 transition-transform duration-500" />
        </div>
        
        <div className="flex justify-between items-start mb-1 px-1">
          <span className="text-[#a39171] font-mono text-[10px] uppercase font-bold" style={{ color: color }}>
            {c.subject}
          </span>
          <span className="text-[#a39171] font-mono text-[10px] uppercase font-bold" style={{ color: diffColor }}>
            {c.difficulty}
          </span>
        </div>
        
        <h3 className="font-detective text-black font-bold text-sm mb-1 px-1 leading-tight line-clamp-2 min-h-[2.5rem]">{c.title}</h3>
        
        <div className="flex items-center justify-between px-1 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600 font-detective text-[11px] underline">File #{c.id.toString().substring(0, 4)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 bg-gray-300 rounded-full overflow-hidden border border-gray-400">
               <div className="h-full bg-crimson-light" style={{ width: `${c.progress_percentage}%` }} />
            </div>
            <span className="text-gray-800 font-mono text-[10px] font-bold">{Math.round(c.progress_percentage)}%</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function GenerateMysteryModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ subject: 'environmental' as Subject, grade_level: 'middle' as GradeLevel, difficulty: 'medium' as Difficulty, topic: '', additional_context: '' })
  const [loading, setLoading] = useState(false)
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const handleGenerate = async () => {
    if (!form.topic.trim()) { toast.error('Please enter a topic'); return }
    setLoading(true)
    try {
      const res = await casesApi.generate(form)
      toast.success(`Mystery generated: ${res.data.title}`)
      router.push(`/cases/${res.data.id}`)
      onClose()
    } catch { toast.error('Failed to generate mystery.') } finally { setLoading(false) }
  }

  const SUBJECT_OPTIONS = [
    { value: 'biology', icon: '🦠', label: 'Biology', color: '#10b981' },
    { value: 'chemistry', icon: '⚗️', label: 'Chemistry', color: '#a855f7' },
    { value: 'physics', icon: '⚛️', label: 'Physics', color: '#3b82f6' },
    { value: 'mathematics', icon: '📐', label: 'Math', color: '#f59e0b' },
    { value: 'engineering', icon: '⚙️', label: 'Engineering', color: '#ef4444' },
    { value: 'environmental', icon: '🌿', label: 'Environment', color: '#22a066' },
  ]

  const TOPIC_SUGGESTIONS: Record<string, string[]> = {
    biology: ['Bacterial resistance', 'Cell division errors', 'Ecosystem collapse'],
    chemistry: ['Acid rain formation', 'Unknown compound', 'Catalyst reaction'],
    physics: ['Satellite orbit decay', 'Bridge resonance', 'Magnetic anomaly'],
    mathematics: ['Fibonacci in nature', 'Cryptographic flaw', 'Statistical outlier'],
    engineering: ['Structural failure', 'Circuit malfunction', 'Material fatigue'],
    environmental: ['River pollution', 'Crop failure mystery', 'Species disappearance'],
  }

  const suggestions = TOPIC_SUGGESTIONS[form.subject] || []

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card w-full max-w-xl p-8 border-t-4 border-t-amber-glow"
      >
        {loading ? (
          <div className="text-center py-8">
            <motion.div
              className="w-20 h-20 rounded-full border-2 border-t-transparent mx-auto mb-6 shadow-[0_0_15px_rgba(200,134,10,0.5)]"
              style={{ borderColor: '#4a3520', borderTopColor: '#c8860a' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <h3 className="font-detective text-2xl font-bold text-amber-glow mb-2">Compiling Case File...</h3>
            <p className="text-[#a39171] font-mono text-xs uppercase tracking-widest animate-pulse">Running Background Checks</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#f5e6d3] flex items-center gap-2"><FolderOpen className="text-amber-glow" /> New Investigation</h2>
                <p className="text-[#a39171] font-mono text-xs mt-1 uppercase tracking-widest">Provide the parameters for the next assignment.</p>
              </div>
              <button onClick={onClose} className="text-text-muted hover:text-crimson-glow transition-colors text-2xl leading-none">×</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[#d4b58e] font-bold text-xs uppercase tracking-widest mb-2">Select Department</label>
                <div className="grid grid-cols-6 gap-2">
                  {SUBJECT_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => update('subject', s.value)}
                      className={`flex flex-col items-center p-2.5 rounded border transition-all ${form.subject === s.value ? 'bg-[#1f160e] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]' : 'bg-[#1b1109] border-[#3b2b1d] hover:border-amber-dim'}`}
                      style={form.subject === s.value ? { borderColor: s.color } : {}}
                    >
                      <span className="text-xl mb-1">{s.icon}</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: form.subject === s.value ? s.color : '#a39171' }}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#d4b58e] font-bold text-xs uppercase tracking-widest mb-2">Case Topic *</label>
                <input
                  className="input font-detective text-sm"
                  placeholder={`e.g. ${suggestions[0] || 'Any STEM topic...'}`}
                  value={form.topic}
                  onChange={e => update('topic', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {suggestions.map(s => (
                    <button key={s} onClick={() => update('topic', s)} className="text-[10px] px-2 py-1 rounded bg-[#1b1109] border border-[#3b2b1d] text-[#a39171] hover:border-amber-dim hover:text-amber-light font-mono uppercase tracking-wider transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#d4b58e] font-bold text-xs uppercase tracking-widest mb-2">Clearance Level</label>
                  <select className="input font-mono text-xs uppercase" value={form.grade_level} onChange={e => update('grade_level', e.target.value)}>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[#d4b58e] font-bold text-xs uppercase tracking-widest mb-2">Threat Level</label>
                  <select className="input font-mono text-xs uppercase" value={form.difficulty} onChange={e => update('difficulty', e.target.value)}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#d4b58e] font-bold text-xs uppercase tracking-widest mb-2">Additional Briefing <span className="text-[#5c432d]">(optional)</span></label>
                <textarea
                  className="input resize-none font-detective text-sm"
                  rows={2}
                  placeholder="Any specific focus areas or real-world scenarios..."
                  value={form.additional_context}
                  onChange={e => update('additional_context', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={onClose} className="btn-secondary flex-1">Abort</button>
              <button
                onClick={handleGenerate}
                disabled={!form.topic.trim()}
                className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Issue Warrant
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function CasesPage() {
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [search, setSearch] = useState('')
  const { data, isLoading, refetch } = useQuery<{ data: Case[] }>({ queryKey: ['cases', statusFilter], queryFn: () => casesApi.list(statusFilter !== 'all' ? statusFilter : undefined) })
  const cases = (data?.data || []).filter((c) => search === '' || c.title.toLowerCase().includes(search.toLowerCase()) || c.topic.toLowerCase().includes(search.toLowerCase()))
  
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#f5e6d3]">Case Files</h1>
          <p className="text-[#a39171] font-mono text-xs uppercase tracking-widest mt-1">Classified Records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />Open New Case</button>
      </div>

      <div className="flex items-center gap-3 mb-6 bg-[#1b1109] p-3 rounded border border-[#4a3520] shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a39171]" />
          <input className="input pl-9 font-detective bg-[#110a05]" placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'completed', 'abandoned'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-amber-glow text-[#110a05] shadow-[0_0_10px_rgba(200,134,10,0.5)]' : 'bg-transparent text-[#a39171] border border-[#3b2b1d] hover:border-amber-dim'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="corkboard-panel flex-1 p-8">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-60 mix-blend-multiply pointer-events-none" />
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 relative z-10">
             {[...Array(4)].map((_, i) => <div key={i} className="polaroid-card h-64 shimmer" />)}
          </div>
        ) : cases.length === 0 ? (
          <div className="flex items-center justify-center h-full relative z-10">
             <div className="bg-[#f8f9fa] p-8 shadow-[4px_6px_12px_rgba(0,0,0,0.6)] rotate-[-2deg] text-center max-w-sm">
                <div className="pin bg-[#e53935] shadow-[0_4px_4px_rgba(0,0,0,0.5)] w-4 h-4 rounded-full absolute -top-2 left-1/2 -translate-x-1/2">
                   <div className="w-1.5 h-1.5 bg-white/50 rounded-full absolute top-1 left-1" />
                </div>
                <h3 className="font-detective text-red-700 text-2xl font-bold mb-2 uppercase border-b-2 border-red-700 pb-2 inline-block">EMPTY FOLDER</h3>
                <p className="font-detective text-black text-sm mb-6 mt-4">No records found matching these parameters. The trail is cold.</p>
                <button onClick={() => setShowModal(true)} className="border-2 border-black text-black font-bold uppercase tracking-widest px-4 py-2 hover:bg-black hover:text-white transition-colors">Start Investigation</button>
             </div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 relative z-10">
              {cases.map((c, i) => <CaseCard key={c.id} c={c} index={i} />)}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      
      {/* Modals */}
      <AnimatePresence>
        {showModal && <GenerateMysteryModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  )
}
