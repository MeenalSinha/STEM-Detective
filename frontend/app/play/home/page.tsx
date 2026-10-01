'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, Sprout, Lock } from 'lucide-react'
import { flagshipApi } from '@/lib/api'
import { toGameError, type GameError } from '@/lib/game/errors'
import { useAuthStore } from '@/lib/store/auth'
import { useCatalog } from '@/lib/game/hooks'
import { useGame } from '@/lib/game/ctx'
import { Button, Card, Chip, ErrorState, ProgressBar, ScreenSkeleton, SectionTitle } from '@/components/game/ui'
import { XpCard } from '@/components/game/bits'

export default function Home() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, error, refetch } = useCatalog()
  const { isPro, openPaywall } = useGame()
  const [starting, setStarting] = useState(false)
  const [startErr, setStartErr] = useState<GameError | null>(null)

  if (isLoading) return <ScreenSkeleton />
  if (error || !data) return <ErrorState error={error ?? { kind: 'server', message: 'Could not load your case files.', retryable: true }} onRetry={() => refetch()} />

  const c = data.cases[0]
  const open = async () => {
    setStartErr(null)
    if (c.case_id && c.status !== 'new') return router.push(c.status === 'solved' ? `/play/case/solved/?id=${c.case_id}` : `/play/case/scene/?id=${c.case_id}`)
    setStarting(true)
    try {
      const res = await flagshipApi.start()
      router.push(`/play/case/brief/?id=${res.data.case_id}`)
    } catch (e) { setStartErr(toGameError(e)) } finally { setStarting(false) }
  }

  return (
    <div className="px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-6">
      <p className="text-mute text-sm font-semibold">{c.status === 'new' ? 'Welcome,' : 'Welcome back,'}</p>
      <h1 className="display text-3xl font-bold -mt-0.5">Detective {user?.username}</h1>

      <div className="mt-5"><XpCard p={data.player} /></div>

      <SectionTitle>{c.status === 'new' ? 'Your first case' : c.status === 'solved' ? 'Latest case' : 'Active investigation'}</SectionTitle>
      <Card tone="dark" className="!p-0 overflow-hidden">
        <div className="p-5 bg-[linear-gradient(160deg,#14303a,#141B22)]">
          <div className="flex items-center justify-between"><Chip tone="dark">{c.subtitle}</Chip><Sprout className="text-[#6fd0d8]" aria-hidden /></div>
          <h2 className="display text-[28px] font-bold mt-4 leading-tight">{c.title}</h2>
          <p className="text-[#b9c6d0] mt-2 text-[15px]">{c.blurb}</p>
          {c.status !== 'new' && (<div className="mt-4 [&>div]:!bg-[#2b3641]"><ProgressBar value={c.progress} label="Case progress" /><p className="text-[12px] text-[#9fb0bc] mt-1.5">{c.status === 'solved' ? 'Case closed' : `${Math.round(c.progress)}% investigated`}</p></div>)}
          <Button full onClick={open} loading={starting} className="mt-5">
            {c.status === 'new' ? 'Open case file' : c.status === 'solved' ? 'Review case' : 'Continue investigation'}<ArrowRight size={18} aria-hidden />
          </Button>
          {startErr && <p role="alert" className="text-[#ffb4ab] text-[13px] mt-2">{startErr.message}</p>}
        </div>
      </Card>

      <SectionTitle>Case files</SectionTitle>
      <div className="space-y-3">
        <Card onClick={() => router.push('/play/cases/')}><div className="flex items-center gap-3"><div className="flex-1"><p className="font-bold">Browse all cases</p><p className="text-mute text-[13px]">{data.generated.count} generated case file{data.generated.count === 1 ? '' : 's'}{data.generated.limit != null ? ` (${data.generated.limit} free)` : ''}</p></div><ArrowRight size={18} className="text-mute" aria-hidden /></div></Card>
        {!isPro && (
          <Card tone="gold" onClick={() => openPaywall()}>
            <div className="flex items-center gap-3"><Lock size={20} className="text-gold" aria-hidden /><div className="flex-1"><p className="font-bold">Detective Pro</p><p className="text-[13px] text-ink-2">Advanced analysis, advanced lab, unlimited hints.</p></div></div>
          </Card>
        )}
      </div>
      <p className="text-center mt-8 text-[12px] text-mute"><Link href="/legal/privacy/" className="underline">Privacy</Link> · <Link href="/legal/terms/" className="underline">Terms</Link></p>
    </div>
  )
}
