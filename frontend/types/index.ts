export type GradeLevel = 'elementary' | 'middle' | 'high' | 'college'
export type Subject = 'biology' | 'chemistry' | 'physics' | 'mathematics' | 'engineering' | 'environmental' | 'computer_science'
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type CaseStatus = 'active' | 'completed' | 'abandoned'

export interface User {
  id: string
  email: string
  username: string
  full_name?: string
  avatar_url?: string
  grade_level: GradeLevel
  role: 'student' | 'teacher' | 'admin'
  xp: number
  level: number
  detective_rank: string
  learning_profile: LearningProfile
  created_at: string
}

export interface LearningProfile {
  experience_level?: string
  solve_rate?: number
  total_cases?: number
  cases_solved?: number
  average_progress?: number
  subject_performance?: Record<string, number>
  strengths?: string[]
  weaknesses?: string[]
  recommended_subjects?: string[]
  recommended_difficulty?: string
}

export interface Case {
  id: string
  student_id: string
  title: string
  subject: Subject
  grade_level: GradeLevel
  difficulty: Difficulty
  topic: string
  status: CaseStatus
  story: string
  characters: Character[]
  clues: Clue[]
  evidence_chain: string[]
  stem_concepts: string[]
  investigation_path: string[]
  world_state: WorldState
  conversation_history: ConversationMessage[]
  progress_percentage: number
  xp_earned: number
  solution?: string
  student_hypothesis?: string
  is_solved: boolean
  thumbnail_url?: string
  created_at: string
  updated_at?: string
  completed_at?: string
}

export interface Character {
  name: string
  role: string
  description: string
  dialogue_style: string
  knowledge: string[]
  initial_statement: string
}

export interface Clue {
  id: string
  title: string
  description: string
  clue_type: 'physical' | 'data' | 'witness' | 'laboratory'
  stem_concept: string
  scientific_explanation?: string
  unlock_condition?: string
  is_revealed: boolean
}

export interface WorldState {
  severity: 'low' | 'medium' | 'high' | 'critical'
  time_elapsed: string
  environment_status: string
  affected_entities: string[]
  escalation_events?: EscalationEvent[]
}

export interface EscalationEvent {
  trigger: string
  event: string
  new_evidence: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface Evidence {
  id: string
  case_id: string
  title: string
  description: string
  evidence_type: 'photo' | 'data' | 'witness' | 'lab_result' | 'clue'
  content?: Record<string, unknown>
  image_url?: string
  is_key_evidence: boolean
  relevance_score: number
  ai_analysis?: string
  collected_at: string
}

export interface DMResponse {
  narrative: string
  new_clues: Clue[]
  world_state_changes: Record<string, unknown>
  stem_challenge?: STEMChallenge
  xp_earned: number
  is_plot_twist: boolean
  plot_twist_description?: string
  investigation_progress_delta: number
}

export interface STEMChallenge {
  question: string
  type: 'calculation' | 'multiple_choice' | 'experiment' | 'observation'
  options?: string[]
  hint: string
}

export interface LabResult {
  experiment_id: string
  results: Record<string, unknown>
  conclusion: string
  is_correct: boolean
  feedback: string
  stem_concepts_reinforced: string[]
  xp_earned: number
}

export interface KnowledgeNode {
  id: string
  concept: string
  subject: Subject
  mastery_level: number
  times_encountered: number
  status: 'mastered' | 'learning' | 'weak'
}

export interface KnowledgeEdge {
  id: string
  source: string
  target: string
  subject: string
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  mastery_summary: Record<string, number>
  total_concepts: number
  mastered_count: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  badge_type: 'bronze' | 'silver' | 'gold' | 'platinum'
  xp_reward: number
  earned?: boolean
  earned_at?: string
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  avatar_url?: string
  detective_rank: string
  xp: number
  cases_solved: number
  level: number
}

export interface UserStats {
  xp: number
  level: number
  detective_rank: string
  total_cases: number
  cases_solved: number
  active_cases: number
  achievements_count: number
  learning_profile: LearningProfile
}

export interface HintResponse {
  hint_text: string
  hint_level: number
  xp_penalty: number
}

export interface HypothesisResult {
  is_correct: boolean
  score: number
  feedback: string
  what_was_right: string[]
  what_was_wrong: string[]
  solution_explanation: string
  concepts_learned: string[]
  xp_earned: number
  achievements_earned: Achievement[]
}

export interface Token {
  access_token: string
  token_type: string
  user: User
}

export const SUBJECT_COLORS: Record<Subject, string> = {
  biology: '#10b981',
  chemistry: '#a855f7',
  physics: '#3b82f6',
  mathematics: '#f59e0b',
  engineering: '#ef4444',
  environmental: '#22a066',
  computer_science: '#06b6d4',
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  mathematics: 'Mathematics',
  engineering: 'Engineering',
  environmental: 'Environmental',
  computer_science: 'Computer Science',
}

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
  expert: '#a855f7',
}
