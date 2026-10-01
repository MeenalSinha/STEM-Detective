'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { motion, useAnimationControls } from 'framer-motion'
import Link from 'next/link'

/* ────────────────────────────────────────────────────────────────
   Floating particle canvas (CSS-only, no Three.js dep needed)
──────────────────────────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const W = (canvas.width = window.innerWidth)
    const H = (canvas.height = window.innerHeight)

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.5 + 0.1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,134,10,${p.opacity})`
        ctx.fill()
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
}

/* ────────────────────────────────────────────────────────────────
   Glitch / typewriter text
──────────────────────────────────────────────────────────────── */
function GlitchText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`relative ${className}`}>
      {text}
      <span className="absolute inset-0 text-amber-glow/20 translate-x-0.5 translate-y-0.5 select-none pointer-events-none" aria-hidden>{text}</span>
    </span>
  )
}

/* ────────────────────────────────────────────────────────────────
   Mystery preview cards
──────────────────────────────────────────────────────────────── */
const PREVIEW_MYSTERIES = [
  { title: 'The Dying River', subject: 'Environmental', desc: 'Fish are dying upstream. What toxic agent invaded the ecosystem?', color: '#22a066', icon: '🐟', level: 'Medium' },
  { title: 'Satellite Zero', subject: 'Physics', desc: 'A research satellite plummeted from orbit. Was it sabotage or science?', color: '#3b82f6', icon: '🛰️', level: 'Hard' },
  { title: 'The Silent Greenhouse', subject: 'Biology', desc: "A city's plants stopped growing overnight. Uncover the cause.", color: '#10b981', icon: '🌿', level: 'Medium' },
  { title: 'Acid Rain Mystery', subject: 'Chemistry', desc: 'Corrosion patterns point to industrial sabotage. Find the compound.', color: '#a855f7', icon: '🧪', level: 'Expert' },
  { title: 'Bridge Collapse Code', subject: 'Engineering', desc: 'Metal fatigue or design flaw? Reconstruct the failure sequence.', color: '#ef4444', icon: '🌉', level: 'Hard' },
  { title: 'Outbreak Origin', subject: 'Biology', desc: 'A pathogen spreads through a school. Trace patient zero.', color: '#10b981', icon: '🦠', level: 'Easy' },
]

const FEATURES = [
  { icon: '🤖', title: 'AI Dungeon Master', desc: 'Your mystery evolves in real-time. The AI adapts the story to every action you take.', color: '#c8860a' },
  { icon: '🔬', title: 'STEM Crime Lab', desc: 'Run pH tests, microscope analyses, force simulations, and pollution scans.', color: '#a855f7' },
  { icon: '🗺️', title: 'Dynamic World', desc: 'Ignore clues and the world gets worse. Act fast or watch the crisis escalate.', color: '#22a066' },
  { icon: '📊', title: 'Knowledge Graph', desc: 'Your mastery map grows with every concept you learn and case you solve.', color: '#3b82f6' },
  { icon: '🏆', title: 'XP & Achievements', desc: 'Earn detective badges, climb leaderboards, unlock ranks and cosmetics.', color: '#f59e0b' },
  { icon: '👩‍🏫', title: 'Teacher Studio', desc: 'Generate full mystery packages for any STEM topic in seconds.', color: '#ef4444' },
]

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated, router])

  return (
    <main className="min-h-screen bg-bg-primary overflow-x-hidden">
      {/* ── Particle background ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <ParticleCanvas />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-primary/20 to-bg-primary" />
        {/* Big radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] rounded-full bg-amber-glow/6 blur-3xl" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(#c8860a 1px, transparent 1px), linear-gradient(90deg, #c8860a 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5 border-b border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-glow/20 border border-amber-glow/40 flex items-center justify-center shadow-amber animate-pulse-amber overflow-hidden">
            <img src="/raccoon-detective.webp" alt="STEM Detective" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="detective-text text-text-primary font-bold text-lg leading-none">STEM DETECTIVE</p>
            <p className="text-text-muted text-[10px] tracking-widest uppercase">Multiverse of Mysteries</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-text-muted">
          <a href="#features" className="hover:text-amber-light transition-colors">Features</a>
          <a href="#mysteries" className="hover:text-amber-light transition-colors">Mysteries</a>
          <a href="#how-it-works" className="hover:text-amber-light transition-colors">How It Works</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-secondary text-sm">Sign In</Link>
          <Link href="/auth/register" className="btn-primary text-sm">Start Investigating</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative z-10 text-center px-4 pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-glow/30 bg-amber-glow/10 mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-glow animate-pulse" />
            <span className="text-amber-light text-xs font-semibold tracking-wider uppercase">AI-Powered STEM Education Platform</span>
          </div>

          {/* Headline */}
          <h1 className="display-text text-5xl sm:text-6xl md:text-7xl font-black text-text-primary leading-[1.05] mb-6 max-w-4xl mx-auto">
            Every Mystery
            <br />
            <GlitchText text="Teaches Science." className="text-amber-glow text-glow-amber" />
          </h1>

          <p className="text-text-secondary text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Become a detective. Solve <strong className="text-text-primary">AI-generated mysteries</strong>. Master STEM concepts through immersive real-world investigations in biology, chemistry, physics, and more.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/auth/register" className="btn-primary text-base px-10 py-3.5 shadow-amber-strong">
              🕵️ Start Your First Case — Free
            </Link>
            <Link href="/auth/login" className="btn-secondary text-base px-8 py-3.5">
              Already a Detective? Sign In
            </Link>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 text-text-muted text-sm"
          >
            {[
              { label: 'Mysteries Generated', value: '∞' },
              { label: 'STEM Concepts', value: '500+' },
              { label: 'Lab Simulations', value: '4' },
              { label: 'Grade Levels', value: 'K–College' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-amber-light text-2xl font-black display-text">{s.value}</p>
                <p className="text-text-muted text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Mystery Cards Carousel ───────────────────────────────── */}
      <section id="mysteries" className="relative z-10 py-20 overflow-hidden">
        <div className="text-center mb-12 px-4">
          <p className="section-title mb-3 text-amber-glow">The Multiverse of Mysteries</p>
          <h2 className="display-text text-3xl font-bold text-text-primary">AI Creates Infinite Cases</h2>
          <p className="text-text-secondary text-base mt-3 max-w-xl mx-auto">Enter any STEM topic. The AI generates a complete, original detective story — every single time.</p>
        </div>

        {/* Scrolling marquee */}
        <div className="relative overflow-hidden">
          <motion.div
            className="flex gap-5 py-2"
            animate={{ x: [0, -2400] }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            style={{ width: 'max-content' }}
          >
            {[...PREVIEW_MYSTERIES, ...PREVIEW_MYSTERIES, ...PREVIEW_MYSTERIES].map((m, i) => (
              <div
                key={i}
                className="card p-5 flex-shrink-0 w-72 hover:border-amber-dim transition-all hover:-translate-y-1 cursor-default"
                style={{ borderTopColor: m.color, borderTopWidth: 2 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{m.icon}</span>
                  <span className="badge text-xs" style={{ background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}44` }}>{m.subject}</span>
                </div>
                <h3 className="display-text text-text-primary font-bold text-base mb-2">{m.title}</h3>
                <p className="text-text-muted text-xs leading-relaxed">{m.desc}</p>
                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                  <span className="text-text-dim text-xs">Difficulty: {m.level}</span>
                  <span className="text-amber-light text-xs">AI Generated →</span>
                </div>
              </div>
            ))}
          </motion.div>
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg-primary to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg-primary to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="section-title mb-3 text-amber-glow">The Investigation Flow</p>
          <h2 className="display-text text-3xl font-bold text-text-primary">From Mystery to Mastery</h2>
        </div>

        <div className="grid md:grid-cols-5 gap-6 items-start">
          {[
            { n: '1', icon: '🎯', title: 'Choose Topic', desc: 'Pick any STEM subject or enter a topic. AI generates a unique mystery instantly.' },
            { n: '2', icon: '🔍', title: 'Investigate', desc: 'Interview witnesses, examine evidence, and uncover clues guided by the AI dungeon master.' },
            { n: '3', icon: '⚗️', title: 'Run Experiments', desc: 'Enter the STEM Crime Lab. Run pH tests, force simulations, DNA analysis, and more.' },
            { n: '4', icon: '🧠', title: 'Form Hypothesis', desc: 'Apply your STEM knowledge to form a scientific hypothesis about the mystery\'s cause.' },
            { n: '5', icon: '🏆', title: 'Solve & Earn', desc: 'Crack the case, earn XP, unlock badges, and watch your knowledge graph grow.' },
          ].map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="relative inline-block mb-4">
                <div className="w-16 h-16 rounded-xl bg-bg-secondary border border-amber-glow/30 flex items-center justify-center text-2xl shadow-amber mx-auto">
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-glow text-bg-primary text-xs font-black flex items-center justify-center">{step.n}</span>
              </div>
              <h3 className="text-text-primary font-semibold text-sm mb-1">{step.title}</h3>
              <p className="text-text-muted text-xs leading-relaxed">{step.desc}</p>
              {i < 4 && <div className="hidden md:block absolute top-8 left-full w-6 border-t border-dashed border-amber-glow/30" />}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="section-title mb-3 text-amber-glow">Platform Features</p>
          <h2 className="display-text text-3xl font-bold text-text-primary">Everything You Need to Learn STEM</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="card p-6 hover:border-amber-dim transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: `${f.color}20`, border: `1px solid ${f.color}40` }}>
                  {f.icon}
                </div>
                <h3 className="text-text-primary font-semibold group-hover:text-amber-light transition-colors">{f.title}</h3>
              </div>
              <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="card p-12 bg-amber-glow/5 border-amber-glow/20 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-amber-glow pointer-events-none opacity-[0.03] blur-2xl" />
            <div className="relative z-10">
              <span className="text-5xl block mb-4">🕵️</span>
              <h2 className="display-text text-4xl font-black text-text-primary mb-3">Ready to Investigate?</h2>
              <p className="text-text-secondary text-lg mb-8">Join thousands of students who are mastering STEM through AI-powered detective mysteries.</p>
              <Link href="/auth/register" className="btn-primary text-lg px-12 py-4 inline-block shadow-amber-strong">
                Begin Your First Investigation
              </Link>
              <p className="text-text-muted text-sm mt-4">Free forever · No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="detective-text text-amber-glow font-bold">STEM Detective</span>
          <span className="text-text-dim text-sm">· Multiverse of Mysteries</span>
        </div>
        <p className="text-text-dim text-xs">AI-powered STEM education platform. Built for the future of learning.</p>
        <div className="flex items-center gap-4 text-text-muted text-sm">
          <Link href="/auth/login" className="hover:text-amber-light transition-colors">Sign In</Link>
          <Link href="/auth/register" className="hover:text-amber-light transition-colors">Register</Link>
        </div>
      </footer>
    </main>
  )
}
