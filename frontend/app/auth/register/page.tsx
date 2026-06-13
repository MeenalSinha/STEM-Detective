'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Mail, User, GraduationCap, Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

const GRADE_OPTIONS = [
  { value: 'elementary', label: 'Elementary', desc: 'Grades K–5', emoji: '🌱' },
  { value: 'middle', label: 'Middle School', desc: 'Grades 6–8', emoji: '🔬' },
  { value: 'high', label: 'High School', desc: 'Grades 9–12', emoji: '⚗️' },
  { value: 'college', label: 'College', desc: 'University+', emoji: '🎓' },
]

const ROLE_OPTIONS = [
  { value: 'student', label: 'I am a Student', desc: 'Solve mysteries, earn XP, master STEM', icon: '🕵️' },
  { value: 'teacher', label: 'I am a Teacher', desc: 'Create classrooms, assign mysteries, track progress', icon: '👩‍🏫' },
]

type Step = 'role' | 'info' | 'grade'

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [step, setStep] = useState<Step>('role')
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    full_name: '',
    role: 'student',
    grade_level: 'middle',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleRegister = async () => {
    if (!form.email || !form.username || !form.password) {
      toast.error('Please fill in all required fields')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.register({
        email: form.email,
        username: form.username,
        password: form.password,
        full_name: form.full_name || undefined,
        grade_level: form.grade_level,
        role: form.role,
      })
      const { access_token, user } = res.data
      setAuth(user, access_token)
      toast.success('Account created! Welcome, Detective!')
      router.push('/onboarding')
    } catch (err: unknown) {
      const detail = (err as any)?.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg : (typeof detail === 'string' ? detail : 'Registration failed');
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const steps: Step[] = ['role', 'info', 'grade']
  const stepIdx = steps.indexOf(step)
  const progressPct = ((stepIdx + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-subject-chemistry/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-amber-glow/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#c8860a 1px, transparent 1px), linear-gradient(90deg, #c8860a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-black border-2 border-amber-glow flex items-center justify-center shadow-[0_0_15px_rgba(200,134,10,0.5)] overflow-hidden">
              <img src="/raccoon-detective.webp" alt="STEM Detective" className="w-full h-full object-cover" />
            </div>
            <p className="font-detective text-[#f5e6d3] font-bold text-xl uppercase tracking-widest">STEM DETECTIVE</p>
          </Link>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-4 bg-black p-3 rounded border border-[#3b2b1d] shadow-inner">
          <div className="flex justify-between text-[#a39171] font-mono text-[10px] uppercase tracking-widest mb-2 font-bold">
            <span>Sequence {stepIdx + 1} of {steps.length}</span>
            <span>{step === 'role' ? 'Identify Role' : step === 'info' ? 'Clearance Data' : 'Rank Assignment'}</span>
          </div>
          <div className="h-1.5 bg-[#1b1109] rounded-full overflow-hidden border border-[#3b2b1d]">
            <motion.div
              className="h-full bg-amber-glow rounded-full shadow-[0_0_8px_rgba(200,134,10,0.8)]"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="evidence-card p-8 bg-[#1a120c] border-[#4a3520] shadow-[0_8px_30px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Step 1: Role */}
          {step === 'role' && (
            <div>
              <div className="mb-6 border-b border-[#3b2b1d] pb-4 text-center">
                <h1 className="font-detective text-3xl font-bold text-[#f5e6d3] uppercase tracking-widest">Identify Subject</h1>
                <p className="text-[#a39171] font-mono text-[10px] mt-2 uppercase tracking-widest">Select Operative Classification</p>
              </div>
              <div className="space-y-3">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => { update('role', r.value); setStep('info') }}
                    className={`w-full p-4 rounded-sm border text-left transition-all hover:-translate-y-0.5 ${
                      form.role === r.value
                        ? 'border-amber-glow bg-[#3d270c] shadow-[0_0_15px_rgba(200,134,10,0.3)]'
                        : 'border-[#3b2b1d] bg-black hover:border-amber-dim'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl drop-shadow-md">{r.icon}</span>
                      <div>
                        <p className="font-detective text-[#f5e6d3] font-bold text-sm uppercase tracking-wider">{r.label}</p>
                        <p className="text-[#a39171] font-mono text-[9px] uppercase tracking-widest mt-1 leading-relaxed">{r.desc}</p>
                      </div>
                      <ChevronRight size={16} className="ml-auto text-amber-glow" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Info */}
          {step === 'info' && (
            <div>
              <div className="mb-6 border-b border-[#3b2b1d] pb-4 text-center">
                <h1 className="font-detective text-3xl font-bold text-[#f5e6d3] uppercase tracking-widest">Operative Data</h1>
                <p className="text-[#a39171] font-mono text-[10px] mt-2 uppercase tracking-widest">Establish Clearance Credentials</p>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault()
                if (!form.email || !form.username || !form.password) { toast.error('Fill all required fields'); return }
                setStep('grade')
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#d4b58e] font-mono text-[10px] font-bold uppercase tracking-widest mb-1.5">Full Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-glow" />
                      <input className="input pl-9 font-detective text-sm uppercase bg-black border-[#4a3520]" placeholder="Jane Smith" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#d4b58e] font-mono text-[10px] font-bold uppercase tracking-widest mb-1.5">Detective Alias (Username) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-glow text-sm">🔍</span>
                      <input className="input pl-9 font-detective text-sm uppercase bg-black border-[#4a3520]" placeholder="SherlockJr" value={form.username} onChange={(e) => update('username', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#d4b58e] font-mono text-[10px] font-bold uppercase tracking-widest mb-1.5">Email *</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-glow" />
                      <input className="input pl-9 font-detective text-sm uppercase bg-black border-[#4a3520]" type="email" placeholder="detective@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#d4b58e] font-mono text-[10px] font-bold uppercase tracking-widest mb-1.5">Passcode *</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-glow" />
                      <input className="input pl-9 pr-10 font-detective text-sm uppercase bg-black border-[#4a3520]" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={(e) => update('password', e.target.value)} />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a39171] hover:text-amber-glow">
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={() => setStep('role')} className="btn-secondary flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest py-3 px-4"><ChevronLeft size={14} />Retreat</button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm font-bold uppercase tracking-widest py-3">Proceed<ChevronRight size={14} /></button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Grade */}
          {step === 'grade' && (
            <div>
              <div className="mb-6 border-b border-[#3b2b1d] pb-4 text-center">
                <h1 className="font-detective text-3xl font-bold text-[#f5e6d3] uppercase tracking-widest">Rank Assignment</h1>
                <p className="text-[#a39171] font-mono text-[10px] mt-2 uppercase tracking-widest">Calibrate clearance for tailored assignments</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {GRADE_OPTIONS.map((g) => (
                  <button
                    type="button"
                    key={g.value}
                    onClick={() => update('grade_level', g.value)}
                    className={`p-4 rounded-sm border text-left transition-all hover:-translate-y-0.5 ${
                      form.grade_level === g.value
                        ? 'border-amber-glow bg-[#3d270c] shadow-[0_0_15px_rgba(200,134,10,0.3)]'
                        : 'border-[#3b2b1d] bg-black hover:border-amber-dim'
                    }`}
                  >
                    <span className="text-2xl block mb-2 drop-shadow-md">{g.emoji}</span>
                    <p className="font-detective text-[#f5e6d3] font-bold text-sm uppercase tracking-wider">{g.label}</p>
                    <p className="text-[#a39171] font-mono text-[9px] uppercase tracking-widest mt-1">{g.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('info')} className="btn-secondary flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest py-3 px-4"><ChevronLeft size={14} />Retreat</button>
                <button type="button" onClick={handleRegister} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-bold uppercase tracking-widest py-3">
                  {loading ? <><Loader2 size={15} className="animate-spin" />ENCRYPTING...</> : <><GraduationCap size={15} />FINALIZE CLEARANCE</>}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-5 border-t border-[#3b2b1d] text-center">
            <p className="text-[#a39171] font-mono text-[10px] uppercase tracking-widest">Active Operative?{' '}
              <Link href="/auth/login" className="text-amber-glow hover:underline font-bold ml-1">Access Terminal</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
