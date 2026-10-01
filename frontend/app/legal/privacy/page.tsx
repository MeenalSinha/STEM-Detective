export default function Privacy() {
  return (
    <main className="game-root mx-auto max-w-md p-6 safe-top">
      <h1 className="display text-3xl font-bold">Privacy policy</h1>
      <p className="text-mute text-sm mt-1">Draft for submission. Replace with your reviewed legal text and set NEXT_PUBLIC_PRIVACY_URL.</p>
      <div className="mt-5 space-y-3 text-[15px] leading-relaxed">
        <p><b>What we store:</b> your email, detective name, hashed password, and your game progress (XP, cases, evidence).</p>
        <p><b>Purchases:</b> subscriptions are processed by Apple or Google. We use RevenueCat to manage subscription status; RevenueCat receives an anonymous app user ID and purchase status, not your payment details.</p>
        <p><b>AI features:</b> when enabled, text you type to witnesses or hypotheses may be sent to an AI provider to generate a reply. Do not enter personal information.</p>
        <p>You can ask for your account to be deleted by contacting the address listed on the store page.</p>
      </div>
    </main>
  )
}
