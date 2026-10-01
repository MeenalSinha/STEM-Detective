'use client'
import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { Search, MessageCircle, FlaskConical, Network, Gavel, Lightbulb } from 'lucide-react'
import { flagshipApi } from '@/lib/api'
import { toGameError, type GameError } from '@/lib/game/errors'
import { useGame } from '@/lib/game/ctx'
import { useFx } from './Fx'
import { Button, Sheet, Chip } from './ui'
import { TopBar } from './bits'
import type { CaseView } from '@/lib/game/types'
import { useQueryClient } from '@tanstack/react-query'

interface Hint { stage: string; level: number; text: string; detective_insight: { text: string } | null; used: number; limit: number | null }

/** Header + hint button. Hints are limited on the free tier; the paywall appears when the limit is hit. */
export function CaseHeader({ id, title, data }: { id: string; title: string; data?: CaseView }) {
  const { openPaywall, isPro } = useGame()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [hint, setHint] = useState<Hint | null>(null)
  const [err, setErr] = useState<GameError | null>(null)
  const [busy, setBusy] = useState(false)

  const ask = async () => {
    setBusy(true); setErr(null)
    try {
      const r = await flagshipApi.hint(id)
      setHint(r.data); setOpen(true)
      qc.invalidateQueries({ queryKey: ['case', id] })
    } catch (e) {
      const g = toGameError(e)
      if (g.kind === 'pro') openPaywall(g.feature)
      else { setErr(g); setOpen(true) }
    } finally { setBusy(false) }
  }
  const left = data?.hints.remaining
  return (
    <>
      <TopBar title={title} back="/play/home/" right={
        <button onClick={ask} disabled={busy} aria-label={left == null ? 'Get a hint' : `Get a hint, ${left} remaining`}
          className="h-11 px-3 mr-1 rounded-full bg-gold-soft text-gold font-bold text-[13px] flex items-center gap-1.5 disabled:opacity-60">
          <Lightbulb size={16} aria-hidden />Hint{left != null && <span className="bg-gold text-white rounded-full min-w-5 h-5 px-1 text-[11px] flex items-center justify-center">{left}</span>}
        </button>} />
      <Sheet open={open} onClose={() => setOpen(false)} title="Detective's note">
        {err ? <p role="alert" className="text-rose">{err.message}</p> : hint && (
          <div>
            <Chip tone="gold">Hint {hint.used}{hint.limit ? ` of ${hint.limit}` : ''} · level {hint.level}</Chip>
            <p className="text-[17px] leading-relaxed mt-3">{hint.text}</p>
            {hint.detective_insight && <p className="mt-4 rounded-xl bg-lab-soft p-3 text-[15px]"><span className="font-bold text-lab">Pro insight. </span>{hint.detective_insight.text}</p>}
            {!isPro && <p className="text-[13px] text-mute mt-4">Free detectives get {hint.limit} hints per case. Detective Pro adds unlimited hints.</p>}
            <Button full variant="secondary" className="mt-4" onClick={() => setOpen(false)}>Back to the case</Button>
          </div>
        )}
      </Sheet>
    </>
  )
}

const NAV = [
  { key: 'scene', label: 'Scene', icon: Search, href: (id: string) => `/play/case/scene/?id=${id}` },
  { key: 'witness', label: 'Witnesses', icon: MessageCircle, href: (id: string) => `/play/case/witness/?id=${id}` },
  { key: 'lab', label: 'Lab', icon: FlaskConical, href: (id: string) => `/play/lab/?id=${id}` },
  { key: 'board', label: 'Board', icon: Network, href: (id: string) => `/play/case/board/?id=${id}` },
  { key: 'solve', label: 'Solve', icon: Gavel, href: (id: string) => `/play/case/hypothesis/?id=${id}` },
]
export function CaseNav({ id, active }: { id: string; active: string }) {
  return (
    <nav aria-label="Investigation" className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md bg-ink text-paper safe-bottom">
      <ul className="grid grid-cols-5">
        {NAV.map((n) => (
          <li key={n.key}>
            <Link href={n.href(id)} aria-current={active === n.key ? 'page' : undefined}
              className={clsx('flex flex-col items-center justify-center h-[64px] gap-0.5 text-[11px] font-semibold', active === n.key ? 'text-[#6fd0d8]' : 'text-[#9fb0bc]')}>
              <n.icon size={21} aria-hidden />{n.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function CaseShell({ id, active, title, data, children }: { id: string; active: string; title: string; data?: CaseView; children: ReactNode }) {
  return (
    <div className="pb-[calc(76px+env(safe-area-inset-bottom))]">
      <CaseHeader id={id} title={title} data={data} />
      {children}
      <CaseNav id={id} active={active} />
    </div>
  )
}
export { useRouter }
