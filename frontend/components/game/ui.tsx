'use client'
import { ReactNode, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { AlertTriangle, WifiOff, X, Loader2 } from 'lucide-react'
import type { GameError } from '@/lib/game/errors'

type BtnProps = {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'
  disabled?: boolean; loading?: boolean; full?: boolean; className?: string; type?: 'button' | 'submit'; ariaLabel?: string
}
/** 48px minimum touch target. */
export function Button({ children, onClick, variant = 'primary', disabled, loading, full, className, type = 'button', ariaLabel }: BtnProps) {
  const styles = {
    primary: 'bg-lab text-white active:bg-[#0a6068]',
    secondary: 'bg-white text-ink border border-line active:bg-paper-2',
    ghost: 'bg-transparent text-ink-2 active:bg-paper-2',
    danger: 'bg-rose text-white',
    dark: 'bg-ink text-paper active:bg-ink-2',
  }[variant]
  return (
    <button
      type={type} onClick={onClick} disabled={disabled || loading} aria-label={ariaLabel} aria-busy={loading}
      className={clsx('min-h-[48px] px-5 rounded-xl font-semibold text-[15px] inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50',
        styles, full && 'w-full', className)}
    >
      {loading && <Loader2 className="animate-spin" size={18} aria-hidden />}
      {children}
    </button>
  )
}

export function Card({ children, className, onClick, tone = 'default' }: { children: ReactNode; className?: string; onClick?: () => void; tone?: 'default' | 'dark' | 'lab' | 'gold' }) {
  const tones = { default: 'bg-white border-line', dark: 'bg-ink text-paper border-ink-2', lab: 'bg-lab-soft border-[#b7dde0]', gold: 'bg-gold-soft border-[#ecd29b]' }[tone]
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={clsx('rounded-2xl border p-4 text-left w-full', tones, onClick && 'active:scale-[0.99] transition-transform', className)}>
      {children}
    </Tag>
  )
}

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'lab' | 'gold' | 'rose' | 'ok' | 'dark' }) {
  const t = { neutral: 'bg-paper-2 text-ink-2', lab: 'bg-lab-soft text-[#075259]', gold: 'bg-gold-soft text-gold', rose: 'bg-rose-soft text-rose', ok: 'bg-ok-soft text-ok', dark: 'bg-ink text-paper' }[tone]
  return <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold', t)}>{children}</span>
}

export function ProgressBar({ value, max = 100, label, tone = 'lab' }: { value: number; max?: number; label: string; tone?: 'lab' | 'gold' }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100))
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} className="h-2.5 rounded-full bg-paper-2 overflow-hidden">
      <div className={clsx('h-full rounded-full transition-[width] duration-700', tone === 'lab' ? 'bg-lab' : 'bg-gold')} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx('skeleton', className)} />
}

export function ScreenSkeleton() {
  return (
    <div className="p-5 space-y-4" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-2/3" /><Skeleton className="h-28" /><Skeleton className="h-20" /><Skeleton className="h-20" />
      <span className="sr-only">Loading</span>
    </div>
  )
}

/** Every failure gets an explanation and a recovery action. */
export function ErrorState({ error, onRetry, compact }: { error: GameError; onRetry?: () => void; compact?: boolean }) {
  const Icon = error.kind === 'offline' || error.kind === 'timeout' ? WifiOff : AlertTriangle
  return (
    <div role="alert" className={clsx('flex flex-col items-center text-center gap-3', compact ? 'p-4' : 'p-8 pt-16')}>
      <div className="w-14 h-14 rounded-full bg-rose-soft text-rose flex items-center justify-center"><Icon size={26} aria-hidden /></div>
      <p className="font-semibold text-ink">{error.kind === 'offline' ? 'No connection' : error.kind === 'timeout' ? 'Taking too long' : 'That did not work'}</p>
      <p className="text-mute text-[14px] max-w-xs">{error.message}</p>
      {error.retryable && onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

/** Bottom sheet dialog: Escape closes, focus moves inside, background scroll is locked. */
export function Sheet({ open, onClose, title, children, dark }: { open: boolean; onClose: () => void; title: string; children: ReactNode; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.() }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center game-root !min-h-0 !bg-transparent">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={clsx('relative w-full max-w-md max-h-[88dvh] scroll-y rounded-t-3xl safe-bottom outline-none', dark ? 'bg-ink text-paper' : 'bg-paper')}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-4 pb-2 bg-inherit">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-12 h-12 -mr-3 flex items-center justify-center rounded-full active:bg-black/10"><X size={22} /></button>
        </div>
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="flex items-center justify-between mb-2 mt-6"><h3 className="text-[13px] font-bold uppercase tracking-wider text-mute">{children}</h3>{action}</div>
}
