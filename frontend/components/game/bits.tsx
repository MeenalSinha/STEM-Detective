'use client'
import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Zap } from 'lucide-react'
import { ProgressBar } from './ui'
import type { PlayerProgress } from '@/lib/game/types'

export function XpCard({ p, name }: { p: PlayerProgress; name?: string }) {
  return (
    <div className="rounded-2xl bg-ink text-paper p-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#6fd0d8]">Level {p.level} detective</p>
          <p className="display text-2xl font-bold mt-0.5">{p.rank}</p>
          {name && <p className="text-[#9fb0bc] text-sm">{name}</p>}
        </div>
        <div className="flex items-center gap-1 text-[#f2b84b] font-bold"><Zap size={16} aria-hidden />{p.xp} XP</div>
      </div>
      <div className="mt-4 [&>div]:!bg-[#2b3641]"><ProgressBar value={p.xp_in_level} max={p.xp_span} label={`Level progress ${p.xp_in_level} of ${p.xp_span} XP`} /></div>
      <p className="text-[12px] text-[#9fb0bc] mt-2">{p.xp_in_level} / {p.xp_span} XP to next level</p>
    </div>
  )
}

export function TopBar({ title, back, right, dark }: { title?: string; back?: string | true; right?: ReactNode; dark?: boolean }) {
  const router = useRouter()
  return (
    <header className={`sticky top-0 z-30 safe-top ${dark ? 'bg-ink text-paper' : 'bg-paper/95 backdrop-blur'} `}>
      <div className="h-14 px-2 flex items-center gap-1">
        {back ? (
          <button aria-label="Back" onClick={() => (typeof back === 'string' ? router.push(back) : router.back())} className="w-12 h-12 flex items-center justify-center rounded-full active:bg-black/10"><ChevronLeft size={26} /></button>
        ) : <span className="w-3" />}
        <h1 className="flex-1 text-[17px] font-bold truncate">{title}</h1>
        {right}
      </div>
    </header>
  )
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 p-10">
      <div className="w-16 h-16 rounded-full bg-paper-2 text-mute flex items-center justify-center">{icon}</div>
      <p className="font-bold text-lg">{title}</p><p className="text-mute text-[14px] max-w-xs">{text}</p>{action}
    </div>
  )
}
