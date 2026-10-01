'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { FlaskConical } from 'lucide-react'
import { flagshipApi } from '@/lib/api'
import { toGameError, type GameError } from '@/lib/game/errors'
import { useCase } from '@/lib/game/hooks'
import { CaseShell } from '@/components/game/CaseChrome'
import GreenhouseScene from '@/components/game/GreenhouseScene'
import { useFx } from '@/components/game/Fx'
import { Button, Chip, ErrorState, ProgressBar, ScreenSkeleton, Sheet } from '@/components/game/ui'
import { suspended } from '@/components/game/Suspended'
import type { Evidence } from '@/lib/game/types'

function Scene() {
  const id = useSearchParams().get('id')
  const router = useRouter()
  const qc = useQueryClient()
  const { celebrate } = useFx()
  const { data, isLoading, error, refetch } = useCase(id)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<GameError | null>(null)
  const [reveal, setReveal] = useState<{ label: string; items: Evidence[]; samples: string[]; revisit: boolean } | null>(null)

  if (!id) return <ErrorState error={{ kind: 'notfound', message: 'No case selected.', retryable: false }} />
  if (isLoading) return <ScreenSkeleton />
  if (error || !data) return <ErrorState error={error!} onRetry={() => refetch()} />

  const pick = async (hid: string) => {
    setBusy(hid); setErr(null)
    const label = data.hotspots.find((h) => h.id === hid)!.label
    try {
      const r = (await flagshipApi.inspect(id, hid)).data
      setReveal({ label, items: r.evidence, samples: r.samples_unlocked, revisit: !r.first_visit })
      celebrate({ evidence: r.new_evidence, xp: r.xp })
      qc.invalidateQueries({ queryKey: ['case', id] }); qc.invalidateQueries({ queryKey: ['catalog'] })
    } catch (e) { setErr(toGameError(e)) } finally { setBusy(null) }
  }
  const found = data.hotspots.filter((h) => h.inspected).length

  return (
    <CaseShell id={id} active="scene" title="Investigation" data={data}>
      <div className="px-4">
        <div className="flex items-center justify-between mb-2 mt-1">
          <p className="text-[13px] font-semibold text-ink-2">{found} of {data.hotspots.length} locations inspected</p>
          <Chip tone="lab">{data.evidence.length} evidence</Chip>
        </div>
        <ProgressBar value={found} max={data.hotspots.length} label="Locations inspected" />
        <div className="mt-3"><GreenhouseScene hotspots={data.hotspots} onPick={pick} busyId={busy} /></div>
        {err && <div className="mt-3"><ErrorState error={err} compact onRetry={() => setErr(null)} /></div>}
        <p className="text-[13px] text-mute mt-3">Tap a glowing marker to inspect it. Benches B and C are failing; Bench A is the control. Compare them.</p>

        <ul className="sr-only">{data.hotspots.map((h) => <li key={h.id}><button onClick={() => pick(h.id)}>{h.label}: {h.prompt}</button></li>)}</ul>
      </div>

      <Sheet open={!!reveal} onClose={() => setReveal(null)} title={reveal?.label ?? ''} dark>
        {reveal && (<div>
          {reveal.items.map((e) => (
            <div key={e.key} className="rounded-2xl bg-[#1d2a35] border border-[#2b3641] p-4 mb-3">
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#f2b84b]">{reveal.revisit ? 'Already in your file' : 'New evidence'} · {e.kind}</p>
              <p className="display font-bold text-xl mt-1">{e.title}</p>
              <p className="text-[#c9d1d8] text-[15px] mt-1.5 leading-relaxed">{e.description}</p>
            </div>
          ))}
          {reveal.samples.length > 0 && (
            <div className="rounded-2xl bg-[#14303a] p-4 mb-3 flex items-center gap-3"><FlaskConical className="text-[#6fd0d8] shrink-0" aria-hidden /><p className="text-[14px] text-[#bfeef2]">Sample collected. You can test it in the lab.</p></div>
          )}
          <Button full onClick={() => setReveal(null)}>Continue</Button>
          {reveal.samples.length > 0 && <Button full variant="ghost" className="!text-[#c9d1d8] mt-1" onClick={() => router.push(`/play/lab/?id=${id}`)}>Go to the lab</Button>}
        </div>)}
      </Sheet>
    </CaseShell>
  )
}
export default suspended(Scene)
