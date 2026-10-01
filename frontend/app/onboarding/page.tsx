'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/lib/store/auth'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { ChevronRight, ChevronLeft, Zap } from 'lucide-react'

const SUBJECTS = [
  { id: 'biology', label: 'Biology', icon: '🦠', desc: 'Life sciences, genetics, ecology', color: '#10b981' },
  { id: 'chemistry', label: 'Chemistry', icon: '⚗️', desc: 'Compounds, reactions, elements', color: '#a855f7' },
  { id: 'physics', label: 'Physics', icon: '⚛️', desc: 'Forces, motion, energy', color: '#3b82f6' },
  { id: 'environmental', label: 'Environmental', icon: '🌿', desc: 'Ecosystems, climate, pollution', color: '#22a066' },
  { id: 'mathematics', label: 'Mathematics', icon: '📐', desc: 'Logic, statistics, algebra', color: '#f59e0b' },
  { id: 'engineering', label: 'Engineering', icon: '⚙️', desc: 'Design, structures, systems', color: '#ef4444' },
]

const LEARNING_STYLES = [
  { id: 'visual', label: 'Visual Learner', icon: '👁️', desc: 'I understand best with diagrams and charts' },
  { id: 'hands_on', label: 'Hands-On', icon: '🤲', desc: 'I learn by doing experiments and activities' },
  { id: 'analytical', label: 'Analytical', icon: '🧮', desc: 'I prefer step-by-step logic and reasoning' },
  { id: 'storytelling', label: 'Story-Driven', icon: '📖', desc: 'I learn best through narratives and context' },
]

const DETECTIVE_RANKS = [
  'Rookie Detective',
  'Junior Investigator',
  'Field Agent',
  'Senior Detective',
  'Chief Inspector',
  'Master Detective',
]

type Step = 'welcome' | 'subjects' | 'style' | 'ready'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, updateUser } = useAuthStore()
  const [step, setStep] = useState<Step>('welcome')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [learningStyle, setLearningStyle] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await authApi.updateProfile({
        learning_profile: {
          preferred_subjects: selectedSubjects,
          learning_style: learningStyle,
          onboarding_complete: true,
        },
        preferences: { learning_style: learningStyle },
      })
      updateUser({ learning_profile: { recommended_subjects: selectedSubjects } })
      toast.success('Profile saved! Your first mystery awaits.')
      router.push('/dashboard')
    } catch {
      // Soft fail — just redirect
      router.push('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const steps: Step[] = ['welcome', 'subjects', 'style', 'ready']
  const stepIdx = steps.indexOf(step)

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-amber-glow/6 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#c8860a 1px, transparent 1px), linear-gradient(90deg, #c8860a 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress dots */}
        {step !== 'welcome' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['subjects', 'style', 'ready'].map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${steps.indexOf(step) > i + 1 ? 'bg-amber-glow w-8' : steps.indexOf(step) === i + 1 ? 'bg-amber-glow w-12' : 'bg-bg-overlay w-6'}`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Welcome ────────────────────────────── */}
          {step === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center">
              <motion.div animate={{ rotate: [0, -3, 3, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }} className="text-8xl mb-6 inline-block">🕵️</motion.div>
              <h1 className="display-text text-4xl font-black text-text-primary mb-3">
                Welcome, Detective{user?.username ? ` ${user.username}` : ''}!
              </h1>
              <p className="text-text-secondary text-lg mb-3 max-w-lg mx-auto">
                You&apos;re about to enter the <strong className="text-amber-light">Multiverse of Mysteries</strong> — an AI-powered universe of STEM investigations.
              </p>
              <p className="text-text-muted text-sm mb-10 max-w-md mx-auto">
                Let&apos;s personalize your experience so the AI can generate mysteries that match your interests and grade level.
              </p>
              <div className="card p-5 mb-8 bg-amber-glow/5 border-amber-glow/20 text-left max-w-sm mx-auto">
                <p className="text-text-secondary text-sm font-semibold mb-2">Your Detective Profile</p>
                <div className="space-y-1 text-xs text-text-muted">
                  <p>🎓 Grade: <span className="text-text-primary capitalize">{user?.grade_level || 'Not set'}</span></p>
                  <p>🏅 Starting Rank: <span className="text-amber-light">Rookie Detective</span></p>
                  <p>⚡ XP: <span className="text-xp font-bold">0</span></p>
                </div>
              </div>
              <button onClick={() => setStep('subjects')} className="btn-primary text-base px-10 py-3.5 inline-flex items-center gap-2">
                Let&apos;s Set Up Your Profile <ChevronRight size={16} />
              </button>
              <div className="mt-4">
                <button onClick={() => router.push('/dashboard')} className="text-text-dim text-sm hover:text-text-muted transition-colors">
                  Skip for now →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Subjects ───────────────────────────── */}
          {step === 'subjects' && (
            <motion.div key="subjects" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="text-center mb-8">
                <p className="section-title mb-2 text-amber-glow">Step 1 of 3</p>
                <h2 className="display-text text-3xl font-bold text-text-primary mb-2">What are you passionate about?</h2>
                <p className="text-text-muted">Select all STEM subjects that interest you. You can change this later.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {SUBJECTS.map((s) => {
                  const selected = selectedSubjects.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={`p-4 rounded-lg border text-left transition-all hover:-translate-y-0.5 relative ${selected ? 'border-amber-glow/50 bg-amber-glow/10' : 'border-border bg-bg-secondary hover:border-amber-dim'}`}
                    >
                      {selected && <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-glow flex items-center justify-center"><span className="text-bg-primary text-[8px] font-black">✓</span></div>}
                      <span className="text-2xl block mb-2">{s.icon}</span>
                      <p className="text-text-primary font-semibold text-sm" style={{ color: selected ? s.color : undefined }}>{s.label}</p>
                      <p className="text-text-muted text-xs mt-0.5">{s.desc}</p>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('welcome')} className="btn-secondary flex items-center gap-1.5"><ChevronLeft size={14} />Back</button>
                <button onClick={() => setStep('style')} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {selectedSubjects.length === 0 ? 'Skip' : `Continue (${selectedSubjects.length} selected)`} <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Learning Style ─────────────────────── */}
          {step === 'style' && (
            <motion.div key="style" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div className="text-center mb-8">
                <p className="section-title mb-2 text-amber-glow">Step 2 of 3</p>
                <h2 className="display-text text-3xl font-bold text-text-primary mb-2">How do you learn best?</h2>
                <p className="text-text-muted">The AI will tailor hints and explanations to your style.</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {LEARNING_STYLES.map((ls) => (
                  <button
                    key={ls.id}
                    onClick={() => setLearningStyle(ls.id)}
                    className={`p-5 rounded-lg border text-left transition-all hover:-translate-y-0.5 ${learningStyle === ls.id ? 'border-amber-glow/50 bg-amber-glow/10' : 'border-border bg-bg-secondary hover:border-amber-dim'}`}
                  >
                    <span className="text-3xl block mb-3">{ls.icon}</span>
                    <p className="text-text-primary font-semibold">{ls.label}</p>
                    <p className="text-text-muted text-xs mt-1 leading-relaxed">{ls.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('subjects')} className="btn-secondary flex items-center gap-1.5"><ChevronLeft size={14} />Back</button>
                <button onClick={() => setStep('ready')} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Continue <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Ready ──────────────────────────────── */}
          {step === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-amber-glow/20 border-2 border-amber-glow/50 flex items-center justify-center mx-auto mb-6 shadow-amber-strong"
              >
                <span className="text-4xl">🏅</span>
              </motion.div>
              <h2 className="display-text text-4xl font-black text-text-primary mb-2">You&apos;re Ready!</h2>
              <p className="text-amber-light font-semibold mb-6">{DETECTIVE_RANKS[0]}</p>

              <div className="card p-5 mb-8 text-left max-w-sm mx-auto bg-amber-glow/5 border-amber-glow/20">
                <p className="section-title mb-3">Your Profile Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-text-muted">Interests:</span><span className="text-text-primary">{selectedSubjects.length > 0 ? selectedSubjects.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') : 'All subjects'}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Learning Style:</span><span className="text-text-primary">{LEARNING_STYLES.find(l => l.id === learningStyle)?.label || 'Adaptive'}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Starting XP:</span><span className="text-xp font-bold flex items-center gap-1"><Zap size={12} />0</span></div>
                </div>
              </div>

              <button onClick={handleFinish} disabled={saving} className="btn-primary text-base px-12 py-4 inline-flex items-center gap-2 shadow-amber-strong disabled:opacity-50">
                {saving ? <>Setting up your universe...</> : <>Enter the Multiverse of Mysteries 🕵️</>}
              </button>
              <div className="mt-4">
                <button onClick={() => setStep('style')} className="text-text-dim text-sm hover:text-text-muted transition-colors flex items-center gap-1 mx-auto">
                  <ChevronLeft size={12} />Back
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
