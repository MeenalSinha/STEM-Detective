'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, casesApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Users, MessageSquare, Send, Shield, Zap, FlaskConical,
  Link2, Eye, Target, ChevronRight, Wifi, WifiOff,
  Pin, Star, BookOpen, Globe
} from 'lucide-react'

const SUBJECT_COLORS: Record<string, string> = {
  biology: '#22a066', chemistry: '#a855f7', physics: '#3b82f6',
  mathematics: '#f59e0b', engineering: '#ef4444', environmental: '#10b981',
}

const SUBJECT_EMOJIS: Record<string, string> = {
  biology: '🦠', chemistry: '⚗️', physics: '⚛️',
  mathematics: '📐', engineering: '⚙️', environmental: '🌿',
}

type TeamMessage = {
  user_id: string
  username: string
  content: string
  timestamp: string
}

type Teammate = {
  user_id: string
  username: string
  detective_rank: string
  level: number
  is_online: boolean
}

type SharedEvidence = {
  id: string
  title: string
  description: string
  evidence_type: string
  is_key_evidence: boolean
  relevance_score: number
}

type Session = {
  case_id: string
  case_title: string
  case_subject: string
  owner_id: string
  shared_evidence: SharedEvidence[]
  teammates: Teammate[]
  team_hypothesis: string
  progress: number
}

type LobbyEntry = {
  case_id: string
  case_title: string
  subject: string
  difficulty: string
  progress: number
  owner_id: string
}

/* ─── Teammate Avatar ──────────────────────────────────────────────────── */
function TeammateCard({ t }: { t: Teammate }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 bg-bg-overlay rounded-lg border border-border"
    >
      <div className="relative">
        <div className="w-9 h-9 rounded-full bg-amber-glow/20 border-2 border-amber-glow/40 flex items-center justify-center font-bold text-amber-light text-sm">
          {t.username.charAt(0).toUpperCase()}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-primary ${t.is_online ? 'bg-emerald-400' : 'bg-gray-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-sm font-semibold truncate">{t.username}</p>
        <p className="text-text-muted text-xs truncate">{t.detective_rank}</p>
      </div>
      <span className="text-xs text-text-dim">Lv.{t.level}</span>
    </motion.div>
  )
}

/* ─── Evidence Board ────────────────────────────────────────────────────── */
function SharedEvidenceBoard({ evidence }: { evidence: SharedEvidence[] }) {
  if (!evidence.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Pin size={32} className="text-text-dim mb-3" />
        <p className="text-text-muted text-sm">No evidence collected yet</p>
        <p className="text-text-dim text-xs mt-1">Start investigating to pin clues here</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-3">
      {evidence.map((e, i) => (
        <motion.div
          key={e.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`p-3 rounded-lg border transition-all ${
            e.is_key_evidence
              ? 'border-amber-glow/50 bg-amber-glow/5'
              : 'border-border bg-bg-overlay'
          }`}
        >
          <div className="flex items-start gap-2">
            <Pin size={12} className={`mt-0.5 flex-shrink-0 ${e.is_key_evidence ? 'text-amber-glow' : 'text-text-dim'}`} />
            <div>
              <p className="text-text-primary text-sm font-semibold">{e.title}</p>
              <p className="text-text-muted text-xs mt-0.5 line-clamp-2">{e.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-text-dim uppercase tracking-wider">{e.evidence_type}</span>
                <div className="flex-1 h-1 rounded-full bg-bg-primary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-glow"
                    style={{ width: `${(e.relevance_score || 0) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-amber-light">{Math.round((e.relevance_score || 0) * 100)}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ─── Team Chat ─────────────────────────────────────────────────────────── */
function TeamChat({ caseId }: { caseId: string }) {
  const { user } = useAuthStore()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<TeamMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ['team-messages', caseId],
    queryFn: () => api.get(`/multiplayer/session/${caseId}/messages`),
    refetchInterval: 3000,
  })

  useEffect(() => {
    const msgs: TeamMessage[] = data?.data || []
    setMessages(msgs)
  }, [data])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      api.post(`/multiplayer/session/${caseId}/message`, { message }),
    onSuccess: (res) => {
      setMessages(prev => [...prev, res.data.message])
      setInput('')
    },
    onError: () => toast.error('Failed to send message'),
  })

  const handleSend = () => {
    if (!input.trim()) return
    sendMutation.mutate(input.trim())
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 pb-2">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={24} className="text-text-dim mx-auto mb-2" />
            <p className="text-text-muted text-xs">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}
            >
              <div className="w-7 h-7 rounded-full bg-bg-overlay border border-border flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-light">
                {msg.username.charAt(0).toUpperCase()}
              </div>
              <div className={`max-w-[75%] ${msg.user_id === user?.id ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                <span className="text-[10px] text-text-dim">{msg.username}</span>
                <div className={`px-3 py-2 rounded-xl text-sm ${
                  msg.user_id === user?.id
                    ? 'bg-amber-glow/20 text-text-primary border border-amber-glow/30'
                    : 'bg-bg-overlay text-text-secondary border border-border'
                }`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2 pt-2 border-t border-border">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Share a theory..."
          className="input flex-1 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={sendMutation.isPending || !input.trim()}
          className="btn-primary px-3 disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}

/* ─── Active Session View ───────────────────────────────────────────────── */
function ActiveSession({ caseId, onBack }: { caseId: string; onBack: () => void }) {
  const [hypothesis, setHypothesis] = useState('')
  const [activeTab, setActiveTab] = useState<'evidence' | 'chat' | 'hypothesis'>('evidence')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ data: Session }>({
    queryKey: ['multiplayer-session', caseId],
    queryFn: () => api.get(`/multiplayer/session/${caseId}`),
    refetchInterval: 5000,
  })

  const session = data?.data

  useEffect(() => {
    if (session?.team_hypothesis) setHypothesis(session.team_hypothesis)
  }, [session?.team_hypothesis])

  const updateHypothesisMutation = useMutation({
    mutationFn: (h: string) => api.post(`/multiplayer/session/${caseId}/hypothesis`, { hypothesis: h }),
    onSuccess: () => { toast.success('Team hypothesis updated!'); queryClient.invalidateQueries({ queryKey: ['multiplayer-session', caseId] }) },
  })

  const color = SUBJECT_COLORS[session?.case_subject || ''] || '#c8860a'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <motion.div className="w-12 h-12 rounded-full border-2 border-t-transparent mx-auto mb-3"
            style={{ borderColor: '#8a5c0640', borderTopColor: '#c8860a' }}
            animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
          <p className="text-text-muted text-sm">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const TABS = [
    { id: 'evidence', label: 'Evidence Board', icon: Pin, count: session.shared_evidence.length },
    { id: 'chat', label: 'Team Chat', icon: MessageSquare },
    { id: 'hypothesis', label: 'Team Hypothesis', icon: Target },
  ] as const

  return (
    <div className="flex gap-5 h-full">
      {/* Left: Session Info + Teammates */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <button onClick={onBack} className="text-text-muted hover:text-text-primary text-sm flex items-center gap-1 mb-2">
          ← Back to lobby
        </button>
        {/* Case Header */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{SUBJECT_EMOJIS[session.case_subject] || '🔍'}</span>
            <div>
              <p className="text-text-primary font-semibold text-sm leading-tight">{session.case_title}</p>
              <p className="text-xs capitalize" style={{ color }}>{session.case_subject}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">Progress</span>
              <span className="text-amber-light font-bold">{Math.round(session.progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-bg-overlay overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-amber-glow"
                initial={{ width: 0 }}
                animate={{ width: `${session.progress}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>

        {/* Teammates */}
        <div className="card p-4">
          <h3 className="text-text-primary font-semibold text-sm mb-3 flex items-center gap-2">
            <Users size={14} className="text-amber-glow" />
            Team ({session.teammates.length + 1})
          </h3>
          <div className="space-y-2">
            {session.teammates.map(t => <TeammateCard key={t.user_id} t={t} />)}
            {session.teammates.length === 0 && (
              <p className="text-text-dim text-xs text-center py-4">No teammates yet. Share your case!</p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Main content */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-border p-1 gap-1 flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-glow/15 text-amber-light border border-amber-glow/30'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-overlay'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {'count' in tab && tab.count !== undefined && (
                <span className="bg-amber-glow/20 text-amber-light text-[10px] px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'evidence' && (
              <motion.div key="evidence" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SharedEvidenceBoard evidence={session.shared_evidence} />
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[400px] flex flex-col">
                <TeamChat caseId={caseId} />
              </motion.div>
            )}

            {activeTab === 'hypothesis' && (
              <motion.div key="hypothesis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div>
                  <h3 className="text-text-primary font-semibold mb-2 flex items-center gap-2">
                    <Target size={16} className="text-amber-glow" />
                    Collaborative Hypothesis
                  </h3>
                  <p className="text-text-muted text-sm mb-3">
                    Work together to form a shared theory about the mystery's solution.
                  </p>
                  <textarea
                    value={hypothesis}
                    onChange={e => setHypothesis(e.target.value)}
                    placeholder="Based on the evidence, our team believes the cause is..."
                    rows={5}
                    className="input w-full resize-none"
                  />
                  <button
                    onClick={() => updateHypothesisMutation.mutate(hypothesis)}
                    disabled={updateHypothesisMutation.isPending}
                    className="btn-primary mt-3 disabled:opacity-50"
                  >
                    {updateHypothesisMutation.isPending ? 'Saving...' : 'Save Team Hypothesis'}
                  </button>
                </div>

                {/* STEM concepts reminder */}
                <div className="bg-bg-overlay rounded-lg border border-border p-4">
                  <h4 className="text-text-primary text-sm font-semibold mb-2 flex items-center gap-2">
                    <BookOpen size={14} className="text-amber-glow" />
                    Consider These STEM Concepts
                  </h4>
                  <p className="text-text-muted text-xs">
                    Review your collected evidence and apply scientific reasoning. 
                    What patterns do you see? Which experiment results support your theory?
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* ─── Lobby ─────────────────────────────────────────────────────────────── */
function Lobby({ onJoin }: { onJoin: (caseId: string) => void }) {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['multiplayer-lobby'],
    queryFn: () => api.get('/multiplayer/lobby'),
    refetchInterval: 10000,
  })

  const { data: myActiveCases } = useQuery({
    queryKey: ['cases', 'active'],
    queryFn: () => casesApi.list('active'),
  })

  const lobby = data?.data || { sessions: [], classmates: [] }
  const activeCases = myActiveCases?.data || []

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="card p-6 border-amber-glow/30 bg-gradient-to-r from-amber-glow/5 to-transparent relative overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-6xl opacity-20 select-none">🕵️</div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-glow/20 border border-amber-glow/40 flex items-center justify-center">
              <Globe size={20} className="text-amber-glow" />
            </div>
            <div>
              <h2 className="text-text-primary font-bold text-lg">Multiplayer Detective Mode</h2>
              <p className="text-text-muted text-sm">Collaborate with classmates to solve STEM mysteries together</p>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            {[
              { icon: Shield, label: 'Shared Evidence Board', desc: 'Pool all collected clues' },
              { icon: MessageSquare, label: 'Team Chat', desc: 'Real-time communication' },
              { icon: Target, label: 'Joint Hypothesis', desc: 'Collaborative deduction' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2 flex-1">
                <Icon size={14} className="text-amber-glow mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-text-primary text-xs font-semibold">{label}</p>
                  <p className="text-text-dim text-[11px]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My active cases — join your own */}
        <div className="card p-5">
          <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <FlaskConical size={16} className="text-amber-glow" />
            My Active Cases
            <span className="text-text-dim text-xs font-normal ml-auto">Open your investigation to the team</span>
          </h3>
          {activeCases.length === 0 ? (
            <div className="text-center py-8">
              <FlaskConical size={28} className="text-text-dim mx-auto mb-2" />
              <p className="text-text-muted text-sm">No active cases</p>
              <p className="text-text-dim text-xs mt-1">Generate a new mystery to start investigating</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeCases.map((c: any) => {
                const color = SUBJECT_COLORS[c.subject] || '#c8860a'
                return (
                  <button
                    key={c.id}
                    onClick={() => onJoin(c.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-overlay hover:border-amber-glow/40 transition-all text-left group"
                  >
                    <span className="text-xl">{SUBJECT_EMOJIS[c.subject] || '🔍'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-semibold truncate">{c.title}</p>
                      <p className="text-xs capitalize" style={{ color }}>{c.subject} • {c.difficulty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-bg-primary overflow-hidden">
                        <div className="h-full bg-amber-glow rounded-full" style={{ width: `${c.progress_percentage || 0}%` }} />
                      </div>
                      <ChevronRight size={14} className="text-text-dim group-hover:text-amber-glow transition-colors" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Classmates' sessions */}
        <div className="card p-5">
          <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <Users size={16} className="text-amber-glow" />
            Classmate Sessions
            {lobby.classmates.length > 0 && (
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 ml-auto">
                {lobby.classmates.length} online
              </span>
            )}
          </h3>

          {isLoading ? (
            <div className="text-center py-8">
              <motion.div className="w-8 h-8 rounded-full border-2 border-t-transparent mx-auto"
                style={{ borderColor: '#8a5c0640', borderTopColor: '#c8860a' }}
                animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
            </div>
          ) : lobby.sessions.length === 0 ? (
            <div className="text-center py-8">
              <WifiOff size={28} className="text-text-dim mx-auto mb-2" />
              <p className="text-text-muted text-sm">No classmate sessions active</p>
              <p className="text-text-dim text-xs mt-1">
                {lobby.classmates.length === 0
                  ? 'Join a classroom to see classmate sessions'
                  : 'Classmates are not currently investigating'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {lobby.sessions.map((session: LobbyEntry) => {
                const color = SUBJECT_COLORS[session.subject] || '#c8860a'
                return (
                  <button
                    key={session.case_id}
                    onClick={() => onJoin(session.case_id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-bg-overlay hover:border-emerald-500/40 transition-all text-left group"
                  >
                    <span className="text-xl">{SUBJECT_EMOJIS[session.subject] || '🔍'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-semibold truncate">{session.case_title}</p>
                      <p className="text-xs capitalize" style={{ color }}>{session.subject} • {session.difficulty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Wifi size={12} className="text-emerald-400" />
                        <span className="text-emerald-400 text-xs">Live</span>
                      </div>
                      <ChevronRight size={14} className="text-text-dim group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Classmates list */}
      {lobby.classmates.length > 0 && (
        <div className="card p-5">
          <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-glow" />
            Your Team
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {lobby.classmates.map((c: any) => (
              <div key={c.user_id} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-bg-overlay">
                <div className="w-8 h-8 rounded-full bg-amber-glow/20 border border-amber-glow/30 flex items-center justify-center text-xs font-bold text-amber-light">
                  {c.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-text-primary text-xs font-semibold truncate">{c.username}</p>
                  <p className="text-text-dim text-[10px]">Lv.{c.level} · {c.xp.toLocaleString()} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function MultiplayerPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="display-text text-3xl font-bold text-text-primary flex items-center gap-3">
          <Users size={28} className="text-amber-glow" />
          Multiplayer Detective Mode
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Collaborate with classmates to crack STEM mysteries together
        </p>
      </div>

      <AnimatePresence mode="wait">
        {activeSessionId ? (
          <motion.div key="session" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-[calc(100vh-12rem)]">
            <ActiveSession caseId={activeSessionId} onBack={() => setActiveSessionId(null)} />
          </motion.div>
        ) : (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Lobby onJoin={setActiveSessionId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
