'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth'
import { useAuthReady } from '@/lib/game/hooks'

/** Splash. Waits for persisted auth, shows the brand for a beat, then routes. */
export default function Splash() {
  const router = useRouter()
  const ready = useAuthReady()
  const authed = useAuthStore((s) => s.isAuthenticated && !!s.token)

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => router.replace(authed ? '/play/home/' : '/play/welcome/'), 1100)
    return () => clearTimeout(t)
  }, [ready, authed, router])

  return (
    <main className="min-h-dvh bg-[#141B22] text-[#F5F1E8] flex flex-col items-center justify-center gap-6 p-8">
      <motion.div initial={{ scale: 0.8, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}
        className="w-24 h-24 rounded-3xl bg-[#0E7C86] flex items-center justify-center shadow-2xl">
        <Search size={46} strokeWidth={2.2} aria-hidden />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="text-center">
        <h1 style={{ fontFamily: 'var(--font-playfair)' }} className="text-4xl font-bold tracking-tight">STEM Detective</h1>
        <p className="text-[#9fb0bc] mt-2">Use science to solve mysteries.</p>
      </motion.div>
      <div role="status" aria-label="Loading" className="h-1 w-28 rounded-full bg-[#2b3641] overflow-hidden"><motion.div className="h-full bg-[#6fd0d8]" initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }} /></div>
    </main>
  )
}
