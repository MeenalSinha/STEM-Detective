'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/lib/store/auth'
import {
  Settings, Moon, Sun, Type, Eye, Volume2, VolumeX, Keyboard,
  User, Bell, Shield, ChevronRight, Check, Palette, Accessibility
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'

type FontSize = 'sm' | 'md' | 'lg' | 'xl'
type ColorMode = 'default' | 'colorblind-deuteranopia' | 'colorblind-protanopia' | 'high-contrast'

interface AccessibilitySettings {
  fontSize: FontSize
  dyslexiaFont: boolean
  colorMode: ColorMode
  ttsEnabled: boolean
  reduceMotion: boolean
  keyboardNav: boolean
}

const FONT_SIZES: { id: FontSize; label: string; preview: string }[] = [
  { id: 'sm', label: 'Small', preview: 'Aa' },
  { id: 'md', label: 'Medium', preview: 'Aa' },
  { id: 'lg', label: 'Large', preview: 'Aa' },
  { id: 'xl', label: 'X-Large', preview: 'Aa' },
]

const COLOR_MODES: { id: ColorMode; label: string; desc: string; preview: string[] }[] = [
  { id: 'default', label: 'Default', desc: 'Standard detective theme', preview: ['#c8860a', '#22a066', '#3b82f6'] },
  { id: 'colorblind-deuteranopia', label: 'Deuteranopia', desc: 'Green-blind friendly', preview: ['#f59e0b', '#1d4ed8', '#7c3aed'] },
  { id: 'colorblind-protanopia', label: 'Protanopia', desc: 'Red-blind friendly', preview: ['#f59e0b', '#0ea5e9', '#8b5cf6'] },
  { id: 'high-contrast', label: 'High Contrast', desc: 'Maximum visibility', preview: ['#ffffff', '#ffff00', '#00ffff'] },
]

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Data', icon: Shield },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-amber-glow' : 'bg-bg-overlay border border-border'}`}
    >
      <motion.div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ left: checked ? '22px' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    grade_level: user?.grade_level || 'middle',
  })

  const [a11y, setA11y] = useState<AccessibilitySettings>({
    fontSize: 'md',
    dyslexiaFont: false,
    colorMode: 'default',
    ttsEnabled: false,
    reduceMotion: false,
    keyboardNav: false,
  })

  const [notifications, setNotifications] = useState({
    newClues: true,
    xpMilestones: true,
    classroomActivity: true,
    dailyReminders: false,
    weeklyReport: true,
  })

  const applyA11y = (settings: AccessibilitySettings) => {
    const root = document.documentElement
    const fontSizeMap: Record<FontSize, string> = { sm: '14px', md: '16px', lg: '18px', xl: '20px' }
    root.style.fontSize = fontSizeMap[settings.fontSize]
    if (settings.dyslexiaFont) {
      root.style.fontFamily = '"OpenDyslexic", "Comic Sans MS", cursive'
    } else {
      root.style.fontFamily = ''
    }
    if (settings.reduceMotion) {
      root.style.setProperty('--motion-duration', '0ms')
    } else {
      root.style.removeProperty('--motion-duration')
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await authApi.updateProfile(profile)
      updateUser(profile)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const updateA11y = (update: Partial<AccessibilitySettings>) => {
    const next = { ...a11y, ...update }
    setA11y(next)
    applyA11y(next)
    toast.success('Setting applied', { duration: 1500 })
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="display-text text-3xl font-bold text-text-primary flex items-center gap-3">
          <Settings size={28} className="text-amber-glow" />Settings
        </h1>
        <p className="text-text-secondary text-sm mt-1">Customize your detective experience</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? 'bg-amber-glow/15 text-amber-light border border-amber-glow/30' : 'text-text-muted hover:text-text-primary hover:bg-bg-overlay'}`}
            >
              <t.icon size={16} />
              {t.label}
              {activeTab === t.id && <ChevronRight size={13} className="ml-auto" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {/* Profile */}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="card p-6">
                  <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2"><User size={16} className="text-amber-glow" />Detective Profile</h2>
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-20 h-20 rounded-full bg-amber-glow/20 border-2 border-amber-glow/40 flex items-center justify-center text-3xl font-black text-amber-glow display-text">
                      {user?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-text-primary font-bold text-lg">{user?.username}</p>
                      <p className="text-text-muted text-sm">{user?.detective_rank}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge bg-amber-glow/20 text-amber-light border border-amber-glow/30 text-xs">Level {user?.level}</span>
                        <span className="text-text-muted text-xs">{user?.xp?.toLocaleString()} XP</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-secondary text-sm mb-1.5">Full Name</label>
                      <input className="input" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-text-secondary text-sm mb-1.5">Username</label>
                      <input className="input" value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-text-secondary text-sm mb-1.5">Grade Level</label>
                      <select className="input" value={profile.grade_level} onChange={e => setProfile(p => ({ ...p, grade_level: e.target.value }))}>
                        {['elementary', 'middle', 'high', 'college'].map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-text-secondary text-sm mb-1.5">Email</label>
                      <input className="input opacity-60" value={user?.email || ''} disabled />
                    </div>
                  </div>
                  <button onClick={handleSaveProfile} disabled={saving} className="btn-primary mt-5 disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Accessibility */}
            {activeTab === 'accessibility' && (
              <motion.div key="a11y" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="card p-6">
                  <h2 className="text-text-primary font-semibold mb-5 flex items-center gap-2"><Type size={16} className="text-amber-glow" />Text & Reading</h2>

                  {/* Font size */}
                  <div className="mb-5">
                    <p className="text-text-secondary text-sm mb-3">Font Size</p>
                    <div className="grid grid-cols-4 gap-2">
                      {FONT_SIZES.map(f => (
                        <button
                          key={f.id}
                          onClick={() => updateA11y({ fontSize: f.id })}
                          className={`p-3 rounded-lg border text-center transition-all ${a11y.fontSize === f.id ? 'border-amber-glow/50 bg-amber-glow/10' : 'border-border bg-bg-tertiary hover:border-amber-dim'}`}
                        >
                          <span className="block text-text-primary font-bold" style={{ fontSize: f.id === 'sm' ? 12 : f.id === 'md' ? 16 : f.id === 'lg' ? 20 : 24 }}>{f.preview}</span>
                          <span className="text-text-muted text-xs mt-1 block">{f.label}</span>
                          {a11y.fontSize === f.id && <Check size={10} className="text-amber-glow mx-auto mt-0.5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dyslexia font */}
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <div>
                      <p className="text-text-primary text-sm font-medium">Dyslexia-Friendly Font</p>
                      <p className="text-text-muted text-xs mt-0.5">Uses OpenDyslexic font for easier reading</p>
                    </div>
                    <Toggle checked={a11y.dyslexiaFont} onChange={v => updateA11y({ dyslexiaFont: v })} />
                  </div>

                  {/* Reduce motion */}
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <div>
                      <p className="text-text-primary text-sm font-medium flex items-center gap-2"><Moon size={14} />Reduce Motion</p>
                      <p className="text-text-muted text-xs mt-0.5">Minimize animations and transitions</p>
                    </div>
                    <Toggle checked={a11y.reduceMotion} onChange={v => updateA11y({ reduceMotion: v })} />
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="text-text-primary font-semibold mb-5 flex items-center gap-2"><Volume2 size={16} className="text-amber-glow" />Audio & Navigation</h2>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-text-primary text-sm font-medium flex items-center gap-2">{a11y.ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}Text-to-Speech</p>
                      <p className="text-text-muted text-xs mt-0.5">Read mystery text and AI responses aloud</p>
                    </div>
                    <Toggle checked={a11y.ttsEnabled} onChange={v => updateA11y({ ttsEnabled: v })} />
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <div>
                      <p className="text-text-primary text-sm font-medium flex items-center gap-2"><Keyboard size={14} />Enhanced Keyboard Navigation</p>
                      <p className="text-text-muted text-xs mt-0.5">Full keyboard control with focus indicators</p>
                    </div>
                    <Toggle checked={a11y.keyboardNav} onChange={v => updateA11y({ keyboardNav: v })} />
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="text-text-primary font-semibold mb-5 flex items-center gap-2"><Eye size={16} className="text-amber-glow" />Color Vision</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {COLOR_MODES.map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => updateA11y({ colorMode: mode.id })}
                        className={`p-3 rounded-lg border text-left transition-all ${a11y.colorMode === mode.id ? 'border-amber-glow/50 bg-amber-glow/10' : 'border-border bg-bg-tertiary hover:border-amber-dim'}`}
                      >
                        <div className="flex gap-1.5 mb-2">
                          {mode.preview.map((c, i) => <div key={i} className="w-5 h-5 rounded-full" style={{ background: c }} />)}
                        </div>
                        <p className="text-text-primary font-medium text-sm">{mode.label}</p>
                        <p className="text-text-muted text-xs">{mode.desc}</p>
                        {a11y.colorMode === mode.id && <Check size={12} className="text-amber-glow mt-1" />}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <div className="card p-6">
                  <h2 className="text-text-primary font-semibold mb-5 flex items-center gap-2"><Palette size={16} className="text-amber-glow" />Theme</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'dark-amber', label: 'Dark Amber', desc: 'Default detective theme', color: '#c8860a' },
                      { id: 'midnight', label: 'Midnight Blue', desc: 'Deep blue investigation', color: '#3b82f6' },
                      { id: 'forest', label: 'Forest Case', desc: 'Natural green mystery', color: '#22a066' },
                      { id: 'crimson', label: 'Crimson Files', desc: 'Red crime thriller', color: '#ef4444' },
                    ].map(theme => (
                      <button key={theme.id} onClick={() => toast('Theme customization coming soon!', { icon: '🎨' })}
                        className={`p-4 rounded-lg border text-left transition-all hover:-translate-y-0.5 ${theme.id === 'dark-amber' ? 'border-amber-glow/50 bg-amber-glow/10' : 'border-border bg-bg-tertiary hover:border-amber-dim'}`}>
                        <div className="w-8 h-8 rounded-lg mb-2" style={{ background: `${theme.color}30`, border: `2px solid ${theme.color}` }} />
                        <p className="text-text-primary text-sm font-semibold">{theme.label}</p>
                        <p className="text-text-muted text-xs">{theme.desc}</p>
                        {theme.id === 'dark-amber' && <span className="badge bg-amber-glow/20 text-amber-light border border-amber-glow/30 text-[10px] mt-1">Active</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <div className="card p-6">
                  <h2 className="text-text-primary font-semibold mb-5 flex items-center gap-2"><Bell size={16} className="text-amber-glow" />Notification Preferences</h2>
                  <div className="space-y-0 divide-y divide-border">
                    {Object.entries(notifications).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between py-3.5">
                        <div>
                          <p className="text-text-primary text-sm font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</p>
                          <p className="text-text-muted text-xs mt-0.5">{key === 'newClues' ? 'When new clues are unlocked in your cases' : key === 'xpMilestones' ? 'XP level ups and badge unlocks' : key === 'classroomActivity' ? 'Teacher assigns mystery or sends message' : key === 'dailyReminders' ? 'Daily investigation reminder' : 'Weekly progress summary'}</p>
                        </div>
                        <Toggle checked={val} onChange={v => setNotifications(n => ({ ...n, [key]: v }))} />
                      </div>
                    ))}
                  </div>
                  <button onClick={() => toast.success('Notification preferences saved!')} className="btn-primary mt-4">Save Preferences</button>
                </div>
              </motion.div>
            )}

            {/* Privacy */}
            {activeTab === 'privacy' && (
              <motion.div key="privacy" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <div className="card p-6">
                  <h2 className="text-text-primary font-semibold mb-5 flex items-center gap-2"><Shield size={16} className="text-amber-glow" />Privacy & Data</h2>
                  <div className="space-y-4 text-sm text-text-secondary">
                    <p>Your investigation data, learning profile, and mystery progress are stored securely.</p>
                    <div className="p-4 bg-bg-primary rounded border border-border">
                      <p className="text-text-primary font-semibold mb-2">Data We Collect</p>
                      <ul className="space-y-1 text-text-muted text-xs">
                        <li>• Investigation history and progress</li>
                        <li>• STEM concept mastery scores</li>
                        <li>• Experiment results</li>
                        <li>• XP and achievement data</li>
                      </ul>
                    </div>
                    <button onClick={() => toast('Data export coming soon!', { icon: '📦' })} className="btn-secondary text-sm w-full">Export My Data</button>
                    <button onClick={() => toast.error('This action cannot be undone. Contact support to delete account.')} className="w-full py-2 rounded border border-crimson/40 text-crimson-light text-sm hover:bg-crimson/10 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
