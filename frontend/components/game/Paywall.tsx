'use client'
/**
 * Detective Pro paywall. Appears only when the player reaches a gated tool (never on first launch).
 * Copy is tied to the feature they just tried to use. Prices come from RevenueCat offerings.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { Check, FlaskConical, LineChart, Lightbulb, FolderSearch, Lock } from 'lucide-react'
import { Sheet, Button, Skeleton } from './ui'
import { useGame } from '@/lib/game/ctx'
import { useFx } from './Fx'
import { loadOffering, purchase, restore, type LoadedOffering } from '@/lib/purchases'

const FEATURE_COPY: Record<string, { head: string; sub: string }> = {
  advanced_evidence_analysis: { head: 'Your evidence needs deeper analysis', sub: 'Advanced Evidence Analysis cross-checks the greenhouse logger against your timeline.' },
  advanced_lab: { head: 'This experiment needs the advanced lab', sub: 'Run a controlled trial with a treated sample and an untreated control.' },
  unlimited_hints: { head: 'You have used your free hints', sub: 'Detective Pro gives unlimited hints, including overlooked-relationship insights.' },
  unlimited_cases: { head: 'Your next case needs deeper investigation', sub: 'Free detectives can open two generated case files. Pro is unlimited.' },
}
const DEFAULT_COPY = { head: 'Your next case requires deeper investigation', sub: 'Unlock the full detective toolkit.' }

const BENEFITS = [
  { icon: LineChart, title: 'Advanced Evidence Analysis', text: 'Timeline and correlation analysis from real logger data' },
  { icon: FlaskConical, title: 'Advanced laboratory', text: 'Controlled trials with a treated sample and an untreated control' },
  { icon: Lightbulb, title: 'Unlimited hints', text: 'Plus insights that point out relationships you overlooked' },
  { icon: FolderSearch, title: 'Unlimited AI case files', text: 'Generate as many new investigations as you like' },
]
const TERMS = process.env.NEXT_PUBLIC_TERMS_URL || '/legal/terms/'
const PRIVACY = process.env.NEXT_PUBLIC_PRIVACY_URL || '/legal/privacy/'

export default function Paywall({ open, onClose, feature }: { open: boolean; onClose: () => void; feature?: string }) {
  const { billing, syncEntitlement, isPro } = useGame()
  const { celebrate } = useFx()
  const [offering, setOffering] = useState<LoadedOffering | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'empty'>('idle')
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null)
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null)

  const load = useCallback(async () => {
    setState('loading'); setMessage(null)
    try {
      const o = await loadOffering()
      if (!o) { setState('empty'); return }
      setOffering(o); setSelected(o.packages[0].id); setState('idle')
    } catch { setState('error') }
  }, [])

  useEffect(() => { if (open && billing === 'ready' && !offering) load() }, [open, billing, offering, load])
  useEffect(() => { if (open) setMessage(null) }, [open])

  const finish = async () => {
    setMessage({ tone: 'info', text: 'Purchase received. Activating Detective Pro...' })
    const ok = await syncEntitlement({ poll: true })
    if (ok) { celebrate({}); onClose() }
    else setMessage({ tone: 'info', text: 'Your purchase went through but the server has not confirmed it yet. Close this and pull down to refresh in a moment, or tap Restore purchases.' })
  }

  const buy = async () => {
    const pkg = offering?.packages.find((p) => p.id === selected)
    if (!pkg) return
    setBusy('buy'); setMessage(null)
    const r = await purchase(pkg.pkg)
    setBusy(null)
    if (r.outcome === 'success' && r.isPro) await finish()
    else if (r.outcome === 'error') setMessage({ tone: 'error', text: r.message })
    else if (r.outcome === 'success') setMessage({ tone: 'error', text: 'The purchase completed but did not unlock Pro. Tap Restore purchases, or contact support.' })
  }

  const doRestore = async () => {
    setBusy('restore'); setMessage(null)
    const r = await restore()
    setBusy(null)
    if (r.outcome === 'success' && r.isPro) await finish()
    else if (r.outcome === 'success') setMessage({ tone: 'info', text: 'No active Detective Pro subscription was found for this store account.' })
    else if (r.outcome === 'error') setMessage({ tone: 'error', text: r.message })
  }

  const copy = (feature && FEATURE_COPY[feature]) || DEFAULT_COPY
  const selectedPkg = offering?.packages.find((p) => p.id === selected)

  return (
    <Sheet open={open} onClose={onClose} title="Detective Pro" dark>
      {isPro ? (
        <p className="py-6 text-center">You already have Detective Pro. Thank you for supporting the agency.</p>
      ) : (
        <>
          <div className="flex items-center gap-2 text-[#f2b84b] text-[12px] font-bold uppercase tracking-wider mb-2"><Lock size={14} aria-hidden />Restricted file</div>
          <p className="display text-2xl font-bold leading-tight">{copy.head}</p>
          <p className="text-[#c9d1d8] mt-2 text-[15px]">{copy.sub}</p>

          <ul className="mt-5 space-y-3">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#1d2a35] text-[#6fd0d8] flex items-center justify-center shrink-0"><b.icon size={18} aria-hidden /></span>
                <span><span className="block font-semibold text-[15px]">{b.title}</span><span className="block text-[13px] text-[#a9b5bf]">{b.text}</span></span>
              </li>
            ))}
          </ul>
          <p className="text-[13px] text-[#a9b5bf] mt-4">Free detectives keep the full Silent Greenhouse case, basic lab, 3 hints per case and XP progression.</p>

          <div className="mt-5">
            {billing === 'loading' && <Skeleton className="h-28 !bg-[#1d2a35]" />}
            {billing === 'unavailable_web' && <Notice>In-app purchases are available in the Android and iOS apps. Open STEM Detective on your phone to subscribe.</Notice>}
            {billing === 'not_configured' && <Notice>Purchases are not configured in this build. Add the RevenueCat SDK key (see docs/SETUP.md).</Notice>}
            {billing === 'error' && <Notice>We could not start the store connection. Check your connection and reopen this screen.</Notice>}
            {billing === 'ready' && state === 'loading' && <Skeleton className="h-28 !bg-[#1d2a35]" />}
            {billing === 'ready' && state === 'error' && <Notice action={<button onClick={load} className="underline font-semibold">Try again</button>}>We could not load prices from the store.</Notice>}
            {billing === 'ready' && state === 'empty' && <Notice>No subscription options are available right now. Please try again later.</Notice>}
            {billing === 'ready' && offering && state === 'idle' && (
              <div role="radiogroup" aria-label="Subscription plans" className="space-y-2.5">
                {offering.packages.map((p) => {
                  const on = p.id === selected
                  return (
                    <button key={p.id} role="radio" aria-checked={on} onClick={() => setSelected(p.id)}
                      className={clsx('w-full text-left rounded-2xl border-2 p-4 flex items-center gap-3 min-h-[68px]', on ? 'border-[#6fd0d8] bg-[#14303a]' : 'border-[#2b3641] bg-[#1a242d]')}>
                      <span className={clsx('w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0', on ? 'border-[#6fd0d8] bg-[#6fd0d8] text-ink' : 'border-[#56636e]')}>{on && <Check size={14} aria-hidden />}</span>
                      <span className="flex-1 min-w-0">
                        <span className="font-semibold block">{p.title}{p.kind === 'annual' && offering.annualSavingsPct ? <span className="ml-2 text-[11px] font-bold bg-[#f2b84b] text-ink px-2 py-0.5 rounded-full">Save {offering.annualSavingsPct}%</span> : null}</span>
                        <span className="text-[13px] text-[#a9b5bf] block">{p.introText ? `${p.introText}, then ` : ''}{p.perMonthString && p.kind === 'annual' ? `${p.perMonthString} per month` : ''}</span>
                      </span>
                      <span className="font-bold whitespace-nowrap">{p.priceString}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {message && <p role="alert" className={clsx('mt-3 text-[14px] rounded-xl p-3', message.tone === 'error' ? 'bg-[#3a1d1b] text-[#ffb4ab]' : 'bg-[#14303a] text-[#bfeef2]')}>{message.text}</p>}

          <div className="mt-5 space-y-2">
            <Button full loading={busy === 'buy'} disabled={billing !== 'ready' || !selectedPkg || busy === 'restore'} onClick={buy}>
              {selectedPkg ? `Continue with ${selectedPkg.title}` : 'Continue'}
            </Button>
            <Button full variant="ghost" loading={busy === 'restore'} disabled={billing !== 'ready' || busy === 'buy'} onClick={doRestore} className="!text-[#c9d1d8]">Restore purchases</Button>
            <Button full variant="ghost" onClick={onClose} className="!text-[#c9d1d8]">Not now</Button>
          </div>
          <p className="text-[11px] leading-relaxed text-[#7f8d98] mt-4">
            Payment is charged to your Apple ID or Google Play account at confirmation. Subscriptions renew automatically unless cancelled at least 24 hours before the period ends. Manage or cancel in your store account settings.{' '}
            <Link href={TERMS} className="underline">Terms</Link> · <Link href={PRIVACY} className="underline">Privacy</Link>
          </p>
        </>
      )}
    </Sheet>
  )
}

function Notice({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return <div className="rounded-2xl bg-[#1a242d] border border-[#2b3641] p-4 text-[14px] text-[#c9d1d8]">{children} {action}</div>
}
