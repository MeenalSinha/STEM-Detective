'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { CheckCircle2, XCircle, Brain, Zap, ArrowRight, BookOpen } from 'lucide-react'

type QuizQuestion = {
  id: string
  type: 'transfer' | 'misconception' | 'synthesis'
  question: string
  options: { id: string; text: string }[]
  correct_answer: string
  explanation: string
  stem_concept: string
  difficulty: string
  misconception_addressed?: string
  real_world_connection?: string
}

type QuizData = {
  quiz_title: string
  questions: QuizQuestion[]
  learning_objectives: string[]
  curriculum_standards: string[]
}

const TYPE_LABELS = {
  transfer: { label: 'Transfer', color: '#3b82f6', desc: 'Apply the concept to a new situation' },
  misconception: { label: 'Common Error', color: '#ef4444', desc: 'Watch out for a common misconception' },
  synthesis: { label: 'Real World', color: '#22a066', desc: 'Connect to real-world applications' },
}

export default function ProofOfLearningPage() {
  const { id: caseId } = useParams<{ id: string }>()
  const router = useRouter()

  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<{ results: unknown[]; retention_score: number; xp_awarded: number; message: string } | null>(null)

  const { data: quizRes, isLoading } = useQuery({
    queryKey: ['quiz', caseId],
    queryFn: () => api.post('/quiz/generate', { case_id: caseId }),
  })

  const submitMutation = useMutation({
    mutationFn: (answersPayload: unknown[]) =>
      api.post('/quiz/submit', {
        case_id: caseId,
        answers: answersPayload,
      }),
    onSuccess: (res) => {
      setResults(res.data)
      setSubmitted(true)
    },
    onError: () => toast.error('Failed to submit quiz'),
  })

  const quiz: QuizData | null = quizRes?.data?.quiz || null
  const question = quiz?.questions[currentQ]

  const handleAnswer = (optionId: string) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [question!.id]: optionId }))
  }

  const handleNext = () => {
    if (!question || !answers[question.id]) {
      toast.error('Please select an answer first')
      return
    }
    if (currentQ < (quiz?.questions.length || 0) - 1) {
      setCurrentQ((q) => q + 1)
    } else {
      // Submit all answers
      const payload = quiz!.questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || '',
        question_data: q,
      }))
      submitMutation.mutate(payload)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <Brain size={40} className="text-amber-glow mx-auto mb-4 animate-pulse" />
          <p className="display-text text-text-primary text-xl font-bold mb-2">Preparing Your Quiz</p>
          <p className="text-text-muted text-sm">Analyzing what you learned...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted">Quiz unavailable. <button onClick={() => router.back()} className="text-amber-light underline">Go back</button></p>
        </div>
      </div>
    )
  }

  if (submitted && results) {
    const score = results.retention_score
    const color = score >= 80 ? '#22a066' : score >= 60 ? '#c8860a' : '#c42e2e'

    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full">
          {/* Score */}
          <div className="card p-8 text-center mb-5">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center border-4" style={{ borderColor: color, background: `${color}22` }}>
              <span className="mono-text text-3xl font-bold" style={{ color }}>{score}%</span>
            </div>
            <h2 className="display-text text-2xl font-bold text-text-primary mb-1">
              {score >= 80 ? 'Outstanding Retention' : score >= 60 ? 'Solid Understanding' : 'Keep Practicing'}
            </h2>
            <p className="text-text-secondary text-sm">{results.message}</p>
            {results.xp_awarded > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-xp">
                <Zap size={16} />
                <span className="font-bold">+{results.xp_awarded} XP earned</span>
              </div>
            )}
          </div>

          {/* Question-by-question breakdown */}
          <div className="space-y-3 mb-5">
            {(results.results as { is_correct: boolean; explanation: string; misconception_addressed?: string; real_world_connection?: string; correct_answer: string }[]).map((r, i) => {
              const q = quiz.questions[i]
              const selected = answers[q.id]
              return (
                <div key={i} className={`card p-4 border-l-4 ${r.is_correct ? 'border-l-green-600' : 'border-l-red-700'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    {r.is_correct
                      ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      : <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    }
                    <p className="text-text-primary text-sm font-medium">{q.question}</p>
                  </div>
                  {!r.is_correct && (
                    <div className="flex gap-4 text-xs mb-2">
                      <span className="text-red-400">Your answer: {q.options.find(o => o.id === selected)?.text}</span>
                      <span className="text-green-400">Correct: {q.options.find(o => o.id === r.correct_answer)?.text}</span>
                    </div>
                  )}
                  <p className="text-text-muted text-xs leading-relaxed">{r.explanation}</p>
                  {r.misconception_addressed && (
                    <div className="mt-2 bg-red-950/30 border border-red-900/30 rounded p-2">
                      <p className="text-red-300 text-xs">Common misconception addressed: {r.misconception_addressed}</p>
                    </div>
                  )}
                  {r.real_world_connection && (
                    <div className="mt-2 bg-green-950/30 border border-green-900/30 rounded p-2">
                      <p className="text-green-300 text-xs">Real world: {r.real_world_connection}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Curriculum standards */}
          {quiz.curriculum_standards?.length > 0 && (
            <div className="card p-4 mb-5">
              <p className="section-title mb-2">Standards Addressed</p>
              <div className="flex flex-wrap gap-1.5">
                {quiz.curriculum_standards.map((s, i) => (
                  <span key={i} className="badge bg-bg-overlay text-text-muted border border-border text-xs">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => router.push('/dashboard')} className="btn-secondary flex-1 py-3">Dashboard</button>
            <button onClick={() => router.push('/cases')} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
              New Mystery <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const questionType = TYPE_LABELS[question?.type || 'transfer']
  const progress = ((currentQ) / quiz.questions.length) * 100
  const selectedAnswer = question ? answers[question.id] : null

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={18} className="text-amber-glow" />
            <p className="text-text-secondary text-sm font-medium">{quiz.quiz_title}</p>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-muted text-xs">Question {currentQ + 1} of {quiz.questions.length}</span>
            <span className="text-text-muted text-xs">{Math.round(progress)}% complete</span>
          </div>
          <div className="xp-bar">
            <motion.div className="xp-bar-fill" style={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Question type badge */}
            <div className="flex items-center gap-2 mb-4">
              <span
                className="badge text-xs font-medium"
                style={{ background: `${questionType.color}22`, color: questionType.color, border: `1px solid ${questionType.color}44` }}
              >
                {questionType.label}
              </span>
              <span className="text-text-muted text-xs">{questionType.desc}</span>
            </div>

            {/* Question */}
            <div className="card p-5 mb-4">
              <p className="text-text-primary text-base font-medium leading-relaxed">{question?.question}</p>
              {question?.stem_concept && (
                <p className="text-text-muted text-xs mt-2">Concept: {question.stem_concept}</p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2 mb-6">
              {question?.options.map((option) => {
                const isSelected = selectedAnswer === option.id
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => handleAnswer(option.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full text-left p-4 rounded border transition-all ${
                      isSelected
                        ? 'bg-amber-glow/20 border-amber-glow text-text-primary'
                        : 'bg-bg-secondary border-border text-text-secondary hover:border-amber-dim hover:text-text-primary'
                    }`}
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isSelected ? 'border-amber-glow bg-amber-glow text-bg-primary' : 'border-border text-text-muted'
                      }`}>
                        {option.id.toUpperCase()}
                      </span>
                      {option.text}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedAnswer || submitMutation.isPending}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {submitMutation.isPending ? (
                <><span className="w-4 h-4 border-2 border-bg-primary/50 border-t-bg-primary rounded-full animate-spin" />Analyzing...</>
              ) : currentQ < quiz.questions.length - 1 ? (
                <>Next Question <ArrowRight size={15} /></>
              ) : (
                <>Submit Answers <CheckCircle2 size={15} /></>
              )}
            </button>

            <p className="text-center text-text-dim text-xs mt-3">
              No XP penalty for wrong answers — this quiz helps you learn, not judge you.
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
