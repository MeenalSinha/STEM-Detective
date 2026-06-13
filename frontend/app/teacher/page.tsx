'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teacherApi, api } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, Users, Sparkles, Copy, ChevronRight, BookOpen, BarChart3, Target, Brain } from 'lucide-react'
import { Subject, GradeLevel, Difficulty } from '@/types'

type Classroom = { id: string; name: string; grade_level: string; join_code: string; member_count: number }
type Student = { user_id: string; username: string; xp: number; level: number; detective_rank: string; cases_solved: number }

function ClassroomAnalytics({ classroomId }: { classroomId: string }) {
  const { data } = useQuery({ queryKey: ['classroom-students', classroomId], queryFn: () => api.get(`/teacher/classrooms/${classroomId}/students`) })
  const students: Student[] = data?.data || []
  const avgXP = students.length ? Math.round(students.reduce((a, s) => a + s.xp, 0) / students.length) : 0
  const avgCases = students.length ? Math.round(students.reduce((a, s) => a + s.cases_solved, 0) / students.length) : 0
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-primary rounded p-3 text-center"><p className="text-amber-light text-xl font-bold mono-text">{students.length}</p><p className="text-text-muted text-xs">Students</p></div>
        <div className="bg-bg-primary rounded p-3 text-center"><p className="text-amber-light text-xl font-bold mono-text">{avgCases}</p><p className="text-text-muted text-xs">Avg Cases Solved</p></div>
        <div className="bg-bg-primary rounded p-3 text-center"><p className="text-amber-light text-xl font-bold mono-text">{avgXP.toLocaleString()}</p><p className="text-text-muted text-xs">Avg XP</p></div>
      </div>
      <div className="space-y-2">
        {students.map(s => (
          <div key={s.user_id} className="flex items-center gap-3 bg-bg-primary rounded p-3">
            <div className="w-8 h-8 rounded-full bg-bg-overlay border border-border flex items-center justify-center flex-shrink-0"><span className="text-amber-light font-bold text-xs">{s.username.charAt(0).toUpperCase()}</span></div>
            <div className="flex-1 min-w-0"><p className="text-text-primary text-sm font-medium">{s.username}</p><p className="text-text-muted text-xs">{s.detective_rank}</p></div>
            <div className="flex items-center gap-4 flex-shrink-0 text-xs text-text-muted"><span>{s.cases_solved} cases</span><span className="text-xp font-medium">{s.xp.toLocaleString()} XP</span></div>
          </div>
        ))}
        {!students.length && <p className="text-text-muted text-sm text-center py-4">No students enrolled yet.</p>}
      </div>
    </div>
  )
}

function MysteryStudioModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ topic: '', subject: 'biology' as Subject, grade_level: 'middle' as GradeLevel, difficulty: 'medium' as Difficulty, duration_minutes: 45, learning_objectives: '' })
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const update = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const generate = async () => {
    if (!form.topic) { toast.error('Enter a topic'); return }
    setLoading(true)
    try {
      const res = await teacherApi.mysteryStudio({ ...form, learning_objectives: form.learning_objectives ? form.learning_objectives.split('\n').filter(Boolean) : [] })
      setResult(res.data); toast.success('Mystery package generated!')
    } catch { toast.error('Generation failed') } finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card w-full max-w-2xl p-6 my-4">
        <div className="flex items-center gap-2 mb-4"><Sparkles size={20} className="text-amber-glow" /><h2 className="display-text text-xl font-bold text-text-primary">Mystery Studio</h2></div>
        {!result ? (
          <div className="space-y-4">
            <div><label className="block text-text-secondary text-sm mb-1.5">Topic *</label><input className="input" placeholder="e.g. Newton Laws, Photosynthesis" value={form.topic} onChange={e => update('topic', e.target.value)} /></div>
            <div className="grid grid-cols-4 gap-3">
              {[{k:'subject',opts:['biology','chemistry','physics','mathematics','engineering','environmental']},{k:'grade_level',opts:['elementary','middle','high','college']},{k:'difficulty',opts:['easy','medium','hard','expert']}].map(({k,opts})=>(
                <div key={k}><label className="block text-text-secondary text-sm mb-1.5">{k.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</label>
                  <select className="input text-sm" value={String((form as Record<string,unknown>)[k])} onChange={e=>update(k,e.target.value)}>{opts.map(o=><option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}</select></div>
              ))}
              <div><label className="block text-text-secondary text-sm mb-1.5">Mins</label><input type="number" className="input text-sm" value={form.duration_minutes} onChange={e=>update('duration_minutes',Number(e.target.value))} /></div>
            </div>
            <div><label className="block text-text-secondary text-sm mb-1.5">Learning Objectives (one per line)</label><textarea className="input resize-none" rows={3} value={form.learning_objectives} onChange={e=>update('learning_objectives',e.target.value)} /></div>
            <div className="flex gap-3 mt-2">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={generate} disabled={loading} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading?<><span className="w-4 h-4 border-2 border-bg-primary/50 border-t-bg-primary rounded-full animate-spin"/>Generating...</>:<><Sparkles size={15}/>Generate Package</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card-elevated p-4"><p className="section-title mb-1 text-amber-glow">Mystery Generated</p><p className="text-text-primary font-bold text-lg">{(result.mystery as Record<string,string>)?.title}</p><p className="text-text-muted text-sm mt-0.5">{(result.mystery as Record<string,string>)?.tagline}</p></div>
            {result.teacher_guide && (
              <div className="card-elevated p-4">
                <div className="flex items-center gap-2 mb-3"><BookOpen size={14} className="text-amber-glow"/><p className="section-title text-amber-glow">Teacher Guide</p></div>
                <p className="text-text-secondary text-sm font-medium mb-2">Discussion Questions</p>
                {((result.teacher_guide as Record<string,string[]>)?.discussion_questions||[]).slice(0,4).map((q:string,i:number)=><p key={i} className="text-text-muted text-xs mb-1.5">• {q}</p>)}
              </div>
            )}
            <div className="flex gap-3"><button onClick={()=>setResult(null)} className="btn-secondary flex-1">Generate Another</button><button onClick={onClose} className="btn-primary flex-1">Done</button></div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function TeacherDashboardPage() {
  const [showStudio, setShowStudio] = useState(false)
  const [showClassroom, setShowClassroom] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState<string|null>(null)
  const [activeTab, setActiveTab] = useState<'classrooms'|'analytics'>('classrooms')
  const [newClassroom, setNewClassroom] = useState({ name: '', grade_level: 'middle' as GradeLevel })
  const qc = useQueryClient()
  const { data: classroomsRes, isLoading } = useQuery({ queryKey: ['classrooms'], queryFn: () => teacherApi.getClassrooms() })
  const createMutation = useMutation({ mutationFn: () => teacherApi.createClassroom(newClassroom), onSuccess: () => { toast.success('Classroom created!'); qc.invalidateQueries({queryKey:['classrooms']}); setShowClassroom(false); setNewClassroom({name:'',grade_level:'middle'}) }, onError: () => toast.error('Failed') })
  const classrooms: Classroom[] = classroomsRes?.data || []
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="display-text text-3xl font-bold text-text-primary">Teacher Hub</h1><p className="text-text-secondary text-sm mt-1">Manage classrooms, track learning outcomes, generate mysteries</p></div>
        <div className="flex gap-3">
          <button onClick={()=>setShowStudio(true)} className="btn-secondary flex items-center gap-2 text-sm"><Sparkles size={15}/>Mystery Studio</button>
          <button onClick={()=>setShowClassroom(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={15}/>New Classroom</button>
        </div>
      </div>
      <div className="flex gap-2 mb-5">
        {[{key:'classrooms',label:'Classrooms',icon:Users},{key:'analytics',label:'Learning Analytics',icon:BarChart3}].map(({key,label,icon:Icon})=>(
          <button key={key} onClick={()=>setActiveTab(key as 'classrooms'|'analytics')} className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium border transition-all ${activeTab===key?'bg-amber-glow/20 text-amber-light border-amber-glow/40':'bg-bg-tertiary text-text-muted border-border hover:border-amber-dim'}`}><Icon size={14}/>{label}</button>
        ))}
      </div>
      <AnimatePresence>
        {showClassroom && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden">
            <div className="card p-5 mb-5">
              <h3 className="text-text-primary font-semibold mb-4">Create New Classroom</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="col-span-2"><label className="block text-text-secondary text-sm mb-1.5">Classroom Name</label><input className="input" placeholder="Period 3 Biology" value={newClassroom.name} onChange={e=>setNewClassroom(p=>({...p,name:e.target.value}))} /></div>
                <div><label className="block text-text-secondary text-sm mb-1.5">Grade Level</label><select className="input" value={newClassroom.grade_level} onChange={e=>setNewClassroom(p=>({...p,grade_level:e.target.value as GradeLevel}))}>{['elementary','middle','high','college'].map(g=><option key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</option>)}</select></div>
              </div>
              <div className="flex gap-3"><button onClick={()=>setShowClassroom(false)} className="btn-secondary">Cancel</button><button onClick={()=>createMutation.mutate()} disabled={!newClassroom.name||createMutation.isPending} className="btn-primary disabled:opacity-50">{createMutation.isPending?'Creating...':'Create Classroom'}</button></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {activeTab==='classrooms' && (
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-5 space-y-3">
            {isLoading?[...Array(3)].map((_,i)=><div key={i} className="card h-24 shimmer"/>):classrooms.length===0?(
              <div className="card p-12 text-center"><Users size={36} className="text-text-muted mx-auto mb-3"/><p className="text-text-primary font-semibold mb-1">No Classrooms</p><p className="text-text-muted text-sm">Create your first classroom to get started.</p></div>
            ):classrooms.map(c=>(
              <button key={c.id} onClick={()=>setSelectedClassroom(c.id===selectedClassroom?null:c.id)} className={`card w-full text-left p-4 hover:border-amber-dim transition-all ${selectedClassroom===c.id?'border-amber-glow/40 bg-amber-glow/5':''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div><p className="text-text-primary font-bold">{c.name}</p><p className="text-text-muted text-xs capitalize mt-0.5">{c.grade_level} · {c.member_count} students</p></div>
                  <div className="flex items-center gap-1 bg-bg-overlay rounded px-2 py-1" onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(c.join_code);toast.success('Copied!')}}>
                    <span className="mono-text text-amber-light text-sm font-bold">{c.join_code}</span><Copy size={11} className="text-text-muted"/>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-light text-xs"><span>View students</span><ChevronRight size={12}/></div>
              </button>
            ))}
          </div>
          <div className="col-span-7">
            {selectedClassroom?(
              <div className="card p-5"><div className="flex items-center gap-2 mb-4"><Users size={16} className="text-amber-glow"/><h3 className="text-text-primary font-semibold">{classrooms.find(c=>c.id===selectedClassroom)?.name} — Students</h3></div><ClassroomAnalytics classroomId={selectedClassroom}/></div>
            ):(
              <div className="card p-10 text-center h-full flex flex-col items-center justify-center"><Target size={36} className="text-text-muted mb-3"/><p className="text-text-muted text-sm">Select a classroom to view student progress</p></div>
            )}
          </div>
        </div>
      )}
      {activeTab==='analytics' && (
        <div className="card p-8 text-center"><BarChart3 size={40} className="text-amber-glow mx-auto mb-4"/><h3 className="display-text text-lg font-bold text-text-primary mb-2">Learning Analytics</h3><p className="text-text-muted text-sm mb-4">Assign mysteries to see retention rates, NGSS standards coverage, and mastery data.</p><button onClick={()=>setShowStudio(true)} className="btn-primary inline-flex items-center gap-2"><Sparkles size={15}/>Generate a Mystery for Your Class</button></div>
      )}
      <AnimatePresence>{showStudio&&<MysteryStudioModal onClose={()=>setShowStudio(false)}/>}</AnimatePresence>
    </div>
  )
}
