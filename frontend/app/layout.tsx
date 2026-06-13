import type { Metadata } from 'next'
import { Playfair_Display, Inter, JetBrains_Mono, Special_Elite } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from './providers'
import AccessibilityWidget from '@/components/accessibility/AccessibilityWidget'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const specialElite = Special_Elite({
  subsets: ['latin'],
  variable: '--font-special-elite',
  weight: '400',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'STEM Detective: Multiverse of Mysteries',
  description: 'Solve AI-generated STEM mysteries. The future of science education.',
  openGraph: {
    title: 'STEM Detective',
    description: 'AI-powered STEM education through detective mysteries',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} ${jetbrains.variable} ${specialElite.variable} antialiased`}
      >
        <Providers>
          {children}
          <AccessibilityWidget />
        </Providers>
      </body>
    </html>
  )
}
