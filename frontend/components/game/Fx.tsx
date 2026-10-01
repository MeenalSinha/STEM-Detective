'use client'
/** Celebration layer: evidence discovered, XP earned, level-up. Subtle, purposeful, reduced-motion aware. */
import { createContext, useCallback, useContext, useState, ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Search, Zap, Award } from 'lucide-react'
import type { Evidence, XpSummary } from '@/lib/game/types'
import { Button } from './ui'

export interface FxPayload { evidence?: Evidence[]; xp?: XpSummary | null }
interface Item { id: number; kind: 'evidence' | 'xp'; title: string; sub?: string }
const Ctx = createContext<{ celebrate: (p: FxPayload) => void }>({ celebrate: () => {} })
export const useFx = () => useContext(Ctx)

async function tap(style: 'light' | 'success') {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics')
    if (style === 'success') await Haptics.notification({ type: NotificationType.Success })
    else await Haptics.impact({ style: ImpactStyle.Light })
  } catch { /* haptics are optional */ }
}

export function FxProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const [level, setLevel] = useState<{ level: number; rank: string } | null>(null)
  const reduce = useReducedMotion()

  const celebrate = useCallback(({ evidence, xp }: FxPayload) => {
    const add: Item[] = []
    evidence?.forEach((e, i) => add.push({ id: Date.now() + i, kind: 'evidence', title: 'Evidence discovered', sub: e.title }))
    if (xp && xp.gained > 0) add.push({ id: Date.now() + 99, kind: 'xp', title: `+${xp.gained} XP` })
    if (!add.length) return
    tap(evidence?.length ? 'success' : 'light')
    setItems((s) => [...s.filter((x) => !(x.kind === 'xp' && add.some((a) => a.kind === 'xp'))), ...add])
    add.forEach((a) => setTimeout(() => setItems((s) => s.filter((x) => x.id !== a.id)), 3200))
    if (xp?.leveled_up) setTimeout(() => setLevel({ level: xp.level, rank: xp.rank }), 900)
  }, [])

  return (
    <Ctx.Provider value={{ celebrate }}>
      {children}
      <div className="fixed left-0 right-0 z-[60] top-0 pointer-events-none flex flex-col items-center gap-2 px-4 safe-top" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 64px)' }} aria-live="polite" role="status">
        <AnimatePresence>
          {items.map((it) => (
            <motion.div key={it.id} initial={reduce ? { opacity: 0 } : { y: -24, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className={it.kind === 'evidence'
                ? 'w-full max-w-sm bg-ink text-paper rounded-2xl px-4 py-3 shadow-xl border border-ink-2 flex items-center gap-3'
                : 'bg-gold text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 font-bold'}>
              {it.kind === 'evidence'
                ? <><span className="w-9 h-9 rounded-full bg-[#f2b84b] text-ink flex items-center justify-center shrink-0"><Search size={18} aria-hidden /></span>
                    <span className="min-w-0"><span className="block text-[11px] uppercase tracking-wider text-[#f2b84b] font-bold">{it.title}</span><span className="block text-[14px] font-semibold truncate">{it.sub}</span></span></>
                : <><Zap size={16} aria-hidden />{it.title}</>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {level && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-ink/90 flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label="Level up">
            <motion.div initial={reduce ? false : { scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-paper rounded-3xl p-8 text-center max-w-sm w-full game-root !min-h-0">
              <div className="w-16 h-16 rounded-full bg-gold-soft text-gold mx-auto flex items-center justify-center mb-3"><Award size={32} aria-hidden /></div>
              <p className="text-mute text-sm font-semibold uppercase tracking-wider">Level up</p>
              <h2 className="text-4xl font-bold mt-1">Level {level.level}</h2>
              <p className="text-ink-2 mt-1 mb-6">{level.rank}</p>
              <Button full onClick={() => setLevel(null)}>Continue</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  )
}
