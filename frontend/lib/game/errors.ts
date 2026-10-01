import { AxiosError } from 'axios'

export type GameErrorKind = 'offline' | 'timeout' | 'pro' | 'ai' | 'auth' | 'notfound' | 'invalid' | 'server'

export interface GameError {
  kind: GameErrorKind
  message: string
  feature?: string
  /** Safe to retry automatically or via a "Try again" button */
  retryable: boolean
}

/** Turn any thrown value into a player-facing error with a recovery hint. */
export function toGameError(err: unknown): GameError {
  const e = err as AxiosError<{ detail?: unknown; code?: string }>
  if (!e || typeof e !== 'object' || !('isAxiosError' in e)) {
    return { kind: 'server', message: 'Something went wrong. Please try again.', retryable: true }
  }
  if (e.code === 'ECONNABORTED') {
    return { kind: 'timeout', message: 'The server took too long to answer. Check your connection and try again.', retryable: true }
  }
  if (!e.response) {
    return { kind: 'offline', message: 'You appear to be offline, or the case server cannot be reached.', retryable: true }
  }
  const { status, data } = e.response
  const detail = data?.detail
  if (status === 403 && detail && typeof detail === 'object' && (detail as { code?: string }).code === 'PRO_REQUIRED') {
    const d = detail as { feature?: string; message?: string }
    return { kind: 'pro', message: d.message ?? 'This is a Detective Pro feature.', feature: d.feature, retryable: false }
  }
  if (status === 503 && data?.code === 'AI_UNAVAILABLE') {
    return { kind: 'ai', message: 'The AI assistant is unavailable right now. The core investigation still works.', retryable: true }
  }
  if (status === 401) return { kind: 'auth', message: 'Your session expired. Please sign in again.', retryable: false }
  if (status === 404) return { kind: 'notfound', message: 'That case file could not be found.', retryable: false }
  if (status === 400 || status === 422) {
    const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? (detail[0] as { msg?: string })?.msg : undefined
    return { kind: 'invalid', message: msg ?? 'That request was not valid.', retryable: false }
  }
  return { kind: 'server', message: 'The server had a problem. Please try again in a moment.', retryable: true }
}
