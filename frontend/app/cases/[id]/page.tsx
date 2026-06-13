'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { casesApi, evidenceApi, api } from '@/lib/api'
import { Case, Evidence, HypothesisResult, SUBJECT_COLORS } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import {
  Send, Lightbulb, FlaskConical, Pin, ChevronRight,
  CheckCircle2, AlertTriangle, Zap, BookOpen, ArrowLeft,
  Eye, Lock, Brain, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { CinematicSolveSequence, WorldDecayTimer } from '@/components/mystery/SolveSequence'

type Tab = 'investigation' | 'evidence' | 'clues' | 'lab' | 'hypothesis'

export default function CaseInvestigationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('investigation')
  const [message, setMessage] = useState('')
  const [hypothesis, setHypothesis] = useState('')
  const [hintLevel, setHintLevel] = useState(0)
  const [currentHint, setCurrentHint] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [solveResult, setSolveResult] = useState<HypothesisResult | null>(null)
  const [showCinematic, setShowCinematic] = useState(false)
  const [misconception, setMisconception] = useState<{ socratic_question: string } | null>(null)
  const [actionCount, setActionCount] = useState(0)
  const [worldDecayEvent, setWorldDecayEvent] = useState<{ event_title: string; narrative: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mcTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: caseRes, isLoading } = useQuery<{ data: Case }>({ queryKey: ['case', id], queryFn: () => casesApi.get(id) })
  const { data: evidenceRes } = useQuery<{ data: Evidence[] }>({ queryKey: ['evidence', id], queryFn: () => evidenceApi.getForCase(id), enabled: tab === 'evidence' })

  const interactMutation = useMutation({
    mutationFn: (msg: string) => casesApi.interact({ case_id: id, student_message: msg, action_type: 'investigate' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['case', id] }); queryClient.invalidateQueries({ queryKey: ['user-stats'] }) },
  })

  const hintMutation = useMutation({
    mutationFn: () => casesApi.getHint(id, hintLevel),
    onSuccess: (res) => { setCurrentHint(res.data.hint_text); setHintLevel(l => l + 1); toast(`Hint used. -${res.data.xp_penalty} XP`, { icon: '!' }) },
  })

  const hypothesisMutation = useMutation({
    mutationFn: () => casesApi.submitHypothesis({ case_id: id, hypothesis, supporting_evidence: evidenceRes?.data?.filter(e => e.is_key_evidence).map(e => e.id) || [] }),
    onSuccess: (res) => { queryClient.invalidateQueries({ queryKey: ['case', id] }); queryClient.invalidateQueries({ queryKey: ['user-stats'] }); setSolveResult(res.data); setShowCinematic(true) },
    onError: () => toast.error('Failed to evaluate hypothesis'),
  })

  const worldDecayMutation = useMutation({
    mutationFn: (actions: number) => api.post('/quiz/world-decay', { case_id: id, actions_since_last_event: actions }),
    onSuccess: (res) => { if (res.data.triggered && res.data.event) { setWorldDecayEvent(res.data.event); queryClient.invalidateQueries({ queryKey: ['case', id] }); setTimeout(() => setWorldDecayEvent(null), 8000) } },
  })

  const checkMisconception = useCallback(async (text: string) => {
    if (text.length < 30) return
    try {
      const res = await api.post('/quiz/check-misconception', { case_id: id, student_text: text })
      if (res.data.has_misconception && res.data.misconception_data) setMisconception(res.data.misconception_data)
    } catch { /* silent */ }
  }, [id])

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    if (mcTimer.current) clearTimeout(mcTimer.current)
    if (e.target.value.length > 30) { mcTimer.current = setTimeout(() => checkMisconception(e.target.value), 1500) }
    else setMisconception(null)
  }

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [isTyping])
  useEffect(() => { if (actionCount > 0 && actionCount % 5 === 0) worldDecayMutation.mutate(actionCount) }, [actionCount])

  const handleSend = async () => {
    if (!message.trim()) return
    const msg = message; setMessage(''); setMisconception(null); setIsTyping(true); setActionCount(n => n + 1)
    try { await interactMutation.mutateAsync(msg) } finally { setIsTyping(false) }
  }

  if (isLoading) return <div className="p-6 flex items-center justify-center min-h-screen"><div className="text-center"><div className="w-8 h-8 border-2 border-amber-glow/30 border-t-amber-glow rounded-full animate-spin mx-auto mb-3" /><p className="text-text-muted text-sm">Loading case file...</p></div></div>
  if (!caseRes?.data) return null

  const caseData = caseRes.data
  const conversations = caseData.conversation_history || []
  const color = SUBJECT_COLORS[caseData.subject as keyof typeof SUBJECT_COLORS] || '#8a5c06'
  const revealedClues = caseData.clues?.filter(c => c.is_revealed) || []
  const lockedClues = caseData.clues?.filter(c => !c.is_revealed) || []
  const worldSeverity = (caseData.world_state?.severity || 'low') as 'low' | 'medium' | 'high' | 'critical'

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'investigation', label: 'Investigation', icon: <ChevronRight size={14} /> },
    { key: 'clues', label: `Clues (${revealedClues.length})`, icon: <Eye size={14} /> },
    { key: 'evidence', label: 'Evidence', icon: <Pin size={14} /> },
    { key: 'lab', label: 'Crime Lab', icon: <FlaskConical size={14} /> },
    { key: 'hypothesis', label: 'Hypothesis', icon: <BookOpen size={14} /> },
  ]

  return (
    <div className="flex flex-col h-screen">
      <AnimatePresence>{showCinematic && solveResult && <CinematicSolveSequence result={solveResult} caseId={id} caseTitle={caseData.title} onComplete={() => { setShowCinematic(false); router.push(`/cases/${id}/quiz`) }} />}</AnimatePresence>
      <AnimatePresence>{worldDecayEvent && (
        <motion.div initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-40 max-w-md w-full mx-4">
          <div className="bg-red-950/95 border border-red-800/60 rounded-lg p-4 shadow-crimson">
            <div className="flex items-start gap-3"><AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" /><div><p className="text-red-200 font-semibold text-sm">{worldDecayEvent.event_title}</p><p className="text-red-300/80 text-xs mt-1 leading-relaxed">{worldDecayEvent.narrative}</p></div></div>
          </div>
        </motion.div>
      )}</AnimatePresence>

      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-bg-secondary px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/cases" className="text-text-muted hover:text-text-primary transition-colors"><ArrowLeft size={18} /></Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="badge text-xs uppercase" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>{caseData.subject}</span>
              <span className="text-text-muted text-xs capitalize">{caseData.difficulty}</span>
              {caseData.is_solved && <span className="badge bg-amber-glow/20 text-amber-light border border-amber-glow/30 text-xs">SOLVED</span>}
            </div>
            <h1 className="display-text text-xl font-bold text-text-primary truncate">{caseData.title}</h1>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {worldSeverity !== 'low' && <WorldDecayTimer severity={worldSeverity} urgencyMessage={caseData.world_state?.environment_status} onDecayTick={() => worldDecayMutation.mutate(actionCount)} />}
            <div className="flex items-center gap-2"><div className="w-24 xp-bar"><div className="xp-bar-fill" style={{ width: `${caseData.progress_percentage}%` }} /></div><span className="text-text-muted text-xs">{Math.round(caseData.progress_percentage)}%</span></div>
            {!caseData.is_solved && <button onClick={() => hintMutation.mutate()} disabled={hintMutation.isPending} className="btn-secondary text-xs flex items-center gap-1.5"><Lightbulb size={13} />Hint {hintLevel > 0 ? `(Lv.${hintLevel})` : ''}</button>}
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${tab === t.key ? 'bg-amber-glow/20 text-amber-light border border-amber-glow/40' : 'text-text-muted hover:text-text-secondary hover:bg-bg-overlay'}`}>{t.icon}{t.label}</button>
          ))}
        </div>
      </div>

      <AnimatePresence>{currentHint && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-amber-glow/10 border-b border-amber-glow/20 px-6 py-2.5 flex items-start gap-2">
          <Lightbulb size={14} className="text-amber-glow flex-shrink-0 mt-0.5" /><p className="text-text-primary text-sm flex-1">{currentHint}</p><button onClick={() => setCurrentHint(null)} className="text-text-muted hover:text-text-primary text-xs">Dismiss</button>
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{misconception && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-amber-glow/8 border-b border-amber-glow/20 px-6 py-2.5 flex items-start gap-2">
          <Brain size={14} className="text-amber-glow flex-shrink-0 mt-0.5" />
          <div className="flex-1"><p className="text-text-secondary text-xs mb-0.5">Before you send that — have you considered:</p><p className="text-text-primary text-sm">{misconception.socratic_question}</p></div>
          <button onClick={() => setMisconception(null)} className="text-text-muted hover:text-text-primary text-xs flex-shrink-0">Got it</button>
        </motion.div>
      )}</AnimatePresence>

      <div className="flex-1 overflow-hidden flex">
        {tab === 'investigation' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="card-elevated p-5">
                <p className="section-title mb-2 text-amber-glow">Case File</p>
                <p className="text-text-secondary text-sm leading-relaxed">{caseData.story}</p>
                {caseData.stem_concepts?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{caseData.stem_concepts.map((c, i) => <span key={i} className="badge bg-bg-overlay text-text-muted border border-border text-xs">{c}</span>)}</div>}
              </div>
              {conversations.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-amber-glow/20 text-text-primary border border-amber-glow/30' : 'bg-bg-tertiary text-text-secondary border border-border'}`}>
                    {msg.role === 'assistant' ? <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{msg.content}</ReactMarkdown> : msg.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && <div className="flex justify-start"><div className="bg-bg-tertiary border border-border rounded-lg px-4 py-3"><div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-glow animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}</div></div></div>}
              <div ref={messagesEndRef} />
            </div>
            {!caseData.is_solved && (
              <div className="flex-shrink-0 border-t border-border p-4">
                <div className="flex gap-3">
                  <input className="input flex-1 text-sm" placeholder="What do you investigate? Talk to witnesses, examine clues..." value={message} onChange={handleMessageChange} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} disabled={isTyping} />
                  <button onClick={handleSend} disabled={isTyping || !message.trim()} className="btn-primary px-4 disabled:opacity-50"><Send size={15} /></button>
                </div>
                <p className="text-text-dim text-xs mt-2">Try: "I inspect the water", "I talk to the witness", "I check the lab report"</p>
              </div>
            )}
          </div>
        )}

        {tab === 'clues' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              {revealedClues.map(clue => (
                <div key={clue.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2 mb-2"><span className="badge bg-amber-glow/20 text-amber-light border border-amber-glow/30 text-xs">{clue.clue_type}</span><Eye size={13} className="text-amber-glow flex-shrink-0 mt-0.5" /></div>
                  <h3 className="text-text-primary font-semibold text-sm mb-1">{clue.title}</h3>
                  <p className="text-text-muted text-xs leading-relaxed">{clue.description}</p>
                  {clue.stem_concept && <div className="mt-2 pt-2 border-t border-border"><span className="text-amber-light text-xs">STEM Concept: {clue.stem_concept}</span></div>}
                </div>
              ))}
              {lockedClues.map((_, i) => <div key={i} className="card p-4 opacity-40"><div className="flex items-center gap-2 mb-2"><Lock size={13} className="text-text-muted" /><span className="text-text-muted text-xs">Locked clue</span></div><p className="text-text-dim text-xs">Keep investigating to unlock this clue.</p></div>)}
              {revealedClues.length === 0 && <div className="col-span-2 card p-12 text-center"><p className="text-text-muted text-sm">No clues revealed yet. Start investigating.</p></div>}
            </div>
          </div>
        )}

        {tab === 'evidence' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4">
              {(evidenceRes?.data || []).map(e => (
                <div key={e.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2"><span className="badge bg-bg-overlay text-text-muted border border-border text-xs">{e.evidence_type}</span>{e.is_key_evidence && <span className="badge bg-amber-glow/20 text-amber-light border border-amber-glow/30 text-xs">Key Evidence</span>}</div>
                  <h3 className="text-text-primary font-semibold text-sm mb-1">{e.title}</h3>
                  <p className="text-text-muted text-xs mb-2">{e.description}</p>
                  {e.ai_analysis && <div className="bg-bg-primary rounded p-2 mt-2"><p className="text-text-secondary text-xs leading-relaxed">{e.ai_analysis}</p></div>}
                  <div className="mt-2 flex items-center gap-2"><div className="flex-1 xp-bar" style={{height:3}}><div className="xp-bar-fill" style={{width:`${e.relevance_score*100}%`}}/></div><span className="text-text-dim text-xs">{Math.round(e.relevance_score*100)}% relevant</span></div>
                </div>
              ))}
              {!(evidenceRes?.data?.length) && <div className="col-span-2 card p-12 text-center"><p className="text-text-muted text-sm">No evidence collected yet.</p></div>}
            </div>
          </div>
        )}

        {tab === 'lab' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="card-elevated p-6 text-center"><FlaskConical size={40} className="text-amber-glow mx-auto mb-4" /><h3 className="display-text text-lg font-bold text-text-primary mb-2">STEM Crime Lab</h3><p className="text-text-muted text-sm mb-4">Perform virtual experiments to analyze evidence and test hypotheses.</p><Link href={`/lab?case=${id}`} className="btn-primary inline-flex items-center gap-2"><FlaskConical size={16} />Open Crime Lab</Link></div>
          </div>
        )}

        {tab === 'hypothesis' && (
          <div className="flex-1 overflow-y-auto p-6">
            {caseData.is_solved ? (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4"><CheckCircle2 size={20} className="text-amber-glow" /><h3 className="display-text text-lg font-bold text-amber-light">Case Solved!</h3></div>
                {caseData.student_hypothesis && <div className="mb-4"><p className="section-title mb-2">Your Hypothesis</p><p className="text-text-secondary text-sm">{caseData.student_hypothesis}</p></div>}
                {caseData.solution && <div className="mb-5"><p className="section-title mb-2 text-amber-glow">Solution</p><p className="text-text-primary text-sm leading-relaxed">{caseData.solution}</p></div>}
                <Link href={`/cases/${id}/quiz`} className="btn-primary inline-flex items-center gap-2"><Brain size={15} />Take the Proof-of-Learning Quiz</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="card-elevated p-4"><p className="section-title mb-2 text-amber-glow">Form Your Hypothesis</p><p className="text-text-muted text-sm">Based on your investigation, what caused this mystery? Use STEM concepts to support your answer.</p></div>
                <div><label className="block text-text-secondary text-sm mb-2">Your Hypothesis</label><textarea className="input resize-none w-full" rows={6} placeholder="I believe the cause is... This is supported by... The STEM concept that explains this is..." value={hypothesis} onChange={e => setHypothesis(e.target.value)} /></div>
                {caseData.progress_percentage < 30 && <div className="flex items-start gap-2 bg-amber-glow/10 border border-amber-glow/20 rounded p-3"><AlertTriangle size={14} className="text-amber-glow flex-shrink-0 mt-0.5" /><p className="text-text-secondary text-xs">You have only investigated {Math.round(caseData.progress_percentage)}% of the case. Collect more evidence first.</p></div>}
                <button onClick={() => hypothesisMutation.mutate()} disabled={!hypothesis.trim() || hypothesisMutation.isPending} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                  {hypothesisMutation.isPending ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-bg-primary/50 border-t-bg-primary rounded-full animate-spin" />Analyzing...</span> : <><Zap size={15} />Submit Hypothesis</>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
