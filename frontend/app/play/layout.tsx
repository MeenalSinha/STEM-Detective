'use client'
import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, FolderSearch, FlaskConical, Trophy, User } from 'lucide-react'
import clsx from 'clsx'
import { FxProvider } from '@/components/game/Fx'
import { GameProvider } from '@/lib/game/ctx'
import { useAuthStore } from '@/lib/store/auth'
import { useAuthReady } from '@/lib/game/hooks'
import { ScreenSkeleton } from '@/components/game/ui'

const TABS = [
  { href: '/play/home/', label: 'Home', icon: Home },
  { href: '/play/cases/', label: 'Cases', icon: FolderSearch },
  { href: '/play/lab/', label: 'Lab', icon: FlaskConical },
  { href: '/play/progress/', label: 'Progress', icon: Trophy },
  { href: '/play/profile/', label: 'Profile', icon: User },
]
const norm = (p: string) => (p.endsWith('/') ? p : p + '/')

export default function PlayLayout({ children }: { children: ReactNode }) {
  const path = norm(usePathname() || '/')
  const router = useRouter()
  const ready = useAuthReady()
  const authed = useAuthStore((s) => s.isAuthenticated && !!s.token)
  const isWelcome = path.startsWith('/play/welcome')
  const showTabs = TABS.some((t) => t.href === path)

  useEffect(() => { if (ready && !authed && !isWelcome) router.replace('/play/welcome/') }, [ready, authed, isWelcome, router])

  return (
    <FxProvider>
      <GameProvider>
        <div className="game-root mx-auto max-w-md relative flex flex-col">
          <main className={clsx('flex-1', showTabs && 'pb-[calc(76px+env(safe-area-inset-bottom))]')}>
            {!ready || (!authed && !isWelcome) ? <ScreenSkeleton /> : children}
          </main>
          {showTabs && authed && (
            <nav aria-label="Main" className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-md bg-white/95 backdrop-blur border-t border-line safe-bottom">
              <ul className="grid grid-cols-5">
                {TABS.map((t) => {
                  const on = path === t.href
                  return (
                    <li key={t.href}>
                      <Link href={t.href} aria-current={on ? 'page' : undefined}
                        className={clsx('flex flex-col items-center justify-center gap-0.5 h-[64px] text-[11px] font-semibold', on ? 'text-lab' : 'text-mute')}>
                        <span className={clsx('w-14 h-8 rounded-full flex items-center justify-center transition-colors', on && 'bg-lab-soft')}><t.icon size={21} strokeWidth={on ? 2.4 : 2} aria-hidden /></span>
                        {t.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )}
        </div>
      </GameProvider>
    </FxProvider>
  )
}
