'use client'

import { useQuery } from '@tanstack/react-query'
import { casesApi, usersApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import { Case, UserStats } from '@/types'
import Link from 'next/link'
import { motion, useSpring, useTransform, useMotionValue, animate } from 'framer-motion'
import { useEffect } from 'react'
import {
  Zap, Gem, ArrowRight, FlaskConical,
  Microscope, Atom, Leaf, Pin, Gift, Target, CheckCircle2, Clock,
  Flame, TrendingUp, Trophy, FolderOpen, Network, Users
} from 'lucide-react'

const LAB_MODULES = [
  { key: 'chemistry', label: 'Chemistry Lab', Icon: FlaskConical, color: '#a855f7' }, 
  { key: 'biology', label: 'Biology Lab', Icon: Microscope, color: '#10b981' },     
  { key: 'physics', label: 'Physics Lab', Icon: Atom, color: '#3b82f6' },           
  { key: 'environmental', label: 'Environment Lab', Icon: Leaf, color: '#f59e0b' }, 
]

const DAILY_MISSIONS = [
  { label: 'Collect 3 Evidence', progress: 2, total: 3, xp: 100, done: false },
  { label: 'Run a Lab Experiment', progress: 0, total: 1, xp: 150, done: false },
  { label: 'Solve a STEM Puzzle', progress: 1, total: 1, xp: 120, done: true },
  { label: 'Ask AI Assistant', progress: 1, total: 3, xp: 80, done: true },
]

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: casesRes } = useQuery<{ data: Case[] }>({
    queryKey: ['cases', 'active'],
    queryFn: () => casesApi.list('active'),
  })

  const { data: statsRes } = useQuery<{ data: UserStats }>({
    queryKey: ['user-stats'],
    queryFn: () => usersApi.getStats(),
  })

  const { data: graphRes } = useQuery({
    queryKey: ['knowledge-graph'],
    queryFn: () => usersApi.getKnowledgeGraph(),
  })

  const activeCases = casesRes?.data || []
  const stats = statsRes?.data

  const dailyCaseSolved = stats?.cases_solved || 0

  return (
    <div className="pb-12 text-text-primary">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* --- LEFT COLUMN --- */}
        <div className="col-span-1 md:col-span-5 flex flex-col gap-6">
          
          {/* Active Cases */}
          <div className="bg-[#1b1109] rounded-xl border border-[#4a3520] shadow-[0_4px_20px_rgba(0,0,0,0.8)] p-5 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="flex items-center gap-2 font-display text-lg text-[#d4b58e] font-bold">
                <FolderOpen size={18} /> Active Cases
              </h3>
              <Link href="/cases" className="text-[#a39171] hover:text-[#f5e6d3] transition-colors text-xs font-bold tracking-wider flex items-center gap-1">
                View All Cases <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="space-y-4 flex-1">
              {activeCases.length === 0 ? (
                <div className="text-center p-6 text-text-muted text-sm border border-[#4a3520] border-dashed rounded-xl">
                  No active cases. <br/><Link href="/cases" className="text-amber-light underline mt-2 inline-block">Start an investigation</Link>.
                </div>
              ) : (
                activeCases.slice(0, 2).map((c, i) => (
                  <div key={c.id} className="bg-[#2a1e12] border border-[#3b2b1d] rounded-lg p-3 flex gap-4 hover:border-[#5c432d] transition-colors cursor-pointer group relative shadow-md">
                    <div className="w-24 h-24 bg-white flex flex-col justify-end p-1 pb-2 shadow-lg rotate-[-2deg] flex-shrink-0 relative">
                       <div className="pin bg-crimson-glow shadow-crimson w-2.5 h-2.5 rounded-full absolute -top-1 left-1/2 -translate-x-1/2 z-10" />
                       <div className="w-full h-16 bg-[#1a1a1a] mb-1 flex items-center justify-center overflow-hidden border border-gray-200">
                          {c.subject === 'physics' && <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop" className="opacity-70 object-cover w-full h-full sepia-[0.3]" />}
                          {c.subject === 'environmental' && <img src="https://images.unsplash.com/photo-1611273426858-450d8ce80f26?q=80&w=200&auto=format&fit=crop" className="opacity-70 object-cover w-full h-full sepia-[0.3]" />}
                          {c.subject === 'chemistry' && <img src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=200&auto=format&fit=crop" className="opacity-70 object-cover w-full h-full sepia-[0.3]" />}
                       </div>
                       <span className="absolute -bottom-2 -right-2 w-6 h-6 rounded bg-yellow-300 text-black font-detective font-bold text-sm flex items-center justify-center rotate-12 shadow-sm border border-yellow-500">
                         {i + 1}
                       </span>
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="px-2 py-0.5 bg-[#1f4a2d] text-[#6ee7b7] rounded text-[9px] font-bold uppercase tracking-wider border border-[#10b981]/30">
                          {c.subject}
                        </span>
                        {i === 0 && (
                          <div className="absolute -top-3 -right-2 px-2 py-1 bg-[#fff8dc] text-red-700 rounded-sm text-[10px] font-detective font-bold shadow-md rotate-6 border border-[#e5d5a8] flex items-center">
                             <Pin size={10} className="mr-1 text-red-600" /> NEW CLUE!
                          </div>
                        )}
                      </div>
                      <h4 className="font-display text-[#f5e6d3] text-sm font-semibold truncate mt-1">{c.title}</h4>
                      <p className="text-xs text-[#a39171] truncate mb-3">{c.story?.slice(0, 80)}...</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#1a110d] rounded-full overflow-hidden border border-[#3b2b1d]">
                          <div className="h-full bg-amber-glow shadow-[0_0_8px_#c8860a]" style={{ width: `${c.progress_percentage}%` }}></div>
                        </div>
                        <span className="text-[10px] font-mono text-[#a39171]">{Math.round(c.progress_percentage)}%</span>
                        <Link href={`/cases/${c.id}`} className="border border-[#4a3520] text-[#d4b58e] hover:bg-[#3b2b1d] text-[10px] uppercase px-3 py-1 rounded transition-colors">
                          Continue Case
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* STEM Crime Lab */}
          <div className="bg-[#1b1109] rounded-xl border border-[#4a3520] shadow-[0_4px_20px_rgba(0,0,0,0.8)] p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="flex items-center gap-2 font-display text-lg text-[#d4b58e] font-bold">
                 <FlaskConical size={18} /> STEM Crime Lab
               </h3>
               <Link href="/lab" className="text-[#a39171] hover:text-[#f5e6d3] transition-colors text-xs font-bold tracking-wider flex items-center gap-1">
                  Enter Lab <ArrowRight size={14} />
               </Link>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {LAB_MODULES.map((m) => (
                <Link key={m.key} href={`/lab?module=${m.key}`} className="bg-[#110a05] border border-[#2d1c0a] rounded-lg p-3 flex flex-col items-center justify-center hover:bg-[#1a110d] transition-all group relative overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: m.color }} />
                  <span className="mb-2 group-hover:scale-110 transition-transform">
                    <m.Icon size={32} style={{ color: m.color, filter: `drop-shadow(0 0 10px ${m.color}90)` }} />
                  </span>
                  <span className="text-[9px] text-center font-bold uppercase tracking-wider text-[#a39171] group-hover:text-white mt-1">
                    {m.label.replace(' Lab', '')}<br/>Lab
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* AI Detective Assistant */}
          <div className="bg-[#1b1109] rounded-xl p-4 flex items-center gap-4 border border-[#4a3520] border-l-4 border-l-crimson-glow shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
            <div className="w-14 h-14 rounded-full border border-[#4a3520] flex items-center justify-center flex-shrink-0 overflow-hidden bg-black">
              <img src="/raccoon-detective.webp" alt="AI" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=AI&background=1a1008&color=c8860a' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#f5e6d3] font-bold text-sm">AI Detective Assistant</p>
              <p className="text-[#a39171] text-[11px] mt-0.5">Need a hint or guidance?<br/>I'll never give answers, only clues.</p>
            </div>
            <Link href={activeCases[0] ? `/cases/${activeCases[0].id}` : '/cases'} className="bg-transparent border border-crimson-glow text-crimson-glow text-[10px] px-3 py-1.5 rounded font-bold uppercase hover:bg-crimson-glow hover:text-white transition-colors flex-shrink-0 shadow-[0_0_10px_rgba(255,68,68,0.2)]">
              Ask Assistant
            </Link>
          </div>

        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="col-span-1 md:col-span-7 flex flex-col gap-6">

          {/* Evidence Board */}
          <div className="bg-[#1b1109] rounded-xl border border-[#4a3520] shadow-[0_4px_20px_rgba(0,0,0,0.8)] p-5 flex flex-col flex-1 relative">
            <div className="flex justify-between items-center mb-4 z-20">
              <h3 className="flex items-center gap-2 font-display text-lg text-[#d4b58e] font-bold">
                <Pin size={18} className="text-crimson-glow drop-shadow-[0_0_5px_rgba(255,68,68,0.5)]" /> Evidence Board
              </h3>
              <Link href="/evidence" className="text-[#a39171] hover:text-[#f5e6d3] transition-colors text-xs font-bold tracking-wider flex items-center gap-1">
                Open Board <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="corkboard rounded-xl relative flex-1 min-h-[340px] border-[6px] border-[#221508] shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] opacity-60 mix-blend-multiply" />
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ filter: 'drop-shadow(2px 4px 4px rgba(0,0,0,0.6))' }}>
                 <line x1="25%" y1="35%" x2="55%" y2="60%" stroke="#e53935" strokeWidth="2.5" strokeLinecap="round" />
                 <line x1="75%" y1="25%" x2="55%" y2="60%" stroke="#e53935" strokeWidth="2.5" strokeLinecap="round" />
                 <line x1="30%" y1="75%" x2="55%" y2="60%" stroke="#e53935" strokeWidth="2.5" strokeLinecap="round" />
                 <circle cx="55%" cy="60%" r="18" stroke="#e53935" strokeWidth="3" fill="transparent" strokeDasharray="6,4" />
                 <path d="M calc(55% - 8px) calc(60% - 8px) L calc(55% + 8px) calc(60% + 8px) M calc(55% - 8px) calc(60% + 8px) L calc(55% + 8px) calc(60% - 8px)" stroke="#e53935" strokeWidth="3" />
              </svg>
              
              {/* Polaroids */}
              <div className="absolute top-[15%] left-[10%] w-32 bg-[#f8f9fa] p-2 pb-6 shadow-[4px_6px_12px_rgba(0,0,0,0.6)] rotate-[-6deg] z-20">
                 <div className="pin bg-[#e53935] shadow-[0_4px_4px_rgba(0,0,0,0.5)] w-3 h-3 rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2">
                   <div className="w-1 h-1 bg-white/50 rounded-full absolute top-0.5 left-0.5" />
                 </div>
                 <div className="h-20 bg-black mb-2 flex items-center justify-center overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1582488815159-847e1121d102?q=80&w=200&auto=format&fit=crop" className="opacity-80 sepia-[0.5] grayscale-[0.5]" />
                 </div>
                 <p className="text-black font-detective font-bold text-[11px] text-center leading-none mt-1">Water Sample<br/><span className="text-red-700 font-mono text-[10px]">pH: 2.1</span></p>
              </div>

              <div className="absolute top-[18%] right-[15%] bg-[#ffeaa7] p-3 shadow-[3px_5px_10px_rgba(0,0,0,0.5)] rotate-[8deg] z-20 w-28">
                 <div className="pin bg-[#e53935] shadow-[0_4px_4px_rgba(0,0,0,0.5)] w-3 h-3 rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2">
                   <div className="w-1 h-1 bg-white/50 rounded-full absolute top-0.5 left-0.5" />
                 </div>
                 <p className="text-black font-detective text-xs text-center leading-tight">Unknown<br/>Chemical<br/>Barrels</p>
              </div>

              <div className="absolute top-[35%] left-[38%] bg-[#fef08a] px-3 py-2 shadow-[2px_4px_8px_rgba(0,0,0,0.4)] rotate-[-4deg] z-30">
                 <div className="w-8 h-3 bg-white/40 absolute -top-1.5 left-1/2 -translate-x-1/2 rotate-[-2deg] shadow-sm" />
                 <p className="text-black font-detective text-[11px] font-bold">Possible Chemical Leak?</p>
              </div>

              <div className="absolute bottom-[10%] left-[15%] bg-[#f8f9fa] w-32 p-3 shadow-[4px_6px_12px_rgba(0,0,0,0.6)] rotate-[3deg] z-20 border-l-4 border-l-blue-600">
                 <div className="pin bg-[#e53935] shadow-[0_4px_4px_rgba(0,0,0,0.5)] w-3 h-3 rounded-full absolute -top-1.5 right-3">
                   <div className="w-1 h-1 bg-white/50 rounded-full absolute top-0.5 left-0.5" />
                 </div>
                 <p className="text-black font-detective font-bold text-[11px] mb-1 underline">Lab Report</p>
                 <p className="text-gray-800 font-detective text-[10px] leading-tight italic">Suspicious levels of Sulfur and Lead.</p>
              </div>

              <div className="absolute bottom-[10%] right-[20%] w-28 bg-[#f8f9fa] p-2 pb-6 shadow-[4px_6px_12px_rgba(0,0,0,0.6)] rotate-[-4deg] z-20">
                 <div className="pin bg-[#e53935] shadow-[0_4px_4px_rgba(0,0,0,0.5)] w-3 h-3 rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2">
                   <div className="w-1 h-1 bg-white/50 rounded-full absolute top-0.5 left-0.5" />
                 </div>
                 <div className="h-16 bg-black mb-2 flex items-center justify-center overflow-hidden">
                   <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop" className="opacity-80 sepia-[0.8] grayscale contrast-125" />
                 </div>
                 <p className="text-black font-detective font-bold text-[11px] text-center leading-tight">Witness<br/><span className="font-normal text-[9px]">Saw a truck...</span></p>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Knowledge Graph Mini */}
            <div className="bg-[#1b1109] rounded-xl border border-[#4a3520] shadow-[0_4px_20px_rgba(0,0,0,0.8)] p-5 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center gap-2 font-display text-lg text-[#d4b58e] font-bold">
                  <Network size={18} /> Knowledge Graph
                </h3>
                <Link href="/knowledge-graph" className="text-[#a39171] hover:text-[#f5e6d3] transition-colors text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                  Explore <ArrowRight size={12} />
                </Link>
              </div>
              <div className="bg-[#0a0f12] rounded-lg overflow-hidden border border-[#1f2937] h-[200px] relative flex items-center justify-center shadow-inner">
                 <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                   <line x1="50%" y1="50%" x2="25%" y2="30%" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
                   <line x1="50%" y1="50%" x2="75%" y2="30%" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
                   <line x1="50%" y1="50%" x2="25%" y2="70%" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" />
                   <line x1="50%" y1="50%" x2="75%" y2="70%" stroke="#a855f7" strokeWidth="1" strokeDasharray="3,3" />
                 </svg>
                 <div className="absolute top-[20%] left-[20%] text-center"><div className="w-8 h-8 rounded-full border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] bg-[#061c13] mx-auto flex items-center justify-center"><Leaf size={14} className="text-emerald-500" /></div><p className="text-[9px] text-[#9ca3af] mt-1 font-mono">Food Chain</p></div>
                 <div className="absolute top-[20%] right-[20%] text-center"><div className="w-8 h-8 rounded-full border border-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] bg-[#1c1106] mx-auto flex items-center justify-center"><Users size={14} className="text-orange-500" /></div><p className="text-[9px] text-[#9ca3af] mt-1 font-mono">Human Impact</p></div>
                 <div className="absolute bottom-[20%] left-[20%] text-center"><div className="w-8 h-8 rounded-full border border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] bg-[#06111c] mx-auto flex items-center justify-center"><FlaskConical size={14} className="text-blue-500" /></div><p className="text-[9px] text-[#9ca3af] mt-1 font-mono">Pollution</p></div>
                 <div className="absolute bottom-[20%] right-[20%] text-center"><div className="w-8 h-8 rounded-full border border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] bg-[#13061c] mx-auto flex items-center justify-center"><Zap size={14} className="text-purple-500" /></div><p className="text-[9px] text-[#9ca3af] mt-1 font-mono">Water Quality</p></div>
                 
                 <div className="absolute top-[40%] left-[42%] text-center z-10"><div className="w-12 h-12 rounded-full border border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)] bg-[#051a0d] mx-auto flex items-center justify-center"><Network size={20} className="text-green-400" /></div><p className="text-[10px] text-green-400 font-bold mt-1 font-mono">Ecosystems</p></div>
              </div>
            </div>

            {/* Today's Missions */}
            <div className="bg-[#1b1109] rounded-xl border border-[#4a3520] shadow-[0_4px_20px_rgba(0,0,0,0.8)] p-5 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center gap-2 font-display text-lg text-[#d4b58e] font-bold">
                  <Target size={18} /> Today's Missions
                </h3>
              </div>
              <div className="space-y-3 flex-1">
                {DAILY_MISSIONS.map((m, i) => (
                  <div key={i} className={`bg-[#2a1e12] border border-[#3b2b1d] rounded-lg p-2.5 flex items-center gap-3 ${m.done ? 'opacity-60' : ''}`}>
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      m.done ? 'bg-[#1f4a2d] border-[#10b981]/50 text-[#10b981]' : 'bg-[#1a110d] border-[#a855f7]/50 text-[#a855f7]'
                    }`}>
                      {m.done ? <CheckCircle2 size={14} /> : <Target size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-bold ${m.done ? 'line-through text-[#a39171]' : 'text-[#f5e6d3]'}`}>
                        {m.label}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        {!m.done ? (
                          <div className="flex-1 mr-3 h-1 bg-[#1a110d] rounded-full overflow-hidden border border-[#3b2b1d]">
                            <div className="h-full bg-[#a855f7]" style={{ width: `${(m.progress / m.total) * 100}%` }} />
                          </div>
                        ) : (
                          <span className="text-[9px] text-[#10b981] font-mono">COMPLETED</span>
                        )}
                        {!m.done && <span className="text-[9px] font-mono text-[#a39171]">{m.progress}/{m.total}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] text-[#a39171] font-bold">XP</span>
                      <span className="text-[#a855f7] text-xs font-mono font-bold">{m.xp}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/achievements" className="bg-[#2a1e12] hover:bg-[#3b2b1d] text-[#d4b58e] text-center border border-[#4a3520] rounded-lg py-1.5 mt-4 text-[10px] font-bold uppercase tracking-widest transition-colors">
                View All Missions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
