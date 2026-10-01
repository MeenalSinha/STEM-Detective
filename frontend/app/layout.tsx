import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/inter'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource/special-elite'
import '@/styles/globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'STEM Detective',
  description: 'Use science to solve mysteries. A mobile detective game that teaches STEM through evidence, experiments and deduction.',
}

// viewport-fit=cover lets the app draw under notches; safe-area padding keeps content clear.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F5F1E8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
