'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Circle, FolderOpen } from 'lucide-react'
import { useCase } from '@/lib/game/hooks'
import { Button, ErrorState, ScreenSkeleton } from '@/components/game/ui'
import { suspended } from '@/components/game/Suspended'

/** Case opening: the folder opens, the title is stamped, the briefing is revealed line by line. */
function Brief() {
  const id = useSearchParams().get('id')
  const router = useRouter()
  const reduce = useReducedMotion()
  const { data, isLoading, error, refetch } = useCase(id)
  if (!id) return <ErrorState error={{ kind: 'notfound', message: 'No case selected.', retryable: false }} />
  if (isLoading) return <ScreenSkeleton />
  if (error || !data) return <ErrorState error={error!} onRetry={() => refetch()} />
  const paras = data.briefing.split('\n\n')

  return (
    <div className="min-h-dvh bg-[#141B22] text-[#F5F1E8] px-6 pt-[calc(env(safe-area-inset-top)+28px)] pb-8 flex flex-col">
      <motion.div initial={reduce ? false : { rotateX: -70, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ duration: 0.7 }} style={{ transformOrigin: 'top' }}
        className="flex items-center gap-2 text-[#f2b84b] text-xs font-bold tracking-[0.2em] uppercase"><FolderOpen size={16} aria-hidden />Classified case file</motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[#9fb0bc] text-sm mt-6">{data.subtitle}</motion.p>
      <motion.h1 initial={reduce ? false : { scale: 1.15, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }} style={{ fontFamily: 'var(--font-playfair)' }} className="text-[40px] leading-[1.05] font-bold mt-1">{data.title}</motion.h1>
      <div className="h-px bg-[#2b3641] my-6" />
      <div className="space-y-4">
        {paras.map((p, i) => (
          <motion.p key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 + i * 0.8 }} className="text-[17px] leading-relaxed text-[#d8e0e6]">{p}</motion.p>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 + paras.length * 0.8 }} className="mt-7">
        <p className="text-[12px] font-bold tracking-[0.18em] uppercase text-[#6fd0d8] mb-3">Objectives</p>
        <ul className="space-y-2">{data.objectives.map((o) => <li key={o} className="flex gap-2.5 text-[15px] text-[#d8e0e6]"><Circle size={16} className="mt-1 shrink-0 text-[#6fd0d8]" aria-hidden />{o}</li>)}</ul>
      </motion.div>
      <div className="flex-1" />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 + paras.length * 0.8 }} className="mt-8 safe-bottom">
        <Button full onClick={() => router.replace(`/play/case/scene/?id=${id}`)}>Begin investigation</Button>
      </motion.div>
    </div>
  )
}
export default suspended(Brief)
