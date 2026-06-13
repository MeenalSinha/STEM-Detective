'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useAnimate } from 'framer-motion'
import { HypothesisResult } from '@/types'
import { Zap, Star, Trophy, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SolveSequenceProps {
  result: HypothesisResult
  caseId: string
  caseTitle: string
  onComplete: () => void
}

/** Cinematic solve sequence — the wow moment judges will remember */
export function CinematicSolveSequence({ result, caseId, caseTitle, onComplete }: SolveSequenceProps) {
  const [phase, setPhase] = useState<'strings' | 'score' | 'xp' | 'conclusion' | 'done'>('strings')
  const [typewriterText, setTypewriterText] = useState('')
  const fullText = result.solution_explanation || 'Mystery solved through careful scientific investigation.'

  // Phase progression
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('score'), 1800),
      setTimeout(() => setPhase('xp'), 3000),
      setTimeout(() => setPhase('conclusion'), 4200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  // Typewriter effect for conclusion
  useEffect(() => {
    if (phase !== 'conclusion') return
    let i = 0
    const interval = setInterval(() => {
      setTypewriterText(fullText.slice(0, i))
      i++
      if (i > fullText.length) {
        clearInterval(interval)
        setTimeout(() => setPhase('done'), 1200)
      }
    }, 22)
    return () => clearInterval(interval)
  }, [phase, fullText])

  const score = Math.round(result.score * 100)
  const isCorrect = result.is_correct

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 overflow-hidden">
      {/* Ambient glow */}
      <div className={`absolute inset-0 transition-all duration-2000 ${isCorrect ? 'bg-amber-glow/5' : 'bg-crimson/5'}`} />

      {/* Particle rain on correct solve */}
      {isCorrect && phase !== 'strings' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-amber-glow"
              initial={{ x: `${Math.random() * 100}vw`, y: -10, opacity: 1 }}
              animate={{ y: '110vh', opacity: [1, 1, 0] }}
              transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 1.5, ease: 'linear' }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-xl w-full mx-4">

        {/* Phase: Evidence strings connecting */}
        <AnimatePresence>
          {phase === 'strings' && (
            <motion.div
              key="strings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <p className="section-title text-amber-glow mb-4">Connecting the evidence...</p>
              <div className="relative w-64 h-40 mx-auto">
                {[
                  { x: 20, y: 10, label: 'Clue A' },
                  { x: 70, y: 30, label: 'Lab Data' },
                  { x: 40, y: 70, label: 'Witness' },
                  { x: 80, y: 80, label: 'Evidence' },
                ].map((node, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.2 }}
                  >
                    <div className="w-3 h-3 rounded-full bg-crimson-light shadow-crimson" />
                    <span className="absolute top-4 left-0 text-[9px] text-text-muted whitespace-nowrap">{node.label}</span>
                  </motion.div>
                ))}
                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full">
                  {[[0,1],[0,2],[1,3],[2,3]].map(([a, b], i) => {
                    const positions = [
                      { x: 20, y: 10 }, { x: 70, y: 30 },
                      { x: 40, y: 70 }, { x: 80, y: 80 },
                    ]
                    return (
                      <motion.line
                        key={i}
                        x1={`${positions[a].x}%`} y1={`${positions[a].y}%`}
                        x2={`${positions[b].x}%`} y2={`${positions[b].y}%`}
                        stroke="#c42e2e"
                        strokeWidth="1"
                        opacity="0.6"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.6 + i * 0.15, duration: 0.4 }}
                      />
                    )
                  })}
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase: Score reveal */}
        <AnimatePresence>
          {(phase === 'score' || phase === 'xp' || phase === 'conclusion' || phase === 'done') && (
            <motion.div
              key="score"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-center mb-8"
            >
              <div className={`w-28 h-28 rounded-full mx-auto mb-4 flex items-center justify-center border-4 ${
                isCorrect ? 'border-amber-glow bg-amber-glow/20' : 'border-crimson bg-crimson/20'
              }`}>
                {isCorrect
                  ? <Trophy size={44} className="text-amber-glow" />
                  : <Star size={44} className="text-crimson-light" />
                }
              </div>
              <h2 className="display-text text-4xl font-black text-text-primary mb-1">
                {isCorrect ? 'Case Solved!' : 'Good Effort'}
              </h2>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="mono-text text-5xl font-bold" style={{ color: isCorrect ? '#c8860a' : '#c42e2e' }}>
                  {score}%
                </span>
                <span className="text-text-muted text-lg">accuracy</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase: XP rain */}
        <AnimatePresence>
          {(phase === 'xp' || phase === 'conclusion' || phase === 'done') && (
            <motion.div
              key="xp"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex justify-center gap-4 mb-6"
            >
              <motion.div
                className="flex items-center gap-2 bg-xp/20 border border-xp/40 rounded-lg px-5 py-2"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ type: 'spring', duration: 0.5 }}
              >
                <Zap size={18} className="text-xp" />
                <span className="text-xp font-bold text-xl mono-text">+{result.xp_earned} XP</span>
              </motion.div>
              {result.achievements_earned?.length > 0 && (
                <motion.div
                  className="flex items-center gap-2 bg-gem/20 border border-gem/40 rounded-lg px-5 py-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ type: 'spring', duration: 0.5, delay: 0.15 }}
                >
                  <Trophy size={18} className="text-gem" />
                  <span className="text-gem font-bold text-xl">{result.achievements_earned.length} Badge{result.achievements_earned.length > 1 ? 's' : ''}</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase: Conclusion typewriter */}
        <AnimatePresence>
          {(phase === 'conclusion' || phase === 'done') && (
            <motion.div
              key="conclusion"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5 mb-5"
            >
              <p className="section-title mb-2 text-amber-glow">The Science Behind It</p>
              <p className="text-text-secondary text-sm leading-relaxed">
                {typewriterText}
                <span className="animate-pulse">|</span>
              </p>
              {result.concepts_learned?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {result.concepts_learned.map((c, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="badge bg-amber-glow/20 text-amber-light border border-amber-glow/30 text-xs"
                    >
                      {c}
                    </motion.span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase: Action buttons */}
        <AnimatePresence>
          {phase === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <button
                onClick={onComplete}
                className="btn-secondary flex-1 py-3"
              >
                Take the Quiz
              </button>
              <Link
                href="/cases"
                className="btn-primary flex-1 py-3 text-center flex items-center justify-center gap-2"
              >
                New Mystery <ArrowRight size={15} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}


interface WorldDecayTimerProps {
  severity: 'low' | 'medium' | 'high' | 'critical'
  urgencyMessage?: string
  environmentStatus?: string
  onDecayTick?: () => void
}

/** Live world decay timer — creates urgency and teaches cause-and-effect */
export function WorldDecayTimer({ severity, urgencyMessage, environmentStatus, onDecayTick }: WorldDecayTimerProps) {
  const [seconds, setSeconds] = useState(() => {
    const durations = { low: 1800, medium: 900, high: 480, critical: 240 }
    return durations[severity] || 900
  })

  useEffect(() => {
    if (severity === 'low') return
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 0) {
          onDecayTick?.()
          return s
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [severity, onDecayTick])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const pct = seconds / (severity === 'low' ? 1800 : severity === 'medium' ? 900 : severity === 'high' ? 480 : 240)

  const colors = {
    low: { text: 'text-amber-dim', bar: '#8a5c06', border: 'border-amber-dim/30' },
    medium: { text: 'text-amber-glow', bar: '#c8860a', border: 'border-amber-glow/40' },
    high: { text: 'text-orange-400', bar: '#f97316', border: 'border-orange-400/40' },
    critical: { text: 'text-crimson-glow', bar: '#ff4444', border: 'border-crimson-glow/50' },
  }[severity]

  if (severity === 'low') return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 bg-bg-secondary border ${colors.border} rounded-lg px-3 py-2`}
    >
      {/* Pulsing severity dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${severity === 'critical' ? 'animate-ping' : 'animate-pulse'}`}
           style={{ background: colors.bar }} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium ${colors.text}`}>
            {urgencyMessage || environmentStatus || `Situation worsening`}
          </span>
          {severity !== 'low' && (
            <span className={`mono-text text-xs font-bold ${colors.text} ml-2 flex-shrink-0`}>
              {mins}:{String(secs).padStart(2, '0')}
            </span>
          )}
        </div>
        <div className="h-1 bg-bg-overlay rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: colors.bar }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
