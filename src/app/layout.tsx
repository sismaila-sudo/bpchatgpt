import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BP ChatGPT - Business Plan Assistant',
  description: 'AI-powered business plan creation and financial analysis tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  )
}
