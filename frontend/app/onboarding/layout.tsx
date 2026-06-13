'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/lib/api'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FolderOpen, FlaskConical, BookOpen,
  Network, Trophy, BarChart3, Users, Settings, LogOut, Zap, Gem
} from 'lucide-react'
import { UserStats } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/cases', icon: FolderOpen, label: 'My Cases' },
  { href: '/lab', icon: FlaskConical, label: 'Crime Lab' },
  { href: '/evidence', icon: BookOpen, label: 'Evidence Board' },
  { href: '/knowledge-graph', icon: Network, label: 'Knowledge Graph' },
  { href: '/achievements', icon: Trophy, label: 'Achievements' },
  { href: '/leaderboard', icon: BarChart3, label: 'Leaderboard' },
  { href: '/teacher', icon: Users, label: 'Teacher Hub', teacherOnly: true },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()

  const { data: statsData } = useQuery<{ data: UserStats }>({
    queryKey: ['user-stats'],
    queryFn: () => usersApi.getStats(),
    enabled: isAuthenticated,
    refetchInterval: 60000,
  })

  const stats = statsData?.data

  useEffect(() => {
    if (!isAuthenticated) router.push('/auth/login')
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) return null

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const filteredNav = NAV_ITEMS.filter(
    (item) => !item.teacherOnly || user.role === 'teacher' || user.role === 'admin'
  )

  const xpToNextLevel = 1000 - (user.xp % 1000)
  const xpProgress = ((user.xp % 1000) / 1000) * 100

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-bg-secondary border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-glow/50 flex-shrink-0 bg-[#1a120c]">
              <img src="/raccoon-detective.webp" alt="STEM Detective" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="detective-text text-text-primary font-bold text-sm leading-none">STEM DETECTIVE</p>
              <p className="text-text-muted text-xs mt-0.5">Multiverse of Mysteries</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {filteredNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150 group ${
                  active
                    ? 'bg-amber-glow/15 text-amber-light border-l-2 border-amber-glow'
                    : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary'
                }`}
              >
                <item.icon
                  size={16}
                  className={active ? 'text-amber-glow' : 'text-text-muted group-hover:text-text-secondary'}
                />
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-glow" />}
              </Link>
            )
          })}
        </nav>

        {/* Detective Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-bg-overlay border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <span className="text-amber-light font-bold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-text-primary text-sm font-semibold truncate">{user.username}</p>
              <p className="text-text-muted text-xs truncate">{user.detective_rank}</p>
            </div>
          </div>

          {/* XP bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Level {user.level}</span>
              <span>{user.xp.toLocaleString()} XP</span>
            </div>
            <div className="xp-bar">
              <motion.div
                className="xp-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Stat chips */}
          <div className="flex gap-2 mb-3">
            <div className="flex items-center gap-1 text-xs text-xp">
              <Zap size={11} />
              <span>{user.xp.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gem">
              <Gem size={11} />
              <span>{stats?.achievements_count || 0}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-text-muted hover:text-crimson-light text-xs transition-colors w-full"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
