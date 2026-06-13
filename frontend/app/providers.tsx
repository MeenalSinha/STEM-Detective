'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#2d1c0a',
            color: '#f5e6c8',
            border: '1px solid #3a2410',
            fontFamily: 'var(--font-inter)',
          },
          success: {
            iconTheme: { primary: '#c8860a', secondary: '#1a1008' },
          },
          error: {
            iconTheme: { primary: '#c42e2e', secondary: '#1a1008' },
          },
        }}
      />
    </QueryClientProvider>
  )
}
