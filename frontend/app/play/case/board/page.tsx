'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Database, FileText, FlaskConical, MessageCircle, Link2, Lock, LineChart } from 'lucide-react'
import clsx from 'clsx'
import { flagshipApi } from '@/lib/api'
import { toGameError, type GameError } from '@/lib/game/errors'
import { useCase } from '@/lib/game/hooks'
import { useGame } from '@/lib/game/ctx'
import { CaseShell } from '@/components/game/CaseChrome'
import { useFx } from '@/components/game/Fx'
import { Button, Card, Chip, ErrorState, ProgressBar, ScreenSkeleton, SectionTitle } from '@/components/game/ui'
import { suspended } from '@/components/game/Suspended'
import PhChart from '@/components/game/PhChart'
import type { Evidence } from '@/lib/game/types'

const ICON = { photo: Camera, data: Database, document: FileText, lab: FlaskConical, witness: MessageCircle }
interface Analysis { days: number[]; bench_a: number[]; bench_b: number[]; switch_day: number; symptom_day: number; threshold: number; findings: string[]; caveat: string; lead_days: number | null }

function Board() {
  const id = useSearchParams().get('id')
  const qc = useQueryClient()
  const { celebrate } = useFx()
  const { openPaywall, isPro } = useGame()
  const { data, isLoading, error, refetch } = useCase(id)
  const [sel, setSel] = useState<string | null>(null)
  const [note, setNote] = useState<{ ok: boolean; title?: string; text: string } | null>(null)
  const [shake, setShake] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [aErr, setAErr] = useState<GameError | null>(null)
  const [aBusy, setABusy] = useState(false)

  if (!id) return <ErrorState error={{ kind: 'notfound', message: 'No case selected.', retryable: false }} />
  if (isLoading) return <ScreenSkeleton />
  if (error || !data) return <ErrorState error={error!} onRetry={() => refetch()} />

  const tap = async (e: Evidence) => {
    if (busy) return
    if (!sel) { setSel(e.key); setNote(null); return }
    if (sel === e.key) { setSel(null); return }
    const a = sel; setSel(null); setBusy(true)
    try {
      const r = (await flagshipApi.link(id, a, e.key)).data
      if (r.valid) {
        setNote({ ok: true, title: r.inference.title, text: r.inference.insight })
        if (r.new) { celebrate({ xp: r.xp }); qc.invalidateQueries({ queryKey: ['case', id] }) }
      } else { setNote({ ok: false, text: r.message }); setShake(e.key); setTimeout(() => setShake(null), 500) }
    } catch (er) { setNote({ ok: false, text: toGameError(er).message }) } finally { setBusy(false) }
  }

  const runAnalysis = async () => {
    setABusy(true); setAErr(null)
    try {
      const r = (await flagshipApi.advanced(id)).data
      setAnalysis(r); celebrate({ evidence: r.new_evidence, xp: r.xp }); qc.invalidateQueries({ queryKey: ['case', id] })
    } catch (er) {
      const g = toGameError(er)
      if (g.kind === 'pro') openPaywall(g.feature ?? 'advanced_evidence_analysis'); else setAErr(g)
    } finally { setABusy(false) }
  }
  const selected = data.evidence.find((e) => e.key === sel)

  return (
    <CaseShell id={id} active="board" title="Evidence board" data={data}>
      <div className="px-4">
        <div className="flex items-center justify-between mt-1"><p className="text-[13px] font-semibold text-ink-2">Deductions {data.inferences.length} of {data.inference_total}</p></div>
        <div className="mt-1.5"><ProgressBar value={data.inferences.length} max={data.inference_total} label="Deductions made" /></div>
        <p className="text-[13px] text-mute mt-2">{selected ? <>Selected: <b>{selected.title}</b>. Now tap a second clue it connects to.</> : 'Tap one clue, then another it helps explain, to connect them.'}</p>

        <AnimatePresence>
          {note && (
            <motion.div key={note.text} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status"
              className={clsx('mt-3 rounded-2xl p-4 border', note.ok ? 'bg-ok-soft border-[#b9dcb9]' : 'bg-paper-2 border-line')}>
              {note.ok ? <p className="text-[12px] font-bold uppercase tracking-wider text-ok flex items-center gap-1.5"><Link2 size={14} aria-hidden />Connection confirmed</p> : <p className="text-[12px] font-bold uppercase tracking-wider text-mute">Not yet</p>}
              {note.title && <p className="display font-bold text-lg mt-1">{note.title}</p>}
              <p className="text-[14.5px] mt-1 text-ink-2">{note.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {data.evidence.length === 0 ? (
          <Card className="mt-4 text-center"><p className="font-bold">Your board is empty</p><p className="text-mute text-sm mt-1">Inspect the scene and question witnesses to pin up evidence.</p></Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {data.evidence.map((e, i) => {
              const Ic = ICON[e.kind] ?? FileText
              const on = sel === e.key
              return (
                <motion.button key={e.key} onClick={() => tap(e)} aria-pressed={on} aria-label={`${e.title}. ${e.kind} evidence.`}
                  animate={shake === e.key ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                  initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                  style={{ rotate: `${((i % 3) - 1) * 0.8}deg` }}
                  className={clsx('relative text-left rounded-xl bg-white border-2 p-3 min-h-[116px] shadow-sm', on ? 'border-lab ring-4 ring-lab/20' : 'border-line')}>
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-rose shadow" aria-hidden />
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-mute"><Ic size={13} aria-hidden />{e.kind}</span>
                  <span className="block font-semibold text-[14px] leading-snug mt-1.5">{e.title}</span>
                  {e.significance === 'ruled_out' && <span className="mt-2 inline-block"><Chip>Rules out</Chip></span>}
                  {on && <span className="mt-2 inline-block"><Chip tone="lab">Selected</Chip></span>}
                </motion.button>
              )
            })}
          </div>
        )}

        {data.inferences.length > 0 && (<>
          <SectionTitle>Your deductions</SectionTitle>
          <div className="space-y-2">{data.inferences.map((i) => <Card key={i.id}><p className="font-semibold text-[15px]">{i.title}</p><p className="text-[13.5px] text-mute mt-1">{i.insight}</p></Card>)}</div>
        </>)}

        <SectionTitle>Advanced evidence analysis</SectionTitle>
        {!analysis ? (
          <Card tone={data.advanced.available ? 'gold' : 'default'}>
            <div className="flex gap-3"><div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-gold shrink-0">{isPro ? <LineChart aria-hidden /> : <Lock aria-hidden />}</div>
              <div><p className="font-bold">Timeline and correlation analysis</p>
                <p className="text-[13.5px] text-ink-2 mt-0.5">Cross-check the greenhouse logger against symptom onset to test whether the cause came first.</p>
                {!data.advanced.available && <p className="text-[12.5px] text-mute mt-1">Collect at least 4 pieces of evidence to unlock.</p>}</div></div>
            <Button full variant={isPro ? 'primary' : 'dark'} className="mt-3" loading={aBusy} disabled={!data.advanced.available} onClick={runAnalysis}>{isPro ? 'Run analysis' : 'Unlock with Detective Pro'}</Button>
            {aErr && <p role="alert" className="text-rose text-sm mt-2">{aErr.message}</p>}
          </Card>
        ) : (
          <Card>
            <PhChart days={analysis.days} a={analysis.bench_a} b={analysis.bench_b} switchDay={analysis.switch_day} symptomDay={analysis.symptom_day} threshold={analysis.threshold} />
            <ul className="mt-3 space-y-2">{analysis.findings.map((f) => <li key={f} className="text-[14.5px] flex gap-2"><span className="text-lab font-bold">›</span>{f}</li>)}</ul>
            <p className="text-[12.5px] text-mute mt-3 italic">{analysis.caveat}</p>
          </Card>
        )}
      </div>
    </CaseShell>
  )
}
export default suspended(Board)
