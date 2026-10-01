'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Crown, LogOut, RefreshCw, Shield } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth'
import { useGame } from '@/lib/game/ctx'
import { signOutPurchases } from '@/lib/purchases'
import { restore } from '@/lib/purchases'
import { Button, Card, Chip, SectionTitle, Sheet } from '@/components/game/ui'
import { api } from '@/lib/api'
import { TopBar } from '@/components/game/bits'
import { useQueryClient } from '@tanstack/react-query'

export default function Profile() {
  const router = useRouter()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { isPro, entitlement, openPaywall, billing, syncEntitlement } = useGame()
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [delErr, setDelErr] = useState<string | null>(null)

  const doRestore = async () => {
    setBusy(true); setMsg(null)
    if (billing !== 'ready') { const ok = await syncEntitlement(); setMsg(ok ? 'Detective Pro is active on your account.' : 'Store restore needs the Android or iOS app. No active subscription was found on the server.'); setBusy(false); return }
    const r = await restore()
    if (r.outcome === 'success' && r.isPro) { await syncEntitlement({ poll: true }); setMsg('Purchases restored. Detective Pro is active.') }
    else if (r.outcome === 'success') setMsg('No active subscription was found for this store account.')
    else if (r.outcome === 'error') setMsg(r.message)
    setBusy(false)
  }
  const deleteAccount = async () => {
    setBusy(true); setDelErr(null)
    try { await api.delete('/auth/me'); await signOutPurchases(); logout(); qc.clear(); router.replace('/play/welcome/') }
    catch { setDelErr('We could not delete your account right now. Check your connection and try again.'); setBusy(false) }
  }
  const signOut = async () => { await signOutPurchases(); logout(); qc.clear(); router.replace('/play/welcome/') }

  return (
    <>
      <TopBar title="Profile" />
      <div className="px-5 pb-6">
        <Card>
          <p className="display text-2xl font-bold">{user?.username}</p>
          <p className="text-mute text-[14px]">{user?.email}</p>
          <div className="mt-3 flex gap-2"><Chip tone={isPro ? 'gold' : 'neutral'}>{isPro ? 'Detective Pro' : 'Free Detective'}</Chip></div>
        </Card>

        <SectionTitle>Subscription</SectionTitle>
        <Card tone={isPro ? 'gold' : 'default'}>
          <div className="flex items-center gap-3"><Crown className="text-gold" aria-hidden />
            <div className="flex-1"><p className="font-bold">{isPro ? 'Detective Pro is active' : 'Upgrade to Detective Pro'}</p>
              <p className="text-[13px] text-mute">{isPro ? (entitlement?.expires_at ? `Renews or ends ${new Date(entitlement.expires_at).toLocaleDateString()}` : 'Lifetime access') : 'Advanced analysis, advanced lab, unlimited hints'}</p></div>
          </div>
          {entitlement?.stale && <p className="text-[12px] text-gold mt-2">Showing your last confirmed status; the subscription service could not be reached.</p>}
          {!isPro && <Button full className="mt-3" onClick={() => openPaywall()}>See Detective Pro</Button>}
        </Card>
        <Button full variant="secondary" className="mt-3" loading={busy} onClick={doRestore}><RefreshCw size={16} aria-hidden />Restore purchases</Button>
        {msg && <p role="status" className="text-[14px] mt-2 text-ink-2">{msg}</p>}
        {isPro && <p className="text-[12px] text-mute mt-3">Manage or cancel in your App Store or Google Play subscription settings.</p>}

        <SectionTitle>About</SectionTitle>
        <div className="space-y-2.5">
          <Card onClick={() => router.push('/legal/privacy/')}><span className="flex items-center gap-2 font-semibold"><Shield size={18} aria-hidden />Privacy policy</span></Card>
          <Card onClick={() => router.push('/legal/terms/')}><span className="font-semibold">Terms of use</span></Card>
        </div>
        <Button full variant="secondary" className="mt-6" onClick={signOut}><LogOut size={16} aria-hidden />Sign out</Button>
        <Button full variant="ghost" className="mt-2 !text-rose" onClick={() => setConfirmDel(true)}>Delete my account</Button>
        <Sheet open={confirmDel} onClose={() => setConfirmDel(false)} title="Delete account?">
          <p className="text-[15px] leading-relaxed">This permanently deletes your detective profile, progress, XP and evidence. It cannot be undone.</p>
          {isPro && <p className="text-[14px] mt-3 rounded-xl bg-gold-soft p-3">Your Detective Pro subscription is managed by the App Store or Google Play and is not cancelled automatically. Cancel it in your store account settings.</p>}
          {delErr && <p role="alert" className="text-rose text-sm mt-3">{delErr}</p>}
          <Button full variant="danger" className="mt-5" loading={busy} onClick={deleteAccount}>Delete permanently</Button>
          <Button full variant="ghost" className="mt-1" onClick={() => setConfirmDel(false)}>Keep my account</Button>
        </Sheet>
        <p className="text-center text-[12px] text-mute mt-6">STEM Detective · <Link href="/about/" className="underline">About</Link></p>
      </div>
    </>
  )
}
