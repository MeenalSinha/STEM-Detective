'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.login(form.email, form.password)
      const { access_token, user } = res.data
      setAuth(user, access_token)
      toast.success(`Welcome back, Detective ${user.username}!`)
      router.push('/dashboard')
    } catch (err: unknown) {
      const detail = (err as any)?.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail[0]?.msg : (typeof detail === 'string' ? detail : 'Invalid credentials');
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-amber-glow/5 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-subject-chemistry/5 blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#c8860a 1px, transparent 1px), linear-gradient(90deg, #c8860a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-black border-2 border-amber-glow flex items-center justify-center shadow-[0_0_15px_rgba(200,134,10,0.5)] overflow-hidden">
              <img src="/raccoon-detective.webp" alt="STEM Detective" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-detective text-[#f5e6d3] font-bold text-2xl leading-none uppercase tracking-widest">STEM DETECTIVE</p>
              <p className="text-[#a39171] font-mono text-[10px] tracking-widest uppercase mt-1">Multiverse of Mysteries</p>
            </div>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="evidence-card p-8 bg-[#1a120c] border-[#4a3520] shadow-[0_8px_30px_rgba(0,0,0,0.8)]"
        >
          <div className="mb-6 border-b border-[#3b2b1d] pb-4 text-center">
            <h1 className="font-detective text-3xl font-bold text-[#f5e6d3] uppercase tracking-widest">Access Terminal</h1>
            <p className="text-[#a39171] font-mono text-[10px] mt-2 uppercase tracking-widest">Provide Clearance Credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#d4b58e] font-mono text-[10px] font-bold uppercase tracking-widest mb-1.5" htmlFor="email">
                Operative ID (Email)
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-glow" />
                <input
                  id="email"
                  type="email"
                  className="input pl-9 font-detective text-sm uppercase bg-black border-[#4a3520]"
                  placeholder="detective@example.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#d4b58e] font-mono text-[10px] font-bold uppercase tracking-widest mb-1.5" htmlFor="password">
                Passcode
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-glow" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="input pl-9 pr-10 font-detective text-sm uppercase bg-black border-[#4a3520]"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a39171] hover:text-amber-glow transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 mt-4 font-bold tracking-widest text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  DECRYPTING...
                </>
              ) : (
                'AUTHORIZE ACCESS'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#3b2b1d] text-center">
            <p className="text-[#a39171] font-mono text-[10px] uppercase tracking-widest">
              Unregistered Operative?{' '}
              <Link href="/auth/register" className="text-amber-glow hover:underline font-bold ml-1">
                Request Clearance
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 p-3 bg-black rounded border border-[#3b2b1d] shadow-inner">
            <p className="text-[#7a5c3a] font-mono text-[9px] uppercase tracking-widest text-center mb-2 font-bold">Training Simulations</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setForm({ email: 'demo@stem.detective', password: 'demo1234' })}
                className="text-[#a39171] font-mono text-[10px] hover:text-amber-glow uppercase tracking-widest transition-colors font-bold"
              >
                Cadet Demo
              </button>
              <span className="text-[#4a3520] text-xs">|</span>
              <button
                onClick={() => setForm({ email: 'teacher@stem.detective', password: 'demo1234' })}
                className="text-[#a39171] font-mono text-[10px] hover:text-amber-glow uppercase tracking-widest transition-colors font-bold"
              >
                Director Demo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
