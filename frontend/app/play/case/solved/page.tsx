'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Award, Check } from 'lucide-react'
import { useCase } from '@/lib/game/hooks'
import { Button, ErrorState, ProgressBar, ScreenSkeleton } from '@/components/game/ui'
import { suspended } from '@/components/game/Suspended'
import type { HypothesisResult } from '@/lib/game/types'

/** Case solved sequence: stamp, deduction report, XP count-up, level bar, debrief. */
function Solved() {
  const id = useSearchParams().get('id')
  const router = useRouter(); const reduce = useReducedMotion()
  const { data, isLoading, error, refetch } = useCase(id)
  const result = useMemo<HypothesisResult | null>(() => {
    if (typeof window === 'undefined' || !id) return null
    try { return JSON.parse(sessionStorage.getItem(`sd_result_${id}`) || 'null') } catch { return null }
  }, [id])
  const [xp, setXp] = useState(0)
  const gained = result?.xp.gained ?? 0
  useEffect(() => {
    if (!gained) return
    if (reduce) { setXp(gained); return }
    let n = 0; const step = Math.max(1, Math.round(gained / 40))
    const t = setInterval(() => { n = Math.min(gained, n + step); setXp(n); if (n >= gained) clearInterval(t) }, 30)
    return () => clearInterval(t)
  }, [gained, reduce])

  if (!id) return <ErrorState error={{ kind: 'notfound', message: 'No case selected.', retryable: false }} />
  if (isLoading) return <ScreenSkeleton />
  if (error || !data) return <ErrorState error={error!} onRetry={() => refetch()} />
  // Only bounce away if the case is genuinely unsolved AND we hold no fresh result for it.
  if (!data.solved && !result) { router.replace(`/play/case/scene/?id=${id}`); return <ScreenSkeleton /> }
  const debrief = result?.debrief ?? data.debrief
  const p = result?.player ?? data.player

  return (
    <div className="min-h-dvh bg-[#141B22] text-[#F5F1E8] px-6 pt-[calc(env(safe-area-inset-top)+36px)] pb-10">
      <p className="text-[#9fb0bc] text-sm text-center">{data.subtitle}</p>
      <motion.div initial={reduce ? false : { scale: 2.2, rotate: -18, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.2 }}
        className="mx-auto mt-5 w-fit border-4 border-[#6fd0d8] text-[#6fd0d8] rounded-md px-5 py-1.5 text-3xl font-black tracking-[0.12em]">CASE CLOSED</motion.div>
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ fontFamily: 'var(--font-playfair)' }} className="text-3xl font-bold text-center mt-6">{data.title}</motion.h1>

      {debrief && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="mt-7 rounded-2xl bg-[#1d2a35] p-5">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#f2b84b]">{debrief.title}</p>
          <p className="mt-2 leading-relaxed text-[#d8e0e6] text-[15.5px]">{debrief.body}</p>
          <p className="mt-3 text-[13.5px] text-[#9fb0bc]"><b className="text-[#d8e0e6]">In the real world:</b> {debrief.real_world}</p>
          <div className="flex flex-wrap gap-2 mt-4">{debrief.concepts.map((c) => <span key={c} className="px-2.5 py-1 rounded-full bg-[#14303a] text-[#bfeef2] text-[12px] font-semibold">{c}</span>)}</div>
        </motion.section>)}

      {result && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="mt-4 rounded-2xl bg-[#1d2a35] p-5">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#6fd0d8]">Deduction report</p>
          <ul className="mt-3 space-y-2">{result.components.map((c) => <li key={c.id} className="flex gap-2.5 text-[14px] text-[#d8e0e6]"><Check size={18} className="text-[#6fd0d8] shrink-0" aria-hidden />{c.label}</li>)}</ul>
          <div className="mt-5 border-t border-[#2b3641] pt-4">
            <p className="text-[#9fb0bc] text-sm">Experience earned</p>
            <p className="text-5xl font-black text-[#f2b84b] tabular-nums" aria-live="polite">+{xp}<span className="text-xl ml-1">XP</span></p>
            {result.xp.leveled_up && <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#f2b84b] text-ink text-[12px] font-black tracking-wider px-3 py-1"><Award size={14} aria-hidden />LEVEL UP · LEVEL {result.xp.level}</p>}
            <ul className="mt-2 space-y-1 text-[13.5px] text-[#b9c6d0]">{result.xp_breakdown.map((b) => <li key={b.label} className="flex justify-between"><span>{b.label}</span><span>+{b.xp}</span></li>)}</ul>
          </div>
        </motion.section>)}

      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }} className="mt-4 rounded-2xl bg-[#1d2a35] p-5">
        <div className="flex items-center justify-between"><p className="font-bold">Level {p.level} · {p.rank}</p><span className="text-[#f2b84b] text-sm font-bold">{p.xp} XP</span></div>
        <div className="mt-3 [&>div]:!bg-[#2b3641]"><ProgressBar value={p.xp_in_level} max={p.xp_span} label="Level progress" /></div>
        <p className="text-[12px] text-[#9fb0bc] mt-2">{p.xp_in_level} / {p.xp_span} XP to next level</p>
      </motion.section>

      {result?.achievements?.length ? (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }} className="mt-4 space-y-2">
          {result.achievements.map((a) => (
            <div key={a.name} className="rounded-2xl bg-[#3a2c10] border border-[#6b4f12] p-4 flex gap-3 items-center"><Award className="text-[#f2b84b] shrink-0" aria-hidden /><div><p className="font-bold">Achievement unlocked: {a.name}</p><p className="text-[13px] text-[#d8c79a]">{a.description} (+{a.xp_reward} XP)</p></div></div>))}
        </motion.section>) : null}

      <div className="mt-8 space-y-2 safe-bottom">
        <Button full onClick={() => router.replace('/play/progress/')}>View my progress</Button>
        <Button full variant="ghost" className="!text-[#b9c6d0]" onClick={() => router.replace('/play/cases/')}>More cases</Button>
      </div>
    </div>
  )
}
export default suspended(Solved)
