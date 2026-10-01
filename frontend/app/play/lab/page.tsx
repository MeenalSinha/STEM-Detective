'use client'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, FlaskConical, Lock, AlertTriangle, Beaker } from 'lucide-react'
import clsx from 'clsx'
import { flagshipApi } from '@/lib/api'
import { toGameError, type GameError } from '@/lib/game/errors'
import { useCase, useCatalog } from '@/lib/game/hooks'
import { useGame } from '@/lib/game/ctx'
import { useFx } from '@/components/game/Fx'
import { Button, Card, Chip, ErrorState, ScreenSkeleton } from '@/components/game/ui'
import { TopBar, Empty } from '@/components/game/bits'
import { CaseNav } from '@/components/game/CaseChrome'
import { suspended } from '@/components/game/Suspended'
import type { AvailabilityResult, Nutrient } from '@/lib/game/types'

type Tab = 'probe' | 'nutrients' | 'fert' | 'lime'
interface Curve { ph_grid: number[]; series: Record<string, number[]>; names: Record<string, string>; toxic: Record<string, number>; deficient_below: number; disclaimer: string }

function interp(c: Curve, sym: string, ph: number) {
  const g = c.ph_grid, ys = c.series[sym]
  const p = Math.max(g[0], Math.min(g[g.length - 1], ph))
  for (let i = 0; i < g.length - 1; i++) if (p >= g[i] && p <= g[i + 1]) return ys[i] + ((p - g[i]) / (g[i + 1] - g[i])) * (ys[i + 1] - ys[i])
  return ys[ys.length - 1]
}
function rowsAt(c: Curve, ph: number): Nutrient[] {
  return Object.keys(c.series).map((s) => {
    const v = Math.round(interp(c, s, ph)); const tox = s in c.toxic
    return { symbol: s, name: c.names[s], value: v, is_toxin: tox, status: tox ? (v >= c.toxic[s] ? 'toxic' : 'ok') : v < c.deficient_below ? 'scarce' : 'ok' }
  })
}

function Lab() {
  const sp = useSearchParams()
  const router = useRouter()
  const cat = useCatalog()
  const id = sp.get('id') ?? cat.data?.cases[0]?.case_id ?? null
  const { data, isLoading, error, refetch } = useCase(id)
  const [tab, setTab] = useState<Tab>('probe')

  if (cat.isLoading || (id && isLoading)) return <ScreenSkeleton />
  if (!id) return (<><TopBar title="Laboratory" /><Empty icon={<FlaskConical size={28} />} title="No active case" text="The lab opens when you take a case. Start The Silent Greenhouse to get samples to test."
    action={<Button onClick={() => router.push('/play/cases/')}>Go to cases</Button>} /></>)
  if (error || !data) return <ErrorState error={error ?? { kind: 'server', message: 'Could not open the lab.', retryable: true }} onRetry={() => refetch()} />

  return (
    <div className={sp.get('id') ? 'pb-[calc(76px+env(safe-area-inset-bottom))]' : ''}>
      <TopBar title="Laboratory" back={sp.get('id') ? `/play/case/scene/?id=${id}` : undefined} />
      <div className="px-4">
        <div role="tablist" aria-label="Instruments" className="grid grid-cols-4 gap-1 bg-paper-2 p-1 rounded-2xl">
          {([['probe', 'pH probe'], ['nutrients', 'Nutrients'], ['fert', 'Fertilizer'], ['lime', 'Lime trial']] as [Tab, string][]).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={clsx('min-h-[44px] rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-1', tab === k ? 'bg-white shadow-sm text-ink' : 'text-mute')}>
              {l}{k === 'lime' && !data.is_pro && <Lock size={11} aria-hidden />}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {tab === 'probe' && <Probe id={id} data={data} />}
          {tab === 'nutrients' && <Nutrients id={id} measured={data.evidence.some((e) => e.key === 'ev_ph_b')} />}
          {tab === 'fert' && <Fert id={id} />}
          {tab === 'lime' && <Lime id={id} measured={data.evidence.some((e) => e.key === 'ev_ph_b')} />}
        </div>
      </div>
      {sp.get('id') && <CaseNav id={id} active="lab" />}
    </div>
  )
}

/* ── pH probe ───────────────────────────────────────────────────────────────── */
function PhScale({ ph }: { ph: number | null }) {
  const pct = ph == null ? 0 : ((ph - 3) / 8) * 100
  return (
    <div>
      <div className="relative h-5 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg,#d84a3a,#e8913a,#f0c93a,#7bbf4a,#2f9e8f,#3b6fb5,#5b4aa3)' }} aria-hidden>
        {ph != null && <motion.div className="absolute top-0 bottom-0 w-1.5 bg-ink" initial={{ left: '50%' }} animate={{ left: `${pct}%` }} transition={{ type: 'spring', stiffness: 90, damping: 14 }} />}
      </div>
      <div className="flex justify-between text-[11px] text-mute mt-1" aria-hidden><span>3 acidic</span><span>7 neutral</span><span>11 alkaline</span></div>
    </div>
  )
}
function Probe({ id, data }: { id: string; data: NonNullable<ReturnType<typeof useCase>['data']> }) {
  const qc = useQueryClient(); const { celebrate } = useFx()
  const [reading, setReading] = useState<{ label: string; ph: number; band: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<GameError | null>(null)
  const run = async (sid: string) => {
    setBusy(sid); setErr(null)
    try {
      const r = (await flagshipApi.probe(id, sid)).data
      await new Promise((res) => setTimeout(res, 650)) // probe settling
      setReading({ label: r.label, ph: r.ph, band: r.band })
      celebrate({ evidence: r.new_evidence, xp: r.xp }); qc.invalidateQueries({ queryKey: ['case', id] })
    } catch (e) { setErr(toGameError(e)) } finally { setBusy(null) }
  }
  return (
    <div>
      <Card tone="dark" className="text-center">
        <p className="text-[11px] tracking-[0.2em] font-bold uppercase text-[#6fd0d8]">pH meter</p>
        <p className="font-mono text-[56px] leading-none mt-2 tabular-nums" aria-live="polite">{busy ? '...' : reading ? reading.ph.toFixed(1) : '--.-'}</p>
        <p className="text-[13px] text-[#9fb0bc] mt-1 h-4">{reading && !busy ? `${reading.label}: ${reading.band}` : 'Select a sample'}</p>
        <div className="mt-4"><PhScale ph={busy ? null : reading?.ph ?? null} /></div>
        <p className="text-[11.5px] text-[#7f8d98] mt-2">Tolerance ±0.05 · target for tomato seedlings 6.0 to 6.5</p>
      </Card>
      <h3 className="text-[13px] font-bold uppercase tracking-wider text-mute mt-5 mb-2">Samples</h3>
      {data.samples.length === 0 ? <Card><p className="text-mute text-[14px]">You have not collected any samples. Inspect the benches, reservoir and supply shed at the scene.</p></Card> : (
        <div className="space-y-2.5">{data.samples.map((s) => (
          <Card key={s.id} onClick={() => run(s.id)} className={busy === s.id ? 'opacity-60' : ''}>
            <div className="flex items-center gap-3"><Beaker className="text-lab" aria-hidden /><span className="flex-1 font-semibold">{s.label}</span>{s.measured ? <Chip tone="ok"><Check size={12} aria-hidden />Measured</Chip> : <Chip tone="lab">Test</Chip>}</div>
          </Card>))}</div>)}
      {err && <ErrorState compact error={err} />}
    </div>
  )
}

/* ── nutrient availability model ────────────────────────────────────────────── */
function Nutrients({ id, measured }: { id: string; measured: boolean }) {
  const qc = useQueryClient(); const { celebrate } = useFx()
  const curve = useQuery<Curve>({ queryKey: ['curve'], queryFn: async () => (await flagshipApi.curve()).data, staleTime: Infinity })
  const [ph, setPh] = useState(6.5)
  const [res, setRes] = useState<AvailabilityResult | null>(null)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<GameError | null>(null)
  const rows = useMemo(() => (curve.data ? rowsAt(curve.data, ph) : []), [curve.data, ph])
  if (curve.isLoading) return <ScreenSkeleton />
  if (curve.error || !curve.data) return <ErrorState error={toGameError(curve.error)} onRetry={() => curve.refetch()} />
  const analyse = async () => {
    setBusy(true); setErr(null)
    try {
      const r = (await flagshipApi.availability(id, Math.round(ph * 10) / 10)).data; setRes(r)
      celebrate({ evidence: r.new_evidence, xp: r.xp }); qc.invalidateQueries({ queryKey: ['case', id] })
    } catch (e) { setErr(toGameError(e)) } finally { setBusy(false) }
  }
  const label = { ok: 'OK', scarce: 'Scarce', toxic: 'Toxic' } as const
  return (
    <div>
      <Card>
        <div className="flex items-baseline justify-between"><label htmlFor="ph" className="font-bold">Substrate pH</label><span className="font-mono text-3xl tabular-nums">{ph.toFixed(1)}</span></div>
        <input id="ph" type="range" min={4} max={8.5} step={0.1} value={ph} onChange={(e) => { setPh(parseFloat(e.target.value)); setRes(null) }} className="w-full mt-3 h-12 accent-[#0E7C86]" aria-valuetext={`pH ${ph.toFixed(1)}`} />
        <div className="flex justify-between text-[11px] text-mute -mt-1"><span>4.0</span><span>8.5</span></div>
      </Card>
      <div className="mt-3 space-y-2" aria-live="polite">
        {rows.map((n) => (
          <div key={n.symbol} className="flex items-center gap-3">
            <span className="w-8 font-mono font-bold text-sm">{n.symbol}</span>
            <div className="flex-1 h-3.5 rounded-full bg-paper-2 overflow-hidden" role="meter" aria-label={n.name} aria-valuenow={n.value} aria-valuemin={0} aria-valuemax={100}>
              <div className={clsx('h-full rounded-full transition-all duration-300', n.status === 'toxic' ? 'bg-rose' : n.status === 'scarce' ? 'bg-gold' : n.is_toxin ? 'bg-mute' : 'bg-lab')} style={{ width: `${n.value}%` }} />
            </div>
            <span className={clsx('w-[74px] text-[12px] font-bold text-right', n.status === 'toxic' ? 'text-rose' : n.status === 'scarce' ? 'text-gold' : 'text-mute')}>
              {n.status !== 'ok' && <AlertTriangle size={11} className="inline mr-1 -mt-0.5" aria-hidden />}{n.value}% {n.status !== 'ok' ? label[n.status] : ''}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-mute mt-3">Bars show relative availability to roots. Al and Mn become toxic when too available; the rest become scarce when too low. {curve.data.disclaimer}</p>
      <Button full className="mt-4" loading={busy} onClick={analyse}>Record analysis at pH {ph.toFixed(1)}</Button>
      {!measured && <p className="text-[13px] text-mute mt-2">Tip: measure a real sample first, then model that pH.</p>}
      {res?.hint && <p role="status" className="mt-3 rounded-xl bg-gold-soft text-ink-2 p-3 text-[14px]">{res.hint}</p>}
      {res?.new_evidence?.length ? <p role="status" className="mt-3 rounded-xl bg-ok-soft p-3 text-[14px]">Analysis added to your case file: <b>{res.new_evidence[0].title}</b></p> : null}
      {res && !res.new_evidence?.length && !res.hint && <p role="status" className="mt-3 rounded-xl bg-paper-2 p-3 text-[14px]">Reading recorded. Nothing new for your case file from this pH. Try a pH you measured on a sample.</p>}
      {err && <ErrorState compact error={err} />}
    </div>
  )
}

/* ── fertilizer comparison ──────────────────────────────────────────────────── */
function Fert({ id }: { id: string }) {
  const qc = useQueryClient(); const { celebrate } = useFx()
  const list = useQuery<{ id: string; name: string; npk: string }[]>({ queryKey: ['ferts'], queryFn: async () => (await flagshipApi.fertilizers()).data, staleTime: Infinity })
  const [sel, setSel] = useState<string[]>([])
  const [res, setRes] = useState<{ rows: { id: string; name: string; npk: string; acidity: number; direction: string; note: string }[]; unit: string } | null>(null)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<GameError | null>(null)
  const run = async () => {
    setBusy(true); setErr(null)
    try { const r = (await flagshipApi.fertilizer(id, sel)).data; setRes(r); celebrate({ evidence: r.new_evidence, xp: r.xp }); qc.invalidateQueries({ queryKey: ['case', id] }) }
    catch (e) { setErr(toGameError(e)) } finally { setBusy(false) }
  }
  if (list.isLoading) return <ScreenSkeleton />
  const max = res ? Math.max(...res.rows.map((r) => Math.abs(r.acidity)), 1) : 1
  return (
    <div>
      <p className="text-[14px] text-mute mb-3">Choose two or more fertilizers to compare how they change substrate pH over time.</p>
      <div className="space-y-2">{(list.data ?? []).map((f) => { const on = sel.includes(f.id); return (
        <button key={f.id} role="checkbox" aria-checked={on} onClick={() => setSel((s) => (on ? s.filter((x) => x !== f.id) : [...s, f.id]))} className={clsx('w-full text-left rounded-2xl border-2 p-3.5 min-h-[56px] flex items-center gap-3', on ? 'border-lab bg-lab-soft' : 'border-line bg-white')}>
          <span className={clsx('w-6 h-6 rounded-md border-2 flex items-center justify-center', on ? 'bg-lab border-lab text-white' : 'border-mute')}>{on && <Check size={15} aria-hidden />}</span>
          <span className="flex-1 font-semibold">{f.name}</span><span className="font-mono text-sm text-mute">{f.npk}</span>
        </button>) })}</div>
      <Button full className="mt-4" disabled={sel.length < 2} loading={busy} onClick={run}>Compare acidity</Button>
      {err && <ErrorState compact error={err} />}
      {res && (
        <Card className="mt-4">
          <div className="space-y-3">{res.rows.map((r) => (
            <div key={r.id}>
              <div className="flex justify-between text-[14px]"><span className="font-semibold">{r.name}</span><span className={clsx('font-bold', r.acidity > 0 ? 'text-rose' : 'text-lab')}>{r.acidity > 0 ? '+' : ''}{r.acidity} · {r.direction}</span></div>
              <div className="h-3 rounded-full bg-paper-2 mt-1 overflow-hidden"><div className={clsx('h-full rounded-full', r.acidity > 0 ? 'bg-rose' : 'bg-lab')} style={{ width: `${(Math.abs(r.acidity) / max) * 100}%` }} /></div>
              <p className="text-[12.5px] text-mute mt-1">{r.note}</p>
            </div>))}</div>
          <p className="text-[11.5px] text-mute mt-3">Units: {res.unit}. Positive = acid-forming.</p>
        </Card>)}
    </div>
  )
}

/* ── lime trial (Pro) ───────────────────────────────────────────────────────── */
function Lime({ id, measured }: { id: string; measured: boolean }) {
  const qc = useQueryClient(); const { celebrate } = useFx(); const { openPaywall, isPro } = useGame()
  const [g, setG] = useState(3)
  const [res, setRes] = useState<{ control: AvailabilityResult; treated: AvailabilityResult; treated_ph: number; note: string; success: boolean; overlimed: boolean } | null>(null)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<GameError | null>(null)
  const run = async () => {
    setBusy(true); setErr(null)
    try { const r = (await flagshipApi.lime(id, g)).data; setRes(r); celebrate({ evidence: r.new_evidence, xp: r.xp }); qc.invalidateQueries({ queryKey: ['case', id] }) }
    catch (e) { const x = toGameError(e); if (x.kind === 'pro') openPaywall(x.feature); else setErr(x) } finally { setBusy(false) }
  }
  return (
    <div>
      <Card tone={isPro ? 'default' : 'gold'}>
        <p className="font-bold">Controlled lime trial</p>
        <p className="text-[14px] text-ink-2 mt-1">Treat a Bench B sample with dolomitic lime and keep an untreated control. If acidity is the cause, fixing it should fix the nutrient balance.</p>
        {!isPro && <p className="text-[13px] text-gold font-semibold mt-2 flex items-center gap-1.5"><Lock size={13} aria-hidden />Advanced lab · Detective Pro</p>}
      </Card>
      <Card className="mt-3">
        <div className="flex items-baseline justify-between"><label htmlFor="lime" className="font-bold">Lime dose</label><span className="font-mono text-2xl tabular-nums">{g.toFixed(1)} g/L</span></div>
        <input id="lime" type="range" min={0.5} max={10} step={0.5} value={g} onChange={(e) => { setG(parseFloat(e.target.value)); setRes(null) }} className="w-full mt-3 h-12 accent-[#0E7C86]" />
      </Card>
      <Button full variant={isPro ? 'primary' : 'dark'} className="mt-3" loading={busy} disabled={isPro && !measured} onClick={run}>{isPro ? 'Run controlled trial' : 'Unlock the advanced lab'}</Button>
      {isPro && !measured && <p className="text-[13px] text-mute mt-2">Measure Bench B's pH first.</p>}
      {err && <ErrorState compact error={err} />}
      {res && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[['Control (no lime)', res.control, false], ['Treated', res.treated, true]].map(([t, r, tr]) => { const a = r as AvailabilityResult; return (
            <Card key={t as string} tone={tr ? 'lab' : 'default'}>
              <p className="text-[12px] font-bold uppercase tracking-wide text-mute">{t as string}</p>
              <p className="font-mono text-3xl mt-1 tabular-nums">{a.ph.toFixed(1)}</p><p className="text-[12px] text-mute">substrate pH</p>
              <p className="mt-2 text-[13px]"><b>Vigor index {a.vigor_index}</b> / 100</p>
              <p className="text-[12px] text-mute mt-1">{a.scarce.length ? `Scarce: ${a.scarce.join(', ')}` : 'No scarce nutrients'}</p>
              <p className="text-[12px] text-mute">{a.toxic.length ? `Toxic: ${a.toxic.join(', ')}` : 'No toxins'}</p>
            </Card>) })}
          <p className={clsx('col-span-2 rounded-xl p-3 text-[14px]', res.success ? 'bg-ok-soft' : 'bg-gold-soft')} role="status">{res.note}</p>
        </div>)}
    </div>
  )
}
export default suspended(Lab)
