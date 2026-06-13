'use client'

import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Award, Shield, Zap, Lock } from 'lucide-react'
import { useState } from 'react'

const BADGE_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
}

const BADGE_TIERS = ['bronze', 'silver', 'gold', 'platinum']



function AchievementCard({ achievement, earned, index }: {
  achievement: { name: string; description: string; badge_type: string; xp_reward: number; icon?: string; earned_at?: string }
  earned: boolean
  index: number
}) {
  const color = BADGE_COLORS[achievement.badge_type] || '#c8860a'
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`evidence-card text-center relative overflow-hidden transition-all ${earned ? 'hover:-translate-y-1' : 'opacity-50'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow effect when earned + hovered */}
      {earned && hovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 70%)` }}
        />
      )}

      {/* Badge icon */}
      <div className="relative inline-block mb-3">
        <motion.div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{
            background: earned ? `${color}20` : '#1a1008',
            border: `2px solid ${earned ? color : '#2d1c0a'}`,
            boxShadow: earned && hovered ? `0 0 20px ${color}50` : 'none',
          }}
          animate={earned ? { scale: hovered ? 1.1 : 1 } : {}}
        >
          {achievement.icon ? (
            <span className="text-2xl">{achievement.icon}</span>
          ) : (
            <Trophy size={24} style={{ color: earned ? color : '#3a2410' }} />
          )}
        </motion.div>
        {!earned && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full">
            <Lock size={14} className="text-text-muted" />
          </div>
        )}
        {/* Tier badge */}
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black border border-bg-secondary"
          style={{ background: color }}
        >
          {achievement.badge_type === 'bronze' ? 'B' : achievement.badge_type === 'silver' ? 'S' : achievement.badge_type === 'gold' ? 'G' : 'P'}
        </div>
      </div>

      <p className={`font-detective font-bold text-sm mb-1 tracking-widest uppercase ${earned ? 'text-[#f5e6d3]' : 'text-text-muted'}`}>{achievement.name}</p>
      <p className="text-[#a39171] font-mono text-[10px] leading-relaxed mb-3 uppercase tracking-wider">{achievement.description}</p>

      <div className="flex items-center justify-center gap-2">
        <span className="text-xp text-xs flex items-center gap-0.5">
          <Zap size={10} />+{achievement.xp_reward} XP
        </span>
        {earned && achievement.earned_at && (
          <span className="text-text-dim text-[10px]">· {new Date(achievement.earned_at).toLocaleDateString()}</span>
        )}
      </div>

      {earned && (
        <motion.div
          className="absolute top-2 right-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: index * 0.04 + 0.2 }}
        >
          <div className="w-5 h-5 rounded-full bg-amber-glow/20 border border-amber-glow/50 flex items-center justify-center">
            <span className="text-amber-glow text-[9px] font-black">✓</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default function AchievementsPage() {
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [showOnlyEarned, setShowOnlyEarned] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => usersApi.getAchievements(),
  })

  const earned = data?.data?.earned || []
  const available = data?.data?.available || []

  // Merge API achievements with predefined ones for display
  const allAchievements = available || []
  const earnedIds = new Set(earned.map((a: { id: string }) => a.id))

  const filtered = allAchievements.filter((a: { badge_type: string; earned?: boolean }) =>
    (tierFilter === 'all' || a.badge_type === tierFilter) &&
    (!showOnlyEarned || a.earned || earnedIds.has((a as { id?: string }).id || ''))
  )

  const totalXp = earned.reduce((sum: number, a: { xp_reward: number }) => sum + (a.xp_reward || 0), 0)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-[#3b2b1d] pb-6">
        <div>
          <h1 className="font-detective text-4xl font-bold text-[#f5e6d3] flex items-center gap-3 uppercase tracking-widest">
            <Trophy size={32} className="text-amber-glow" />Achievements
          </h1>
          <p className="text-[#a39171] font-mono text-xs mt-3 uppercase tracking-widest bg-[#1b1109] inline-block px-4 py-1 border border-[#3b2b1d] rounded-sm">
            <span className="text-amber-light font-bold">{earned.length}</span> SECURED <span className="mx-2">|</span>{' '}
            <span className="text-amber-glow font-bold">{totalXp.toLocaleString()} XP</span> RECOVERED
          </p>
        </div>

        {/* Progress overview */}
        <div className="card px-5 py-3 flex items-center gap-5">
          {BADGE_TIERS.map(tier => {
            const count = allAchievements.filter((a: { badge_type: string }) => a.badge_type === tier).length
            const earnedCount = earned.filter((a: { badge_type: string }) => a.badge_type === tier).length
            return (
              <div key={tier} className="text-center">
                <div className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-base" style={{ background: `${BADGE_COLORS[tier]}20`, border: `1.5px solid ${BADGE_COLORS[tier]}` }}>
                  {tier === 'bronze' ? '🥉' : tier === 'silver' ? '🥈' : tier === 'gold' ? '🥇' : '💎'}
                </div>
                <p className="text-xs font-bold" style={{ color: BADGE_COLORS[tier] }}>{earnedCount}/{count}</p>
                <p className="text-text-dim text-[10px] capitalize">{tier}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recently Earned - spotlight section */}
      {earned.length > 0 && (
        <section className="mb-10 bg-[#1b1109] p-5 rounded border border-[#4a3520] shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
          <p className="font-detective text-amber-glow font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Star size={16} /> RECENT DECLASSIFICATIONS</p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {earned.slice(0, 5).map((a: { id: string; name: string; description: string; badge_type: string; xp_reward: number; earned_at?: string }, i: number) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.08, type: 'spring' }}
                className="evidence-card p-4 text-center flex-shrink-0 w-40 bg-[#2a1e12] border border-[#4a3520]"
                style={{ borderTopColor: BADGE_COLORS[a.badge_type], borderTopWidth: 4 }}
              >
                <div className="text-3xl mb-2 drop-shadow-[0_0_8px_rgba(200,134,10,0.5)]">🏅</div>
                <p className="font-detective text-[#f5e6d3] font-bold text-xs uppercase tracking-widest line-clamp-2 leading-tight min-h-[2rem]">{a.name}</p>
                <p className="text-amber-glow font-mono text-[10px] mt-2 flex items-center justify-center gap-1 bg-black border border-[#4a3520] py-1 rounded shadow-inner font-bold"><Zap size={10} />+{a.xp_reward}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-2">
          {['all', ...BADGE_TIERS].map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest border transition-all ${tierFilter === t ? 'bg-amber-glow text-black border-amber-glow shadow-[0_0_10px_rgba(200,134,10,0.5)]' : 'bg-[#1b1109] text-[#a39171] border-[#3b2b1d] hover:border-amber-dim'}`}
            >
              {t === 'all' ? 'All Classes' : `Class ${t.charAt(0).toUpperCase()}`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowOnlyEarned(!showOnlyEarned)}
          className={`ml-auto px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest border transition-all ${showOnlyEarned ? 'bg-green-700/20 text-green-500 border-green-700' : 'bg-[#1b1109] text-[#a39171] border-[#3b2b1d] hover:border-amber-dim'}`}
        >
          {showOnlyEarned ? '✓ Acquired Only' : 'Show All'}
        </button>
      </div>

      {/* Achievement Grid */}
      {isLoading ? (
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="card h-44 shimmer" />)}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div layout className="grid grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((a: { id?: string; name: string; description: string; badge_type: string; xp_reward: number; earned?: boolean; earned_at?: string }, i: number) => (
              <AchievementCard
                key={a.id || a.name}
                achievement={a}
                earned={Boolean(a.earned) || earnedIds.has(a.id || '')}
                index={i}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Shield size={40} className="text-text-muted mx-auto mb-4" />
          <p className="text-text-muted text-sm">No achievements match your filters.</p>
        </div>
      )}
    </div>
  )
}
