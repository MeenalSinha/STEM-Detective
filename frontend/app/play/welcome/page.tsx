'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FlaskConical, Link2 } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import { toGameError, type GameError } from '@/lib/game/errors'
import { Button } from '@/components/game/ui'
import { useAuthReady } from '@/lib/game/hooks'

const SLIDES = [
  { icon: Search, title: 'Investigate', text: 'Walk the scene. Inspect objects. Every clue you find is real evidence you can use later.' },
  { icon: FlaskConical, title: 'Test with science', text: 'Run experiments in the lab. Measurements, models and controls reveal what witnesses cannot.' },
  { icon: Link2, title: 'Prove your case', text: 'Connect clues into inferences, then defend a hypothesis. You have to understand the science to crack it.' },
]

export default function Welcome() {
  const router = useRouter()
  const ready = useAuthReady()
  const authed = useAuthStore((s) => s.isAuthenticated && !!s.token)
  const setAuth = useAuthStore((s) => s.setAuth)
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [err, setErr] = useState<GameError | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (ready && authed) router.replace('/play/home/') }, [ready, authed, router])

  const onAuth = async () => {
    setErr(null)
    if (mode === 'register' && form.username.trim().length < 3) return setErr({ kind: 'invalid', message: 'Pick a detective name with at least 3 characters.', retryable: false })
    if (form.password.length < 8) return setErr({ kind: 'invalid', message: 'Your password needs at least 8 characters.', retryable: false })
    setBusy(true)
    try {
      const res = mode === 'register'
        ? await authApi.register({ email: form.email.trim(), username: form.username.trim(), password: form.password, grade_level: 'middle' })
        : await authApi.login(form.email.trim(), form.password)
      setAuth(res.data.user, res.data.access_token)
      router.replace('/play/home/')
    } catch (e) {
      const g = toGameError(e)
      if (g.kind === 'auth' || g.kind === 'invalid') g.message = mode === 'login' ? 'That email and password do not match.' : g.message
      setErr(g)
    } finally { setBusy(false) }
  }

  const onboarding = step < SLIDES.length
  return (
    <div className="min-h-dvh flex flex-col safe-top safe-bottom">
      {onboarding ? (
        <div className="flex-1 flex flex-col bg-[#141B22] text-[#F5F1E8] px-7 pt-14 pb-8">
          <p className="text-[#6fd0d8] text-xs font-bold tracking-[0.2em] uppercase">STEM Detective</p>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}
              drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25}
              onDragEnd={(_, i) => { if (i.offset.x < -60) setStep((s) => Math.min(s + 1, SLIDES.length)); if (i.offset.x > 60) setStep((s) => Math.max(s - 1, 0)) }}
              className="flex-1 flex flex-col justify-center">
              {(() => { const S = SLIDES[step]; return (<>
                <div className="w-20 h-20 rounded-3xl bg-[#0E7C86] flex items-center justify-center mb-8"><S.icon size={38} aria-hidden /></div>
                <h1 style={{ fontFamily: 'var(--font-playfair)' }} className="text-4xl font-bold leading-tight">{S.title}</h1>
                <p className="text-[#b9c6d0] text-lg mt-4 leading-relaxed">{S.text}</p>
              </>) })()}
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-2 mb-6" aria-hidden>{SLIDES.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-7 bg-[#6fd0d8]' : 'w-2 bg-[#3a4753]'}`} />)}</div>
          <Button full onClick={() => setStep(step + 1)}>{step === SLIDES.length - 1 ? 'Open my case file' : 'Next'}</Button>
          {step < SLIDES.length - 1 && <Button full variant="ghost" onClick={() => setStep(SLIDES.length)} className="!text-[#b9c6d0] mt-1">Skip</Button>}
        </div>
      ) : (
        <form className="flex-1 px-6 pt-12 pb-8" onSubmit={(e) => { e.preventDefault(); onAuth() }}>
          <h1 className="display text-3xl font-bold">{mode === 'register' ? 'Join the agency' : 'Welcome back, detective'}</h1>
          <p className="text-mute mt-2">{mode === 'register' ? 'Your progress and XP are saved to your detective profile.' : 'Sign in to continue your investigation.'}</p>
          <div className="mt-6 space-y-4">
            <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            {mode === 'register' && <Field label="Detective name" type="text" autoComplete="username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} />}
            <Field label="Password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={form.password} onChange={(v) => setForm({ ...form, password: v })} hint={mode === 'register' ? 'At least 8 characters' : undefined} />
          </div>
          {err && <p role="alert" className="mt-4 rounded-xl bg-rose-soft text-rose p-3 text-[14px]">{err.message}</p>}
          <Button type="submit" full loading={busy} className="mt-6" disabled={!form.email || !form.password}>{mode === 'register' ? 'Create my profile' : 'Sign in'}</Button>
          <Button full variant="ghost" className="mt-2" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setErr(null) }}>
            {mode === 'register' ? 'I already have a profile' : 'Create a new profile'}
          </Button>
        </form>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type, autoComplete, hint }: { label: string; value: string; onChange: (v: string) => void; type: string; autoComplete: string; hint?: string }) {
  const id = `f-${label.replace(/\s/g, '').toLowerCase()}`
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-bold text-ink-2 mb-1.5">{label}</label>
      <input id={id} type={type} value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)}
        inputMode={type === 'email' ? 'email' : undefined} autoCapitalize="none" autoCorrect="off"
        className="w-full min-h-[52px] rounded-xl border border-line bg-white px-4 text-[16px] outline-none focus:border-lab focus:ring-2 focus:ring-lab/30" />
      {hint && <p className="text-[12px] text-mute mt-1">{hint}</p>}
    </div>
  )
}
