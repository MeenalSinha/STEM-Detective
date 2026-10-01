'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Send, FileSearch, ChevronRight } from 'lucide-react'
import { flagshipApi } from '@/lib/api'
import { toGameError, type GameError } from '@/lib/game/errors'
import { useCase } from '@/lib/game/hooks'
import { CaseShell } from '@/components/game/CaseChrome'
import { useFx } from '@/components/game/Fx'
import { Card, Chip, ErrorState, ScreenSkeleton, Sheet } from '@/components/game/ui'
import { suspended } from '@/components/game/Suspended'

interface Msg { from: 'me' | 'them'; text: string; tag?: string }
const SUGGEST: Record<string, string[]> = {
  okonkwo: ['What happened here?', 'Tell me about Bench A', 'Has anyone tested the substrate pH?'],
  teo: ['What is your daily routine?', 'Did anything change recently?', 'Have you seen any pests?'],
  pruitt: ['Why did the supplier change?', 'What is your budget situation?'],
}
const initials = (n: string) => n.replace(/^(Dr|Mr|Ms)\.?\s+/i, '').split(' ').map((p) => p[0]).slice(0, 2).join('')

function Witness() {
  const sp = useSearchParams()
  const id = sp.get('id'); const wid = sp.get('w')
  const router = useRouter()
  const qc = useQueryClient()
  const { celebrate } = useFx()
  const { data, isLoading, error, refetch } = useCase(id)
  const [log, setLog] = useState<Record<string, Msg[]>>({})
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState<GameError | null>(null)
  const [pick, setPick] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const w = data?.witnesses.find((x) => x.id === wid)

  useEffect(() => { if (w && !log[w.id]) setLog((l) => ({ ...l, [w.id]: [{ from: 'them', text: w.opening }] })) }, [w, log])
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [log, sending])

  if (!id) return <ErrorState error={{ kind: 'notfound', message: 'No case selected.', retryable: false }} />
  if (isLoading) return <ScreenSkeleton />
  if (error || !data) return <ErrorState error={error!} onRetry={() => refetch()} />

  const send = async (body: { message?: string; present_evidence?: string }, mine: string) => {
    if (!w || sending) return
    setSending(true); setErr(null)
    setLog((l) => ({ ...l, [w.id]: [...(l[w.id] ?? []), { from: 'me', text: mine }] }))
    try {
      const r = (await flagshipApi.witness(id, { witness_id: w.id, ...body })).data
      setLog((l) => ({ ...l, [w.id]: [...l[w.id], { from: 'them', text: r.reply, tag: r.new_evidence?.length ? `Evidence: ${r.new_evidence[0].title}` : undefined }] }))
      celebrate({ evidence: r.new_evidence, xp: r.xp })
      qc.invalidateQueries({ queryKey: ['case', id] })
    } catch (e) {
      setErr(toGameError(e))
      setLog((l) => ({ ...l, [w.id]: l[w.id].slice(0, -1) }))
    } finally { setSending(false) }
  }
  const ask = () => { const m = text.trim(); if (!m) return; setText(''); send({ message: m }, m) }

  // ── list of witnesses
  if (!w) {
    return (
      <CaseShell id={id} active="witness" title="Witnesses" data={data}>
        <div className="px-4 space-y-3 mt-2">
          <p className="text-mute text-[14px]">Question each person. Ask about specifics, or present evidence from your file to see how they react.</p>
          {data.witnesses.map((x) => (
            <Card key={x.id} onClick={() => router.push(`/play/case/witness/?id=${id}&w=${x.id}`)}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-ink text-paper flex items-center justify-center font-bold" aria-hidden>{initials(x.name)}</div>
                <div className="flex-1 min-w-0"><p className="font-bold">{x.name}</p><p className="text-[13px] text-mute">{x.role}</p></div>
                {x.spoken && <Chip tone="ok">Interviewed</Chip>}<ChevronRight className="text-mute" aria-hidden />
              </div>
            </Card>
          ))}
        </div>
      </CaseShell>
    )
  }

  const msgs = log[w.id] ?? []
  return (
    <div className="flex flex-col h-dvh">
      <header className="safe-top bg-ink text-paper">
        <div className="h-14 px-2 flex items-center gap-2">
          <button aria-label="Back to witnesses" onClick={() => router.push(`/play/case/witness/?id=${id}`)} className="w-12 h-12 flex items-center justify-center text-xl">‹</button>
          <div className="w-9 h-9 rounded-full bg-[#2b3641] flex items-center justify-center text-sm font-bold" aria-hidden>{initials(w.name)}</div>
          <div className="min-w-0"><p className="font-bold leading-tight truncate">{w.name}</p><p className="text-[12px] text-[#9fb0bc] leading-tight">{w.role}</p></div>
        </div>
      </header>
      <div className="flex-1 scroll-y px-4 py-4 space-y-3 bg-paper" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={m.from === 'me' ? 'flex justify-end' : 'flex'}>
            <div className={`max-w-[84%] rounded-2xl px-4 py-2.5 text-[15.5px] leading-relaxed ${m.from === 'me' ? 'bg-lab text-white rounded-br-md' : 'bg-white border border-line rounded-bl-md'}`}>
              {m.text}
              {m.tag && <p className="mt-2 text-[12px] font-bold text-gold flex items-center gap-1"><FileSearch size={13} aria-hidden />{m.tag}</p>}
            </div>
          </div>
        ))}
        {sending && <div className="flex"><div className="bg-white border border-line rounded-2xl px-4 py-3 flex gap-1" role="status" aria-label="Thinking">{[0, 1, 2].map((d) => <span key={d} className="w-2 h-2 rounded-full bg-mute animate-bounce" style={{ animationDelay: `${d * 120}ms` }} />)}</div></div>}
        {err && <ErrorState error={err} compact onRetry={() => setErr(null)} />}
        <div ref={end} />
      </div>
      <div className="bg-paper border-t border-line px-3 pt-2 safe-bottom">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {(SUGGEST[w.id] ?? []).map((q) => <button key={q} disabled={sending} onClick={() => send({ message: q }, q)} className="shrink-0 min-h-[40px] px-3.5 rounded-full bg-white border border-line text-[13.5px] font-medium">{q}</button>)}
          <button disabled={sending || data.evidence.length === 0} onClick={() => setPick(true)} className="shrink-0 min-h-[40px] px-3.5 rounded-full bg-gold-soft text-gold text-[13.5px] font-bold flex items-center gap-1.5"><FileSearch size={15} aria-hidden />Present evidence</button>
        </div>
        <form className="flex gap-2 pb-2" onSubmit={(e) => { e.preventDefault(); ask() }}>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={400} placeholder={`Ask ${w.name.split(' ').slice(-1)[0]} a question`} aria-label="Your question" enterKeyHint="send"
            className="flex-1 min-h-[48px] rounded-full border border-line bg-white px-4 text-[16px] outline-none focus:border-lab" />
          <button type="submit" disabled={!text.trim() || sending} aria-label="Send" className="w-12 h-12 rounded-full bg-lab text-white flex items-center justify-center disabled:opacity-40"><Send size={19} aria-hidden /></button>
        </form>
      </div>

      <Sheet open={pick} onClose={() => setPick(false)} title="Present evidence">
        <p className="text-[14px] text-mute mb-3">Choose something from your case file to show {w.name.split(' ')[0]}.</p>
        <div className="space-y-2">
          {data.evidence.map((e) => (
            <button key={e.key} onClick={() => { setPick(false); send({ present_evidence: e.key }, `[Shows: ${e.title}]`) }} className="w-full text-left rounded-xl border border-line bg-white p-3 min-h-[56px]">
              <span className="font-semibold block text-[15px]">{e.title}</span><span className="text-[12px] text-mute capitalize">{e.kind}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
export default suspended(Witness)
