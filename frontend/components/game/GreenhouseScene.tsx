'use client'
import { Check } from 'lucide-react'
import clsx from 'clsx'

/** Illustrated greenhouse with tappable hotspots. Bench B/C plants are drawn visibly sick: the mystery is visible. */
const POS: Record<string, { x: number; y: number; label: string }> = {
  h_logger: { x: 12, y: 24, label: 'Logger' },
  h_microscope: { x: 39, y: 33, label: 'Microscope' },
  h_bench_a: { x: 19, y: 58, label: 'Bench A' },
  h_bench_b: { x: 50, y: 58, label: 'Bench B' },
  h_roots: { x: 78, y: 70, label: 'Roots' },
  h_reservoir: { x: 16, y: 80, label: 'Reservoir' },
  h_shed: { x: 50, y: 80, label: 'Supply shed' },
  h_logbook: { x: 83, y: 80, label: 'Logbook' },
}

function Plant({ x, y, sick }: { x: number; y: number; sick: boolean }) {
  const leaf = sick ? '#c9b24a' : '#3f9b4b'
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={sick ? 'M0 0 Q-2 -10 3 -16' : 'M0 0 V-24'} stroke={sick ? '#8a7a30' : '#2d7a3a'} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx={sick ? -6 : -7} cy={sick ? -10 : -15} rx={sick ? 5 : 7} ry={sick ? 2.5 : 3.5} fill={leaf} transform={`rotate(${sick ? 40 : -25} ${sick ? -6 : -7} ${sick ? -10 : -15})`} />
      <ellipse cx={sick ? 8 : 7} cy={sick ? -13 : -19} rx={sick ? 5 : 7} ry={sick ? 2.5 : 3.5} fill={leaf} transform={`rotate(${sick ? 70 : 25} ${sick ? 8 : 7} ${sick ? -13 : -19})`} />
      {sick && <><circle cx="-6" cy="-10" r="0.9" fill="#5a3d1a" /><circle cx="8" cy="-13" r="0.9" fill="#5a3d1a" /></>}
      {!sick && <ellipse cx="0" cy="-26" rx="4.5" ry="3" fill="#4cb35a" />}
    </g>
  )
}

export default function GreenhouseScene({ hotspots, onPick, busyId }: {
  hotspots: { id: string; label: string; inspected: boolean }[]
  onPick: (id: string) => void
  busyId?: string | null
}) {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-line bg-[#dcebea]" style={{ aspectRatio: '360 / 440' }}>
      <svg viewBox="0 0 360 440" className="absolute inset-0 w-full h-full" aria-hidden role="presentation">
        <defs><linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cfe6e4" /><stop offset="1" stopColor="#eaf4f2" /></linearGradient></defs>
        <rect width="360" height="440" fill="url(#glass)" />
        <path d="M0 150 Q180 -30 360 150" fill="#f4faf9" stroke="#b6d4d1" strokeWidth="2" />
        {[60, 120, 180, 240, 300].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="330" stroke="#b6d4d1" strokeWidth="1" />)}
        <rect y="330" width="360" height="110" fill="#d9d2c1" />
        <rect y="326" width="360" height="6" fill="#bfb7a2" />
        {/* control room wall */}
        <rect x="14" y="96" width="132" height="92" rx="8" fill="#e8e2d2" stroke="#bfb7a2" />
        <rect x="24" y="108" width="56" height="40" rx="4" fill="#141B22" /><polyline points="30,138 40,128 50,132 60,118 74,122" fill="none" stroke="#6fd0d8" strokeWidth="2" />
        <rect x="96" y="150" width="40" height="28" rx="3" fill="#8b6b45" /><rect x="108" y="128" width="8" height="24" rx="2" fill="#2b3641" /><circle cx="112" cy="126" r="7" fill="#2b3641" />
        {/* benches */}
        {[{ x: 20, sick: false }, { x: 130, sick: true }, { x: 240, sick: true }].map((b, i) => (
          <g key={i}>
            <rect x={b.x} y="262" width="100" height="12" rx="3" fill="#8b6b45" />
            <rect x={b.x + 8} y="274" width="6" height="52" fill="#6f5434" /><rect x={b.x + 86} y="274" width="6" height="52" fill="#6f5434" />
            {[22, 50, 78].map((o) => <Plant key={o} x={b.x + o} y={262} sick={b.sick} />)}
          </g>
        ))}
        {/* pulled seedling with roots */}
        <g transform="translate(262 356)"><path d="M0 0 C-4 8 -8 14 -10 22 M0 0 C2 10 2 16 6 24 M0 0 C6 6 12 10 16 16" stroke="#6b4a2a" strokeWidth="2.5" fill="none" strokeLinecap="round" /><path d="M0 0 L2 -14" stroke="#8a7a30" strokeWidth="2.5" /><ellipse cx="-3" cy="-12" rx="6" ry="2.5" fill="#c9b24a" /></g>
        {/* reservoir */}
        <rect x="26" y="344" width="44" height="64" rx="8" fill="#9fc4d4" stroke="#6f9db0" strokeWidth="2" /><rect x="26" y="366" width="44" height="42" rx="6" fill="#7eb0c6" opacity="0.8" /><path d="M70 360 h14 v-30 h30" fill="none" stroke="#6f9db0" strokeWidth="3" />
        {/* shed shelf with bags */}
        <rect x="140" y="384" width="88" height="6" fill="#8b6b45" /><rect x="146" y="352" width="34" height="32" rx="3" fill="#f2b84b" /><rect x="188" y="358" width="34" height="26" rx="3" fill="#e7e0cf" stroke="#bfb7a2" />
        <text x="163" y="373" fontSize="8" fontWeight="700" textAnchor="middle" fill="#141B22">21-0-0</text><text x="205" y="374" fontSize="7" textAnchor="middle" fill="#2b3641">15.5-0-0</text>
        {/* logbook */}
        <rect x="270" y="352" width="46" height="56" rx="4" fill="#2b3641" /><rect x="276" y="360" width="34" height="40" rx="2" fill="#f5f1e8" />{[368, 376, 384, 392].map((y) => <line key={y} x1="280" y1={y} x2="306" y2={y} stroke="#bfb7a2" />)}
      </svg>

      {hotspots.map((h) => {
        const p = POS[h.id]; if (!p) return null
        return (
          <button key={h.id} onClick={() => onPick(h.id)} disabled={busyId === h.id}
            aria-label={`${h.label}${h.inspected ? ', inspected' : ''}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center min-w-12 min-h-12 justify-center"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <span className={clsx('relative w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-md transition-colors',
              h.inspected ? 'bg-ink text-[#6fd0d8] border-[#6fd0d8]' : 'bg-[#f2b84b] text-ink border-white')}>
              {!h.inspected && <span className="absolute inset-0 rounded-full bg-[#f2b84b] animate-ping opacity-40" aria-hidden />}
              {h.inspected ? <Check size={15} strokeWidth={3} aria-hidden /> : <span className="w-2 h-2 rounded-full bg-ink" aria-hidden />}
            </span>
            <span className="mt-0.5 px-1.5 py-px rounded-full bg-white/90 text-[10px] font-bold text-ink shadow-sm whitespace-nowrap">{p.label}</span>
          </button>
        )
      })}
    </div>
  )
}
