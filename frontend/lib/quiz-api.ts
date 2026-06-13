// Additions to lib/api.ts — Quiz and Learning Science endpoints
// Add these to the existing api.ts file

export const quizApi = {
  generate: (caseId: string) =>
    import('./api').then(({ api }) => api.post('/quiz/generate', { case_id: caseId })),

  submit: (caseId: string, answers: Array<{ question_id: string; answer: string; question_data: unknown }>) =>
    import('./api').then(({ api }) => api.post('/quiz/submit', { case_id: caseId, answers })),

  checkMisconception: (caseId: string, studentText: string) =>
    import('./api').then(({ api }) =>
      api.post('/quiz/check-misconception', { case_id: caseId, student_text: studentText })
    ),

  triggerWorldDecay: (caseId: string, actionsSinceLastEvent: number) =>
    import('./api').then(({ api }) =>
      api.post('/quiz/world-decay', { case_id: caseId, actions_since_last_event: actionsSinceLastEvent })
    ),
}
