'use client'

import { Target, Calendar, Flame, CheckCircle2, Zap, Clock, Star, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const DAILY_MISSIONS = [
  { id: 'd1', label: 'Collect 3 Evidence', progress: 2, total: 3, xp: 100, done: false, icon: '🔍' },
  { id: 'd2', label: 'Run a Lab Experiment', progress: 0, total: 1, xp: 150, done: false, icon: '🧪' },
  { id: 'd3', label: 'Solve a STEM Puzzle', progress: 1, total: 1, xp: 120, done: true, icon: '🧩' },
  { id: 'd4', label: 'Ask AI Assistant', progress: 1, total: 3, xp: 80, done: true, icon: '🤖' },
]

const WEEKLY_MISSIONS = [
  { id: 'w1', label: 'Complete 3 Active Cases', progress: 1, total: 3, xp: 1000, done: false, icon: '📁' },
  { id: 'w2', label: 'Achieve 100% Accuracy in Chemistry', progress: 85, total: 100, xp: 500, done: false, icon: '⚗️', isPercentage: true },
  { id: 'w3', label: 'Log in for 5 consecutive days', progress: 5, total: 5, xp: 300, done: true, icon: '📅' },
]

const SPECIAL_MISSIONS = [
  { id: 's1', label: 'The Quantum Anomalies Event', progress: 0, total: 1, xp: 2500, done: false, icon: '🌌', expireIn: '2 days' },
]

function MissionCard({ mission, delay, isSpecial }: { mission: any, delay: number, isSpecial?: boolean }) {
  const isDone = mission.done
  const percent = mission.isPercentage ? mission.progress : (mission.progress / mission.total) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`evidence-card p-5 relative overflow-hidden transition-all ${isDone ? 'opacity-60 grayscale-[0.2]' : 'hover:-translate-y-1'}`}
      style={{
        borderTopWidth: 3,
        borderTopColor: isDone ? '#10b981' : isSpecial ? '#ef4444' : '#a855f7'
      }}
    >
      <div className="flex items-start gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xl shadow-inner ${
          isDone ? 'bg-[#1f4a2d] border-[#10b981]/50' : 'bg-[#1a110d] border-[#3b2b1d]'
        }`}>
          {isDone ? <CheckCircle2 size={24} className="text-[#10b981]" /> : mission.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className={`font-detective font-bold uppercase tracking-widest text-sm ${isDone ? 'line-through text-[#a39171]' : 'text-[#f5e6d3]'}`}>
              {mission.label}
            </h3>
            <div className="flex items-center gap-1 bg-black border border-[#4a3520] px-2 py-0.5 rounded shadow-inner">
              <Zap size={10} className={isDone ? 'text-gray-500' : 'text-amber-glow'} />
              <span className={`text-[10px] font-mono font-bold ${isDone ? 'text-gray-500' : 'text-amber-glow'}`}>+{mission.xp}</span>
            </div>
          </div>
          
          {isSpecial && mission.expireIn && (
            <p className="text-crimson-glow text-[10px] font-mono flex items-center gap-1 mb-2 font-bold">
              <Clock size={10} /> EXPIRES IN: {mission.expireIn}
            </p>
          )}

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold tracking-widest uppercase text-[#d4b58e]">
                {isDone ? 'Mission Accomplished' : 'Progress'}
              </span>
              {!isDone && (
                <span className="text-[10px] font-mono text-[#a39171]">
                  {mission.isPercentage ? `${mission.progress}%` : `${mission.progress}/${mission.total}`}
                </span>
              )}
            </div>
            {!isDone && (
              <div className="h-1.5 bg-[#1a110d] rounded-full overflow-hidden border border-[#3b2b1d]">
                <div 
                  className={`h-full transition-all duration-1000 ${isSpecial ? 'bg-crimson-glow shadow-[0_0_8px_#ff4444]' : 'bg-[#a855f7] shadow-[0_0_8px_#a855f7]'}`} 
                  style={{ width: `${percent}%` }} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function MissionsPage() {
  const totalDailyXp = DAILY_MISSIONS.reduce((sum, m) => sum + m.xp, 0)
  const earnedDailyXp = DAILY_MISSIONS.filter(m => m.done).reduce((sum, m) => sum + m.xp, 0)

  return (
    <div className="p-6 text-text-primary max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-[#3b2b1d] pb-6">
        <div>
          <h1 className="font-detective text-4xl font-bold text-[#f5e6d3] flex items-center gap-3 uppercase tracking-widest">
            <Target size={32} className="text-[#a855f7]" /> Active Missions
          </h1>
          <p className="text-[#a39171] font-mono text-xs mt-3 uppercase tracking-widest bg-[#1b1109] inline-block px-4 py-1 border border-[#3b2b1d] rounded-sm">
            Execute objectives to earn clearance and XP.
          </p>
        </div>
        
        <div className="card px-5 py-4 flex items-center gap-6 mt-4 md:mt-0 bg-[#1a110d] border-[#4a3520] shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          <div>
            <p className="text-[10px] text-[#a39171] font-bold uppercase tracking-widest mb-1">Daily XP Recovered</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-mono text-amber-glow font-bold leading-none">{earnedDailyXp}</span>
              <span className="text-xs text-[#d4b58e] font-mono mb-0.5">/ {totalDailyXp}</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-full border-[3px] border-[#3b2b1d] relative flex items-center justify-center">
             <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="28" fill="none" stroke="#a855f7" strokeWidth="3" strokeDasharray="175" strokeDashoffset={175 - (175 * (earnedDailyXp / totalDailyXp))} className="transition-all duration-1000 ease-out" />
             </svg>
             <Flame size={20} className={earnedDailyXp === totalDailyXp ? 'text-amber-glow animate-pulse' : 'text-[#4a3520]'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Daily & Special */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Daily Missions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-detective text-xl font-bold text-[#d4b58e] uppercase tracking-widest flex items-center gap-2">
                <Target size={18} className="text-[#a855f7]" /> Daily Directives
              </h2>
              <span className="text-[10px] font-mono text-[#a39171] uppercase tracking-widest">Resets in 14:22:05</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DAILY_MISSIONS.map((m, i) => (
                <MissionCard key={m.id} mission={m} delay={i * 0.05} />
              ))}
            </div>
          </section>

          {/* Special Event Missions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-detective text-xl font-bold text-crimson-glow uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_5px_rgba(255,68,68,0.5)]">
                <Star size={18} /> Classified Events
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {SPECIAL_MISSIONS.map((m, i) => (
                <MissionCard key={m.id} mission={m} delay={0.2 + (i * 0.05)} isSpecial />
              ))}
            </div>
          </section>
        </div>

        {/* Right Col: Weekly */}
        <div className="space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-detective text-xl font-bold text-[#d4b58e] uppercase tracking-widest flex items-center gap-2">
                <Calendar size={18} className="text-[#3b82f6]" /> Weekly Operations
              </h2>
              <span className="text-[10px] font-mono text-[#a39171] uppercase tracking-widest">Resets in 3 days</span>
            </div>
            <div className="flex flex-col gap-4">
              {WEEKLY_MISSIONS.map((m, i) => (
                <MissionCard key={m.id} mission={m} delay={0.1 + (i * 0.05)} />
              ))}
            </div>
          </section>

          {/* Call to action */}
          <div className="bg-[#110a05] border border-[#2d1c0a] rounded-xl p-6 text-center shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            <div className="relative z-10">
              <h3 className="font-detective font-bold text-[#f5e6d3] text-lg uppercase tracking-widest mb-2">Need More XP?</h3>
              <p className="text-[#a39171] text-xs mb-4">Take on additional cases from the active board.</p>
              <Link href="/cases" className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4 uppercase tracking-widest">
                Browse Cases <ArrowRight size={14} />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
