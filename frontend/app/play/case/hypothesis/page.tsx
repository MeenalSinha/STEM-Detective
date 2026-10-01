'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Circle, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { flagshipApi } from '@/lib/api'
import { toGameError, type GameError } from '@/lib/game/errors'
import { useCase } from '@/lib/game/hooks'
import { CaseShell } from '@/components/game/CaseChrome'
import { useFx } from '@/components/game/Fx'
import { Button, Card, ErrorState, ScreenSkeleton, SectionTitle } from '@/components/game/ui'
import { suspended } from '@/components/game/Suspended'
import type { HypothesisResult } from '@/lib/game/types'

const PROMPTS = ['What is wrong with the substrate?', 'What caused it on Benches B and C but not A?', 'How does that harm the plants?', 'What did you rule out, and how do you know?']

function Hypothesis() {
  const id = useSearchParams().get('id')
  const router = useRouter(); const qc = useQueryClient(); const { celebrate } = useFx()
  const { data, isLoading, error, refetch } = useCase(id)
  const [text, setText] = useState('')
  const [cited, setCited] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<GameError | null>(null)
  const [res, setRes] = useState<HypothesisResult | null>(null)

  if (!id) return <ErrorState error={{ kind: 'notfound', message: 'No case selected.', retryable: false }} />
  if (isLoading) return <ScreenSkeleton />
  if (error || !data) return <ErrorState error={error!} onRetry={() => refetch()} />
  if (data.solved && !res) { router.replace(`/play/case/solved/?id=${id}`); return <ScreenSkeleton /> }

  const words = text.trim().split(/\s+/).filter(Boolean).length
  const submit = async () => {
    setBusy(true); setErr(null)
    try {
      const r: HypothesisResult = (await flagshipApi.hypothesis(id, text.trim(), cited)).data
      qc.invalidateQueries({ queryKey: ['catalog'] }); qc.invalidateQueries({ queryKey: ['stats'] }); qc.invalidateQueries({ queryKey: ['ach'] })
      // Refresh case state BEFORE navigating so the solved screen never reads a stale "unsolved" cache.
      await qc.refetchQueries({ queryKey: ['case', id] })
      if (r.solved) { sessionStorage.setItem(`sd_result_${id}`, JSON.stringify(r)); router.push(`/play/case/solved/?id=${id}`) }
      else { celebrate({ xp: r.xp }); setRes(r) }
    } catch (e) { setErr(toGameError(e)) } finally { setBusy(false) }
  }

  return (
    <CaseShell id={id} active="solve" title="Your hypothesis" data={data}>
      <div className="px-4">
        <p className="text-[14.5px] text-ink-2 mt-1">State what went wrong, why, and how you know. Back every claim with evidence from your file.</p>
        <ul className="mt-3 space-y-1.5">{PROMPTS.map((p) => <li key={p} className="text-[13.5px] text-mute flex gap-2"><span className="text-lab font-bold">?</span>{p}</li>)}</ul>

        <label htmlFor="hyp" className="block font-bold mt-5 mb-1.5">Hypothesis</label>
        <textarea id="hyp" value={text} onChange={(e) => setText(e.target.value)} rows={7} maxLength={1200}
          placeholder="Write it like a scientist: because..., which caused..., while ... can be ruled out."
          className="w-full rounded-2xl border border-line bg-white p-4 text-[16px] leading-relaxed outline-none focus:border-lab focus:ring-2 focus:ring-lab/30" />
        <p className="text-[12px] text-mute mt-1 text-right">{words} words</p>

        <SectionTitle>Cite your evidence ({cited.length})</SectionTitle>
        {data.evidence.length === 0 ? <p className="text-mute text-sm">You have no evidence yet. Investigate first.</p> : (
          <div className="space-y-2">{data.evidence.map((e) => { const on = cited.includes(e.key); return (
            <button key={e.key} role="checkbox" aria-checked={on} onClick={() => setCited((c) => (on ? c.filter((k) => k !== e.key) : [...c, e.key]))}
              className={clsx('w-full text-left rounded-xl border-2 px-3.5 py-3 min-h-[52px] flex items-center gap-3', on ? 'border-lab bg-lab-soft' : 'border-line bg-white')}>
              <span className={clsx('w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0', on ? 'bg-lab border-lab text-white' : 'border-mute')}>{on && <Check size={15} aria-hidden />}</span>
              <span className="text-[14.5px] font-medium">{e.title}</span>
            </button>) })}</div>)}

        {err && <div className="mt-3"><ErrorState compact error={err} onRetry={submit} /></div>}
        <Button full className="mt-5" loading={busy} disabled={words < 6} onClick={submit}>Submit to the case review</Button>
        {words < 6 && <p className="text-[12.5px] text-mute mt-2 text-center">Write at least a sentence to submit.</p>}

        {res && !res.solved && (
          <Card className="mt-5" tone="gold">
            <p className="text-[12px] font-bold uppercase tracking-wider text-gold">Review: not yet</p>
            <p className="text-[15.5px] mt-2 leading-relaxed">{res.feedback}</p>
            <ul className="mt-4 space-y-2">{res.components.map((c) => (
              <li key={c.id} className="flex gap-2.5 text-[14px]">
                {c.status === 'strong' ? <Check className="text-ok shrink-0 mt-0.5" size={18} aria-hidden /> : c.status === 'unsupported' ? <AlertCircle className="text-gold shrink-0 mt-0.5" size={18} aria-hidden /> : <Circle className="text-mute shrink-0 mt-0.5" size={18} aria-hidden />}
                <span><span className="font-semibold">{c.label}.</span> <span className="text-mute">{c.status === 'strong' ? 'Supported by your evidence.' : c.status === 'unsupported' ? 'Claimed, but cite evidence that supports it.' : 'Not addressed yet.'}</span></span>
              </li>))}</ul>
          </Card>)}
      </div>
    </CaseShell>
  )
}
export default suspended(Hypothesis)
