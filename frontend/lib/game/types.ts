export interface Evidence {
  key: string; title: string; description: string
  kind: 'photo' | 'data' | 'document' | 'lab' | 'witness'
  significance: 'key' | 'context' | 'ruled_out'; tags: string[]
}
export interface PlayerProgress {
  xp: number; level: number; rank: string; level_floor: number; level_ceiling: number; xp_in_level: number; xp_span: number
}
export interface XpSummary { gained: number; total: number; level: number; rank: string; leveled_up: boolean }
export interface CaseView {
  case_id: string; slug: string; title: string; subtitle: string; briefing: string; objectives: string[]
  concepts: string[]; status: string; solved: boolean
  stage: 'investigate' | 'lab' | 'connect' | 'hypothesis' | 'solved'; progress: number
  hotspots: { id: string; label: string; area: string; prompt: string; inspected: boolean }[]
  evidence: Evidence[]
  inferences: { id: string; title: string; insight: string }[]; inference_total: number
  witnesses: { id: string; name: string; role: string; opening: string; spoken: boolean }[]
  samples: { id: string; label: string; measured: boolean }[]
  labs_done: number
  hints: { used: number; limit: number | null; remaining: number | null }
  advanced: { available: boolean; used: boolean }
  is_pro: boolean; player: PlayerProgress
  debrief: { title: string; body: string; concepts: string[]; real_world: string } | null
}
export interface CatalogCase {
  slug: string; title: string; subtitle: string; tier: string; concepts: string[]
  case_id: string | null; status: 'new' | 'in_progress' | 'solved'; progress: number; blurb: string
}
export interface Catalog {
  player: PlayerProgress; is_pro: boolean; cases: CatalogCase[]
  generated: { count: number; limit: number | null; cases: { case_id: string; title: string; status: string; topic: string; progress: number }[] }
}
export interface Nutrient { symbol: string; name: string; value: number; status: 'ok' | 'scarce' | 'toxic'; is_toxin: boolean }
export interface AvailabilityResult { ph: number; rows: Nutrient[]; scarce: string[]; toxic: string[]; vigor_index: number; hint?: string | null; new_evidence?: Evidence[]; xp?: XpSummary }
export interface HypothesisResult {
  solved: boolean; score: number; short: boolean; feedback: string
  components: { id: string; label: string; weight: number; status: 'strong' | 'unsupported' | 'missing'; points: number }[]
  xp: XpSummary; xp_breakdown: { label: string; xp: number }[]
  achievements: { name: string; description: string; badge_type: string; xp_reward: number }[]
  player: PlayerProgress; missing: string[]; ai?: boolean
  debrief: { title: string; body: string; concepts: string[]; real_world: string } | null
}
