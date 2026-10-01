'use client'

import { useQuery } from '@tanstack/react-query'
import { leaderboardApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import { LeaderboardEntry } from '@/types'
import { motion } from 'framer-motion'
import { Zap, Trophy, Medal, Crown, Star, Search, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { useState } from 'react'



function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="relative w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-400/60 flex items-center justify-center shadow-[0_0_12px_rgba(234,179,8,0.3)]">
      <Crown size={16} className="text-yellow-400" />
    </div>
  )
  if (rank === 2) return (
    <div className="w-10 h-10 rounded-full bg-slate-400/20 border-2 border-slate-300/60 flex items-center justify-center">
      <Medal size={16} className="text-slate-300" />
    </div>
  )
  if (rank === 3) return (
    <div className="w-10 h-10 rounded-full bg-orange-700/20 border-2 border-orange-600/60 flex items-center justify-center">
      <Medal size={16} className="text-orange-500" />
    </div>
  )
  return (
    <div className="w-10 h-10 rounded-full bg-bg-overlay border border-border flex items-center justify-center">
      <span className="text-text-muted font-bold text-sm">#{rank}</span>
    </div>
  )
}

function RankChange({ change }: { change?: number }) {
  if (!change) return <Minus size={10} className="text-text-dim" />
  if (change > 0) return <span className="flex items-center text-emerald-400 text-[10px] gap-0.5"><ChevronUp size={10} />{change}</span>
  return <span className="flex items-center text-red-400 text-[10px] gap-0.5"><ChevronDown size={10} />{Math.abs(change)}</span>
}

const TOP3_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32']

export default function LeaderboardPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'global' | 'weekly' | 'subject'>('global')

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', tab],
    queryFn: () => leaderboardApi.get(50) as Promise<{ data: LeaderboardEntry[] }>,
  })

  const rawEntries = data?.data || []
  const entries = rawEntries.filter(e =>
    e.username.toLowerCase().includes(search.toLowerCase())
  )
  const top3 = rawEntries.slice(0, 3)
  const rest = entries.slice(3)
  const myEntry = rawEntries.find(e => e.user_id === user?.id)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center border-b border-[#3b2b1d] pb-6">
        <h1 className="font-detective text-4xl font-bold text-[#f5e6d3] flex items-center justify-center gap-3 tracking-widest uppercase">
          <Trophy size={32} className="text-amber-glow" />
          Hall of Detectives
        </h1>
        <p className="text-[#a39171] font-mono text-xs mt-3 uppercase tracking-widest bg-[#1b1109] inline-block px-4 py-1 border border-[#3b2b1d] rounded-sm">Top Secret Rankings</p>
      </div>

      {/* Podium */}
      {!isLoading && top3.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-10 px-4">
          {/* 2nd place */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col items-center w-28"
          >
            <div className="w-14 h-14 rounded-full bg-slate-400/20 border-2 border-slate-300/50 flex items-center justify-center mb-2 text-xl font-bold text-slate-200">
              {top3[1].username.charAt(0)}
            </div>
            <p className="text-text-primary font-bold text-xs text-center truncate w-full">{top3[1].username}</p>
            <p className="text-slate-300 text-[10px] mb-2">{top3[1].xp.toLocaleString()} XP</p>
            <div className="w-full h-16 rounded-t-lg bg-gradient-to-t from-slate-600/30 to-slate-400/20 border-t border-x border-slate-400/30 flex items-center justify-center">
              <Medal size={18} className="text-slate-300" />
            </div>
          </motion.div>

          {/* 1st place */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
            className="flex flex-col items-center w-32"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-2xl mb-1"
            >👑</motion.div>
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-400/60 flex items-center justify-center mb-2 text-2xl font-black text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              {top3[0].username.charAt(0)}
            </div>
            <p className="text-amber-light font-bold text-sm text-center truncate w-full">{top3[0].username}</p>
            <p className="text-yellow-400 text-[10px] mb-2">{top3[0].xp.toLocaleString()} XP</p>
            <div className="w-full h-24 rounded-t-lg bg-gradient-to-t from-amber-900/40 to-amber-700/20 border-t border-x border-yellow-500/30 flex items-center justify-center">
              <Crown size={22} className="text-yellow-400" />
            </div>
          </motion.div>

          {/* 3rd place */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-col items-center w-28"
          >
            <div className="w-14 h-14 rounded-full bg-orange-700/20 border-2 border-orange-600/50 flex items-center justify-center mb-2 text-xl font-bold text-orange-400">
              {top3[2].username.charAt(0)}
            </div>
            <p className="text-text-primary font-bold text-xs text-center truncate w-full">{top3[2].username}</p>
            <p className="text-orange-400 text-[10px] mb-2">{top3[2].xp.toLocaleString()} XP</p>
            <div className="w-full h-10 rounded-t-lg bg-gradient-to-t from-orange-900/30 to-orange-700/10 border-t border-x border-orange-600/30 flex items-center justify-center">
              <Medal size={16} className="text-orange-500" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Your rank highlight */}
      {myEntry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="evidence-card p-4 mb-5 flex items-center gap-4 bg-amber-glow/10 border-amber-glow/40"
        >
          <Star size={16} className="text-amber-glow flex-shrink-0 drop-shadow-[0_0_8px_rgba(200,134,10,0.8)]" />
          <p className="text-[#f5e6d3] font-detective text-sm flex-1 uppercase tracking-wider">
            Your Status: <span className="text-amber-light font-bold text-lg ml-2">#{myEntry.rank}</span> <span className="mx-2 text-[#5c432d]">|</span> <span className="font-mono">{myEntry.xp.toLocaleString()} XP</span>
          </p>
          <span className="text-[#a39171] text-xs font-mono border border-[#4a3520] px-2 py-1 bg-black">{myEntry.detective_rank}</span>
        </motion.div>
      )}

      {/* Tabs + Search */}
      <div className="flex items-center gap-3 mb-6 bg-[#1b1109] p-3 rounded border border-[#4a3520] shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
        <div className="flex gap-1">
          {(['global', 'weekly', 'subject'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${tab === t ? 'bg-amber-glow text-[#110a05] shadow-[0_0_10px_rgba(200,134,10,0.5)]' : 'bg-transparent text-[#a39171] hover:border-amber-dim'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 relative max-w-sm ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a39171]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="SEARCH DOSSIERS..."
            className="w-full input font-detective uppercase pl-9 bg-[#110a05] border-[#3b2b1d]"
          />
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="corkboard-panel p-6 pb-8 min-h-[400px]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-60 mix-blend-multiply pointer-events-none" />
        {isLoading ? (
          <div className="space-y-4 relative z-10">{[...Array(10)].map((_, i) => <div key={i} className="evidence-card h-16 shimmer" />)}</div>
        ) : (
          <div className="space-y-4 relative z-10">
            {entries.map((e, i) => {
              const isMe = e.user_id === user?.id
              return (
                <motion.div
                  key={e.user_id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className={`evidence-card flex items-center gap-4 p-4 transition-all ${isMe ? 'border-amber-glow/40 bg-[#3d270c]' : 'hover:border-amber-dim hover:-translate-x-0.5'}`}
                >
                  <RankBadge rank={e.rank} />

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-detective font-black text-lg border-2 shadow-sm ${isMe ? 'border-amber-glow bg-black text-amber-light shadow-amber' : 'border-[#4a3520] bg-black text-[#a39171]'}`}>
                    {e.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-detective font-bold text-sm tracking-wider flex items-center gap-2 ${isMe ? 'text-amber-light' : 'text-[#f5e6d3]'}`}>
                      {e.username}
                      {isMe && <span className="text-[9px] bg-red-700/20 text-red-500 px-1.5 py-0.5 rounded border border-red-700/30 uppercase font-mono tracking-widest font-bold">You</span>}
                    </p>
                    <p className="text-[#a39171] font-mono text-[10px] mt-0.5 uppercase tracking-widest">{e.detective_rank}</p>
                  </div>

                  <div className="flex items-center gap-6 flex-shrink-0 text-center border-l border-[#3b2b1d] pl-6">
                    <div>
                      <p className="text-[#f5e6d3] font-detective font-bold text-base">{e.cases_solved}</p>
                      <p className="text-[#7a5c3a] font-mono text-[9px] uppercase tracking-widest">Cases</p>
                    </div>
                    <div>
                      <p className="text-[#f5e6d3] font-detective font-bold text-base">Lv.{e.level}</p>
                      <p className="text-[#7a5c3a] font-mono text-[9px] uppercase tracking-widest">Level</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-glow bg-black border border-[#4a3520] px-3 py-1.5 rounded min-w-[90px] justify-center shadow-inner">
                      <Zap size={12} className="drop-shadow-[0_0_5px_rgba(200,134,10,0.8)]" />
                      <span className="font-bold text-sm font-mono tracking-wider">{e.xp.toLocaleString()}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}

          {!entries.length && (
            <div className="evidence-card p-14 text-center mt-4">
              <Trophy size={32} className="text-[#4a3520] mx-auto mb-3" />
              <p className="font-detective text-[#7a5c3a] text-sm uppercase tracking-widest">No dossiers found matching your search.</p>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  )
}
