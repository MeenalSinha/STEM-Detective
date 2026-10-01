'use client'
import { Suspense, ComponentType } from 'react'
import { ScreenSkeleton } from './ui'

/** Static export requires useSearchParams() consumers to sit inside Suspense. */
export function suspended<P extends object>(C: ComponentType<P>) {
  return function Wrapped(props: P) {
    return <Suspense fallback={<ScreenSkeleton />}><C {...props} /></Suspense>
  }
}
