'use client'
/** Line chart of substrate pH over time, with the fertilizer switch, symptom onset and toxicity threshold marked. */
export default function PhChart({ days, a, b, switchDay, symptomDay, threshold }: { days: number[]; a: number[]; b: number[]; switchDay: number; symptomDay: number; threshold: number }) {
  const W = 340, H = 200, L = 34, R = 10, T = 12, B = 28
  const minD = days[0], maxD = days[days.length - 1], minP = 4.4, maxP = 6.6
  const x = (d: number) => L + ((d - minD) / (maxD - minD)) * (W - L - R)
  const y = (p: number) => T + ((maxP - p) / (maxP - minP)) * (H - T - B)
  const path = (v: number[]) => v.map((p, i) => `${i ? 'L' : 'M'}${x(days[i]).toFixed(1)} ${y(p).toFixed(1)}`).join(' ')
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Substrate pH over time for Bench A and Bench B. Bench A stays flat near 6.2. Bench B falls from 6.3 to 4.7 after the fertilizer switch on day 0.">
        {[4.5, 5, 5.5, 6, 6.5].map((p) => <g key={p}><line x1={L} x2={W - R} y1={y(p)} y2={y(p)} stroke="#e3dccb" /><text x={L - 6} y={y(p) + 3} fontSize="9" textAnchor="end" fill="#5d6a75">{p}</text></g>)}
        <line x1={L} x2={W - R} y1={y(threshold)} y2={y(threshold)} stroke="#b3261e" strokeDasharray="4 3" /><text x={W - R} y={y(threshold) - 4} fontSize="9" textAnchor="end" fill="#b3261e">toxicity threshold {threshold}</text>
        <line x1={x(switchDay)} x2={x(switchDay)} y1={T} y2={H - B} stroke="#9a5b00" strokeWidth="1.5" /><text x={x(switchDay) + 3} y={T + 9} fontSize="9" fill="#9a5b00">fertilizer switch</text>
        <line x1={x(symptomDay)} x2={x(symptomDay)} y1={T + 14} y2={H - B} stroke="#141B22" strokeDasharray="2 2" /><text x={x(symptomDay) + 3} y={T + 24} fontSize="9" fill="#141B22">symptoms</text>
        <path d={path(a)} fill="none" stroke="#2e7d32" strokeWidth="2.5" /><path d={path(b)} fill="none" stroke="#0E7C86" strokeWidth="2.5" strokeDasharray="0" />
        {[-5, 0, 5, 10].map((d) => <text key={d} x={x(d)} y={H - 10} fontSize="9" textAnchor="middle" fill="#5d6a75">Day {d}</text>)}
      </svg>
      <figcaption className="flex gap-4 text-[12px] text-ink-2 mt-1"><span className="flex items-center gap-1.5"><i className="w-4 h-[3px] bg-ok inline-block" />Bench A (control)</span><span className="flex items-center gap-1.5"><i className="w-4 h-[3px] bg-lab inline-block" />Bench B</span></figcaption>
    </figure>
  )
}
