import axios, { AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000, // never leave the player on an infinite spinner
})

// Attach auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('stem_detective_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('stem_detective_token')
      localStorage.removeItem('stem_detective_user')
      window.location.href = '/play/welcome/'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: {
    email: string
    username: string
    password: string
    full_name?: string
    grade_level?: string
    role?: string
  }) => api.post('/auth/register', data),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getMe: () => api.get('/auth/me'),

  updateProfile: (data: Record<string, unknown>) =>
    api.patch('/auth/me/profile', data),
}

// ── Cases ─────────────────────────────────────────────────────────────────────

export const casesApi = {
  generate: (data: {
    subject: string
    grade_level: string
    difficulty: string
    topic: string
    additional_context?: string
  }) => api.post('/cases/generate', data),

  list: (status?: string) =>
    api.get('/cases/', { params: status ? { status } : {} }),

  get: (caseId: string) => api.get(`/cases/${caseId}`),

  interact: (data: {
    case_id: string
    student_message: string
    action_type?: string
  }) => api.post('/cases/interact', data),

  getHint: (caseId: string, currentLevel: number) =>
    api.post(`/cases/${caseId}/hint`, { case_id: caseId, current_hint_level: currentLevel }),

  submitHypothesis: (data: {
    case_id: string
    hypothesis: string
    supporting_evidence: string[]
  }) => api.post(`/cases/${data.case_id}/hypothesis`, data),

  abandon: (caseId: string) => api.delete(`/cases/${caseId}`),
}

// ── Lab ───────────────────────────────────────────────────────────────────────

export const labApi = {
  runExperiment: (data: {
    case_id: string
    lab_type: string
    hypothesis: string
    parameters: Record<string, unknown>
  }) => api.post('/lab/run', data),

  getHistory: (caseId: string) => api.get(`/lab/history/${caseId}`),

  getModules: () => api.get('/lab/modules'),
}

// ── Evidence ──────────────────────────────────────────────────────────────────

export const evidenceApi = {
  add: (data: {
    case_id: string
    title: string
    description: string
    evidence_type: string
    content?: Record<string, unknown>
  }) => api.post('/evidence/', data),

  getForCase: (caseId: string) => api.get(`/evidence/case/${caseId}`),

  analyze: (evidenceId: string, caseId: string, interpretation?: string) =>
    api.post(`/evidence/${evidenceId}/analyze`, {
      case_id: caseId,
      evidence_id: evidenceId,
      student_interpretation: interpretation,
    }),
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  getStats: () => api.get('/users/stats'),
  getKnowledgeGraph: () => api.get('/users/knowledge-graph'),
  getAchievements: () => api.get('/users/achievements'),
  joinClassroom: (joinCode: string) =>
    api.post('/users/join-classroom', { join_code: joinCode }),
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export const leaderboardApi = {
  get: (limit = 50) => api.get('/leaderboard/', { params: { limit } }),
}

// ── Teacher ───────────────────────────────────────────────────────────────────

export const teacherApi = {
  createClassroom: (data: {
    name: string
    description?: string
    grade_level: string
  }) => api.post('/teacher/classrooms', data),

  getClassrooms: () => api.get('/teacher/classrooms'),

  getStudents: (classroomId: string) =>
    api.get(`/teacher/classrooms/${classroomId}/students`),

  mysteryStudio: (data: {
    topic: string
    subject: string
    grade_level: string
    difficulty: string
    learning_objectives?: string[]
    duration_minutes?: number
  }) => api.post('/teacher/mystery-studio', data),
}


// ── Flagship case (The Silent Greenhouse) ─────────────────────────────────────

export const flagshipApi = {
  catalog: () => api.get('/flagship/catalog'),
  start: () => api.post('/flagship/silent-greenhouse/start'),
  state: (id: string) => api.get(`/flagship/cases/${id}/state`),
  inspect: (id: string, hotspot_id: string) => api.post(`/flagship/cases/${id}/inspect`, { hotspot_id }),
  witness: (id: string, body: { witness_id: string; message?: string; present_evidence?: string }) =>
    api.post(`/flagship/cases/${id}/witness`, body),
  curve: () => api.get('/flagship/lab/curve'),
  fertilizers: () => api.get('/flagship/lab/fertilizers'),
  probe: (id: string, sample_id: string) => api.post(`/flagship/cases/${id}/lab/probe`, { sample_id }),
  availability: (id: string, ph: number) => api.post(`/flagship/cases/${id}/lab/availability`, { ph }),
  fertilizer: (id: string, fertilizers: string[]) => api.post(`/flagship/cases/${id}/lab/fertilizer`, { fertilizers }),
  lime: (id: string, grams_per_litre: number) => api.post(`/flagship/cases/${id}/lab/lime-trial`, { grams_per_litre }),
  advanced: (id: string) => api.post(`/flagship/cases/${id}/analysis/advanced`),
  link: (id: string, a: string, b: string) => api.post(`/flagship/cases/${id}/link`, { a, b }),
  hint: (id: string) => api.post(`/flagship/cases/${id}/hint`),
  hypothesis: (id: string, hypothesis: string, evidence: string[]) =>
    api.post(`/flagship/cases/${id}/hypothesis`, { hypothesis, evidence }),
}

export const billingApi = {
  entitlement: (refresh = false) => api.get('/billing/entitlement', { params: refresh ? { refresh: true } : {} }),
}
