'use client'
import { useQuery } from '@tanstack/react-query'
import { Award, CheckCircle2, Circle, FolderCheck } from 'lucide-react'
import { usersApi } from '@/lib/api'
import { toGameError } from '@/lib/game/errors'
import { useCatalog } from '@/lib/game/hooks'
import { Card, Chip, ErrorState, ScreenSkeleton, SectionTitle } from '@/components/game/ui'
import { TopBar, XpCard } from '@/components/game/bits'
import Link from 'next/link'

interface Ach { id: string; name: string; description: string; xp_reward: number; earned: boolean }

export default function Progress() {
  const cat = useCatalog()
  const stats = useQuery({ queryKey: ['stats'], queryFn: async () => (await usersApi.getStats()).data })
  const ach = useQuery({ queryKey: ['ach'], queryFn: async () => (await usersApi.getAchievements()).data })
  if (cat.isLoading || stats.isLoading || ach.isLoading) return <ScreenSkeleton />
  if (cat.error || !cat.data) return <ErrorState error={cat.error!} onRetry={() => cat.refetch()} />
  if (stats.error) return <ErrorState error={toGameError(stats.error)} onRetry={() => stats.refetch()} />
  const s = stats.data
  const all: Ach[] = ach.data?.available ?? []
  const f = cat.data.cases[0]

  return (
    <>
      <TopBar title="Progress" />
      <div className="px-5 pb-6">
        <XpCard p={cat.data.player} />
        <div className="grid grid-cols-3 gap-2.5 mt-3">
          {[['Cases solved', s.cases_solved], ['Cases opened', s.total_cases], ['Badges', s.achievements_count]].map(([l, v]) => (
            <Card key={l as string} className="!p-3 text-center"><p className="display text-2xl font-bold">{v}</p><p className="text-[11px] text-mute font-semibold">{l}</p></Card>
          ))}
        </div>

        <SectionTitle>Case record</SectionTitle>
        <Card>
          <div className="flex items-center gap-3">
            {f.status === 'solved' ? <CheckCircle2 className="text-ok" aria-hidden /> : <Circle className="text-mute" aria-hidden />}
            <div className="flex-1"><p className="font-semibold">{f.title}</p><p className="text-[13px] text-mute">{f.status === 'solved' ? 'Solved' : f.status === 'in_progress' ? `${Math.round(f.progress)}% investigated` : 'Not started'}</p></div>
            <Chip tone={f.status === 'solved' ? 'ok' : 'neutral'}>{f.status === 'solved' ? 'Solved' : 'Open'}</Chip>
          </div>
        </Card>

        <SectionTitle>Achievements</SectionTitle>
        <div className="space-y-2.5">
          {all.length === 0 && <p className="text-mute text-sm">No achievements are available yet.</p>}
          {all.map((a) => (
            <Card key={a.id} className={a.earned ? '' : 'opacity-70'}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${a.earned ? 'bg-gold-soft text-gold' : 'bg-paper-2 text-mute'}`}><Award size={22} aria-hidden /></div>
                <div className="flex-1"><p className="font-semibold">{a.name}</p><p className="text-[13px] text-mute">{a.description}</p></div>
                <Chip tone={a.earned ? 'ok' : 'neutral'}>{a.earned ? 'Earned' : `+${a.xp_reward} XP`}</Chip>
              </div>
            </Card>
          ))}
        </div>
        <Link href="/knowledge-graph/" className="mt-5 flex items-center justify-center gap-2 min-h-[48px] text-lab font-semibold"><FolderCheck size={18} aria-hidden />Open knowledge graph</Link>
      </div>
    </>
  )
}
