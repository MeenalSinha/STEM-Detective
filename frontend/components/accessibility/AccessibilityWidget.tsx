'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Accessibility, Type, Eye, Volume2, VolumeX, Moon, X, Minus, Plus } from 'lucide-react'

type FontSize = 'sm' | 'md' | 'lg' | 'xl'
type ColorMode = 'default' | 'high-contrast' | 'colorblind-deuteranopia' | 'colorblind-protanopia'

const FONT_SIZES: FontSize[] = ['sm', 'md', 'lg', 'xl']
const FONT_PX: Record<FontSize, string> = { sm: '13px', md: '16px', lg: '18px', xl: '21px' }

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false)
  const [fontSize, setFontSize] = useState<FontSize>('md')
  const [colorMode, setColorMode] = useState<ColorMode>('default')
  const [dyslexia, setDyslexia] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [tts, setTts] = useState(false)

  // Apply settings to <html>
  useEffect(() => {
    const root = document.documentElement
    root.style.fontSize = FONT_PX[fontSize]
  }, [fontSize])

  useEffect(() => {
    const body = document.body
    // Remove all color-mode classes
    body.classList.remove('high-contrast', 'colorblind-deuteranopia', 'colorblind-protanopia')
    if (colorMode !== 'default') body.classList.add(colorMode)
  }, [colorMode])

  useEffect(() => {
    const body = document.body
    if (dyslexia) body.classList.add('dyslexia-font')
    else body.classList.remove('dyslexia-font')
  }, [dyslexia])

  useEffect(() => {
    const body = document.body
    if (reduceMotion) body.classList.add('reduce-motion')
    else body.classList.remove('reduce-motion')
  }, [reduceMotion])

  // TTS: speak clicked text
  useEffect(() => {
    if (!tts) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const text = target.innerText || target.textContent
      if (text && text.length < 500) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        window.speechSynthesis.speak(utterance)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [tts])

  const fontSizeIdx = FONT_SIZES.indexOf(fontSize)
  const decreaseFontSize = () => { if (fontSizeIdx > 0) setFontSize(FONT_SIZES[fontSizeIdx - 1]) }
  const increaseFontSize = () => { if (fontSizeIdx < FONT_SIZES.length - 1) setFontSize(FONT_SIZES[fontSizeIdx + 1]) }

  const COLOR_MODES: { id: ColorMode; label: string; swatches: string[] }[] = [
    { id: 'default', label: 'Default', swatches: ['#c8860a', '#22a066', '#3b82f6'] },
    { id: 'high-contrast', label: 'High Contrast', swatches: ['#ffffff', '#ffff00', '#00ffff'] },
    { id: 'colorblind-deuteranopia', label: 'Deuteranopia', swatches: ['#f59e0b', '#1d4ed8', '#7c3aed'] },
    { id: 'colorblind-protanopia', label: 'Protanopia', swatches: ['#f59e0b', '#0ea5e9', '#8b5cf6'] },
  ]

  return (
    <>
      {/* Colorblind SVG filters */}
      <svg className="hidden" aria-hidden>
        <defs>
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" />
          </filter>
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      {/* FAB button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-amber-glow border-2 border-amber-light shadow-amber-strong flex items-center justify-center text-bg-primary"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open accessibility menu"
        title="Accessibility Options"
      >
        <Accessibility size={20} />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="a11y-panel"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-20 right-6 z-50 w-72 card p-5 shadow-amber-strong"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Accessibility size={16} className="text-amber-glow" />
                <p className="text-text-primary font-semibold text-sm">Accessibility</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Font size */}
            <div className="mb-4">
              <p className="text-text-secondary text-xs mb-2 flex items-center gap-1.5"><Type size={11} />Text Size</p>
              <div className="flex items-center gap-3">
                <button onClick={decreaseFontSize} disabled={fontSizeIdx === 0} className="w-7 h-7 rounded border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-amber-dim disabled:opacity-30 transition-all">
                  <Minus size={12} />
                </button>
                <div className="flex-1 flex gap-1">
                  {FONT_SIZES.map(f => (
                    <button
                      key={f}
                      onClick={() => setFontSize(f)}
                      className={`flex-1 py-1 rounded text-center transition-all ${fontSize === f ? 'bg-amber-glow/20 border border-amber-glow/40 text-amber-light' : 'bg-bg-overlay border border-transparent text-text-muted hover:border-amber-dim'}`}
                    >
                      <span style={{ fontSize: f === 'sm' ? 9 : f === 'md' ? 11 : f === 'lg' ? 13 : 15 }}>Aa</span>
                    </button>
                  ))}
                </div>
                <button onClick={increaseFontSize} disabled={fontSizeIdx === FONT_SIZES.length - 1} className="w-7 h-7 rounded border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-amber-dim disabled:opacity-30 transition-all">
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Color mode */}
            <div className="mb-4">
              <p className="text-text-secondary text-xs mb-2 flex items-center gap-1.5"><Eye size={11} />Color Mode</p>
              <div className="grid grid-cols-2 gap-1.5">
                {COLOR_MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setColorMode(m.id)}
                    className={`flex items-center gap-2 p-2 rounded border text-left transition-all ${colorMode === m.id ? 'border-amber-glow/40 bg-amber-glow/10' : 'border-border bg-bg-overlay hover:border-amber-dim'}`}
                  >
                    <div className="flex gap-0.5 flex-shrink-0">
                      {m.swatches.map((s, i) => <div key={i} className="w-2 h-2 rounded-full" style={{ background: s }} />)}
                    </div>
                    <span className="text-text-primary text-[10px] font-medium leading-tight">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-0 divide-y divide-border">
              {[
                { key: 'dyslexia', icon: Type, label: 'Dyslexia Font', value: dyslexia, onChange: setDyslexia },
                { key: 'motion', icon: Moon, label: 'Reduce Motion', value: reduceMotion, onChange: setReduceMotion },
                { key: 'tts', icon: tts ? Volume2 : VolumeX, label: 'Text-to-Speech', value: tts, onChange: setTts },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2.5">
                  <span className="text-text-secondary text-xs flex items-center gap-1.5">
                    <item.icon size={11} className="text-amber-glow" />{item.label}
                  </span>
                  <button
                    onClick={() => item.onChange(!item.value)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${item.value ? 'bg-amber-glow' : 'bg-bg-overlay border border-border'}`}
                  >
                    <motion.div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                      animate={{ left: item.value ? '17px' : '2px' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Reset */}
            <button
              onClick={() => { setFontSize('md'); setColorMode('default'); setDyslexia(false); setReduceMotion(false); setTts(false) }}
              className="mt-3 w-full text-xs text-text-muted hover:text-text-secondary transition-colors text-center"
            >
              Reset all settings
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
