'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Sparkles, Lock, Sprout } from 'lucide-react'
import { casesApi, flagshipApi } from '@/lib/api'
import { toGameError, type GameError } from '@/lib/game/errors'
import { useCatalog } from '@/lib/game/hooks'
import { useGame } from '@/lib/game/ctx'
import { Button, Card, Chip, ErrorState, ProgressBar, ScreenSkeleton, SectionTitle, Sheet } from '@/components/game/ui'
import { TopBar } from '@/components/game/bits'
import { useQueryClient } from '@tanstack/react-query'

const SUBJECTS = ['biology', 'chemistry', 'physics', 'environmental', 'mathematics']

export default function Cases() {
  const router = useRouter()
  const qc = useQueryClient()
  const { data, isLoading, error, refetch } = useCatalog()
  const { isPro, openPaywall } = useGame()
  const [gen, setGen] = useState(false)
  const [form, setForm] = useState({ subject: 'chemistry', topic: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<GameError | null>(null)

  if (isLoading) return <ScreenSkeleton />
  if (error || !data) return <ErrorState error={error ?? { kind: 'server', message: 'Could not load cases.', retryable: true }} onRetry={() => refetch()} />
  const f = data.cases[0]
  const atLimit = data.generated.limit != null && data.generated.count >= data.generated.limit

  const openFlagship = async () => {
    const id = f.case_id ?? (await flagshipApi.start()).data.case_id
    router.push(f.status === 'new' ? `/play/case/brief/?id=${id}` : f.status === 'solved' ? `/play/case/solved/?id=${id}` : `/play/case/scene/?id=${id}`)
  }
  const generate = async () => {
    if (!form.topic.trim()) return setErr({ kind: 'invalid', message: 'Enter a topic, for example "photosynthesis".', retryable: false })
    setBusy(true); setErr(null)
    try {
      const res = await casesApi.generate({ subject: form.subject, grade_level: 'middle', difficulty: 'medium', topic: form.topic.trim() })
      qc.invalidateQueries({ queryKey: ['catalog'] }); setGen(false)
      router.push(`/cases/view?id=${res.data.id}`)
    } catch (e) {
      const g = toGameError(e)
      if (g.kind === 'pro') { setGen(false); openPaywall(g.feature) } else setErr(g)
    } finally { setBusy(false) }
  }

  return (
    <>
      <TopBar title="Cases" />
      <div className="px-5 pb-6">
        <SectionTitle>Featured case</SectionTitle>
        <Card onClick={openFlagship}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-lab-soft text-lab flex items-center justify-center shrink-0">{f.status === 'solved' ? <Check aria-hidden /> : <Sprout aria-hidden />}</div>
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 flex-wrap"><Chip tone="ok">Free</Chip><Chip>{f.status === 'solved' ? 'Solved' : f.status === 'in_progress' ? 'In progress' : 'New'}</Chip></div>
              <p className="display font-bold text-xl mt-1.5">{f.title}</p>
              <p className="text-mute text-[14px] mt-0.5">{f.blurb}</p>
              {f.status === 'in_progress' && <div className="mt-3"><ProgressBar value={f.progress} label="Progress" /></div>}
              <div className="flex gap-1.5 flex-wrap mt-3">{f.concepts.slice(0, 3).map((c) => <Chip key={c} tone="lab">{c}</Chip>)}</div>
            </div>
          </div>
        </Card>

        <SectionTitle>AI case files</SectionTitle>
        <Card tone={atLimit ? 'gold' : 'default'}>
          <div className="flex items-center gap-3">
            <Sparkles className="text-lab shrink-0" aria-hidden />
            <div className="flex-1"><p className="font-bold">Generate a new mystery</p>
              <p className="text-[13px] text-mute">{isPro ? 'Unlimited with Detective Pro' : `${data.generated.count} of ${data.generated.limit} free case files used`}</p></div>
          </div>
          <Button full variant={atLimit ? 'dark' : 'primary'} className="mt-3" onClick={() => (atLimit ? openPaywall('unlimited_cases') : setGen(true))}>
            {atLimit ? <><Lock size={16} aria-hidden />Unlock unlimited cases</> : 'Create case file'}
          </Button>
        </Card>
        <div className="space-y-2.5 mt-3">
          {data.generated.cases.map((c) => (
            <Card key={c.case_id} onClick={() => router.push(`/cases/view?id=${c.case_id}`)}>
              <p className="font-semibold">{c.title}</p><p className="text-[13px] text-mute capitalize">{c.topic} · {c.status}</p>
            </Card>
          ))}
        </div>
        <p className="text-[12px] text-mute mt-4">Generated cases use the classic investigation screen and require the AI service.</p>
      </div>

      <Sheet open={gen} onClose={() => setGen(false)} title="New case file">
        <label className="text-[13px] font-bold block mb-1.5" htmlFor="subj">Subject</label>
        <select id="subj" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full min-h-[52px] rounded-xl border border-line bg-white px-3 text-[16px] capitalize">{SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <label className="text-[13px] font-bold block mt-4 mb-1.5" htmlFor="topic">Topic</label>
        <input id="topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. photosynthesis" className="w-full min-h-[52px] rounded-xl border border-line bg-white px-4 text-[16px]" />
        {err && <p role="alert" className="mt-3 rounded-xl bg-rose-soft text-rose p-3 text-[14px]">{err.message}</p>}
        <Button full loading={busy} onClick={generate} className="mt-5">Generate</Button>
      </Sheet>
    </>
  )
}
