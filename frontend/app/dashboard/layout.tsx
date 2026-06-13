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
  Network, Trophy, BarChart3, Users, Settings, LogOut, Zap, Gem, CircleCheck, Coins, Bolt
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

  const xpProgress = ((user.xp % 1000) / 1000) * 100

  return (
    <div className="font-body antialiased min-h-screen overflow-x-hidden flex bg-bg-primary text-text-primary">
      {/* Fixed Side Nav */}
      <aside className="fixed h-full left-0 w-72 bg-[#1b1109]/90 backdrop-blur-xl border-r border-[#4a3520] shadow-[4px_0_20px_rgba(0,0,0,0.8)] flex-col py-6 px-4 z-50 hidden md:flex">
        {/* Brand */}
        <div className="mb-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border border-[#4a3520] shadow-[0_4px_10px_rgba(0,0,0,0.8)] mb-4 overflow-hidden bg-black flex items-center justify-center">
             <img src="/assets/raccoon-detective.webp" alt="STEM Detective" className="w-full h-full object-cover grayscale-[0.3]" />
          </div>
          <h1 className="font-detective text-[#f5e6d3] text-2xl tracking-widest text-center font-bold">STEM DETECTIVE</h1>
          <p className="text-text-secondary text-[10px] mt-1 text-center font-mono tracking-widest uppercase">Multiverse of Mysteries</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto pr-2 space-y-1">
          {filteredNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-md transition-all duration-150 relative ${
                  active
                    ? 'text-[#f5e6d3] font-bold border-l-4 border-crimson-glow bg-[#2a1e12] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]'
                    : 'text-[#a39171] hover:text-[#d4b58e] hover:bg-[#1f160e]'
                }`}
              >
                {active && <span className="absolute left-2 w-2 h-2 rounded-full bg-crimson-glow shadow-crimson"></span>}
                <item.icon size={18} className={active ? 'mr-3 ml-2 text-amber-glow' : 'mr-3'} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Profile / Footer */}
        <div className="mt-auto pt-6 border-t border-[#c8860a]/20">
          <div className="glass-panel p-3 rounded-xl mb-4 text-center">
            <div className="flex items-center gap-3 mb-2 text-left">
              <div className="w-10 h-10 rounded-full border border-[#c8860a]/40 flex-shrink-0 overflow-hidden bg-bg-overlay">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-amber-glow font-bold">{user.username.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-text-primary text-sm font-semibold truncate">{user.username}</p>
                <p className="text-amber-glow text-[11px] font-bold uppercase tracking-wider truncate">Level {user.level} Detective</p>
              </div>
            </div>
            {/* XP bar */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 bg-bg-overlay rounded-full overflow-hidden">
                <div className="h-full bg-crimson-glow shadow-crimson transition-all duration-1000" style={{ width: `${xpProgress}%` }}></div>
              </div>
              <span className="text-[10px] text-text-muted font-mono">{user.xp % 1000}/1000</span>
            </div>
            <p className="text-[10px] text-text-muted italic font-display">"Every clue has a story. Every story has science."</p>
          </div>
          
          <div className="flex items-center justify-between px-2 text-text-muted">
            <Link href="/settings" className="hover:text-amber-glow transition-colors"><Settings size={18} /></Link>
            <button onClick={handleLogout} className="hover:text-crimson-glow transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-72 flex flex-col min-h-screen">
        {/* Top App Bar */}
        <header className="fixed top-0 right-0 w-full md:w-[calc(100%-18rem)] bg-[#1b1109]/90 backdrop-blur-xl border-b border-[#4a3520] shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex justify-between items-center px-6 h-20 z-40">
          <div className="flex items-center">
            <div>
               <h2 className="font-display text-xl text-[#f5e6d3] font-semibold">Welcome back, {user.username}</h2>
               <p className="text-xs text-text-muted">You have {stats?.active_cases || 0} active cases and {stats?.achievements_count || 0} recent clues.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex items-center space-x-5 mr-4 font-mono text-sm">
              <span className="flex items-center text-amber-glow"><Bolt size={14} className="mr-1" /> 120</span>
              <span className="flex items-center text-coin"><Coins size={14} className="mr-1" /> 3,450</span>
              <span className="flex items-center text-gem"><Gem size={14} className="mr-1" /> 48</span>
            </div>
            
            <button className="text-text-muted hover:text-amber-glow transition-colors relative">
              <CircleCheck size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-crimson-glow shadow-crimson"></span>
            </button>
            <Link href="/cases" className="bg-amber-glow/20 border border-amber-glow/50 text-amber-light px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-amber-glow/30 transition-colors ml-4 hidden sm:block">
              New Investigation
            </Link>
          </div>
        </header>

        {/* Canvas */}
        <div className="p-4 md:p-8 mt-20 flex-1 w-full max-w-7xl mx-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
